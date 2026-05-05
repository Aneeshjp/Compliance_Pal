"""Analytics routes — KPI summary, monthly trends, vendor breakdown, status distribution."""

from datetime import datetime, timezone, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary")
async def analytics_summary(current_user: dict = Depends(get_current_user)):
    """KPI totals for the current user."""
    db = get_database()
    user_id = current_user["_id"]
    uid = ObjectId(user_id)

    total_invoices = await db.invoices.count_documents(
        {"user_id": uid, "is_deleted": {"$ne": True}}
    )

    # Aggregate GST totals
    pipeline = [
        {"$match": {"user_id": uid, "is_deleted": {"$ne": True}}},
        {
            "$group": {
                "_id": None,
                "total_gst_paid": {"$sum": "$total_gst"},
                "total_taxable": {"$sum": "$taxable_amount"},
                "total_amount": {"$sum": "$total_amount"},
            }
        },
    ]
    totals = {"total_gst_paid": 0, "total_taxable": 0, "total_amount": 0}
    async for doc in db.invoices.aggregate(pipeline):
        totals = doc

    # Reconciliation status counts
    status_pipeline = [
        {"$match": {"user_id": uid, "is_deleted": {"$ne": True}}},
        {"$group": {"_id": "$reconciliation_status", "count": {"$sum": 1}}},
    ]
    status_counts = {"matched": 0, "mismatch": 0, "missing": 0, "pending": 0}
    async for doc in db.invoices.aggregate(status_pipeline):
        status_counts[doc["_id"]] = doc["count"]

    # ITC from latest run
    latest_run = await db.reconciliation_runs.find_one(
        {"user_id": uid}, sort=[("run_date", -1)]
    )
    itc_claimable = latest_run.get("total_itc_claimable", 0) if latest_run else 0
    itc_at_risk = latest_run.get("total_itc_at_risk", 0) if latest_run else 0

    return {
        "total_invoices": total_invoices,
        "total_gst_paid": round(totals.get("total_gst_paid", 0), 2),
        "total_taxable": round(totals.get("total_taxable", 0), 2),
        "total_amount": round(totals.get("total_amount", 0), 2),
        "itc_claimable": round(itc_claimable, 2),
        "itc_at_risk": round(itc_at_risk, 2),
        "matched_count": status_counts.get("matched", 0),
        "mismatch_count": status_counts.get("mismatch", 0),
        "missing_count": status_counts.get("missing", 0),
        "pending_count": status_counts.get("pending", 0),
    }


@router.get("/monthly")
async def analytics_monthly(current_user: dict = Depends(get_current_user)):
    """Monthly invoice count + GST amounts for the last 12 months."""
    db = get_database()
    uid = ObjectId(current_user["_id"])

    twelve_months_ago = datetime.now(timezone.utc) - timedelta(days=365)

    pipeline = [
        {
            "$match": {
                "user_id": uid,
                "is_deleted": {"$ne": True},
                "invoice_date": {"$gte": twelve_months_ago},
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$invoice_date"},
                    "month": {"$month": "$invoice_date"},
                },
                "count": {"$sum": 1},
                "total_gst": {"$sum": "$total_gst"},
                "total_cgst": {"$sum": "$cgst"},
                "total_sgst": {"$sum": "$sgst"},
                "total_igst": {"$sum": "$igst"},
                "total_amount": {"$sum": "$total_amount"},
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]

    months = []
    async for doc in db.invoices.aggregate(pipeline):
        year = doc["_id"]["year"]
        month = doc["_id"]["month"]
        months.append({
            "month": f"{year}-{month:02d}",
            "count": doc["count"],
            "total_gst": round(doc["total_gst"], 2),
            "cgst": round(doc.get("total_cgst", 0), 2),
            "sgst": round(doc.get("total_sgst", 0), 2),
            "igst": round(doc.get("total_igst", 0), 2),
            "total_amount": round(doc["total_amount"], 2),
        })

    return {"months": months}


@router.get("/vendors")
async def analytics_vendors(current_user: dict = Depends(get_current_user)):
    """Per-vendor breakdown (top 10 by volume)."""
    db = get_database()
    uid = ObjectId(current_user["_id"])

    pipeline = [
        {"$match": {"user_id": uid, "is_deleted": {"$ne": True}}},
        {
            "$group": {
                "_id": {"vendor_name": "$vendor_name", "gstin": "$gstin_supplier"},
                "invoice_count": {"$sum": 1},
                "total_gst": {"$sum": "$total_gst"},
                "total_amount": {"$sum": "$total_amount"},
            }
        },
        {"$sort": {"invoice_count": -1}},
        {"$limit": 10},
    ]

    vendors = []
    async for doc in db.invoices.aggregate(pipeline):
        vendors.append({
            "vendor_name": doc["_id"].get("vendor_name", "Unknown"),
            "gstin": doc["_id"].get("gstin", ""),
            "invoice_count": doc["invoice_count"],
            "total_gst": round(doc["total_gst"], 2),
            "total_amount": round(doc["total_amount"], 2),
        })

    return {"vendors": vendors}


@router.get("/itc-trend")
async def analytics_itc_trend(current_user: dict = Depends(get_current_user)):
    """Monthly ITC claimable vs at-risk trend from reconciliation runs."""
    db = get_database()
    uid = ObjectId(current_user["_id"])

    pipeline = [
        {"$match": {"user_id": uid}},
        {"$sort": {"run_date": 1}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$run_date"},
                    "month": {"$month": "$run_date"},
                },
                "itc_claimable": {"$last": "$total_itc_claimable"},
                "itc_at_risk": {"$last": "$total_itc_at_risk"},
                "run_date": {"$last": "$run_date"},
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]

    trend = []
    async for doc in db.reconciliation_runs.aggregate(pipeline):
        year = doc["_id"]["year"]
        month = doc["_id"]["month"]
        trend.append({
            "month": f"{year}-{month:02d}",
            "itc_claimable": round(doc["itc_claimable"], 2),
            "itc_at_risk": round(doc["itc_at_risk"], 2),
        })

    return {"trend": trend}


@router.get("/status-dist")
async def analytics_status_distribution(current_user: dict = Depends(get_current_user)):
    """Current distribution of all invoice statuses."""
    db = get_database()
    uid = ObjectId(current_user["_id"])

    # Validation status
    val_pipeline = [
        {"$match": {"user_id": uid, "is_deleted": {"$ne": True}}},
        {"$group": {"_id": "$validation_status", "count": {"$sum": 1}}},
    ]
    validation = {}
    async for doc in db.invoices.aggregate(val_pipeline):
        validation[doc["_id"]] = doc["count"]

    # Reconciliation status
    rec_pipeline = [
        {"$match": {"user_id": uid, "is_deleted": {"$ne": True}}},
        {"$group": {"_id": "$reconciliation_status", "count": {"$sum": 1}}},
    ]
    reconciliation = {}
    async for doc in db.invoices.aggregate(rec_pipeline):
        reconciliation[doc["_id"]] = doc["count"]

    return {
        "validation": validation,
        "reconciliation": reconciliation,
    }

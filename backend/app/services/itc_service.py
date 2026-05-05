"""ITC (Input Tax Credit) calculation service."""

import logging
from typing import Any

from bson import ObjectId

from app.core.database import get_database

logger = logging.getLogger(__name__)


async def get_itc_summary(user_id: str) -> dict[str, Any]:
    """
    Calculate ITC summary from the latest reconciliation run.
    Returns total claimable, at-risk, possible, and efficiency.
    """
    db = get_database()

    # Get the latest run
    latest_run = await db.reconciliation_runs.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("run_date", -1)],
    )

    if not latest_run:
        return {
            "total_itc_claimable": 0.0,
            "total_itc_at_risk": 0.0,
            "total_possible_itc": 0.0,
            "itc_efficiency_rate": 0.0,
            "matched_itc": 0.0,
            "mismatch_itc": 0.0,
            "missing_itc": 0.0,
        }

    run_id = latest_run["run_id"]

    # Aggregate ITC from results
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "run_id": run_id}},
        {
            "$group": {
                "_id": "$match_status",
                "total_itc": {"$sum": "$itc_claimable"},
                "total_invoice_gst": {"$sum": "$invoice_gst"},
                "count": {"$sum": 1},
            }
        },
    ]

    status_groups: dict[str, dict] = {}
    async for group in db.reconciliation_results.aggregate(pipeline):
        status_groups[group["_id"]] = group

    matched = status_groups.get("matched", {})
    mismatch = status_groups.get("mismatch", {})
    missing = status_groups.get("missing", {})

    matched_itc = matched.get("total_itc", 0.0)
    mismatch_itc = mismatch.get("total_itc", 0.0)
    missing_itc = 0.0  # missing invoices have 0 ITC

    total_itc_claimable = matched_itc + mismatch_itc + missing_itc
    total_possible_itc = (
        matched.get("total_invoice_gst", 0.0)
        + mismatch.get("total_invoice_gst", 0.0)
        + missing.get("total_invoice_gst", 0.0)
    )
    total_itc_at_risk = total_possible_itc - total_itc_claimable

    efficiency = (
        (total_itc_claimable / total_possible_itc * 100)
        if total_possible_itc > 0
        else 0.0
    )

    return {
        "total_itc_claimable": round(total_itc_claimable, 2),
        "total_itc_at_risk": round(total_itc_at_risk, 2),
        "total_possible_itc": round(total_possible_itc, 2),
        "itc_efficiency_rate": round(efficiency, 2),
        "matched_itc": round(matched_itc, 2),
        "mismatch_itc": round(mismatch_itc, 2),
        "missing_itc": round(missing_itc, 2),
    }


async def get_vendor_itc_breakdown(user_id: str) -> list[dict[str, Any]]:
    """
    Get per-vendor ITC breakdown from latest reconciliation.
    """
    db = get_database()

    latest_run = await db.reconciliation_runs.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("run_date", -1)],
    )

    if not latest_run:
        return []

    run_id = latest_run["run_id"]

    pipeline = [
        {
            "$match": {
                "user_id": ObjectId(user_id),
                "run_id": run_id,
                "match_status": {"$ne": "extra_in_gst"},
            }
        },
        {
            "$group": {
                "_id": {"gstin": "$gstin", "vendor_name": "$vendor_name"},
                "invoice_count": {"$sum": 1},
                "total_gst": {"$sum": "$invoice_gst"},
                "itc_claimable": {"$sum": "$itc_claimable"},
            }
        },
        {"$sort": {"total_gst": -1}},
    ]

    vendors = []
    async for doc in db.reconciliation_results.aggregate(pipeline):
        total_gst = doc.get("total_gst", 0.0)
        itc_claimable = doc.get("itc_claimable", 0.0)
        itc_at_risk = total_gst - itc_claimable
        efficiency = (itc_claimable / total_gst * 100) if total_gst > 0 else 0.0

        vendors.append({
            "vendor_name": doc["_id"].get("vendor_name", "Unknown"),
            "gstin": doc["_id"].get("gstin", ""),
            "invoice_count": doc.get("invoice_count", 0),
            "total_gst": round(total_gst, 2),
            "itc_claimable": round(itc_claimable, 2),
            "itc_at_risk": round(itc_at_risk, 2),
            "efficiency": round(efficiency, 2),
        })

    return vendors

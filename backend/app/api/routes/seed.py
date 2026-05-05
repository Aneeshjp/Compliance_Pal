"""Demo data seeder — scans demo_documents/, runs OCR, creates mock GST records."""

import os
import random
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.core.database import get_database
from app.core.security import get_current_user
from app.services.ocr_service import process_invoice_file
from app.services.validation_service import validate_and_update_invoice
from app.services.reconciliation_service import run_reconciliation

router = APIRouter(prefix="/api/seed", tags=["Seed Data"])
settings = get_settings()
logger = logging.getLogger(__name__)

# Sample demo data for when no documents are present
DEMO_INVOICES = [
    {
        "gstin_supplier": "29AADCB2230M1ZV",
        "gstin_recipient": "27AAPFU0939F1ZV",
        "invoice_number": "INV-2026-001",
        "invoice_date": datetime(2026, 3, 15),
        "vendor_name": "Tata Steel Ltd",
        "taxable_amount": 125000.00,
        "cgst": 11250.00,
        "sgst": 11250.00,
        "igst": 0.0,
        "total_gst": 22500.00,
        "total_amount": 147500.00,
    },
    {
        "gstin_supplier": "07AAACR5055K1Z0",
        "gstin_recipient": "27AAPFU0939F1ZV",
        "invoice_number": "INV-2026-002",
        "invoice_date": datetime(2026, 3, 20),
        "vendor_name": "Reliance Industries",
        "taxable_amount": 85000.00,
        "cgst": 0.0,
        "sgst": 0.0,
        "igst": 15300.00,
        "total_gst": 15300.00,
        "total_amount": 100300.00,
    },
    {
        "gstin_supplier": "33AABCU9603R1ZM",
        "gstin_recipient": "27AAPFU0939F1ZV",
        "invoice_number": "INV-2026-003",
        "invoice_date": datetime(2026, 4, 1),
        "vendor_name": "Infosys Technologies",
        "taxable_amount": 200000.00,
        "cgst": 0.0,
        "sgst": 0.0,
        "igst": 36000.00,
        "total_gst": 36000.00,
        "total_amount": 236000.00,
    },
    {
        "gstin_supplier": "29AADCB2230M1ZV",
        "gstin_recipient": "27AAPFU0939F1ZV",
        "invoice_number": "INV-2026-004",
        "invoice_date": datetime(2026, 4, 5),
        "vendor_name": "Tata Steel Ltd",
        "taxable_amount": 50000.00,
        "cgst": 4500.00,
        "sgst": 4500.00,
        "igst": 0.0,
        "total_gst": 9000.00,
        "total_amount": 59000.00,
    },
    {
        "gstin_supplier": "06AABCT1332L1ZX",
        "gstin_recipient": "27AAPFU0939F1ZV",
        "invoice_number": "INV-2026-005",
        "invoice_date": datetime(2026, 5, 10),
        "vendor_name": "TCS",
        "taxable_amount": 175000.00,
        "cgst": 0.0,
        "sgst": 0.0,
        "igst": 31500.00,
        "total_gst": 31500.00,
        "total_amount": 206500.00,
    }
]


def _safe_float(val) -> float:
    try:
        return float(val) if val else 0.0
    except (ValueError, TypeError):
        return 0.0

def _create_gst_record(invoice: dict, user_id: str, scenario: str) -> dict | None:
    """Create a GST record based on the scenario type."""
    inv_date = invoice.get("invoice_date")
    filing_period = ""
    if isinstance(inv_date, datetime):
        filing_period = inv_date.strftime("%Y-%m")

    inv_gst = _safe_float(invoice.get("total_gst"))
    inv_taxable = _safe_float(invoice.get("taxable_amount"))

    if scenario == "matched":
        return {
            "user_id": ObjectId(user_id),
            "gstin": invoice["gstin_supplier"],
            "invoice_number": invoice["invoice_number"],
            "invoice_date": inv_date,
            "vendor_name": invoice.get("vendor_name", ""),
            "taxable_amount": inv_taxable,
            "gst_amount": inv_gst,
            "filing_period": filing_period,
            "source": "GSTR-2B",
        }
    elif scenario == "mismatch":
        # ±5-10% amount difference
        variation = random.uniform(0.05, 0.10) * random.choice([1, -1])
        gst_amount = round(inv_gst * (1 + variation), 2)
        return {
            "user_id": ObjectId(user_id),
            "gstin": invoice["gstin_supplier"],
            "invoice_number": invoice["invoice_number"],
            "invoice_date": inv_date,
            "vendor_name": invoice.get("vendor_name", ""),
            "taxable_amount": round(inv_taxable * (1 + variation), 2),
            "gst_amount": gst_amount,
            "filing_period": filing_period,
            "source": "GSTR-2B",
        }
    else:
        # "missing" — no GST record
        return None


@router.post("/demo")
async def seed_demo_data(current_user: dict = Depends(get_current_user)):
    """Seed demo invoices and GST records for the current user. Idempotent."""
    db = get_database()
    user_id = current_user["_id"]

    # Check if already seeded
    existing = await db.system.find_one({
        "type": "seed_status",
        "user_id": ObjectId(user_id),
    })
    if existing and existing.get("seeded"):
        return {
            "message": "Demo data already seeded",
            "seeded": True,
            "invoice_count": existing.get("invoice_count", 0),
            "gst_record_count": existing.get("gst_record_count", 0),
        }

    # Step 1: Try scanning demo_documents/ for real files
    demo_dir = Path(settings.DEMO_DOCS_DIR)
    demo_dir.mkdir(parents=True, exist_ok=True)
    real_files = list(demo_dir.glob("*.pdf")) + list(demo_dir.glob("*.jpg")) + \
                 list(demo_dir.glob("*.jpeg")) + list(demo_dir.glob("*.png"))

    invoices_inserted = 0
    gst_records_inserted = 0

    for demo_inv in DEMO_INVOICES:
        inv_num = demo_inv["invoice_number"]
        
        existing_inv = await db.invoices.find_one({
            "user_id": ObjectId(user_id),
            "invoice_number": inv_num,
        })
        if existing_inv:
            continue

        file_path_str = ""
        orig_filename = ""
        for rf in real_files:
            if rf.stem == inv_num or rf.stem == inv_num.replace('/', '_'):
                file_path_str = str(rf)
                orig_filename = rf.name
                break

        invoice_doc = {
            "user_id": ObjectId(user_id),
            "file_path": file_path_str,
            "original_filename": orig_filename,
            "gstin_supplier": demo_inv["gstin_supplier"],
            "gstin_recipient": demo_inv["gstin_recipient"],
            "invoice_number": inv_num,
            "invoice_date": demo_inv["invoice_date"],
            "vendor_name": demo_inv["vendor_name"],
            "taxable_amount": demo_inv["taxable_amount"],
            "cgst": demo_inv["cgst"],
            "sgst": demo_inv["sgst"],
            "igst": demo_inv["igst"],
            "total_gst": demo_inv["total_gst"],
            "total_amount": demo_inv["total_amount"],
            "validation_status": "pending",
            "validation_errors": [],
            "validation_warnings": [],
            "reconciliation_status": "pending",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        try:
            await db.invoices.insert_one(invoice_doc)
            invoices_inserted += 1
        except Exception as e:
            if "E11000" in str(e):
                pass
            else:
                logger.warning(f"Failed to insert demo invoice {inv_num}: {e}")

    # Step 4: Generate GST records for seeded invoices
    all_invoices = []
    async for inv in db.invoices.find({"user_id": ObjectId(user_id), "is_deleted": {"$ne": True}}):
        all_invoices.append(inv)

    # Force specific demonstration scenarios based on invoice number
    demo_scenarios = {
        "INV-2026-001": "matched",
        "INV-2026-002": "matched",
        "INV-2026-003": "mismatch",
        "INV-2026-004": "mismatch",
        "INV-2026-005": "missing",
    }

    for inv in all_invoices:
        inv_num = inv.get("invoice_number", "")
        scenario = demo_scenarios.get(inv_num, "matched")

        # Check if GST record already exists
        existing_rec = await db.gst_records.find_one({
            "user_id": ObjectId(user_id),
            "gstin": inv.get("gstin_supplier", ""),
            "invoice_number": inv.get("invoice_number", ""),
        })
        if existing_rec:
            continue

        gst_record = _create_gst_record(inv, user_id, scenario)
        if gst_record:
            try:
                await db.gst_records.insert_one(gst_record)
                gst_records_inserted += 1
            except Exception as e:
                if "E11000" not in str(e):
                    logger.warning(f"Failed to insert gst record: {e}")

    # (User requested NO Extra in GST records, so this is skipped)

    # Step 5: Run validation on all seeded invoices
    for inv in all_invoices:
        try:
            await validate_and_update_invoice(str(inv["_id"]), user_id)
        except Exception as e:
            logger.warning(f"Validation failed for {inv.get('invoice_number')}: {e}")

    # Step 6: Create fake historical reconciliation runs for the ITC Trend Chart
    base_claimable = 120000
    base_risk = 25000
    for m in range(5, 0, -1):
        run_date = datetime.now(timezone.utc) - timedelta(days=m * 30)
        await db.reconciliation_runs.insert_one({
            "user_id": ObjectId(user_id),
            "run_date": run_date,
            "total_invoices_processed": random.randint(30, 80),
            "total_itc_claimable": base_claimable + random.randint(-15000, 30000),
            "total_itc_at_risk": base_risk + random.randint(-5000, 15000),
            "matched_count": random.randint(20, 60),
            "mismatch_count": random.randint(2, 10),
            "missing_count": random.randint(1, 8),
            "extra_in_gst_count": random.randint(0, 5),
            "status": "completed"
        })

    # Step 7: Run real reconciliation for the current state
    try:
        await run_reconciliation(user_id)
    except Exception as e:
        logger.warning(f"Reconciliation failed during seeding: {e}")

    # Step 8: Mark seed as complete
    await db.system.update_one(
        {"type": "seed_status", "user_id": ObjectId(user_id)},
        {
            "$set": {
                "seeded": True,
                "invoice_count": len(all_invoices),
                "gst_record_count": gst_records_inserted,
                "seeded_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )

    return {
        "message": "Demo data seeded successfully",
        "seeded": True,
        "invoice_count": len(all_invoices),
        "gst_record_count": gst_records_inserted,
    }


@router.get("/status")
async def seed_status(current_user: dict = Depends(get_current_user)):
    """Check if demo data has been seeded for the current user."""
    db = get_database()
    user_id = current_user["_id"]

    status_doc = await db.system.find_one({
        "type": "seed_status",
        "user_id": ObjectId(user_id),
    })

    if status_doc:
        return {
            "seeded": status_doc.get("seeded", False),
            "invoice_count": status_doc.get("invoice_count", 0),
            "gst_record_count": status_doc.get("gst_record_count", 0),
        }

    return {"seeded": False, "invoice_count": 0, "gst_record_count": 0}

@router.post("/reset")
async def reset_dashboard(current_user: dict = Depends(get_current_user)):
    """Reset the user's dashboard by deleting all data."""
    db = get_database()
    user_id = current_user["_id"]
    
    await db.invoices.delete_many({"user_id": ObjectId(user_id)})
    await db.gst_records.delete_many({"user_id": ObjectId(user_id)})
    await db.reconciliation_runs.delete_many({"user_id": ObjectId(user_id)})
    await db.reconciliation_results.delete_many({"user_id": ObjectId(user_id)})
    await db.ai_queries.delete_many({"user_id": ObjectId(user_id)})
    await db.system.delete_many({"user_id": ObjectId(user_id)})
    
    return {"message": "Dashboard reset successfully"}

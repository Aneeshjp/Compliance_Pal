"""Reconciliation service — matches invoices against GST records using fuzzy matching."""

import uuid
import logging
from datetime import datetime, timezone, date
from typing import Any

from bson import ObjectId
from rapidfuzz import fuzz

from app.core.database import get_database

logger = logging.getLogger(__name__)


def _normalize_invoice_number(inv_num: str) -> str:
    """Normalize invoice number for comparison."""
    return inv_num.strip().upper().replace(" ", "").replace("-", "").replace("/", "")

def _safe_float(val: Any) -> float:
    """Safely cast value to float."""
    try:
        if val is None or val == "":
            return 0.0
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def _compute_amount_score(invoice_gst: float, record_gst: float) -> float:
    """Score amount similarity. Returns 0.0–1.0."""
    if invoice_gst == 0 and record_gst == 0:
        return 1.0
    if invoice_gst == 0 or record_gst == 0:
        return 0.0
    diff_pct = abs(invoice_gst - record_gst) / max(invoice_gst, record_gst)
    return max(0.0, 1.0 - diff_pct)


def _compute_date_score(inv_date: date | None, rec_date: date | None) -> float:
    """Score date proximity. Returns 0.0–1.0."""
    if not inv_date or not rec_date:
        return 0.5  # neutral when dates missing
    days_diff = abs((inv_date - rec_date).days)
    if days_diff == 0:
        return 1.0
    elif days_diff <= 3:
        return 0.95
    elif days_diff <= 7:
        return 0.85
    elif days_diff <= 30:
        return 0.7
    elif days_diff <= 90:
        return 0.5
    else:
        return 0.2


def _compute_invoice_number_score(inv_num: str, rec_num: str) -> float:
    """Fuzzy match invoice numbers. Returns 0.0–1.0."""
    norm_inv = _normalize_invoice_number(inv_num)
    norm_rec = _normalize_invoice_number(rec_num)
    if norm_inv == norm_rec:
        return 1.0
    return fuzz.ratio(norm_inv, norm_rec) / 100.0


def _compute_composite_score(
    inv_num_score: float, amount_score: float, date_score: float
) -> float:
    """Weighted composite score."""
    return (inv_num_score * 0.5) + (amount_score * 0.35) + (date_score * 0.15)


def _parse_date(val: Any) -> date | None:
    """Parse various date representations to date object."""
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, str):
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(val, fmt).date()
            except ValueError:
                continue
    return None


def _get_filing_period(inv_date: date | None) -> str:
    """Get the filing period string (YYYY-MM) for an invoice date."""
    if not inv_date:
        return ""
    return inv_date.strftime("%Y-%m")


async def run_reconciliation(user_id: str) -> dict[str, Any]:
    """
    Run full reconciliation for a user:
    1. Match each validated invoice against GST records
    2. Score and classify matches
    3. Detect extra GST records with no invoice
    4. Store results and run summary
    """
    db = get_database()
    run_id = str(uuid.uuid4())
    run_date = datetime.now(timezone.utc)

    # Fetch all validated (non-deleted) invoices for user
    invoices = []
    cursor = db.invoices.find({
        "user_id": ObjectId(user_id),
        "validation_status": {"$in": ["valid", "invalid", "pending"]},
        "is_deleted": {"$ne": True},
    })
    async for inv in cursor:
        invoices.append(inv)

    # Fetch all GST records for user
    gst_records = []
    gst_cursor = db.gst_records.find({"user_id": ObjectId(user_id)})
    async for rec in gst_cursor:
        gst_records.append(rec)

    results = []
    matched_gst_record_ids: set[str] = set()
    matched_count = 0
    mismatch_count = 0
    missing_count = 0
    total_itc_claimable = 0.0
    total_itc_at_risk = 0.0

    for invoice in invoices:
        inv_gstin = invoice.get("gstin_supplier", "")
        inv_num = invoice.get("invoice_number", "")
        inv_date = _parse_date(invoice.get("invoice_date"))
        inv_gst = _safe_float(invoice.get("total_gst", 0.0))
        inv_filing_period = _get_filing_period(inv_date)

        # Step 1: Find candidate GST records by GSTIN
        candidates = []
        for rec in gst_records:
            if rec.get("gstin", "") != inv_gstin:
                continue
            # Optional: check filing period overlap
            rec_period = rec.get("filing_period", "")
            if inv_filing_period and rec_period:
                # Allow ±1 month tolerance
                try:
                    inv_year, inv_month = int(inv_filing_period[:4]), int(inv_filing_period[5:7])
                    rec_year, rec_month = int(rec_period[:4]), int(rec_period[5:7])
                    month_diff = abs((inv_year * 12 + inv_month) - (rec_year * 12 + rec_month))
                    if month_diff > 2:
                        continue
                except (ValueError, IndexError):
                    pass
            candidates.append(rec)

        # Step 2 & 3: Score candidates
        best_candidate = None
        best_score = 0.0
        best_details: dict[str, Any] = {}

        for cand in candidates:
            cand_inv_num = cand.get("invoice_number", "")
            cand_gst = _safe_float(cand.get("gst_amount", 0.0))
            cand_date = _parse_date(cand.get("invoice_date"))

            inv_num_score = _compute_invoice_number_score(inv_num, cand_inv_num)
            amount_score = _compute_amount_score(inv_gst, cand_gst)
            date_score = _compute_date_score(inv_date, cand_date)
            composite = _compute_composite_score(inv_num_score, amount_score, date_score)

            if composite > best_score:
                best_score = composite
                best_candidate = cand
                best_details = {
                    "inv_num_score": inv_num_score,
                    "amount_score": amount_score,
                    "date_score": date_score,
                }

        # Step 4: Classify
        match_status = "missing"
        itc_claimable = 0.0
        discrepancy = None
        gst_record_gst = 0.0

        if best_candidate and best_score >= 0.95:
            cand_gst = _safe_float(best_candidate.get("gst_amount", 0.0))
            gst_record_gst = cand_gst
            amount_diff = abs(inv_gst - cand_gst)
            if amount_diff <= 2.0:
                match_status = "matched"
                itc_claimable = inv_gst
                matched_count += 1
            else:
                match_status = "mismatch"
                itc_claimable = min(inv_gst, cand_gst)
                mismatch_count += 1
                discrepancy = {
                    "field": "gst_amount",
                    "invoice_value": inv_gst,
                    "gst_record_value": cand_gst,
                    "difference": round(inv_gst - cand_gst, 2),
                }
            matched_gst_record_ids.add(str(best_candidate["_id"]))

        elif best_candidate and best_score >= 0.75:
            cand_gst = _safe_float(best_candidate.get("gst_amount", 0.0))
            gst_record_gst = cand_gst
            amount_diff_pct = abs(inv_gst - cand_gst) / max(inv_gst, 1.0)
            if amount_diff_pct <= 0.05:
                match_status = "mismatch"
                itc_claimable = min(inv_gst, cand_gst)
                mismatch_count += 1
                discrepancy = {
                    "field": "gst_amount",
                    "invoice_value": inv_gst,
                    "gst_record_value": cand_gst,
                    "difference": round(inv_gst - cand_gst, 2),
                }
                matched_gst_record_ids.add(str(best_candidate["_id"]))
            else:
                match_status = "missing"
                itc_claimable = 0.0
                missing_count += 1
        else:
            match_status = "missing"
            itc_claimable = 0.0
            missing_count += 1

        total_itc_claimable += itc_claimable
        itc_at_risk = inv_gst - itc_claimable
        total_itc_at_risk += itc_at_risk

        result_doc = {
            "user_id": ObjectId(user_id),
            "run_id": run_id,
            "run_date": run_date,
            "invoice_id": invoice["_id"],
            "invoice_number": inv_num,
            "gstin": inv_gstin,
            "match_status": match_status,
            "itc_claimable": round(itc_claimable, 2),
            "confidence_score": round(best_score, 4),
            "discrepancy_details": discrepancy,
            "vendor_name": invoice.get("vendor_name", ""),
            "invoice_gst": inv_gst,
            "gst_record_gst": gst_record_gst,
        }
        results.append(result_doc)

        # Update invoice reconciliation status
        await db.invoices.update_one(
            {"_id": invoice["_id"]},
            {
                "$set": {
                    "reconciliation_status": match_status,
                    "updated_at": run_date,
                }
            },
        )

    # Step 5: Detect EXTRA_IN_GST
    extra_in_gst_count = 0
    for rec in gst_records:
        if str(rec["_id"]) not in matched_gst_record_ids:
            extra_in_gst_count += 1
            result_doc = {
                "user_id": ObjectId(user_id),
                "run_id": run_id,
                "run_date": run_date,
                "invoice_id": None,
                "invoice_number": rec.get("invoice_number", ""),
                "gstin": rec.get("gstin", ""),
                "match_status": "extra_in_gst",
                "itc_claimable": 0.0,
                "confidence_score": 0.0,
                "discrepancy_details": None,
                "vendor_name": rec.get("vendor_name", ""),
                "invoice_gst": 0.0,
                "gst_record_gst": _safe_float(rec.get("gst_amount", 0.0)),
            }
            results.append(result_doc)

    # Store results
    if results:
        await db.reconciliation_results.insert_many(results)

    # Store run summary
    run_summary = {
        "user_id": ObjectId(user_id),
        "run_id": run_id,
        "run_date": run_date,
        "total_invoices": len(invoices),
        "matched_count": matched_count,
        "mismatch_count": mismatch_count,
        "missing_count": missing_count,
        "extra_in_gst_count": extra_in_gst_count,
        "total_itc_claimable": round(total_itc_claimable, 2),
        "total_itc_at_risk": round(total_itc_at_risk, 2),
    }
    await db.reconciliation_runs.insert_one(run_summary)

    return {
        "run_id": run_id,
        "summary": {
            **run_summary,
            "_id": str(run_summary.get("_id", "")),
            "user_id": user_id,
        },
        "result_count": len(results),
    }


async def get_latest_run(user_id: str) -> dict[str, Any] | None:
    """Get the most recent reconciliation run summary."""
    db = get_database()
    run = await db.reconciliation_runs.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("run_date", -1)],
    )
    if run:
        run["_id"] = str(run["_id"])
        run["user_id"] = str(run["user_id"])
    return run


async def get_run_results(user_id: str, run_id: str) -> list[dict[str, Any]]:
    """Get all per-invoice results for a specific run."""
    db = get_database()
    results = []
    cursor = db.reconciliation_results.find({
        "user_id": ObjectId(user_id),
        "run_id": run_id,
    })
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])
        if doc.get("invoice_id"):
            doc["invoice_id"] = str(doc["invoice_id"])
        results.append(doc)
    return results


async def get_run_history(user_id: str) -> list[dict[str, Any]]:
    """Get all past reconciliation runs for a user."""
    db = get_database()
    runs = []
    cursor = db.reconciliation_runs.find(
        {"user_id": ObjectId(user_id)},
    ).sort("run_date", -1).limit(50)
    async for run in cursor:
        run["_id"] = str(run["_id"])
        run["user_id"] = str(run["user_id"])
        runs.append(run)
    return runs

"""Reconciliation routes — run reconciliation, get results, export CSV."""

import csv
import io

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse

from app.core.security import get_current_user
from app.services.reconciliation_service import (
    run_reconciliation,
    get_latest_run,
    get_run_results,
    get_run_history,
)

router = APIRouter(prefix="/api/reconcile", tags=["Reconciliation"])


@router.post("/run")
async def reconcile_run(current_user: dict = Depends(get_current_user)):
    """Run reconciliation for all validated invoices of the current user."""
    user_id = current_user["_id"]
    result = await run_reconciliation(user_id)
    return result


@router.get("/results")
async def get_results(current_user: dict = Depends(get_current_user)):
    """Get the latest reconciliation run summary."""
    user_id = current_user["_id"]
    run = await get_latest_run(user_id)
    if not run:
        return {"message": "No reconciliation runs found", "run": None}
    return {"run": run}


@router.get("/results/{run_id}")
async def get_run_detail(
    run_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get full per-invoice results for a specific reconciliation run."""
    user_id = current_user["_id"]
    results = await get_run_results(user_id, run_id)
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found or has no results",
        )
    return {"run_id": run_id, "results": results}


@router.get("/history")
async def reconcile_history(current_user: dict = Depends(get_current_user)):
    """Get all past reconciliation runs for the user."""
    user_id = current_user["_id"]
    runs = await get_run_history(user_id)
    return {"runs": runs}


@router.post("/export")
async def export_results_csv(current_user: dict = Depends(get_current_user)):
    """Export latest reconciliation results as CSV."""
    user_id = current_user["_id"]
    run = await get_latest_run(user_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reconciliation runs found",
        )

    results = await get_run_results(user_id, run["run_id"])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Invoice Number", "GSTIN", "Vendor", "Match Status",
        "Invoice GST", "GST Record GST", "ITC Claimable",
        "Confidence Score", "Discrepancy",
    ])

    for r in results:
        disc = r.get("discrepancy_details")
        disc_str = ""
        if disc:
            disc_str = f"{disc.get('field', '')}: diff={disc.get('difference', '')}"

        writer.writerow([
            r.get("invoice_number", ""),
            r.get("gstin", ""),
            r.get("vendor_name", ""),
            r.get("match_status", ""),
            r.get("invoice_gst", 0),
            r.get("gst_record_gst", 0),
            r.get("itc_claimable", 0),
            r.get("confidence_score", 0),
            disc_str,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reconciliation_export.csv"},
    )

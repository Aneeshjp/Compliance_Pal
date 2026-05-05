"""Reconciliation Pydantic models."""

from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field


class DiscrepancyDetail(BaseModel):
    """Details about a field mismatch."""
    field: str
    invoice_value: Any = None
    gst_record_value: Any = None
    difference: Any = None


class ReconciliationResultResponse(BaseModel):
    """Per-invoice reconciliation result."""
    id: str
    user_id: str
    run_id: str
    run_date: Optional[datetime] = None
    invoice_id: str
    invoice_number: Optional[str] = None
    gstin: Optional[str] = None
    match_status: str = "pending"
    itc_claimable: float = 0.0
    confidence_score: float = 0.0
    discrepancy_details: Optional[DiscrepancyDetail] = None
    vendor_name: Optional[str] = None
    invoice_gst: Optional[float] = None
    gst_record_gst: Optional[float] = None


class ReconciliationRunResponse(BaseModel):
    """Summary of a reconciliation run."""
    id: str
    user_id: str
    run_id: str
    run_date: datetime
    total_invoices: int = 0
    matched_count: int = 0
    mismatch_count: int = 0
    missing_count: int = 0
    extra_in_gst_count: int = 0
    total_itc_claimable: float = 0.0
    total_itc_at_risk: float = 0.0


class ReconciliationRunDetailResponse(BaseModel):
    """Full run with per-invoice details."""
    run: ReconciliationRunResponse
    results: list[ReconciliationResultResponse]


class ReconciliationHistoryResponse(BaseModel):
    """List of past runs."""
    runs: list[ReconciliationRunResponse]

"""Invoice Pydantic models."""

from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class InvoiceUpdateRequest(BaseModel):
    """Fields the user can correct after OCR."""
    gstin_supplier: Optional[str] = None
    gstin_recipient: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    vendor_name: Optional[str] = None
    taxable_amount: Optional[float] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    total_gst: Optional[float] = None
    total_amount: Optional[float] = None


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class InvoiceResponse(BaseModel):
    """Full invoice response."""
    id: str
    user_id: str
    file_path: Optional[str] = None
    original_filename: Optional[str] = None
    gstin_supplier: Optional[str] = None
    gstin_recipient: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    vendor_name: Optional[str] = None
    taxable_amount: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    total_gst: float = 0.0
    total_amount: float = 0.0
    validation_status: str = "pending"
    validation_errors: list[str] = Field(default_factory=list)
    validation_warnings: list[str] = Field(default_factory=list)
    reconciliation_status: str = "pending"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    confidence_scores: Optional[dict[str, float]] = None


class InvoiceListResponse(BaseModel):
    """Paginated invoice list."""
    invoices: list[InvoiceResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class OCRResultResponse(BaseModel):
    """OCR extraction result returned after upload."""
    invoice: InvoiceResponse
    raw_text: str
    confidence: float
    message: str

"""GST Record Pydantic models (mock GSTR-2B data)."""

from datetime import date
from typing import Optional

from pydantic import BaseModel


class GSTRecordResponse(BaseModel):
    """A single GST record from GSTR-2B."""
    id: str
    user_id: str
    gstin: str
    invoice_number: str
    invoice_date: Optional[date] = None
    vendor_name: Optional[str] = None
    taxable_amount: float = 0.0
    gst_amount: float = 0.0
    filing_period: str = ""
    source: str = "GSTR-2B"


class GSTRecordCreateRequest(BaseModel):
    """Manual GST record creation."""
    gstin: str
    invoice_number: str
    invoice_date: Optional[date] = None
    vendor_name: Optional[str] = None
    taxable_amount: float = 0.0
    gst_amount: float = 0.0
    filing_period: str = ""
    source: str = "manual"

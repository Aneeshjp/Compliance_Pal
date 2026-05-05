"""ITC (Input Tax Credit) Pydantic models."""

from pydantic import BaseModel


class ITCSummaryResponse(BaseModel):
    """ITC summary for the user."""
    total_itc_claimable: float = 0.0
    total_itc_at_risk: float = 0.0
    total_possible_itc: float = 0.0
    itc_efficiency_rate: float = 0.0
    matched_itc: float = 0.0
    mismatch_itc: float = 0.0
    missing_itc: float = 0.0


class VendorITCBreakdown(BaseModel):
    """Per-vendor ITC breakdown."""
    vendor_name: str
    gstin: str
    invoice_count: int = 0
    total_gst: float = 0.0
    itc_claimable: float = 0.0
    itc_at_risk: float = 0.0
    efficiency: float = 0.0


class ITCDetailResponse(BaseModel):
    """Detailed ITC response."""
    summary: ITCSummaryResponse
    vendor_breakdown: list[VendorITCBreakdown] = []

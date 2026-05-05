"""ITC routes — summary and vendor breakdown."""

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.services.itc_service import get_itc_summary, get_vendor_itc_breakdown

router = APIRouter(prefix="/api/itc", tags=["ITC"])


@router.get("/summary")
async def itc_summary(current_user: dict = Depends(get_current_user)):
    """Get ITC summary for the current user."""
    user_id = current_user["_id"]
    summary = await get_itc_summary(user_id)
    return summary


@router.get("/vendors")
async def itc_vendors(current_user: dict = Depends(get_current_user)):
    """Get per-vendor ITC breakdown."""
    user_id = current_user["_id"]
    vendors = await get_vendor_itc_breakdown(user_id)
    return {"vendors": vendors}

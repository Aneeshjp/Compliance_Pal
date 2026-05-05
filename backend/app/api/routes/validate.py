"""Validation routes — validate individual or bulk invoices."""

from fastapi import APIRouter, HTTPException, Depends, status

from app.core.security import get_current_user
from app.services.validation_service import (
    validate_and_update_invoice,
    validate_all_pending,
)

router = APIRouter(prefix="/api/validate", tags=["Validation"])


@router.post("/{invoice_id}")
async def validate_single(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Validate a single invoice and update its status."""
    user_id = current_user["_id"]
    result = await validate_and_update_invoice(invoice_id, user_id)

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"],
        )

    return result


@router.post("/bulk", status_code=status.HTTP_200_OK)
async def validate_bulk(current_user: dict = Depends(get_current_user)):
    """Validate all pending invoices for the current user."""
    user_id = current_user["_id"]
    results = await validate_all_pending(user_id)
    return results

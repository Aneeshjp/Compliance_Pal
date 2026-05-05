"""Invoice validation service implementing GST compliance rules."""

import re
import logging
from datetime import datetime, date, timezone
from typing import Any

from bson import ObjectId

from app.core.database import get_database

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")

VALID_STATE_CODES = {
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
    "31", "32", "33", "34", "35", "36", "37", "38",
}

VALID_GST_RATES = {0, 0.1, 0.25, 3, 5, 12, 18, 28}
GST_RATE_TOLERANCE = 0.5

# Characters for mod-36 checksum
CHECKSUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _validate_gstin_checksum(gstin: str) -> bool:
    """Validate GSTIN check digit using weighted mod-36 algorithm."""
    if len(gstin) != 15:
        return False
    try:
        total = 0
        for i, char in enumerate(gstin[:14]):
            idx = CHECKSUM_CHARS.index(char.upper())
            factor = 1 if i % 2 == 0 else 2
            product = idx * factor
            total += (product // 36) + (product % 36)
        remainder = total % 36
        check_digit = CHECKSUM_CHARS[(36 - remainder) % 36]
        return check_digit == gstin[14].upper()
    except (ValueError, IndexError):
        return False


def _get_financial_year_start(ref_date: date) -> date:
    """Get the start of the financial year for a given date."""
    if ref_date.month >= 4:
        return date(ref_date.year, 4, 1)
    return date(ref_date.year - 1, 4, 1)


# ---------------------------------------------------------------------------
# Individual validation rules
# ---------------------------------------------------------------------------

def rule_gstin_format(invoice: dict[str, Any]) -> list[dict[str, str]]:
    """Rule 1: GSTIN must match the 15-char pattern."""
    errors = []
    for field_name in ["gstin_supplier", "gstin_recipient"]:
        value = invoice.get(field_name)
        if value and not GSTIN_REGEX.match(value):
            errors.append({
                "field": field_name,
                "rule": "format",
                "message": f"GSTIN '{value}' does not match the required 15-character format",
            })
    return errors


def rule_gstin_checksum(invoice: dict[str, Any]) -> list[dict[str, str]]:
    """Rule 2: GSTIN checksum verification."""
    errors = []
    for field_name in ["gstin_supplier", "gstin_recipient"]:
        value = invoice.get(field_name)
        if value and GSTIN_REGEX.match(value) and not _validate_gstin_checksum(value):
            errors.append({
                "field": field_name,
                "rule": "checksum",
                "message": f"GSTIN '{value}' has an invalid check digit",
            })
    return errors


def rule_state_code(invoice: dict[str, Any]) -> list[dict[str, str]]:
    """Rule 3: First 2 digits of GSTIN must be a valid state code."""
    errors = []
    for field_name in ["gstin_supplier", "gstin_recipient"]:
        value = invoice.get(field_name)
        if value and len(value) >= 2:
            state_code = value[:2]
            if state_code not in VALID_STATE_CODES:
                errors.append({
                    "field": field_name,
                    "rule": "state_code",
                    "message": f"State code '{state_code}' in GSTIN is not a valid Indian state code",
                })
    return errors


def rule_invoice_date(invoice: dict[str, Any]) -> tuple[list[dict], list[dict]]:
    """Rule 4: Invoice date validity checks."""
    errors = []
    warnings = []
    inv_date = invoice.get("invoice_date")

    if not inv_date:
        return errors, warnings

    if isinstance(inv_date, str):
        try:
            inv_date = datetime.strptime(inv_date, "%Y-%m-%d").date()
        except ValueError:
            errors.append({
                "field": "invoice_date",
                "rule": "date_format",
                "message": "Invoice date could not be parsed",
            })
            return errors, warnings
    elif isinstance(inv_date, datetime):
        inv_date = inv_date.date()

    today = date.today()

    if inv_date > today:
        errors.append({
            "field": "invoice_date",
            "rule": "future_date",
            "message": "Invoice date cannot be in the future",
        })

    # Check if more than 3 financial years old
    current_fy_start = _get_financial_year_start(today)
    cutoff = date(current_fy_start.year - 3, 4, 1)
    if inv_date < cutoff:
        errors.append({
            "field": "invoice_date",
            "rule": "too_old",
            "message": "Invoice is more than 3 financial years old — ITC cannot be claimed",
        })

    # Warning if more than 1 year old
    one_year_ago = date(today.year - 1, today.month, today.day)
    if inv_date < one_year_ago:
        warnings.append({
            "field": "invoice_date",
            "rule": "age",
            "message": "Invoice is more than 1 year old",
        })

    return errors, warnings


def rule_tax_math(invoice: dict[str, Any]) -> list[dict[str, str]]:
    """Rule 5: Tax math verification — CGST+SGST or IGST, total checks."""
    errors = []
    cgst = invoice.get("cgst", 0.0) or 0.0
    sgst = invoice.get("sgst", 0.0) or 0.0
    igst = invoice.get("igst", 0.0) or 0.0
    total_gst = invoice.get("total_gst", 0.0) or 0.0
    taxable = invoice.get("taxable_amount", 0.0) or 0.0
    total_amount = invoice.get("total_amount", 0.0) or 0.0

    # Intrastate vs Interstate check
    if igst > 0 and (cgst > 0 or sgst > 0):
        errors.append({
            "field": "gst_components",
            "rule": "tax_type_conflict",
            "message": "IGST and CGST/SGST cannot both be present — choose intrastate or interstate",
        })

    # CGST should approximately equal SGST for intrastate
    if cgst > 0 and sgst > 0:
        tolerance = max(1.0, cgst * 0.001)
        if abs(cgst - sgst) > tolerance:
            errors.append({
                "field": "cgst_sgst",
                "rule": "cgst_sgst_mismatch",
                "message": f"CGST (₹{cgst:.2f}) and SGST (₹{sgst:.2f}) should be equal for intrastate supply",
            })

    # Total GST check
    computed_gst = cgst + sgst + igst
    if total_gst > 0 and computed_gst > 0:
        tolerance = max(1.0, total_gst * 0.001)
        if abs(total_gst - computed_gst) > tolerance:
            errors.append({
                "field": "total_gst",
                "rule": "gst_sum_mismatch",
                "message": f"Total GST (₹{total_gst:.2f}) doesn't match sum of components (₹{computed_gst:.2f})",
            })

    # Total amount check
    if taxable > 0 and total_gst > 0 and total_amount > 0:
        expected = taxable + total_gst
        tolerance = max(1.0, expected * 0.001)
        if abs(total_amount - expected) > tolerance:
            errors.append({
                "field": "total_amount",
                "rule": "total_mismatch",
                "message": f"Total amount (₹{total_amount:.2f}) doesn't match taxable + GST (₹{expected:.2f})",
            })

    return errors


def rule_required_fields(invoice: dict[str, Any]) -> list[dict[str, str]]:
    """Rule 6: Required fields must be non-empty and non-zero."""
    errors = []
    required = {
        "gstin_supplier": "Supplier GSTIN",
        "invoice_number": "Invoice Number",
        "invoice_date": "Invoice Date",
        "taxable_amount": "Taxable Amount",
        "total_gst": "Total GST",
    }

    for field, label in required.items():
        value = invoice.get(field)
        if value is None or value == "" or value == 0 or value == 0.0:
            errors.append({
                "field": field,
                "rule": "required",
                "message": f"{label} is required and must not be empty or zero",
            })

    return errors


async def rule_duplicate_detection(
    invoice: dict[str, Any], user_id: str, invoice_id: str | None = None
) -> list[dict[str, str]]:
    """Rule 7: Duplicate invoice number + supplier GSTIN for same user."""
    errors = []
    inv_num = invoice.get("invoice_number")
    gstin = invoice.get("gstin_supplier")

    if not inv_num or not gstin:
        return errors

    db = get_database()
    query: dict[str, Any] = {
        "user_id": ObjectId(user_id),
        "invoice_number": inv_num,
        "gstin_supplier": gstin,
    }
    if invoice_id:
        query["_id"] = {"$ne": ObjectId(invoice_id)}

    existing = await db.invoices.find_one(query)
    if existing:
        errors.append({
            "field": "invoice_number",
            "rule": "duplicate",
            "message": f"Invoice '{inv_num}' from supplier '{gstin}' already exists",
        })

    return errors


def rule_gst_rate_sanity(invoice: dict[str, Any]) -> list[dict[str, str]]:
    """Rule 8: Implied GST rate must be a standard GST slab."""
    warnings = []
    total_gst = invoice.get("total_gst", 0.0) or 0.0
    taxable = invoice.get("taxable_amount", 0.0) or 0.0

    if taxable <= 0 or total_gst <= 0:
        return warnings

    implied_rate = (total_gst / taxable) * 100

    is_valid_rate = any(
        abs(implied_rate - rate) <= GST_RATE_TOLERANCE for rate in VALID_GST_RATES
    )

    if not is_valid_rate:
        warnings.append({
            "field": "total_gst",
            "rule": "rate_sanity",
            "message": f"Implied GST rate ({implied_rate:.1f}%) doesn't match any standard slab (0, 0.1, 0.25, 3, 5, 12, 18, 28%)",
        })

    return warnings


# ---------------------------------------------------------------------------
# Main validation orchestrator
# ---------------------------------------------------------------------------

async def validate_invoice(
    invoice_data: dict[str, Any],
    user_id: str,
    invoice_id: str | None = None,
) -> dict[str, Any]:
    """Run all validation rules on an invoice and return results."""
    all_errors: list[dict] = []
    all_warnings: list[dict] = []

    # Rule 1: GSTIN format
    all_errors.extend(rule_gstin_format(invoice_data))

    # Rule 2: GSTIN checksum
    all_errors.extend(rule_gstin_checksum(invoice_data))

    # Rule 3: State code
    all_errors.extend(rule_state_code(invoice_data))

    # Rule 4: Date validity
    date_errors, date_warnings = rule_invoice_date(invoice_data)
    all_errors.extend(date_errors)
    all_warnings.extend(date_warnings)

    # Rule 5: Tax math
    all_errors.extend(rule_tax_math(invoice_data))

    # Rule 6: Required fields
    all_errors.extend(rule_required_fields(invoice_data))

    # Rule 7: Duplicate detection
    dup_errors = await rule_duplicate_detection(invoice_data, user_id, invoice_id)
    all_errors.extend(dup_errors)

    # Rule 8: GST rate sanity
    all_warnings.extend(rule_gst_rate_sanity(invoice_data))

    is_valid = len(all_errors) == 0
    status = "valid" if is_valid else "invalid"

    return {
        "valid": is_valid,
        "status": status,
        "errors": all_errors,
        "warnings": all_warnings,
    }


async def validate_and_update_invoice(invoice_id: str, user_id: str) -> dict[str, Any]:
    """Load an invoice from DB, validate it, update its status, and return results."""
    db = get_database()
    invoice = await db.invoices.find_one({
        "_id": ObjectId(invoice_id),
        "user_id": ObjectId(user_id),
    })

    if not invoice:
        return {"error": "Invoice not found", "valid": False, "errors": [], "warnings": []}

    result = await validate_invoice(invoice, user_id, invoice_id)

    # Update the invoice status in DB
    error_messages = [e["message"] for e in result["errors"]]
    warning_messages = [w["message"] for w in result["warnings"]]

    await db.invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {
            "$set": {
                "validation_status": result["status"],
                "validation_errors": error_messages,
                "validation_warnings": warning_messages,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return result


async def validate_all_pending(user_id: str) -> dict[str, Any]:
    """Validate all pending invoices for a user."""
    db = get_database()
    cursor = db.invoices.find({
        "user_id": ObjectId(user_id),
        "validation_status": "pending",
    })

    results = {"total": 0, "valid": 0, "invalid": 0, "details": []}

    async for invoice in cursor:
        inv_id = str(invoice["_id"])
        result = await validate_and_update_invoice(inv_id, user_id)
        results["total"] += 1
        if result.get("valid"):
            results["valid"] += 1
        else:
            results["invalid"] += 1
        results["details"].append({
            "invoice_id": inv_id,
            "invoice_number": invoice.get("invoice_number", ""),
            **result,
        })

    return results

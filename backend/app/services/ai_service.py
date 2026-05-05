"""AI Assistant service — builds context from user data and streams Gemini responses."""

import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from bson import ObjectId

from app.core.config import get_settings
from app.core.database import get_database

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are a GST compliance expert for Indian MSMEs.
Answer only based on the data context provided.
Be concise and specific — cite actual numbers from the context.
If a question cannot be answered from the data, say so clearly.
Never give generic advice; always tie answers to the user's actual figures.
IMPORTANT FORMATTING RULES:
- Never use markdown tables under any circumstances.
- Always respond in plain text paragraphs only.
- You may use bullet points or numbered lists, but never tables.
- Do not use pipe characters (|) or dashes to create table-like structures."""

QUICK_PROMPTS = [
    "Summarise my ITC reconciliation this month",
    "Which vendor caused the most mismatches?",
    "What is my total ITC at risk and why?",
    "Which invoices should I follow up on urgently?",
    "Am I at risk of a GST notice based on my data?",
]


async def _build_context(user_id: str) -> str:
    """Build a data context string from the user's GST data."""
    db = get_database()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    total_invoices = await db.invoices.count_documents({
        "user_id": ObjectId(user_id),
        "is_deleted": {"$ne": True},
    })

    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "is_deleted": {"$ne": True}}},
        {"$group": {"_id": "$reconciliation_status", "count": {"$sum": 1}, "total_gst": {"$sum": "$total_gst"}}},
    ]
    status_data: dict[str, dict] = {}
    async for doc in db.invoices.aggregate(pipeline):
        status_data[doc["_id"]] = doc

    matched = status_data.get("matched", {}).get("count", 0)
    mismatch = status_data.get("mismatch", {}).get("count", 0)
    missing = status_data.get("missing", {}).get("count", 0)
    match_pct = (matched / total_invoices * 100) if total_invoices > 0 else 0
    mismatch_pct = (mismatch / total_invoices * 100) if total_invoices > 0 else 0
    missing_pct = (missing / total_invoices * 100) if total_invoices > 0 else 0

    latest_run = await db.reconciliation_runs.find_one(
        {"user_id": ObjectId(user_id)}, sort=[("run_date", -1)]
    )
    itc_claimable = latest_run.get("total_itc_claimable", 0) if latest_run else 0
    itc_at_risk = latest_run.get("total_itc_at_risk", 0) if latest_run else 0

    vendor_pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "reconciliation_status": "mismatch", "is_deleted": {"$ne": True}}},
        {"$group": {"_id": "$vendor_name", "count": {"$sum": 1}, "total_gst": {"$sum": "$total_gst"}}},
        {"$sort": {"count": -1}}, {"$limit": 5},
    ]
    top_vendors = []
    async for v in db.invoices.aggregate(vendor_pipeline):
        name = v["_id"] or "Unknown"
        top_vendors.append(f"{name} ({v['count']} invoices, ₹{v['total_gst']:,.2f})")

    error_pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "validation_status": "invalid", "is_deleted": {"$ne": True}}},
        {"$sort": {"updated_at": -1}}, {"$limit": 5},
        {"$project": {"invoice_number": 1, "validation_errors": 1}},
    ]
    recent_errors = []
    async for doc in db.invoices.aggregate(error_pipeline):
        inv_num = doc.get("invoice_number", "Unknown")
        errs = doc.get("validation_errors", [])
        if errs:
            recent_errors.append(f"Invoice {inv_num}: {'; '.join(errs[:2])}")

    context = f"""
User's GST Data Summary (as of {today}):
- Total invoices: {total_invoices}
- Matched: {matched} ({match_pct:.1f}%)
- Mismatch: {mismatch} ({mismatch_pct:.1f}%)
- Missing: {missing} ({missing_pct:.1f}%)
- Total ITC claimable: ₹{itc_claimable:,.2f}
- ITC at risk: ₹{itc_at_risk:,.2f}
- Top mismatch vendors: {', '.join(top_vendors) if top_vendors else 'None'}
- Recent validation errors: {'; '.join(recent_errors) if recent_errors else 'None'}
"""
    return context.strip()


async def query_assistant(
    user_id: str, question: str
) -> AsyncGenerator[str, None]:
    """Stream a response from OpenRouter using the user's GST data context."""
    import os
    import json
    import requests
    
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        yield "Error: OPENROUTER_API_KEY is not configured in your .env file."
        return

    context = await _build_context(user_id)
    prompt = f"Context:\n{context}\n\nQuestion: {question}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "GST Compass",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "openai/gpt-oss-120b:free",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "stream": True
    }

    full_response = ""
    try:
        # Note: running requests synchronously inside an async generator might block the event loop briefly,
        # but is acceptable for this local demo without adding new async HTTP dependencies.
        with requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            stream=True,
            timeout=30
        ) as response:
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith("data: ") and line != "data: [DONE]":
                        data_str = line[6:]
                        try:
                            data_json = json.loads(data_str)
                            chunk = data_json["choices"][0]["delta"].get("content", "")
                            if chunk:
                                full_response += chunk
                                yield chunk
                        except (json.JSONDecodeError, KeyError):
                            pass
    except requests.exceptions.RequestException as e:
        error_details = ""
        if hasattr(e, 'response') and e.response is not None:
            error_details = f" - Response: {e.response.text}"
        error_msg = f"Error communicating with OpenRouter: {str(e)}{error_details}"
        logger.error(error_msg)
        yield error_msg
        full_response = error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(error_msg)
        yield error_msg
        full_response = error_msg

    # Save query to database
    db = get_database()
    await db.ai_queries.insert_one({
        "user_id": ObjectId(user_id),
        "question": question,
        "response": full_response,
        "context_snapshot": {"raw_context": context},
        "created_at": datetime.now(timezone.utc),
    })


async def get_query_history(user_id: str, limit: int = 20) -> list[dict[str, Any]]:
    """Get past AI queries for a user."""
    db = get_database()
    queries = []
    cursor = (
        db.ai_queries.find({"user_id": ObjectId(user_id)})
        .sort("created_at", -1)
        .limit(limit)
    )
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])
        queries.append(doc)
    return queries

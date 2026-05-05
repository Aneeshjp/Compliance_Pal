"""AI Assistant routes — streaming SSE query and history."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_service import query_assistant, get_query_history, QUICK_PROMPTS

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])


class QueryRequest(BaseModel):
    """AI assistant query payload."""
    question: str


@router.post("/query")
async def assistant_query(
    payload: QueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """Stream an AI response using SSE based on the user's GST data context."""
    user_id = current_user["_id"]

    if not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty",
        )

    async def event_generator():
        async for chunk in query_assistant(user_id, payload.question):
            data = json.dumps({"text": chunk})
            yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history")
async def assistant_history(current_user: dict = Depends(get_current_user)):
    """Get the last 20 AI queries for the current user."""
    user_id = current_user["_id"]
    history = await get_query_history(user_id)
    return {"history": history}


@router.get("/prompts")
async def get_quick_prompts():
    """Get pre-built quick prompt suggestions."""
    return {"prompts": QUICK_PROMPTS}

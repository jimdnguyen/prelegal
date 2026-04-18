from datetime import datetime, timedelta
from typing import defaultdict

from fastapi import APIRouter, HTTPException, Request

from llm import chat
from models import ChatRequest, ChatResponse

router = APIRouter()

# Simple rate limiting: track requests per IP per minute
request_counts: defaultdict[str, list[datetime]] = defaultdict(list)


def check_rate_limit(ip: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
    """Check if IP has exceeded rate limit. Returns True if allowed, False if exceeded."""
    now = datetime.utcnow()
    cutoff = now - timedelta(seconds=window_seconds)

    # Remove old requests outside the window
    request_counts[ip] = [ts for ts in request_counts[ip] if ts > cutoff]

    if len(request_counts[ip]) >= max_requests:
        return False

    request_counts[ip].append(now)
    return True


@router.post("/assist", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, http_request: Request) -> ChatResponse:
    """Process a chat message and return AI response with any extracted document fields.

    Rate limited: 10 requests per minute per IP.
    """
    ip = http_request.client.host if http_request.client else "unknown"

    if not check_rate_limit(ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded: 10 requests per minute per IP",
        )

    try:
        return chat(request.messages, request.document_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException

from llm import chat
from models import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/assist", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Process a chat message and return AI response with any extracted document fields."""
    try:
        return chat(request.messages, request.document_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

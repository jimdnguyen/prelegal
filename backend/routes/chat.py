from fastapi import APIRouter, HTTPException

from llm import chat
from models import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Process a chat message and return AI response with any extracted NDA fields."""
    try:
        return chat(request.messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

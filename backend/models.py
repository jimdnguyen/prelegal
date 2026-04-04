"""Pydantic models for API request/response schemas."""
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class FieldUpdate(BaseModel):
    """A single extracted document field."""
    key: str
    value: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    document_type: str = "Mutual Non-Disclosure Agreement"


class ChatResponse(BaseModel):
    message: str
    field_updates: list[FieldUpdate]

"""Pydantic models for API request/response schemas."""
from pydantic import BaseModel


# ── Chat ────────────────────────────────────────────────────────────────────

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
    field_updates: list[FieldUpdate] = []


# ── Auth ─────────────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: int
    email: str


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentSaveRequest(BaseModel):
    document_type: str
    title: str
    form_data: dict[str, str]


class DocumentListItem(BaseModel):
    id: int
    document_type: str
    title: str
    created_at: str


class DocumentResponse(BaseModel):
    id: int
    document_type: str
    title: str
    form_data: dict[str, str]
    created_at: str

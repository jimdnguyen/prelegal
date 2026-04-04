"""Pydantic models for API request/response schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class NdaFieldUpdates(BaseModel):
    """Partial NDA form fields extracted from the conversation."""
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[str] = None  # "fixed" | "perpetual"
    mndaTermYears: Optional[int] = Field(None, ge=1, le=99)
    confidentialityTermType: Optional[str] = None  # "fixed" | "perpetual"
    confidentialityTermYears: Optional[int] = Field(None, ge=1, le=99)
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1Company: Optional[str] = None
    party1NoticeAddress: Optional[str] = None
    party1Date: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2Company: Optional[str] = None
    party2NoticeAddress: Optional[str] = None
    party2Date: Optional[str] = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    message: str
    field_updates: NdaFieldUpdates

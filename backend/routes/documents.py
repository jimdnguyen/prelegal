"""Document save/list/retrieve endpoints."""
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlmodel import Session, select

from auth import decode_token
from database import get_session
from db_models import GeneratedDocument, User
from documents import load_catalog
from models import DocumentListItem, DocumentResponse, DocumentSaveRequest

_VALID_DOCUMENT_TYPES = {entry["name"] for entry in load_catalog()}

router = APIRouter()
_bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    session: Session = Depends(get_session),
) -> User:
    """Decode Bearer JWT and return the authenticated User."""
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/documents", response_model=DocumentResponse)
def save_document(
    request: DocumentSaveRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> DocumentResponse:
    if request.document_type not in _VALID_DOCUMENT_TYPES:
        raise HTTPException(status_code=422, detail=f"Unknown document_type: {request.document_type!r}")
    doc = GeneratedDocument(
        user_id=user.id,
        document_type=request.document_type,
        title=request.title,
        form_data=json.dumps(request.form_data),
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return DocumentResponse(
        id=doc.id,
        document_type=doc.document_type,
        title=doc.title,
        form_data=request.form_data,
        created_at=doc.created_at.isoformat(),
    )


@router.get("/documents", response_model=list[DocumentListItem])
def list_documents(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[DocumentListItem]:
    stmt = (
        select(GeneratedDocument)
        .where(GeneratedDocument.user_id == user.id)
        .order_by(GeneratedDocument.created_at.desc())
    )
    docs = session.exec(stmt).all()
    return [
        DocumentListItem(
            id=d.id,
            document_type=d.document_type,
            title=d.title,
            created_at=d.created_at.isoformat(),
        )
        for d in docs
    ]


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> DocumentResponse:
    doc = session.get(GeneratedDocument, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse(
        id=doc.id,
        document_type=doc.document_type,
        title=doc.title,
        form_data=json.loads(doc.form_data),
        created_at=doc.created_at.isoformat(),
    )

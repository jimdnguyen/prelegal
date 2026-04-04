"""Authentication endpoints: register and login."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import create_token, hash_password, verify_password
from database import get_session
from db_models import User
from models import AuthRequest, AuthResponse

router = APIRouter()


@router.post("/auth/register", response_model=AuthResponse)
def register(
    request: AuthRequest, session: Session = Depends(get_session)
) -> AuthResponse:
    existing = session.exec(select(User).where(User.email == request.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=request.email, password_hash=hash_password(request.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return AuthResponse(
        token=create_token(user.id, user.email),
        user_id=user.id,
        email=user.email,
    )


@router.post("/auth/login", response_model=AuthResponse)
def login(
    request: AuthRequest, session: Session = Depends(get_session)
) -> AuthResponse:
    user = session.exec(select(User).where(User.email == request.email)).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(
        token=create_token(user.id, user.email),
        user_id=user.id,
        email=user.email,
    )

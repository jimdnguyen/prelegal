import db_models  # noqa: F401 — registers table metadata with SQLModel
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./prelegal.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def create_db() -> None:
    """Create all tables. Called on startup — DB is ephemeral (no volume mount)."""
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session

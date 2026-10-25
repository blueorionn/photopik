"""SQLAlchemy ORM models for the SQLite database.

These are the persistence models only. The provider-facing contract
stays in :mod:`backend.types.generation` (Pydantic); repositories
convert between the two so neither layer leaks into the other.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model in this package."""


class Generation(Base):
    """One row of the ``generations`` table: a single generation attempt."""

    __tablename__ = "generations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    source: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    aspect_ratio: Mapped[str] = mapped_column(String(16), nullable=False, default="1:1")
    resolution: Mapped[str] = mapped_column(String(16), nullable=False, default="1K")
    n: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    output_format: Mapped[str] = mapped_column(
        String(16), nullable=False, default="png"
    )
    mimetype: Mapped[str | None] = mapped_column(String(64), nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    seed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quality: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Local-provider only; None for OpenRouter generations.
    steps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    guidance: Mapped[float | None] = mapped_column(Float, nullable=True)
    provider_request_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="queued", index=True
    )
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    duration_ms: Mapped[float | None] = mapped_column(Float, nullable=True)

    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, index=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class AppLog(Base):
    """One row of the ``app_logs`` table: an application log record."""

    __tablename__ = "app_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, index=True
    )
    level: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    logger_name: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    generation_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True, index=True
    )
    # JSON-serialised dict with extra context, or None.
    context: Mapped[str | None] = mapped_column(Text, nullable=True)

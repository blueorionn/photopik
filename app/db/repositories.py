"""Repositories: the only place SQLAlchemy queries live.

Views and services call these methods instead of building queries.
Every method opens a short-lived session and commits on success, so
callers never hold a session across a (slow) provider call.

Methods accept and return the Pydantic types from
:mod:`backend.types.generation` where a shared type exists, keeping
the ORM models an internal persistence detail.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from ..types.generation import GenerationRecord
from .models import AppLog, AppSetting, Generation


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generation_to_record(row: Generation) -> GenerationRecord:
    """Convert an ORM ``Generation`` row to a ``GenerationRecord``."""
    return GenerationRecord(
        id=row.id,
        source=row.source,
        prompt=row.prompt,
        model=row.model,
        aspect_ratio=row.aspect_ratio,
        resolution=row.resolution,
        n=row.n,
        output_format=row.output_format,
        mimetype=row.mimetype,
        width=row.width,
        height=row.height,
        negative_prompt=row.negative_prompt,
        seed=row.seed,
        quality=row.quality,
        steps=row.steps,
        guidance=row.guidance,
        provider_request_id=row.provider_request_id,
        status=row.status,
        error=row.error,
        image_path=row.image_path,
        duration_ms=row.duration_ms,
        logged_at=row.logged_at,
        finished_at=row.finished_at,
    )


class GenerationRepository:
    """Persistence for ``generations`` rows."""

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._factory = session_factory

    def create(self, record: GenerationRecord) -> GenerationRecord:
        """Insert a new generation row and return it with its id."""
        row = Generation(
            source=record.source,
            prompt=record.prompt,
            model=record.model,
            aspect_ratio=record.aspect_ratio,
            resolution=record.resolution,
            n=record.n,
            output_format=record.output_format,
            mimetype=record.mimetype,
            width=record.width,
            height=record.height,
            negative_prompt=record.negative_prompt,
            seed=record.seed,
            quality=record.quality,
            steps=record.steps,
            guidance=record.guidance,
            provider_request_id=record.provider_request_id,
            status=record.status,
            error=record.error,
            image_path=record.image_path,
            duration_ms=record.duration_ms,
            logged_at=record.logged_at,
            finished_at=record.finished_at,
        )
        if record.id:
            row.id = record.id
        with self._factory() as session, session.begin():
            session.add(row)
            session.flush()
            return generation_to_record(row)

    def create_running(self, record: GenerationRecord) -> GenerationRecord:
        """Insert ``record`` forced to ``running`` (generation started)."""
        return self.create(record.model_copy(update={"status": "running"}))

    def _update(self, generation_id: str, **fields: Any) -> GenerationRecord | None:
        with self._factory() as session, session.begin():
            row = session.get(Generation, generation_id)
            if row is None:
                return None
            for key, value in fields.items():
                setattr(row, key, value)
            session.flush()
            return generation_to_record(row)

    def mark_succeeded(
        self,
        generation_id: str,
        *,
        image_path: str | None = None,
        duration_ms: float | None = None,
        mimetype: str | None = None,
        seed: int | None = None,
        provider_request_id: str | None = None,
    ) -> GenerationRecord | None:
        """Mark a generation succeeded. Unknown id returns None."""
        fields: dict[str, Any] = {
            "status": "succeeded",
            "error": None,
            "finished_at": _utcnow(),
        }
        if image_path is not None:
            fields["image_path"] = image_path
        if duration_ms is not None:
            fields["duration_ms"] = duration_ms
        if mimetype is not None:
            fields["mimetype"] = mimetype
        if seed is not None:
            fields["seed"] = seed
        if provider_request_id is not None:
            fields["provider_request_id"] = provider_request_id
        return self._update(generation_id, **fields)

    def mark_failed(
        self,
        generation_id: str,
        error: str,
        *,
        duration_ms: float | None = None,
    ) -> GenerationRecord | None:
        """Mark a generation failed with ``error``. Unknown id returns None."""
        fields: dict[str, Any] = {
            "status": "failed",
            "error": error,
            "finished_at": _utcnow(),
        }
        if duration_ms is not None:
            fields["duration_ms"] = duration_ms
        return self._update(generation_id, **fields)

    def get_by_id(self, generation_id: str) -> GenerationRecord | None:
        """Return one generation by id, or None."""
        with self._factory() as session:
            row = session.get(Generation, generation_id)
            return generation_to_record(row) if row is not None else None

    def list_recent(
        self,
        limit: int = 20,
        *,
        source: str | None = None,
        model: str | None = None,
        status: str | None = None,
    ) -> list[GenerationRecord]:
        """Return newest generations first, optionally filtered."""
        stmt = select(Generation).order_by(Generation.logged_at.desc())
        if source is not None:
            stmt = stmt.where(Generation.source == source)
        if model is not None:
            stmt = stmt.where(Generation.model == model)
        if status is not None:
            stmt = stmt.where(Generation.status == status)
        stmt = stmt.limit(limit)
        with self._factory() as session:
            rows = list(session.scalars(stmt))
            return [generation_to_record(row) for row in rows]


class SettingsRepository:
    """Persistence for ``app_settings`` key/value rows."""

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._factory = session_factory

    def get(self, key: str, default: str | None = None) -> str | None:
        with self._factory() as session:
            row = session.get(AppSetting, key)
            return row.value if row is not None else default

    def set(self, key: str, value: str | None) -> None:
        with self._factory() as session, session.begin():
            row = session.get(AppSetting, key)
            if row is None:
                session.add(AppSetting(key=key, value=value))
            else:
                row.value = value

    def delete(self, key: str) -> None:
        with self._factory() as session, session.begin():
            row = session.get(AppSetting, key)
            if row is not None:
                session.delete(row)

    def get_json(self, key: str, default=None):
        raw = self.get(key)
        if not raw:
            return default
        try:
            return json.loads(raw)
        except ValueError:
            return default

    def set_json(self, key: str, value) -> None:
        self.set(key, json.dumps(value))


class AppLogRepository:
    """Persistence for ``app_logs`` rows."""

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._factory = session_factory

    def insert(
        self,
        level: str,
        logger_name: str,
        message: str,
        *,
        generation_id: str | None = None,
        context: dict | None = None,
        logged_at: datetime | None = None,
    ) -> AppLog:
        """Insert one log row and return it."""
        row = AppLog(
            level=level,
            logger_name=logger_name,
            message=message,
            generation_id=generation_id,
            context=json.dumps(context) if context is not None else None,
            logged_at=logged_at or _utcnow(),
        )
        with self._factory() as session, session.begin():
            session.add(row)
            session.flush()
            session.refresh(row)
            return row

    def list_recent(
        self, limit: int = 100, *, generation_id: str | None = None
    ) -> list[AppLog]:
        """Return newest log rows first, optionally for one generation."""
        stmt = select(AppLog).order_by(AppLog.logged_at.desc()).limit(limit)
        if generation_id is not None:
            stmt = stmt.where(AppLog.generation_id == generation_id)
        with self._factory() as session:
            return list(session.scalars(stmt))

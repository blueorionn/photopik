"""Shared generation types for every image provider.

These classes are the contract between the HTTP layer, the providers
(OpenRouter, local models), and the SQLite log. Neither provider writes
to the database itself: a provider turns a ``GenerationRequest`` into a
``GenerationResult``, and the generation service turns that result into
a ``GenerationRecord`` for storage.
"""

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Source = Literal["openrouter", "local"]
Status = Literal["queued", "running", "succeeded", "failed"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GenerationRequest(BaseModel):
    """One text-to-image generation request, provider-agnostic.

    ``extra="forbid"`` so unknown fields (typos, stale frontend keys)
    fail validation instead of being silently ignored.
    """

    model_config = ConfigDict(extra="forbid")

    source: Source
    prompt: str
    model: str
    aspect_ratio: str = "1:1"
    resolution: str = "1K"
    n: int = Field(default=1, ge=1)
    output_format: str = "png"
    width: int | None = Field(default=None, ge=256, le=4096)
    height: int | None = Field(default=None, ge=256, le=4096)
    negative_prompt: str | None = None
    seed: int | None = Field(default=None, ge=0)
    quality: str | None = None
    # Local-provider only. OpenRouter requests leave these as None.
    steps: int | None = Field(default=None, ge=1)
    guidance: float | None = Field(default=None, ge=0.0)


class GenerationResult(BaseModel):
    """A successful generation as returned by a provider.

    Providers raise on failure, so there is no error field here; the
    service catches the exception and records it on the Record.
    ``image_bytes`` is transient: it is saved to disk by storage and
    never written to the database.
    """

    model_config = ConfigDict(extra="allow")

    source: Source
    prompt: str
    model: str
    image_bytes: bytes
    mimetype: str = "image/png"
    aspect_ratio: str
    resolution: str
    n: int = 1
    output_format: str = "png"
    width: int | None = None
    height: int | None = None
    seed: int | None = None
    duration_ms: float | None = None
    provider_request_id: str | None = None


class GenerationRecord(BaseModel):
    """One row of the ``generations`` table in SQLite (db.sqlite3).

    Mirrors the request plus outcome fields. Image bytes are not
    stored here; ``image_path`` points at the file on disk.
    """

    model_config = ConfigDict(extra="allow")

    id: str | None = None
    source: Source
    prompt: str
    model: str
    aspect_ratio: str
    resolution: str
    n: int = 1
    output_format: str = "png"
    mimetype: str | None = None
    width: int | None = None
    height: int | None = None
    negative_prompt: str | None = None
    seed: int | None = None
    quality: str | None = None
    status: Status = "queued"
    error: str | None = None
    image_path: str | None = None
    duration_ms: float | None = None
    logged_at: datetime = Field(default_factory=_utcnow)
    finished_at: datetime | None = None

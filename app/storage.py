"""Filesystem storage for generated images.

Providers return raw bytes; this module is the only place that knows
where those bytes land on disk. The returned path string is what gets
stored in ``generations.image_path`` — image bytes never go to the DB.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT_DIR = _PROJECT_ROOT / "outputs"

_UNSAFE = re.compile(r"[^A-Za-z0-9_-]+")
_EXTENSIONS = {"jpeg": "jpg"}


def _safe(value: str) -> str:
    return _UNSAFE.sub("-", value).strip("-") or "image"


def resolve_output_dir(output_dir: str | Path | None = None) -> Path:
    """Output dir from argument, ``OUTPUT_DIR`` env, or the default."""
    chosen = output_dir or os.environ.get("OUTPUT_DIR") or DEFAULT_OUTPUT_DIR
    return Path(chosen).expanduser().resolve()


def save_image(
    image_bytes: bytes,
    output_format: str,
    generation_id: str,
    output_dir: str | Path | None = None,
) -> str:
    """Save ``image_bytes`` and return the stored path as a string.

    Layout: ``<output_dir>/YYYY-MM-DD/<generation_id>.<ext>`` using
    the UTC date, so one day's generations stay together and filenames
    stay unique by generation id.
    """
    if not image_bytes:
        raise ValueError("image_bytes must be non-empty")
    ext = _EXTENSIONS.get(output_format.lower().lstrip("."), None) or _safe(
        output_format.lower().lstrip(".")
    )
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    directory = resolve_output_dir(output_dir) / day
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{_safe(generation_id)}.{ext}"
    path.write_bytes(image_bytes)
    return str(path)

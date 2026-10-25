"""Loader for the curated local-model catalog in ``data/``.

The catalog itself lives in ``data/local_models.json`` so it can be
edited without touching code. This module only reads it. The file is
display metadata, not the source of truth for usability — the
models directory on disk decides what can actually run.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_CATALOG_PATH = Path(__file__).resolve().parents[2] / "data" / "local_models.json"


@lru_cache(maxsize=1)
def _load_catalog() -> tuple[dict, ...]:
    try:
        raw = json.loads(_CATALOG_PATH.read_text(encoding="utf-8"))
    except OSError, ValueError:
        return ()
    if not isinstance(raw, list):
        return ()
    return tuple(entry for entry in raw if isinstance(entry, dict) and entry.get("id"))


def load_local_model_catalog() -> list[dict]:
    """Return the curated catalog entries from ``data/local_models.json``."""
    return [dict(entry) for entry in _load_catalog()]


# Backwards-compatible name: a fresh list copy on each access is not
# possible with a plain attribute, so this is loaded once at import.
LOCAL_MODEL_CATALOG: list[dict] = load_local_model_catalog()

_CATALOG_BY_ID = {entry["id"]: entry for entry in LOCAL_MODEL_CATALOG}


def catalog_entry(model_id: str) -> dict | None:
    """Curated metadata for ``model_id``, or None if not curated."""
    return _CATALOG_BY_ID.get(model_id)

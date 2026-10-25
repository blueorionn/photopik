"""Curated local-model catalog: display metadata only.

This is not the source of truth for what is usable — the models
directory on disk is. Entries here only improve presentation for
well-known models (size, VRAM guidance, license, defaults). Any
downloaded model not listed here still works with generic defaults.
"""

from __future__ import annotations

LOCAL_MODEL_CATALOG: list[dict] = [
    {
        "id": "stable-diffusion-v1-5/stable-diffusion-v1-5",
        "name": "Stable Diffusion 1.5",
        "description": "Fast, light local model. Good first download.",
        "size_gb": 4.0,
        "min_vram_gb": 4,
        "license": "CreativeML Open RAIL-M",
        "default_steps": 30,
        "default_guidance": 7.5,
    },
    {
        "id": "stabilityai/stable-diffusion-xl-base-1.0",
        "name": "Stable Diffusion XL Base 1.0",
        "description": "Higher detail, slower, needs more VRAM.",
        "size_gb": 7.0,
        "min_vram_gb": 6,
        "license": "CreativeML Open RAIL++-M",
        "default_steps": 30,
        "default_guidance": 7.5,
    },
]

_CATALOG_BY_ID = {entry["id"]: entry for entry in LOCAL_MODEL_CATALOG}


def catalog_entry(model_id: str) -> dict | None:
    """Curated metadata for ``model_id``, or None if not curated."""
    return _CATALOG_BY_ID.get(model_id)

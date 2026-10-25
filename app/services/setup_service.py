"""Setup readiness: derives state, never asks the user to configure."""

from __future__ import annotations

import shutil
from importlib.util import find_spec
from pathlib import Path

from flask import current_app

from ..providers.catalog import LOCAL_MODEL_CATALOG
from . import local_model_service, settings_service


def local_deps_installed() -> bool:
    return find_spec("torch") is not None and find_spec("diffusers") is not None


def _gpu_info() -> str | None:
    if find_spec("torch") is None:
        return None
    try:
        import torch

        if torch.cuda.is_available():
            props = torch.cuda.get_device_properties(0)
            return f"{props.name} · {round(props.total_memory / (1024**3))} GB"
    except Exception:
        return None
    return None


def setup_status() -> dict:
    """Everything the setup wizard / settings panel renders from."""
    models = local_model_service.discover_models()
    models_root = Path(current_app.config.get("LOCAL_MODELS_DIR")).expanduser()
    try:
        free_gb = round(shutil.disk_usage(models_root.parent).free / (1024**3), 1)
    except OSError:
        free_gb = None
    state = settings_service.get_setup_state()
    local_ready = local_deps_installed() and len(models) > 0
    # Readiness always wins: once either provider can generate,
    # setup is complete regardless of how the user got there.
    if settings_service.openrouter_configured() or local_ready:
        state = "ready"
    return {
        "state": state,
        "openrouter_configured": settings_service.openrouter_configured(),
        "local": {
            "deps_installed": local_deps_installed(),
            "ready": local_ready,
            "gpu": _gpu_info(),
            "models_dir": str(models_root),
            "disk_free_gb": free_gb,
            "models": models,
            "catalog": LOCAL_MODEL_CATALOG,
        },
    }

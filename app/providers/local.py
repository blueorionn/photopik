"""Local text-to-image generation via diffusers.

Implements the same ``GenerationProvider`` contract as OpenRouter.
Heavy dependencies (torch, diffusers) are imported lazily inside
methods, never at module top, so the app boots without the ``local``
extra installed; the registry/app simply report this provider as
unavailable until then.

One consumer GPU means concurrency 1: a module-level lock serialises
``generate`` calls, and loaded pipelines are cached per model id so
repeat generations do not reload weights.
"""

from __future__ import annotations

import io
import secrets
import threading
import time
from importlib.util import find_spec

from flask import current_app, has_app_context

from ..types.generation import GenerationRequest, GenerationResult
from .base import GenerationProvider

_GPU_LOCK = threading.Lock()
_PIPELINES: dict[str, object] = {}

# Local catalogue: id is the Hugging Face repo used at load time.
LOCAL_MODELS: dict[str, dict] = {
    "stable-diffusion-v1-5/stable-diffusion-v1-5": {
        "name": "Stable Diffusion 1.5 (local)",
        "description": "Local SD 1.5 via diffusers. Fast on a 6 GB GPU.",
    },
    "stabilityai/stable-diffusion-xl-base-1.0": {
        "name": "Stable Diffusion XL (local)",
        "description": "Local SDXL base via diffusers. Slower, higher detail.",
    },
}

_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"]
_FORMATS = ["png", "jpeg", "webp"]
_MIMETYPES = {"png": "image/png", "jpeg": "image/jpeg", "webp": "image/webp"}


def _supported_parameters() -> dict:
    return {
        "aspect_ratio": {"type": "enum", "values": _ASPECT_RATIOS},
        "resolution": {"type": "enum", "values": ["1K"]},
        "output_format": {"type": "enum", "values": _FORMATS},
        "negative_prompt": {"type": "string"},
        "seed": {"type": "integer"},
        "steps": {"type": "range", "min": 1, "max": 100},
        "guidance": {"type": "range", "min": 0.0, "max": 20.0},
        "n": {"type": "range", "min": 1, "max": 1},
        "size": {"type": "string"},
    }


def _dimensions(request: GenerationRequest) -> tuple[int, int]:
    if request.width and request.height:
        return request.width, request.height
    try:
        rw, rh = (int(p) for p in request.aspect_ratio.split(":", 1))
    except ValueError, AttributeError:
        rw, rh = 1, 1
    base = 1024
    if rw >= rh:
        width, height = base, round(base * rh / rw)
    else:
        width, height = round(base * rw / rh), base
    return max(256, width - width % 8), max(256, height - height % 8)


class LocalProvider(GenerationProvider):
    """Text-to-image generation on the local GPU via diffusers."""

    name = "local"

    def is_available(self) -> bool:
        if not has_app_context():
            return False
        if not current_app.config.get("ENABLE_LOCAL_MODELS"):
            return False
        return find_spec("torch") is not None and find_spec("diffusers") is not None

    def unavailable_reason(self) -> str | None:
        if not has_app_context():
            return "Local models require an application context."
        if not current_app.config.get("ENABLE_LOCAL_MODELS"):
            return (
                "Local models are disabled. Set ENABLE_LOCAL_MODELS=true "
                "to enable them."
            )
        if find_spec("torch") is None or find_spec("diffusers") is None:
            return (
                "Local model dependencies are not installed. "
                "Install them with: uv sync --extra local"
            )
        return None

    def list_models(self) -> list[dict]:
        return [
            {
                "id": model_id,
                "name": meta["name"],
                "description": meta["description"],
                "supported_parameters": _supported_parameters(),
            }
            for model_id, meta in LOCAL_MODELS.items()
        ]

    def _load_pipeline(self, model_id: str):
        """Load (and cache) a diffusers pipeline for ``model_id``."""
        if model_id in _PIPELINES:
            return _PIPELINES[model_id]
        import torch
        from diffusers import DiffusionPipeline

        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        pipe = DiffusionPipeline.from_pretrained(
            model_id, torch_dtype=dtype, safety_checker=None
        )
        pipe = pipe.to(device)
        _PIPELINES[model_id] = pipe
        return pipe

    def generate(self, request: GenerationRequest) -> GenerationResult:
        if request.source != self.name:
            raise ValueError(f"LocalProvider cannot serve source '{request.source}'")
        if request.model not in LOCAL_MODELS:
            known = ", ".join(sorted(LOCAL_MODELS))
            raise ValueError(
                f"Unknown local model '{request.model}'. Available: {known}"
            )
        if request.n != 1:
            raise ValueError("Local provider generates one image per request")

        started = time.perf_counter()
        with _GPU_LOCK:  # one consumer GPU: serialise all local work
            import torch

            pipe = self._load_pipeline(request.model)
            device = next(pipe.parameters()).device.type
            seed = (
                request.seed if request.seed is not None else secrets.randbelow(2**31)
            )
            generator = torch.Generator(device=device).manual_seed(seed)
            width, height = _dimensions(request)
            result = pipe(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt or None,
                width=width,
                height=height,
                num_inference_steps=request.steps or 30,
                guidance_scale=(
                    request.guidance if request.guidance is not None else 7.5
                ),
                generator=generator,
            )
            image = result.images[0]

        fmt = request.output_format.lower()
        if fmt not in _MIMETYPES:
            raise ValueError(f"Unsupported output_format '{request.output_format}'")
        buffer = io.BytesIO()
        image.save(buffer, format=fmt.upper() if fmt != "jpeg" else "JPEG")
        return GenerationResult(
            source=self.name,
            prompt=request.prompt,
            model=request.model,
            image_bytes=buffer.getvalue(),
            mimetype=_MIMETYPES[fmt],
            aspect_ratio=request.aspect_ratio,
            resolution=request.resolution,
            n=1,
            output_format=fmt,
            width=width,
            height=height,
            seed=seed,
            duration_ms=(time.perf_counter() - started) * 1000,
        )

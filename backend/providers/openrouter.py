import base64
import time

import httpx
from flask import current_app, has_app_context

from ..types.generation import GenerationRequest, GenerationResult
from ..types.image_model import ImageModel
from .base import GenerationProvider

OPENROUTER_IMAGES_URL = "https://openrouter.ai/api/v1/images"
OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/images/models"

_MODEL_CACHE: dict = {"data": None, "fetched_at": 0.0}
_MODEL_CACHE_TTL = 600.0  # seconds


def list_text_to_image_models():
    """Fetch all text-to-image models and it's subsequent data available on OpenRouter.

    Returns:
        list[ImageModel]:  A list of validated image model objects containing
            model metadata, architecture modalities, supported parameters,
            streaming support, and endpoint information.

    Raises:
        httpx.HTTPError: If the HTTP request fails.
        KeyError: If the API response does not contain the expected key.
    """
    now = time.monotonic()

    if (
        _MODEL_CACHE["data"] is not None
        and now - _MODEL_CACHE["fetched_at"] < _MODEL_CACHE_TTL
    ):
        return _MODEL_CACHE["data"]

    response = httpx.get(OPENROUTER_MODELS_URL, timeout=30.0)
    response.raise_for_status()

    data = [
        ImageModel.model_validate(item, extra="allow")
        for item in response.json()["data"]
    ]

    dumped = [model.model_dump(mode="json") for model in data]
    _MODEL_CACHE.update(data=dumped, fetched_at=now)
    return dumped


def _supported_parameters(model_id: str) -> dict:
    """Declared supported_parameters for one model, {} if unknown/unavailable."""

    try:
        for item in list_text_to_image_models():
            if item["id"] == model_id:
                return item.get("supported_parameters") or {}
    except Exception:
        current_app.logger.warning(
            "Could not load model catalogue; skipping parameter filtering",
            exc_info=True,
        )

    return {}


def _check_enum(name: str, value, supported: dict) -> None:
    param = supported.get(name)
    if param and param.get("type") == "enum":
        allowed = [str(v) for v in param.get("values", [])]
        if allowed and str(value) not in allowed:
            raise ValueError(f"Invalid {name} '{value}'. Expected one of: {allowed}")


def _check_range(name: str, value, supported: dict) -> None:
    param = supported.get(name)
    if param and param.get("type") == "range":
        if not (param["min"] <= value <= param["max"]):
            raise ValueError(
                f"Invalid {name} '{value}'. Expected {param['min']}..{param['max']} "
            )


def generate_image(
    prompt: str,
    model: str = "qwen/qwen-image-2.1-turbo",
    *,
    aspect_ratio: str = "16:9",
    resolution: str = "1K",
    n: int = 1,
    output_format: str = "png",
    width: int = 1024,
    height: int = 576,
    negative_prompt: str | None = None,
    seed: int | None = None,
    quality: str | None = None,
    timeout: int = 120.0,
) -> bytes:
    """Generate an image from a text prompt using OpenRouter.

      Args:
        prompt: Description of the image to generate.
        model: OpenRouter image-generation model ID.
        aspect_ratio: One of the model's declared aspect ratios.
        resolution: One of the model's declared resolutions (e.g. "1K").
        n: Number of images (the web UI always sends 1 per request).
        output_format: e.g. "png", "jpeg", "webp" (model-dependent).
        width/height: Pixel size 256..4096. Only forwarded as "size"
            when the model declares a size parameter; otherwise they are
            validated but aspect_ratio/resolution drive the request.
        negative_prompt: Only sent when set and the model declares it.
        seed: Only sent when set and the model declares it.
        quality: Only sent when set and the model declares it.
        timeout: Request timeout in seconds.

    Returns:
        bytes: The generated image as binary data.

     Raises:
        ValueError: If any argument fails validation.
        RuntimeError: If OPENROUTER_API_KEY is not configured.
        httpx.HTTPError: If the API request fails.
        KeyError: If the response does not contain image data.
    """
    # ---- Missing checks: validate before spending an API call ----
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a non-empty string")
    if not isinstance(model, str) or not model.strip():
        raise ValueError("model must be a non-empty string")
    if isinstance(n, bool) or not isinstance(n, int) or n < 1:
        raise ValueError("n must be a positive integer")
    if seed is not None and (
        isinstance(seed, bool) or not isinstance(seed, int) or seed < 0
    ):
        raise ValueError("seed must be a non-negative integer")
    for name, dim in (("width", width), ("height", height)):
        if dim is not None and not (256 <= dim <= 4096):
            raise ValueError(f"{name} must be between 256 and 4096")

    api_key = current_app.config["OPENROUTER_API_KEY"]
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured on the server")

    supported = _supported_parameters(model)
    # Enum/range checks against THIS model's declared parameters.
    _check_enum("aspect_ratio", aspect_ratio, supported)
    _check_enum("resolution", resolution, supported)
    _check_enum("output_format", output_format, supported)
    _check_enum("quality", quality, supported)
    _check_range("n", n, supported)

    # ---- Build config: base fields + optionals only when set ----
    config: dict = {
        "model": model,
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution,
        "n": n,
        "output_format": output_format,
    }

    if negative_prompt and negative_prompt.strip():
        config["negative_prompt"] = negative_prompt
    if seed is not None:
        config["seed"] = seed
    if quality:
        config["quality"] = quality
    if "size" in supported and width and height:
        config["size"] = f"{width}x{height}"

    # ---- Feature: never send a parameter the model does not declare ----
    if supported:
        allowed = {"model", "prompt", *supported.keys()}
        dropped = sorted(set(config) - allowed)
        if dropped:
            current_app.logger.debug(
                "Dropping unsupported params for %s: %s", model, dropped
            )
        config = {k: v for k, v in config.items() if k in allowed}

    response = httpx.post(
        "https://openrouter.ai/api/v1/images",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=config,
        timeout=timeout,
    )
    # ---- Missing check: surface OpenRouter's real error, not just 400 ----
    if response.is_error:
        current_app.logger.error(
            "OpenRouter %s for model %s: %s",
            response.status_code,
            model,
            response.text[:500],
        )
    response.raise_for_status()

    result = response.json()
    data = result.get("data") or []
    if not data or not data[0].get("b64_json"):
        raise KeyError("Openrouter response contains no image data")

    return base64.b64decode(data[0]["b64_json"], validate=True)


_MIMETYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
    "svg": "image/svg+xml",
    "gif": "image/gif",
}


class OpenRouterProvider(GenerationProvider):
    """Text-to-image generation via the OpenRouter Image API."""

    name = "openrouter"

    def is_available(self) -> bool:
        if not has_app_context():
            return False
        return bool(current_app.config.get("OPENROUTER_API_KEY"))

    def unavailable_reason(self) -> str | None:
        if not self.is_available():
            return (
                "OPENROUTER_API_KEY is not configured on the server. "
                "Set it in the backend environment; never in the browser."
            )
        return None

    def list_models(self) -> list[dict]:
        return list_text_to_image_models()

    def generate(self, request: GenerationRequest) -> GenerationResult:
        if request.source != self.name:
            raise ValueError(
                f"OpenRouterProvider cannot serve source '{request.source}'"
            )

        kwargs: dict = {
            "aspect_ratio": request.aspect_ratio,
            "resolution": request.resolution,
            "n": request.n,
            "output_format": request.output_format,
            "negative_prompt": request.negative_prompt,
            "seed": request.seed,
            "quality": request.quality,
        }
        if request.width is not None:
            kwargs["width"] = request.width
        if request.height is not None:
            kwargs["height"] = request.height

        started = time.perf_counter()
        image_bytes = generate_image(request.prompt, request.model, **kwargs)
        duration_ms = (time.perf_counter() - started) * 1000

        return GenerationResult(
            source=self.name,
            prompt=request.prompt,
            model=request.model,
            image_bytes=image_bytes,
            mimetype=_MIMETYPES.get(
                request.output_format.lower(), "application/octet-stream"
            ),
            aspect_ratio=request.aspect_ratio,
            resolution=request.resolution,
            n=request.n,
            output_format=request.output_format,
            width=request.width,
            height=request.height,
            seed=request.seed,
            duration_ms=duration_ms,
        )

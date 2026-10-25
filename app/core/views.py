"""HTTP layer: parse, validate, map errors to status codes.

All generation workflow lives in the generation service; all
provider access goes through the registry. This module only turns
JSON into a ``GenerationRequest``, calls the service, and turns
exceptions into HTTP responses.
"""

import base64

import httpx
from flask import current_app, jsonify, request
from flask.views import MethodView
from pydantic import ValidationError

from ..providers.registry import (
    ProviderUnavailableError,
    UnknownProviderError,
    get_provider,
)
from ..types.generation import GenerationRequest


class GetTextToImageModels(MethodView):
    def get(self):
        source = request.args.get("source", "openrouter")
        if source not in ("openrouter", "local"):
            return jsonify({"error": f"Unknown source '{source}'"}), 400
        try:
            provider = get_provider(source)
            return jsonify(provider.list_models()), 200
        except UnknownProviderError as exc:
            return jsonify({"error": str(exc)}), 503
        except ProviderUnavailableError as exc:
            current_app.logger.error("Model provider unavailable: %s", exc)
            return jsonify({"error": str(exc)}), 503
        except Exception:
            current_app.logger.exception("Failed to fetch text-to-image models")
            return jsonify({"error": "Failed to fetch text-to-image models"}), 500


class GenerateBase64Image(MethodView):
    def post(self):
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Prompt and Model ID are required"}), 422

        payload = dict(data)
        payload.setdefault("source", "openrouter")
        try:
            gen_request = GenerationRequest.model_validate(payload)
        except ValidationError as exc:
            first = exc.errors()[0] if exc.errors() else {}
            field = ".".join(str(p) for p in first.get("loc", []))
            message = first.get("msg", "Invalid request")
            detail = f"{field}: {message}" if field else message
            return jsonify({"error": detail}), 400

        service = current_app.extensions.get("generation_service")
        if service is None:
            current_app.logger.error("Generation service is not configured")
            return jsonify({"error": "Generation is not configured"}), 500

        try:
            result = service.generate(gen_request)
        except UnknownProviderError as exc:
            return jsonify({"error": str(exc)}), 400
        except ProviderUnavailableError as exc:
            current_app.logger.error("Provider unavailable: %s", exc)
            return jsonify({"error": str(exc)}), 503
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except RuntimeError as exc:
            current_app.logger.exception("Generation is misconfigured")
            return jsonify({"error": str(exc)}), 500
        except httpx.HTTPStatusError as exc:
            current_app.logger.error(
                "OpenRouter error %s: %s",
                exc.response.status_code,
                exc.response.text[:500],
            )
            return (
                jsonify({"error": "Image provider rejected the request"}),
                502,
            )
        except httpx.HTTPError:
            current_app.logger.exception("Failed to reach OpenRouter")
            return jsonify({"error": "Image provider is unreachable"}), 502
        except Exception:
            current_app.logger.exception("Failed to generate image")
            return jsonify({"error": "Failed to generate image"}), 500

        return (
            jsonify(
                {
                    "data": {
                        "image": base64.b64encode(result.image_bytes).decode("utf-8")
                    }
                }
            ),
            200,
        )

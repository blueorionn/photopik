import base64

import httpx
from flask import request, jsonify, current_app
from flask.views import MethodView

from ..providers.openrouter import list_text_to_image_models, generate_image


class GetTextToImageModels(MethodView):
    async def get(self):
        try:
            data = list_text_to_image_models()
            return jsonify(data), 200
        except Exception:
            current_app.logger.exception("Failed to fetch text-to-image models")
            return jsonify({"error": "Failed to fetch text-to-image models"}), 500


class GenerateBase64Image(MethodView):
    async def post(self):
        # Optional POST /generate fields and the Python type each must have.
        _OPTIONAL_FIELDS: dict[str, type | tuple[type, ...]] = {
            "aspect_ratio": str,
            "resolution": str,
            "n": int,
            "output_format": str,
            "width": (int, type(None)),
            "height": (int, type(None)),
            "negative_prompt": (str, type(None)),
            "seed": (int, type(None)),
            "quality": (str, type(None)),
        }

        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Prompt and Model ID are required"}), 422
        if not isinstance(data.get("prompt"), str) or not data["prompt"].strip():
            return jsonify({"error": "A prompt is required"}), 400
        elif not isinstance(data.get("model"), str) or not data["model"].strip():
            return jsonify({"error": "Model ID is required"}), 400

        # ---- Type checks for every optional field the frontend may send ----
        kwargs: dict = {}
        for field, expected in _OPTIONAL_FIELDS.items():
            if field not in data:
                continue
            value = data[field]
            # bool is a subclass of int in Python; never accept it as one.
            if isinstance(value, bool) and expected is int:
                return jsonify({"error": f"'{field}' must be an integer"}), 400
            if not isinstance(value, expected):
                return jsonify({"error": f"'{field}' has an invalid type"}), 400
            kwargs[field] = value

        # ---- Generate, mapping each failure to the right HTTP status ----
        try:
            image_bytes = generate_image(
                data["prompt"],
                data["model"],
                **kwargs,
            )
        except ValueError as exc:
            # Bad enum/range/dimension caught by utils validation.
            return jsonify({"error": str(exc)}), 400
        except RuntimeError as exc:
            # e.g. OPENROUTER_API_KEY not configured. Server fault, not client's.
            current_app.logger.exception("Generation is misconfigured")
            return jsonify({"error": str(exc)}), 500
        except httpx.HTTPStatusError as exc:
            # OpenRouter rejected the request; log detail, return 502.
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
            jsonify({"data": {"image": base64.b64encode(image_bytes).decode("utf-8")}}),
            200,
        )

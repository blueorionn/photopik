import base64
from flask import request, jsonify, current_app
from flask.views import MethodView
from werkzeug.utils import secure_filename

from .utils import get_text_to_image_model_data, generate_image


class GetTextToImageModels(MethodView):
    async def get(self):
        try:
            data = get_text_to_image_model_data()
            return jsonify(data), 200
        except Exception:
            current_app.logger.exception("Failed to fetch text-to-image models")
            return jsonify({"error": "Failed to fetch text-to-image models"}), 500


class GenerateBase64Image(MethodView):
    async def post(self):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Prompt and Model ID are required"}), 422

            if not isinstance(data.get("prompt"), str):
                return jsonify({"error": "A prompt is required"}), 400
            elif not isinstance(data.get("model"), str):
                return jsonify({"error": "Model ID is required"}), 400

            prompt = data.get("prompt")
            model = data.get("model")
            base64_image = generate_image(prompt, model)
            return (
                jsonify(
                    {"data": {"image": base64.b64encode(base64_image).decode("utf-8")}}
                ),
                200,
            )
        except Exception:
            current_app.logger.exception("Failed to generate image")
            return jsonify("Failed to generate image"), 500

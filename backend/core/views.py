from flask import jsonify, current_app
from flask.views import MethodView
from werkzeug.utils import secure_filename

from .utils import get_text_to_image_model_data


class GetTextToImageModels(MethodView):
    async def get(self):
        try:
            data = get_text_to_image_model_data()
            return jsonify(data), 200
        except Exception:
            current_app.logger.exception("Failed to fetch text-to-image models")
            return jsonify({"error": "Failed to fetch text-to-image models"}), 500

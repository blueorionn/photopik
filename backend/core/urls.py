"""Base URLs."""

from flask import Blueprint, jsonify
from .views import GetTextToImageModels, GenerateBase64Image

blueprint = Blueprint("base", __name__)


@blueprint.route("/")
def index():
    return jsonify({"message": "Hello World!"}), 200


blueprint.add_url_rule(
    "/models", view_func=GetTextToImageModels.as_view("text_to_image_models")
)
blueprint.add_url_rule(
    "/generate", view_func=GenerateBase64Image.as_view("generate_image")
)

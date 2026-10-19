"""Base URLs."""

from flask import Blueprint, jsonify
from .views import GetTextToImageModels

blueprint = Blueprint("base", __name__)


@blueprint.route("/")
def index():
    return jsonify({"message": "Hello World!"}), 200

blueprint.add_url_rule("/models", view_func=GetTextToImageModels.as_view("text_to_image_models"))
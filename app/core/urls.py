"""Base URLs."""

from flask import Blueprint
from .pages import index
from .views import GetTextToImageModels, GenerateBase64Image

blueprint = Blueprint("base", __name__)

blueprint.add_url_rule("/", view_func=index)
blueprint.add_url_rule(
    "/models", view_func=GetTextToImageModels.as_view("text_to_image_models")
)
blueprint.add_url_rule(
    "/generate", view_func=GenerateBase64Image.as_view("generate_image")
)

"""Base views."""

from flask import Blueprint, jsonify

blueprint = Blueprint("base", __name__)


@blueprint.route("/")
def index():
    return jsonify({"message": "Hello World!"}), 200

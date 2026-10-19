"""Main application package."""

from flask import Flask, jsonify

from .settings import config
from .extensions import init_cors
from .core.urls import blueprint as base_blueprint


def create_app(config_object=config):
    """Create an application factory

    :param config_object: The configuration object to use
    """
    app = Flask(__name__)
    app.config.from_object(config_object)

    # log config_object type
    app.logger.info(f"Using {config_object.__class__.__name__}")
    app.logger.info(f"Debug mode is {config_object.DEBUG}")

    register_extension(app)
    register_blueprints(app)
    register_error_handlers(app)

    return app


def register_extension(app: Flask):
    """Registering extensions."""

    init_cors(app)


def register_blueprints(app: Flask):
    """Registering blueprints."""

    app.register_blueprint(base_blueprint)


def register_error_handlers(app: Flask):
    """Registering error handlers."""

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"code": "404", "message": "Page Not Found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"code": "405", "message": "Method Not Allowed"}), 405

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({"code": "500", "message": "Internal Server Error"}), 500

    @app.errorhandler(429)
    def too_many_requests(e):
        return jsonify({"code": "429", "message": "Too Many Requests"}), 429

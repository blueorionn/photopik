"""Main application package."""

from flask import Flask, jsonify

from .settings import config
from .extensions import init_cors
from .core.urls import blueprint as base_blueprint
from .db import SQLiteLogHandler, create_engine_and_factory
from .db.repositories import GenerationRepository, SettingsRepository
from .services import GenerationService
from .storage import save_image


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
    init_database(app)


def init_database(app: Flask):
    """Create the DB engine, repositories, service, and log handler.

    Built here, inside the factory, never at import time: Gunicorn's
    ``preload_app`` must not fork a live engine into workers. SQLite
    uses NullPool, so no connection is shared across the fork.
    Objects are stashed on ``app.extensions`` for views to reach via
    ``current_app.extensions``.
    """
    engine, factory = create_engine_and_factory(
        database_path=app.config.get("DATABASE_PATH")
    )
    app.extensions["db_engine"] = engine
    app.extensions["db_session_factory"] = factory
    app.extensions["settings_repository"] = SettingsRepository(factory)
    # Stored OpenRouter key takes effect immediately; env/config wins.
    if not app.config.get("OPENROUTER_API_KEY"):
        stored = app.extensions["settings_repository"].get("openrouter_api_key")
        if stored:
            app.config["OPENROUTER_API_KEY"] = stored
    repository = GenerationRepository(factory)
    app.extensions["generation_repository"] = repository
    app.extensions["generation_service"] = GenerationService(
        repository,
        save_image=lambda data, fmt, gid: save_image(
            data, fmt, gid, app.config.get("OUTPUT_DIR")
        ),
        logger=app.logger,
    )
    if not any(isinstance(h, SQLiteLogHandler) for h in app.logger.handlers):
        app.logger.addHandler(SQLiteLogHandler(factory))


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

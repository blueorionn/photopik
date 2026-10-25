"""Application Configuration."""

import os
from .utils import generate_secret_key


class Config:
    """Base Configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY", generate_secret_key())
    APP_DIR = os.path.abspath(os.path.dirname(__file__))  # This directory
    PROJECT_ROOT = os.path.abspath(os.path.join(APP_DIR, os.pardir))

    # Database
    DATABASE_PATH = os.environ.get("DATABASE_URL", "sqlite:///db.sqlite")
    # Media output
    OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "output")

    # Openrouter key
    OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")


class DevelopmentConfig(Config):
    """Development Configuration."""

    ENV = "dev"
    DEBUG = True
    CORS_ORIGINS = "*"


class ProductionConfig(Config):
    """Production Configuration."""

    ENV = "prod"
    DEBUG = False
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "").split(",")


class TestingConfig(Config):
    """Testing Configuration."""

    TESTING = True
    DEBUG = True
    CORS_ORIGINS = "*"


_CONFIGS = {
    "dev": DevelopmentConfig,
    "prod": ProductionConfig,
    "test": TestingConfig,
}


def set_config():
    env = os.environ.get("FLASK_ENV", "prod").strip().lower()
    try:
        return _CONFIGS[env]()
    except KeyError:
        raise ValueError(
            f"Unknown FLASK_ENV '{env}'. Expected one of: {', '.join(_CONFIGS)}"
        ) from None


config = set_config()

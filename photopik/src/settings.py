"""Application Configuration."""

import os
from .utils import generate_secret_key


class Config:
    """Base Configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY", generate_secret_key())
    APP_DIR = os.path.abspath(os.path.dirname(__file__))  # This directory
    PROJECT_ROOT = os.path.abspath(os.path.join(APP_DIR, os.pardir))
    SQLALCHEMY_DATABASE_URI = os.environ["SQLALCHEMY_DATABASE_URI"]
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,  # persistent connections per worker
        "max_overflow": 5,  # extra connections under burst load
        "pool_timeout": 30,  # wait limit before giving up on a connection
        "pool_recycle": 280,  # recycle before server/proxy idle-kills (e.g. 300s)
        "pool_pre_ping": True,  # verify connection is alive before using it
    }


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
    SQLALCHEMY_DATABASE_URI = "sqlite://"


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

"""Application Configuration."""

import os
from datetime import timedelta
from .utils import generate_secret_key


class Config:
    """Base Configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY", generate_secret_key())
    APP_DIR = os.path.abspath(os.path.dirname(__file__))  # This directory
    PROJECT_ROOT = os.path.abspath(os.path.join(APP_DIR, os.pardir))

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ["SQLALCHEMY_DATABASE_URI"]
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,  # persistent connections per worker
        "max_overflow": 5,  # extra connections under burst load
        "pool_timeout": 30,  # wait limit before giving up on a connection
        "pool_recycle": 280,  # recycle before server/proxy idle-kills (e.g. 300s)
        "pool_pre_ping": True,  # verify connection is alive before using it
    }

    # Webauthn
    WEBAUTHN_RP_NAME = "Photopik"

    # Authentication
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers", "cookies"]  # access via header, refresh via cookie
    JWT_COOKIE_SAMESITE = "Strict"
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_REFRESH_COOKIE_PATH = os.environ.get(
        "JWT_REFRESH_COOKIE_PATH", "/auth/"
    )  # cookie only sent to auth routes
    MAGIC_LINK_TTL_MINUTES = 15

    # AWS configuration
    AWS_SES_REGION = os.environ.get("AWS_SES_REGION", "us-east-1")
    SES_SENDER = os.environ.get("SES_SENDER", "noreply@functionbasket.com")


class DevelopmentConfig(Config):
    """Development Configuration."""

    ENV = "dev"
    DEBUG = True
    CORS_ORIGINS = "*"

    # Webauthn
    WEBAUTHN_RP_ID: str = "localhost"
    WEBAUTHN_ORIGINS: list[str] = ["http://localhost:5000"]

    # Frontend
    FRONTEND_URL = "http://localhost:5000"


class ProductionConfig(Config):
    """Production Configuration."""

    ENV = "prod"
    DEBUG = False
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "").split(",")

    # Webauthn
    WEBAUTHN_RP_ID: str = os.environ["WEBAUTHN_RP_ID"].strip()
    WEBAUTHN_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.environ["WEBAUTHN_ORIGINS"].split(",")
        if origin.strip()
    ]

    # JWT
    JWT_COOKIE_SECURE = True

    # Frontend
    FRONTEND_URL = os.environ["FRONTEND_URL"].strip()


class TestingConfig(Config):
    """Testing Configuration."""

    TESTING = True
    DEBUG = True
    CORS_ORIGINS = "*"
    SQLALCHEMY_DATABASE_URI = "sqlite://"

    # Webauthn
    WEBAUTHN_RP_ID: str = "localhost"
    WEBAUTHN_ORIGINS: list[str] = ["http://localhost:5000"]

    # Frontend
    FRONTEND_URL = "http://localhost:5000"


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

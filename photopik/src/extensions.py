"""Flask extensions for additional functionalities."""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy


# Flask Cors Configuration
def init_cors(app: Flask):
    origins = app.config.get("CORS_ORIGINS")
    CORS(
        app,
        resources={
            r"/*": {
                "origins": origins,
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            }
        },
    )


db = SQLAlchemy()


def init_db(app: Flask):
    db.init_app(app)

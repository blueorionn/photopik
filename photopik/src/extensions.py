"""Flask extensions for additional functionalities."""

import boto3
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager


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
        supports_credentials=True,
    )


db = SQLAlchemy()


def init_db(app: Flask):
    db.init_app(app)


jwt = JWTManager()


def init_jwt(app: Flask):
    jwt.init_app(app)


def init_aws(app: Flask):
    app.extensions["ses"] = boto3.client(
        "sesv2", region_name=app.config["AWS_SES_REGION"]
    )

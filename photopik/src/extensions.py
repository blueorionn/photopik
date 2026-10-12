"""Flask extensions for additional functionalities."""

import boto3
from flask import Flask, jsonify
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
    """Register the JWT manager."""

    jwt.init_app(app)

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"code": "401", "message": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"code": "401", "message": "Invalid token"}), 401

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"code": "401", "message": "Missing credentials"}), 401

    @jwt.revoked_token_loader
    def revoked_token(jwt_header, jwt_payload):
        return jsonify({"code": "401", "message": "Token has been revoked"}), 401


def init_aws(app: Flask):
    app.extensions["ses"] = boto3.client(
        "sesv2", region_name=app.config["AWS_SES_REGION"]
    )

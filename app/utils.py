"""Utility functions."""

import secrets
import uuid


def generate_secret_key():
    """Generate a random string of 50 characters."""
    chars = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)"
    secret_len = 50
    return "".join(secrets.choice(chars) for i in range(secret_len))


def is_valid_uuid_v4(id_str):
    try:
        uuid_obj = uuid.UUID(id_str, version=4)
        return str(uuid_obj) == id_str
    except ValueError:
        return False


def kebab_case(text: str) -> str:
    """Convert text to kebab case"""
    return text.lower().replace(" ", "-")

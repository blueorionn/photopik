"""Authorization decorators for role-based access control"""

from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required


def role_required(*roles: str):
    """Require a valid access token whose role claim is in ``roles``.

    Returns 401 (via the JWT error handlers) for missing/invalid
    tokens and 403 for authenticated users with the wrong role.
    """

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claim = get_jwt()
            if claim.get("role") not in roles or claim.get("status") != "active":
                return (
                    jsonify(
                        {
                            "code": "403",
                            "message": "Access to this resource on the server is denied.",
                        }
                    ),
                    403,
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator

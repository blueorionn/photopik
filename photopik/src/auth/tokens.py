"""Token helpers: magic tokens and JWT pair issuance/rotation."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token, get_jti

from photopik.src.extensions import db
from photopik.src.auth.models import (
    MagicToken,
    MagicTokenPurpose,
    RefreshToken,
    User,
)


def hash_token(raw: str) -> str:
    """Return the SHA-256 hex digest of a raw token string.

    Only the digest is ever stored; the raw token exists solely inside
    the magic link / response payload.
    """

    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def create_magic_token(user: User, purpose: MagicTokenPurpose, ttl: timedelta) -> str:
    """Create a single-use magic token row and return the raw token.

    :param user: owner of the token
    :param purpose: LOGIN (magic link) or WEBAUTHN_ENROLL (bootstrap)
    :param ttl: validity window (e.g. 15 min for login, 24 h for enroll)
    """

    raw = secrets.token_urlsafe(32)
    db.session.add(
        MagicToken(
            user_id=user.id,
            token_hash=hash_token(raw),
            purpose=purpose,
            expires_at=datetime.now(timezone.utc) + ttl,
        )
    )
    db.session.commit()

    return raw


def consume_magic_token(raw: str, purpose: MagicTokenPurpose) -> MagicToken | None:
    """Validate and burn a magic token.

    Returns the MagicToken row on success, None if unknown, already
    used, or expired. Marks used_at but does NOT commit -- the caller
    commits together with the rest of its transaction.
    """

    token = db.session.scalar(
        db.select(MagicToken).filter_by(token_hash=hash_token(raw), purpose=purpose)
    )
    now = datetime.now(timezone.utc)
    if token is None or token.used_at is not None or now >= token.expires_at:
        return None
    token.used_at = now
    return token


def issue_token_pair(user: User) -> tuple[str, str, RefreshToken]:
    """Create an access/refresh JWT pair and persist the refresh jti.

    Claims include {"role": ..., "status": ...}; identity is
    str(user.id). Commits the RefreshToken row. Returns
    (access_token, refresh_token, row).
    """

    claims = {"role": user.role.value, "status": user.status.value}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh_token = create_refresh_token(
        identity=str(user.id), additional_claims=claims
    )

    row = RefreshToken(
        user_id=user.id,
        jti=get_jti(refresh_token),
        expires_at=datetime.now(timezone.utc)
        + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"],
    )
    db.session.add(row)
    db.session.commit()

    return (access_token, refresh_token, row)


def rotate_refresh_token(user: User, current_jti: str) -> tuple[str, str] | None:
    """Rotate a refresh token; return the new pair or None on failure.

    Reuse detection: a presented-but-revoked jti means the token was
    stolen -- revoke ALL of the user's active refresh tokens and return
    None (view maps this to 401).
    """

    now = datetime.now(timezone.utc)
    row = db.session.scalar(db.select(RefreshToken).filter_by(jti=current_jti))

    if row is None or now >= row.expires_at:
        return None

    if row.revoked_at is not None:
        db.session.execute(
            db.update(RefreshToken)
            .where(
                RefreshToken.user_id == row.user_id, RefreshToken.revoked_at.is_(None)
            )
            .values(revoked_at=now)
        )
        db.session.commit()
        return None

    access, refresh, new_row = issue_token_pair(user)
    row.revoked_at = now
    row.replaced_by = new_row.id
    db.session.commit()

    return (access, refresh)

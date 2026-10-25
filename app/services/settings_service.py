"""Application settings and secrets, backed by ``app_settings``.

Precedence for the OpenRouter key: real environment/config value,
then the server-side stored key. The stored key is write-only from
the API's perspective — callers only learn whether one is configured.
"""

from __future__ import annotations

from flask import current_app

KEY_OPENROUTER_API_KEY = "openrouter_api_key"
KEY_SETUP_STATE = "setup_state"
KEY_DEFAULT_SOURCE = "default_source"
KEY_CONSENT_LOCAL = "consent_local_install"


def _repo():
    return current_app.extensions["settings_repository"]


def get_openrouter_api_key() -> str:
    """Effective OpenRouter key: env/config override, else stored."""
    configured = current_app.config.get("OPENROUTER_API_KEY") or ""
    if configured:
        return configured
    repo = current_app.extensions.get("settings_repository")
    if repo is None:
        return ""
    return repo.get(KEY_OPENROUTER_API_KEY) or ""


def openrouter_configured() -> bool:
    return bool(get_openrouter_api_key())


def set_openrouter_api_key(api_key: str) -> None:
    _repo().set(KEY_OPENROUTER_API_KEY, api_key.strip())
    if get_setup_state() in ("", "not_started"):
        set_setup_state("openrouter_configured")


def delete_openrouter_api_key() -> None:
    _repo().delete(KEY_OPENROUTER_API_KEY)


def get_setup_state() -> str:
    repo = current_app.extensions.get("settings_repository")
    if repo is None:
        return "ready" if openrouter_configured() else "not_started"
    return repo.get(KEY_SETUP_STATE) or (
        "ready" if openrouter_configured() else "not_started"
    )


def set_setup_state(state: str) -> None:
    _repo().set(KEY_SETUP_STATE, state)


def record_local_consent(payload: dict) -> None:
    from datetime import datetime, timezone

    payload = dict(payload)
    payload["accepted_at"] = datetime.now(timezone.utc).isoformat()
    _repo().set_json(KEY_CONSENT_LOCAL, payload)

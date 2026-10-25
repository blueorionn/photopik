"""Setup endpoints: first-run wizard and provider settings.

The OpenRouter key is write-only here: POST stores it server-side,
responses only report whether one is configured. Consent for local
install/download is given in the UI and recorded before any job
starts; background work is polled via the job endpoint.
"""

from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from ..services import local_model_service, settings_service, setup_service

blueprint = Blueprint("setup", __name__, url_prefix="/setup")


@blueprint.get("/status")
def status():
    return jsonify(setup_service.setup_status()), 200


@blueprint.post("/openrouter")
def save_openrouter():
    data = request.get_json(silent=True) or {}
    api_key = data.get("api_key")
    if not isinstance(api_key, str) or not api_key.strip():
        return jsonify({"error": "api_key is required"}), 400
    settings_service.set_openrouter_api_key(api_key)
    current_app.config["OPENROUTER_API_KEY"] = api_key.strip()
    return jsonify({"openrouter_configured": True}), 200


@blueprint.delete("/openrouter")
def delete_openrouter():
    settings_service.delete_openrouter_api_key()
    if not current_app.config.get("OPENROUTER_API_KEY"):
        pass
    return (
        jsonify({"openrouter_configured": settings_service.openrouter_configured()}),
        200,
    )


@blueprint.post("/local/consent-install")
def consent_install():
    data = request.get_json(silent=True) or {}
    if data.get("consent") is not True:
        return jsonify({"error": "consent is required"}), 400
    settings_service.record_local_consent({"scope": "install_deps", **data})
    settings_service.set_setup_state("local_installing_deps")
    job_id = local_model_service.start_deps_install()
    return jsonify({"job_id": job_id}), 202


@blueprint.post("/local/models/download")
def download_model():
    data = request.get_json(silent=True) or {}
    repo_id = data.get("repo_id")
    if not isinstance(repo_id, str) or not repo_id.strip() or ".." in repo_id:
        return jsonify({"error": "a valid repo_id is required"}), 400
    if data.get("accept_license") is not True:
        return jsonify({"error": "license acceptance is required"}), 400
    settings_service.record_local_consent(
        {"scope": "download_model", "repo_id": repo_id.strip()}
    )
    job_id = local_model_service.start_download(repo_id.strip())
    return jsonify({"job_id": job_id}), 202


@blueprint.delete("/local/models/<path:repo_id>")
def delete_model(repo_id: str):
    try:
        deleted = local_model_service.delete_model(repo_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if not deleted:
        return jsonify({"error": "model not found"}), 404
    return jsonify({"deleted": repo_id}), 200


@blueprint.get("/jobs/<job_id>")
def job_status(job_id: str):
    job = local_model_service.get_job(job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    return jsonify(job), 200

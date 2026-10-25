"""Setup flow: stored secret, consent gates, local discovery."""

from app import create_app
from app.settings import TestingConfig


def _app(tmp_path):
    config = TestingConfig()
    config.DATABASE_PATH = str(tmp_path / "app.sqlite3")
    config.OUTPUT_DIR = str(tmp_path / "output")
    config.LOCAL_MODELS_DIR = str(tmp_path / "models")
    config.OPENROUTER_API_KEY = ""
    return create_app(config), config


def test_catalog_loads_entries_from_data_file():
    from app.providers.catalog import LOCAL_MODEL_CATALOG, catalog_entry

    assert len(LOCAL_MODEL_CATALOG) >= 10
    ids = [entry["id"] for entry in LOCAL_MODEL_CATALOG]
    assert len(set(ids)) == len(ids)
    assert catalog_entry(ids[0])["name"]
    assert catalog_entry("not/a-model") is None


def test_setup_status_starts_unconfigured(tmp_path):
    app, _ = _app(tmp_path)
    data = app.test_client().get("/setup/status").get_json()
    assert data["openrouter_configured"] is False
    assert data["local"]["catalog"]
    assert data["local"]["models"] == []


def test_openrouter_key_is_stored_and_never_returned(tmp_path):
    app, _ = _app(tmp_path)
    client = app.test_client()
    resp = client.post("/setup/openrouter", json={"api_key": "sk-or-test"})
    assert resp.status_code == 200
    assert "sk-or-test" not in resp.get_data(as_text=True)
    data = client.get("/setup/status").get_json()
    assert data["openrouter_configured"] is True
    assert "sk-or-test" not in str(data)


def test_openrouter_key_required(tmp_path):
    app, _ = _app(tmp_path)
    resp = app.test_client().post("/setup/openrouter", json={})
    assert resp.status_code == 400


def test_local_install_requires_consent(tmp_path):
    app, _ = _app(tmp_path)
    resp = app.test_client().post("/setup/local/consent-install", json={})
    assert resp.status_code == 400


def test_download_requires_license_acceptance(tmp_path):
    app, _ = _app(tmp_path)
    resp = app.test_client().post(
        "/setup/local/models/download", json={"repo_id": "org/model"}
    )
    assert resp.status_code == 400


def test_discovered_model_appears_and_deletes(tmp_path):
    app, config = _app(tmp_path)
    model_dir = tmp_path / "models" / "org" / "demo"
    model_dir.mkdir(parents=True)
    (model_dir / "model_index.json").write_text("{}")
    client = app.test_client()
    data = client.get("/setup/status").get_json()
    assert [m["id"] for m in data["local"]["models"]] == ["org/demo"]
    models = client.get("/models?source=local")
    # Provider may be unavailable without torch; discovery is via status.
    assert models.status_code in (200, 503)
    resp = client.delete("/setup/local/models/org/demo")
    assert resp.status_code == 200
    assert not model_dir.exists()


def test_delete_rejects_path_escape(tmp_path):
    app, _ = _app(tmp_path)
    resp = app.test_client().delete("/setup/local/models/../outside")
    assert resp.status_code in (400, 404)

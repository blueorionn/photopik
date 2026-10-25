"""Focused tests: GenerationRecord sync and app-factory wiring."""

import base64

from backend import create_app
from backend.db import GenerationRepository, create_engine_and_factory
from backend.providers import registry
from backend.providers.base import GenerationProvider
from backend.settings import TestingConfig
from backend.types.generation import GenerationRecord, GenerationResult


class _FakeProvider(GenerationProvider):
    name = "local"

    def list_models(self):
        return []

    def generate(self, request):
        return GenerationResult(
            source="local",
            prompt=request.prompt,
            model=request.model,
            image_bytes=b"fake-png-bytes",
            aspect_ratio=request.aspect_ratio,
            resolution=request.resolution,
            seed=request.seed,
            duration_ms=7.0,
            provider_request_id="req-123",
        )


def test_record_roundtrip_preserves_local_and_provider_fields(tmp_path):
    _, factory = create_engine_and_factory(database_path=tmp_path / "t.sqlite3")
    repo = GenerationRepository(factory)
    created = repo.create_running(
        GenerationRecord(
            source="local",
            prompt="a cat",
            model="fake-1",
            aspect_ratio="1:1",
            resolution="1K",
            steps=20,
            guidance=7.5,
        )
    )
    assert created.steps == 20
    assert created.guidance == 7.5
    done = repo.mark_succeeded(
        created.id, image_path="out.png", provider_request_id="req-123"
    )
    assert done.provider_request_id == "req-123"
    assert repo.get_by_id(created.id).provider_request_id == "req-123"


def test_generate_endpoint_uses_service_and_logs_to_db(tmp_path):
    config = TestingConfig()
    config.DATABASE_PATH = str(tmp_path / "app.sqlite3")
    config.OUTPUT_DIR = str(tmp_path / "output")
    registry.register_provider("local", lambda: _FakeProvider())
    try:
        app = create_app(config)
        assert "generation_service" in app.extensions
        client = app.test_client()
        resp = client.post(
            "/generate",
            json={"prompt": "a cat", "model": "fake-1", "source": "local"},
        )
        assert resp.status_code == 200, resp.get_json()
        image = resp.get_json()["data"]["image"]
        assert base64.b64decode(image) == b"fake-png-bytes"

        _, factory = create_engine_and_factory(database_path=config.DATABASE_PATH)
        rows = GenerationRepository(factory).list_recent()
        assert len(rows) == 1
        assert rows[0].status == "succeeded"
        assert rows[0].provider_request_id == "req-123"
    finally:
        registry.register_provider("openrouter", registry._openrouter_factory)
        registry._INSTANCES.pop("local", None)
        registry._FACTORIES.pop("local", None)

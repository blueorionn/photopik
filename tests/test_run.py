"""Focused tests for the run command."""

import importlib.util
from pathlib import Path

import app as app_module
import app.settings as settings_module

_COMMAND = Path(__file__).resolve().parent.parent / "commands" / "run.py"
_spec = importlib.util.spec_from_file_location("run_command", _COMMAND)
run_command = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(run_command)


class _FakeConfig:
    ENV = "dev"
    DEBUG = True


class _FakeApp:
    def __init__(self):
        self.run_kwargs = None

    def run(self, **kwargs):
        self.run_kwargs = kwargs


def _stubbed(monkeypatch):
    fake = _FakeApp()
    calls = []

    def fake_create_app(config):
        calls.append(config)
        return fake

    monkeypatch.setattr(app_module, "create_app", fake_create_app)
    monkeypatch.setattr(settings_module, "set_config", lambda: _FakeConfig())
    return fake, calls


def test_run_defaults_to_dev_on_port_8000(monkeypatch):
    fake, calls = _stubbed(monkeypatch)
    for var in ("HOST", "PORT"):
        monkeypatch.delenv(var, raising=False)
    assert run_command.main([]) == 0
    assert len(calls) == 1
    assert fake.run_kwargs == {
        "host": "0.0.0.0",
        "port": 8000,
        "debug": True,
        "use_reloader": True,
    }


def test_run_flags_win_over_env(monkeypatch):
    fake, _ = _stubbed(monkeypatch)
    monkeypatch.setenv("HOST", "10.0.0.1")
    monkeypatch.setenv("PORT", "9002")
    assert run_command.main(["--host", "127.0.0.1", "--port", "9001"]) == 0
    assert fake.run_kwargs["host"] == "127.0.0.1"
    assert fake.run_kwargs["port"] == 9001


def test_run_env_vars_are_used(monkeypatch):
    fake, _ = _stubbed(monkeypatch)
    monkeypatch.setenv("HOST", "127.0.0.5")
    monkeypatch.setenv("PORT", "9002")
    assert run_command.main([]) == 0
    assert fake.run_kwargs["host"] == "127.0.0.5"
    assert fake.run_kwargs["port"] == 9002


def test_run_always_uses_dev_config(monkeypatch):
    fake, calls = _stubbed(monkeypatch)
    monkeypatch.setenv("FLASK_ENV", "prod")
    assert run_command.main([]) == 0
    assert len(calls) == 1
    assert fake.run_kwargs["debug"] is True

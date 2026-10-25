"""Focused tests for the database health check command."""

import importlib.util
from pathlib import Path

from app.db import create_engine_and_factory

_COMMAND = Path(__file__).resolve().parent.parent / "commands" / "db_health.py"
_spec = importlib.util.spec_from_file_location("db_health", _COMMAND)
db_health = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(db_health)


def test_db_health_ok_on_initialized_db(tmp_path):
    db_path = tmp_path / "ok.sqlite3"
    create_engine_and_factory(database_path=db_path)
    ok, message = db_health.check_database(str(db_path))
    assert ok, message
    assert "generations" in message


def test_db_health_fails_on_missing_tables(tmp_path):
    ok, message = db_health.check_database(str(tmp_path / "empty.sqlite3"))
    assert not ok
    assert "missing tables" in message


def test_db_health_main_exit_codes(tmp_path, capsys):
    db_path = tmp_path / "ok.sqlite3"
    create_engine_and_factory(database_path=db_path)
    assert db_health.main(["--database-path", str(db_path)]) == 0
    assert "OK" in capsys.readouterr().out
    assert db_health.main(["--database-path", str(tmp_path / "nope.sqlite3")]) == 1
    assert "FAIL" in capsys.readouterr().out

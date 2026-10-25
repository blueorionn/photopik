"""Engine and session-factory creation for SQLite via SQLAlchemy.

No Flask-SQLAlchemy: the engine is a plain SQLAlchemy ``Engine``.
Nothing here runs at import time beyond definitions; callers create
the engine explicitly (ideally inside the Flask app factory, so a
Gunicorn ``preload_app`` fork never inherits a live connection).

SQLite choices, applied to every new DBAPI connection:

* WAL journal mode, so readers do not block the writer inserting a
  ``generations`` or ``app_logs`` row.
* Foreign keys on and a 5s busy timeout, so brief writer contention
  waits instead of raising ``database is locked``.
* ``NullPool``: a fresh connection per session. With Gunicorn sync
  workers (and its preload fork) this avoids sharing a pooled
  connection across processes; SQLite file access is cheap.
"""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from .models import Base

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = _PROJECT_ROOT / "db.sqlite3"


def resolve_database_url(
    database_path: str | Path | None = None,
    database_url: str | None = None,
) -> str:
    """Return a SQLAlchemy URL from an explicit path, URL, or env/default.

    Precedence: ``database_url`` argument, ``DATABASE_URL`` env,
    ``database_path`` argument, ``DATABASE_PATH`` env, then the
    project-root ``db.sqlite3`` default.
    """
    if database_url:
        return database_url
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url
    path = database_path or os.environ.get("DATABASE_PATH") or DEFAULT_DATABASE_PATH
    return f"sqlite:///{Path(path).expanduser().resolve()}"


def _apply_sqlite_pragmas(dbapi_connection, _connection_record) -> None:
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.execute("PRAGMA synchronous=NORMAL")
    finally:
        cursor.close()


def make_engine(
    database_path: str | Path | None = None,
    database_url: str | None = None,
    *,
    echo: bool = False,
) -> Engine:
    """Create a SQLite engine with WAL pragmas on every connection."""
    url = resolve_database_url(database_path, database_url)
    if url.startswith("sqlite:///") and ":memory:" not in url:
        # Ensure the parent directory exists for file databases.
        Path(url.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        url,
        echo=echo,
        poolclass=NullPool,
        connect_args={"check_same_thread": False},
    )
    if engine.dialect.name == "sqlite":
        event.listen(engine, "connect", _apply_sqlite_pragmas)
    return engine


def make_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Return a session factory bound to ``engine``.

    ``expire_on_commit=False`` so returned ORM objects stay usable
    after their short-lived session closes.
    """
    return sessionmaker(bind=engine, expire_on_commit=False)


def init_db(engine: Engine) -> Engine:
    """Create all tables if they do not exist. Returns ``engine``.

    This is first-schema creation only. Once the schema ships with
    real data, switch to Alembic migrations against ``Base.metadata``.
    """
    Base.metadata.create_all(engine)
    return engine


def create_engine_and_factory(
    database_path: str | Path | None = None,
    database_url: str | None = None,
    *,
    echo: bool = False,
) -> tuple[Engine, sessionmaker[Session]]:
    """Convenience: build an engine, create tables, return (engine, factory)."""
    engine = make_engine(database_path, database_url, echo=echo)
    init_db(engine)
    return engine, make_session_factory(engine)

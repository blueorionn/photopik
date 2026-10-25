"""Database package: SQLAlchemy ORM over SQLite"""

from .engine import (
    DEFAULT_DATABASE_PATH,
    create_engine_and_factory,
    init_db,
    make_engine,
    make_session_factory,
    resolve_database_url,
)
from .logger import SQLiteLogHandler, make_sqlite_log_handler
from .models import AppLog, Base, Generation
from .repositories import AppLogRepository, GenerationRepository

__all__ = [
    "AppLog",
    "AppLogRepository",
    "Base",
    "DEFAULT_DATABASE_PATH",
    "Generation",
    "GenerationRepository",
    "SQLiteLogHandler",
    "create_engine_and_factory",
    "init_db",
    "make_engine",
    "make_session_factory",
    "make_sqlite_log_handler",
    "resolve_database_url",
]

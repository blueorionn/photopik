"""SQLite logging handler.

A real :class:`logging.Handler` that writes each record to the
``app_logs`` table via SQLAlchemy. Two hard requirements:

* It must never raise. The insert is wrapped, and any failure falls
  back to stderr so a logging problem can never kill a generation.
* It uses a short-lived session per record, so it is safe to share
  one handler across threads and Gunicorn sync workers.

Attach generation context with the standard ``extra`` mapping::

    logger.info("generation started", extra={"generation_id": gen_id})
    logger.info("...", extra={"generation_id": gen_id,
                              "log_context": {"model": model_id}})

Both keys are optional; records without them are stored with NULLs.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Union

from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from .engine import make_session_factory
from .repositories import AppLogRepository

FactoryOrEngine = Union[sessionmaker, Engine]


class SQLiteLogHandler(logging.Handler):
    """Logging handler that persists records to ``app_logs``.

    :param factory_or_engine: a ``sessionmaker`` or an ``Engine``
        (an engine is wrapped in a session factory for you).
    :param level: minimum level handled, as with any handler.
    """

    def __init__(
        self,
        factory_or_engine: FactoryOrEngine,
        level: int = logging.NOTSET,
    ) -> None:
        super().__init__(level=level)
        if isinstance(factory_or_engine, Engine):
            factory: sessionmaker[Session] = make_session_factory(factory_or_engine)
        else:
            factory = factory_or_engine
        self._logs = AppLogRepository(factory)

    def emit(self, record: logging.LogRecord) -> None:
        try:
            generation_id = getattr(record, "generation_id", None)
            if generation_id is not None:
                generation_id = str(generation_id)
            context = getattr(record, "log_context", None)
            if context is not None and not isinstance(context, dict):
                context = {"value": str(context)}
            if record.exc_info:
                exc_text = logging.Formatter().formatException(record.exc_info)
                merged = dict(context) if context else {}
                merged["exception"] = exc_text
                context = merged

            self._logs.insert(
                level=record.levelname,
                logger_name=record.name,
                message=record.getMessage(),
                generation_id=generation_id,
                context=context,
                logged_at=datetime.fromtimestamp(record.created, tz=timezone.utc),
            )
        except Exception:
            # Never raise from logging; make the failure visible.
            try:
                sys.stderr.write(
                    "SQLiteLogHandler failed to write log record: "
                    f"{record.name} {record.levelname} {record.getMessage()}\n"
                )
            except Exception:
                pass

    def flush(self) -> None:
        """No buffering: every emit writes immediately."""

    def close(self) -> None:
        super().close()


def make_sqlite_log_handler(
    factory_or_engine: FactoryOrEngine,
    level: int = logging.INFO,
) -> SQLiteLogHandler:
    """Convenience constructor for :class:`SQLiteLogHandler`."""
    return SQLiteLogHandler(factory_or_engine, level=level)


def context_json(row_context: str | None) -> dict | None:
    """Decode an ``AppLog.context`` JSON string back to a dict."""
    if not row_context:
        return None
    try:
        value = json.loads(row_context)
    except TypeError, ValueError:
        return None
    return value if isinstance(value, dict) else None

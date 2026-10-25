"""Simple database health check.

Usage:
    python commands/db_health.py [--database-path PATH]

Checks that the database is reachable, answers ``SELECT 1``, and has
the expected tables. Prints ``OK``/``FAIL`` and exits 0/1 so it can be
used from scripts and CI. Uses the same resolution as the app:
``--database-path`` argument, ``DATABASE_PATH`` env, then the
project-root ``db.sqlite3`` default. Never creates tables.
"""

from __future__ import annotations

import argparse
import sys

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import inspect, text

from app.db.engine import make_engine
from app.db.models import Base

EXPECTED_TABLES = sorted(Base.metadata.tables)


def check_database(database_path: str | None = None) -> tuple[bool, str]:
    """Return ``(ok, message)`` for the configured database."""
    engine = make_engine(database_path=database_path)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            tables = inspect(conn).get_table_names()
    except Exception as exc:
        return False, f"cannot connect: {exc}"
    finally:
        engine.dispose()

    missing = [name for name in EXPECTED_TABLES if name not in tables]
    if missing:
        return False, f"missing tables: {', '.join(missing)}"
    return True, f"reachable, tables present: {', '.join(EXPECTED_TABLES)}"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check database health.")
    parser.add_argument(
        "--database-path",
        default=None,
        help="SQLite file to check (default: DATABASE_PATH env or db.sqlite3)",
    )
    args = parser.parse_args(argv)

    ok, message = check_database(args.database_path)
    print(f"{'OK' if ok else 'FAIL'}: database {message}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

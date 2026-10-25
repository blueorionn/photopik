"""Start the Photopik server for local development.

Usage:
    python commands/run.py [--host HOST] [--port PORT]

Local development only. Always uses the ``dev`` config and the Flask
dev server. Defaults: host ``0.0.0.0``, port ``8000``; each flag falls
back to ``HOST`` / ``PORT`` before the default.
"""

from __future__ import annotations

import argparse
import os
import sys

from dotenv import load_dotenv

load_dotenv()


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start the Photopik dev server.")
    parser.add_argument(
        "--host", default=None, help="Bind host (default: HOST env or 0.0.0.0)"
    )
    parser.add_argument(
        "--port", type=int, default=None, help="Bind port (default: PORT env or 8000)"
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    host = args.host or os.environ.get("HOST") or "0.0.0.0"
    port = args.port if args.port is not None else int(os.environ.get("PORT") or 8000)

    # Local dev only, and config is frozen at import time in
    # app.settings, so pin the environment before importing the app.
    os.environ["FLASK_ENV"] = "dev"

    from app import create_app
    from app.settings import set_config

    config = set_config()
    flask_app = create_app(config)
    flask_app.run(host=host, port=port, debug=config.DEBUG, use_reloader=config.DEBUG)
    return 0


if __name__ == "__main__":
    sys.exit(main())

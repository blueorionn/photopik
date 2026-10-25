"""Install local-model dependencies (torch + diffusers extra).

Usage:
    python commands/install_local.py --yes

Decisions are made in the web setup UI; this script only executes.
Without ``--yes`` it refuses to run, so a bare invocation can never
start a multi-GB install by accident.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if "--yes" not in args:
        print("Refusing to install without --yes (consent is given in the web UI).")
        return 2
    root = Path(__file__).resolve().parent.parent
    cmd = ["uv", "sync", "--extra", "local"]
    print(f"Running: {' '.join(cmd)} in {root}")
    try:
        proc = subprocess.run(cmd, cwd=str(root))
    except FileNotFoundError:
        print("uv was not found. Install uv, then run: uv sync --extra local")
        return 1
    if proc.returncode == 0:
        print("Local dependencies installed. Restart the app to use them.")
    return proc.returncode


if __name__ == "__main__":
    sys.exit(main())

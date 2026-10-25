"""Local model discovery, download, and deletion.

The models directory is the source of truth: any model snapshot
present under it is usable, any removed one disappears. Downloads
run as in-memory background jobs whose progress the UI polls; this
is a restart-simple design for a single-user local app, so job
history intentionally does not survive a server restart.
"""

from __future__ import annotations

import shutil
import threading
import uuid
from pathlib import Path

from flask import current_app

_JOBS: dict[str, dict] = {}
_JOBS_LOCK = threading.Lock()


def models_dir() -> Path:
    return Path(current_app.config.get("LOCAL_MODELS_DIR")).expanduser().resolve()


def _dir_size(path: Path) -> float:
    total = 0
    for child in path.rglob("*"):
        if child.is_file():
            try:
                total += child.stat().st_size
            except OSError:
                pass
    return round(total / (1024**3), 2)


def _is_model_dir(path: Path) -> bool:
    return (
        path.is_dir()
        and any(
            (path / name).exists()
            for name in (
                "model_index.json",
                "config.json",
                "model.safetensors.index.json",
            )
        )
        or (path.is_dir() and any(path.glob("*.safetensors")))
    )


def discover_models() -> list[dict]:
    """All model snapshots currently under the models directory."""
    root = models_dir()
    if not root.exists():
        return []
    found: list[dict] = []
    for path in sorted(root.rglob("*")):
        if _is_model_dir(path):
            model_id = path.relative_to(root).as_posix()
            found.append(
                {"id": model_id, "path": str(path), "size_gb": _dir_size(path)}
            )
    return found


def model_downloaded(model_id: str) -> bool:
    return (models_dir() / model_id).is_dir()


def delete_model(model_id: str) -> bool:
    """Delete a downloaded model. False if it was not present.

    The resolved path is confined inside the models directory, so a
    crafted id can never escape it.
    """
    root = models_dir()
    target = (root / model_id).resolve()
    if root not in target.parents and target != root:
        raise ValueError("model id escapes the models directory")
    if not target.exists():
        return False
    shutil.rmtree(target)
    return True


def get_job(job_id: str) -> dict | None:
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        return dict(job) if job else None


def _new_job(kind: str) -> str:
    job_id = str(uuid.uuid4())
    with _JOBS_LOCK:
        _JOBS[job_id] = {
            "id": job_id,
            "kind": kind,
            "status": "running",
            "message": "",
            "progress": None,
        }
    return job_id


def _finish(job_id: str, status: str, message: str) -> None:
    with _JOBS_LOCK:
        if job_id in _JOBS:
            _JOBS[job_id].update(status=status, message=message)


def start_download(repo_id: str) -> str:
    """Download a Hugging Face repo into the models dir, in background."""
    from huggingface_hub import snapshot_download

    target = models_dir() / repo_id
    job_id = _new_job("download")

    def run() -> None:
        try:
            snapshot_download(repo_id=repo_id, local_dir=str(target))
            _finish(job_id, "succeeded", f"Downloaded {repo_id}")
        except Exception as exc:  # surfaced to the user via job status
            _finish(job_id, "failed", str(exc))

    threading.Thread(target=run, daemon=True).start()
    return job_id


def start_deps_install() -> str:
    """Run commands/install_local.py as a subprocess, in background."""
    import subprocess
    import sys

    root = Path(current_app.root_path).parent
    script = root / "commands" / "install_local.py"
    job_id = _new_job("install_deps")

    def run() -> None:
        try:
            proc = subprocess.run(
                [sys.executable, str(script), "--yes"],
                cwd=str(root),
                capture_output=True,
                text=True,
                timeout=7200,
            )
            tail = (proc.stdout + proc.stderr)[-2000:]
            if proc.returncode == 0:
                _finish(
                    job_id,
                    "succeeded",
                    tail or "Dependencies installed. Restart the app.",
                )
            else:
                _finish(job_id, "failed", tail or f"installer exited {proc.returncode}")
        except Exception as exc:
            _finish(job_id, "failed", str(exc))

    threading.Thread(target=run, daemon=True).start()
    return job_id

"""Generation service: orchestrates one generation end-to-end.

Lifecycle owned here, nowhere else::

    create DB record (running)
      -> provider.generate(request)     # may raise
      -> storage.save_image(bytes)      # may raise
      -> mark record succeeded          # or failed, then re-raise

Providers never touch the DB or disk; views never touch providers or
repositories directly. Exceptions are recorded and re-raised so the
view keeps mapping them to HTTP status codes.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable

from ..db.repositories import GenerationRepository
from ..providers.registry import get_provider
from ..storage import save_image as _default_save_image
from ..types.generation import (
    GenerationRecord,
    GenerationRequest,
    GenerationResult,
)

SaveImage = Callable[[bytes, str, str], str]


def record_from_request(request: GenerationRequest) -> GenerationRecord:
    """Build the initial (running) DB record for a request."""
    return GenerationRecord(
        source=request.source,
        prompt=request.prompt,
        model=request.model,
        aspect_ratio=request.aspect_ratio,
        resolution=request.resolution,
        n=request.n,
        output_format=request.output_format,
        width=request.width,
        height=request.height,
        negative_prompt=request.negative_prompt,
        seed=request.seed,
        quality=request.quality,
        status="running",
    )


class GenerationService:
    """Run generations through providers with full DB audit trail.

    :param generations: repository used for every DB write.
    :param save_image: callable ``(bytes, format, generation_id) -> path``;
        injectable so tests and future object storage can replace disk.
    :param logger: logger for lifecycle messages; records carry
        ``generation_id`` in ``extra`` so ``SQLiteLogHandler`` can
        correlate them in ``app_logs``.
    """

    def __init__(
        self,
        generations: GenerationRepository,
        save_image: SaveImage | None = None,
        logger: logging.Logger | None = None,
    ) -> None:
        self._generations = generations
        self._save_image = save_image or _default_save_image
        self._log = logger or logging.getLogger(__name__)

    def generate(self, request: GenerationRequest) -> GenerationResult:
        """Generate one image, recording the attempt in the DB.

        Returns the provider's ``GenerationResult`` on success.
        On any failure the record is marked failed and the original
        exception is re-raised unchanged.
        """
        record = self._generations.create_running(record_from_request(request))
        gen_id = record.id
        extra = {"generation_id": gen_id}
        self._log.info(
            "generation started: %s via %s",
            request.model,
            request.source,
            extra=extra,
        )
        started = time.perf_counter()
        try:
            provider = get_provider(request.source)
            result = provider.generate(request)
            image_path = self._save_image(
                result.image_bytes, result.output_format, gen_id
            )
            duration_ms = result.duration_ms
            if duration_ms is None:
                duration_ms = (time.perf_counter() - started) * 1000
            self._generations.mark_succeeded(
                gen_id,
                image_path=image_path,
                duration_ms=duration_ms,
                mimetype=result.mimetype,
                seed=result.seed,
                provider_request_id=result.provider_request_id,
            )
        except Exception as exc:
            duration_ms = (time.perf_counter() - started) * 1000
            try:
                self._generations.mark_failed(
                    gen_id,
                    str(exc) or exc.__class__.__name__,
                    duration_ms=duration_ms,
                )
            except Exception:
                self._log.exception("failed to mark generation as failed", extra=extra)
            self._log.warning("generation failed: %s", exc, extra=extra)
            raise
        self._log.info("generation succeeded in %.0f ms", duration_ms, extra=extra)
        return result

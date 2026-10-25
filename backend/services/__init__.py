"""Service layer: orchestrates providers, DB, and storage."""

from .generation_service import GenerationService, record_from_request

__all__ = ["GenerationService", "record_from_request"]

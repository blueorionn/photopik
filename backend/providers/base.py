"""Shared interface that every image provider must implement.

A provider converts a ``GenerationRequest`` into a ``GenerationResult``.
Providers raise on failure (validation, unavailable, upstream errors)
instead of returning an error result, so ``generate`` either returns a
successful ``GenerationResult`` or does not return at all.
"""

from abc import ABC, abstractmethod

from ..types.generation import GenerationRequest, GenerationResult, Source


class GenerationProvider(ABC):
    """Base class for OpenRouter, local, and future providers."""

    #: Registry key. Must match the ``source`` values on the shared types.
    name: Source

    @abstractmethod
    def list_models(self) -> list[dict]:
        """Return the models this provider can generate with.

        Each entry is a JSON-serialisable dict describing one model and
        the parameters it supports, in the shape the frontend expects.
        """
        raise NotImplementedError

    @abstractmethod
    def generate(self, request: GenerationRequest) -> GenerationResult:
        """Generate an image for ``request``.

        Implementations must honour ``request.source`` matching their
        own ``name`` and raise on any failure. On success they return a
        ``GenerationResult`` carrying the image bytes and the seed that
        was actually used.
        """
        raise NotImplementedError

    def is_available(self) -> bool:
        """Whether this provider can generate right now.

        Override when availability depends on runtime state, e.g. a
        missing API key or the local ML stack not being installed.
        Defaults to always available.
        """
        return True

    def unavailable_reason(self) -> str | None:
        """Human-readable reason shown when ``is_available`` is False.

        Return e.g. an install command or missing-configuration hint.
        Defaults to no specific reason.
        """
        return None

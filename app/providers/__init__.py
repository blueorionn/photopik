"""Image generation providers (OpenRouter, local models, ...).

Import providers through the registry instead of reaching for a
concrete class::

    from backend.providers import get_provider

    provider = get_provider("openrouter")
    result = provider.generate(request)
"""

from .base import GenerationProvider
from .registry import (
    ProviderUnavailableError,
    UnknownProviderError,
    get_provider,
    list_available,
    list_sources,
    register_provider,
)

__all__ = [
    "GenerationProvider",
    "ProviderUnavailableError",
    "UnknownProviderError",
    "get_provider",
    "list_available",
    "list_sources",
    "register_provider",
]

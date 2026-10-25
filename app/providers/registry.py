"""Provider registry: the single place that maps a source to a provider.

Views and services ask ``get_provider(source)`` instead of importing a
concrete provider, so adding a provider later (e.g. local models) is a
one-line registration here and no caller changes.

Providers are created lazily and cached as singletons: importing this
module never imports a provider's heavy dependencies, and a provider's
constructor must stay cheap (load models on first ``generate``, not in
``__init__``).
"""

from collections.abc import Callable

from ..types.generation import Source
from .base import GenerationProvider


class UnknownProviderError(LookupError):
    """Raised when no provider is registered for a source."""


class ProviderUnavailableError(RuntimeError):
    """Raised when a registered provider cannot generate right now."""


_Factory = Callable[[], GenerationProvider]

_FACTORIES: dict[Source, _Factory] = {}
_INSTANCES: dict[Source, GenerationProvider] = {}


def register_provider(source: Source, factory: _Factory) -> None:
    """Register ``factory`` for ``source``, replacing any previous one.

    ``factory`` is a zero-argument callable returning a provider. It is
    only called on first use, never at registration time.
    """
    _FACTORIES[source] = factory
    _INSTANCES.pop(source, None)


def _openrouter_factory() -> GenerationProvider:
    # Imported here, not at module level, so importing the registry
    # never pulls in a provider's dependencies.
    from .openrouter import OpenRouterProvider

    return OpenRouterProvider()


register_provider("openrouter", _openrouter_factory)
# Future providers register the same way, e.g.:
# register_provider("local", _local_factory)


def list_sources() -> list[Source]:
    """All registered provider sources, available or not."""
    return list(_FACTORIES)


def get_provider(source: Source) -> GenerationProvider:
    """Return the cached provider for ``source``, creating it on first use.

    Raises:
        UnknownProviderError: If nothing is registered for ``source``.
        ProviderUnavailableError: If the provider exists but
            ``is_available()`` is False.
    """
    if source not in _FACTORIES:
        known = ", ".join(sorted(_FACTORIES)) or "none"
        raise UnknownProviderError(
            f"No provider registered for source '{source}'. Registered: {known}"
        )

    if source not in _INSTANCES:
        _INSTANCES[source] = _FACTORIES[source]()

    provider = _INSTANCES[source]
    if not provider.is_available():
        reason = provider.unavailable_reason()
        detail = f": {reason}" if reason else ""
        raise ProviderUnavailableError(f"Provider '{source}' is unavailable{detail}")
    return provider


def list_available() -> dict[Source, bool]:
    """Availability of every registered provider, for /capabilities."""
    available: dict[Source, bool] = {}
    for source, factory in _FACTORIES.items():
        try:
            provider = _INSTANCES.get(source) or factory()
            available[source] = provider.is_available()
        except Exception:
            available[source] = False
    return available

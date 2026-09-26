from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    """AIService talks to this interface only. Swapping providers (Gemini,
    OpenAI, a local model, ...) never requires touching route or service
    code — just point AIService at a different AIProvider implementation."""

    @abstractmethod
    def explain(self, *, intent: str, question: str, context: dict[str, Any]) -> str:
        """Return a short natural-language explanation of `context`'s
        numbers, in answer to `question`. Must not invent numbers that
        aren't in `context` — the provider explains, it doesn't compute."""
        raise NotImplementedError

import json
from typing import Any

import google.generativeai as genai

from app.config import settings
from app.services.providers.base import AIProvider
from app.services.providers.demo_provider import DemoProvider

_PROMPT_TEMPLATE = """You are a business intelligence analyst. Answer the user's question using ONLY the
numbers in the JSON data below — never invent, estimate, or round differently than what's given.
Respond in 1-3 short sentences, plain business language, no markdown, no preamble.

Question: {question}

Data:
{data}
"""


class GeminiProvider(AIProvider):
    """Calls the Gemini API free tier to phrase an explanation of numbers
    `ai_service` already computed via SQL. Falls back to DemoProvider's
    deterministic template on any failure (timeout, quota, network) so a
    live-mode outage never breaks the user experience."""

    def __init__(self) -> None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(settings.GEMINI_MODEL)
        self._fallback = DemoProvider()

    def explain(self, *, intent: str, question: str, context: dict[str, Any]) -> str:
        prompt = _PROMPT_TEMPLATE.format(question=question, data=json.dumps(context, default=str))
        try:
            response = self._model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    max_output_tokens=200,
                    temperature=0.3,
                ),
                request_options={"timeout": settings.AI_REQUEST_TIMEOUT_SECONDS},
            )
            text = (response.text or "").strip()
            if not text:
                raise ValueError("empty response from Gemini")
            return text[: settings.AI_MAX_RESPONSE_LENGTH]
        except Exception:
            return self._fallback.explain(intent=intent, question=question, context=context)

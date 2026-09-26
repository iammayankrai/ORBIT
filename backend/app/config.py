import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _env_list(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    # Brand — change once, the API responses and docs follow.
    BRAND_NAME: str = os.getenv("BRAND_NAME", "Orbit")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://orbit:orbit@localhost:5432/orbit")

    # AI provider
    AI_MODE: str = os.getenv("AI_MODE", "demo")  # "demo" or "live"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # Abuse / cost safeguards — see app/services/rate_limiter.py
    AI_DAILY_LIMIT: int = int(os.getenv("AI_DAILY_LIMIT", "5"))
    AI_MAX_PROMPT_LENGTH: int = int(os.getenv("AI_MAX_PROMPT_LENGTH", "300"))
    AI_MAX_RESPONSE_LENGTH: int = int(os.getenv("AI_MAX_RESPONSE_LENGTH", "1200"))
    AI_REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "15"))
    AI_CACHE_TTL_SECONDS: int = int(os.getenv("AI_CACHE_TTL_SECONDS", "3600"))

    # CORS — comma-separated list of allowed origins, plus local dev defaults.
    CORS_ALLOWED_ORIGINS: list[str] = _env_list(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )

    MAX_REQUEST_BODY_BYTES: int = int(os.getenv("MAX_REQUEST_BODY_BYTES", str(16 * 1024)))

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    @property
    def is_live_ai(self) -> bool:
        return self.AI_MODE.lower() == "live" and bool(self.GEMINI_API_KEY)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

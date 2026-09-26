from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "brand": settings.BRAND_NAME,
        "ai_mode": "live" if settings.is_live_ai else "demo",
    }

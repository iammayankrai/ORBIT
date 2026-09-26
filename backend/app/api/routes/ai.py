from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.schemas.ai import AIAskRequest, AIAskResponse
from app.services import ai_service, rate_limiter
from app.utils.security import client_identifier

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/ask", response_model=AIAskResponse)
def ask(payload: AIAskRequest, request: Request, db: Session = Depends(get_db)):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if len(question) > settings.AI_MAX_PROMPT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Questions are limited to {settings.AI_MAX_PROMPT_LENGTH} characters.",
        )

    question_hash = rate_limiter.hash_question(question)
    cached = rate_limiter.get_cached_answer(db, question_hash)
    if cached is not None:
        return {**cached, "source": "cache"}

    client_key = rate_limiter.hash_client(client_identifier(request))
    if rate_limiter.is_rate_limited(db, client_key):
        raise HTTPException(
            status_code=429,
            detail=f"You've reached today's free question limit ({settings.AI_DAILY_LIMIT}/day). Try again tomorrow.",
        )

    result = ai_service.ask(db, question)
    rate_limiter.log_query(db, client_key, question, result)

    source = "live" if settings.is_live_ai else "demo"
    return {**result, "source": source}

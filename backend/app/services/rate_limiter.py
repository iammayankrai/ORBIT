"""Per-client daily AI usage limit, plus a short-lived answer cache so
repeated questions (e.g. the suggested-question chips, which many visitors
click) don't re-invoke the AI provider. Both live in the same small table —
see AIQueryLog.

This is intentionally simple (a Postgres table, not Redis) because the whole
point of this MVP is to run on free tiers. It's swappable for Redis later
without touching callers, since both functions here take a `Session`.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.db_models import AIQueryLog


def hash_client(identifier: str) -> str:
    return hashlib.sha256(f"orbit-client:{identifier}".encode()).hexdigest()[:32]


def hash_question(question: str) -> str:
    return hashlib.sha256(question.strip().lower().encode()).hexdigest()


def is_rate_limited(db: Session, client_key: str) -> bool:
    since = datetime.now(timezone.utc) - timedelta(days=1)
    count = db.execute(
        select(func.count()).select_from(AIQueryLog).where(
            AIQueryLog.client_key == client_key, AIQueryLog.created_at >= since
        )
    ).scalar_one()
    return count >= settings.AI_DAILY_LIMIT


def get_cached_answer(db: Session, question_hash: str) -> dict | None:
    since = datetime.now(timezone.utc) - timedelta(seconds=settings.AI_CACHE_TTL_SECONDS)
    row = db.execute(
        select(AIQueryLog.answer_json)
        .where(AIQueryLog.question_hash == question_hash, AIQueryLog.created_at >= since)
        .order_by(AIQueryLog.created_at.desc())
        .limit(1)
    ).first()
    if not row:
        return None
    try:
        return json.loads(row[0])
    except (json.JSONDecodeError, TypeError):
        return None


def log_query(db: Session, client_key: str, question: str, answer: dict) -> None:
    entry = AIQueryLog(
        client_key=client_key,
        question=question[:500],
        question_hash=hash_question(question),
        answer_json=json.dumps(answer, default=str),
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()

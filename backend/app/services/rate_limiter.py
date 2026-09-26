"""In-memory per-client daily AI usage limit, plus a short-lived answer
cache keyed by (dataset, question) so repeated questions against the same
dataset don't re-invoke the AI provider.

In-memory, not a database, because this MVP has no database anymore — the
whole analysis pipeline is stateless (see data_analysis_service.py) and
this API runs as a single free-tier instance. State resets on a redeploy or
cold-start restart; that's an acceptable MVP tradeoff. Swap for Redis if
this ever runs as more than one process.
"""

from __future__ import annotations

import hashlib
import time
from collections import defaultdict, deque

from app.config import settings

_MAX_CACHE_ENTRIES = 500


def hash_client(identifier: str) -> str:
    return hashlib.sha256(f"orbit-client:{identifier}".encode()).hexdigest()[:32]


def hash_dataset(file_bytes: bytes | None, dataset_label: str) -> str:
    """Stable identity for a dataset: the bundled sample is identified by
    its label, an uploaded file by a hash of its bytes — so re-asking the
    same question against the same file hits the cache, and a different
    file never collides with it."""
    if file_bytes is None:
        return f"label:{dataset_label}"
    return hashlib.sha256(file_bytes).hexdigest()[:24]


def hash_question(dataset_key: str, question: str) -> str:
    return hashlib.sha256(f"{dataset_key}:{question.strip().lower()}".encode()).hexdigest()


_daily_hits: dict[str, deque[float]] = defaultdict(deque)
_answer_cache: dict[str, tuple[float, dict]] = {}


def is_rate_limited(client_key: str) -> bool:
    now = time.time()
    hits = _daily_hits[client_key]
    while hits and now - hits[0] > 86400:
        hits.popleft()
    return len(hits) >= settings.AI_DAILY_LIMIT


def record_hit(client_key: str) -> None:
    _daily_hits[client_key].append(time.time())


def get_cached_answer(question_hash: str) -> dict | None:
    entry = _answer_cache.get(question_hash)
    if not entry:
        return None
    cached_at, answer = entry
    if time.time() - cached_at > settings.AI_CACHE_TTL_SECONDS:
        _answer_cache.pop(question_hash, None)
        return None
    return answer


def cache_answer(question_hash: str, answer: dict) -> None:
    if len(_answer_cache) >= _MAX_CACHE_ENTRIES:
        oldest_key = min(_answer_cache, key=lambda k: _answer_cache[k][0])
        _answer_cache.pop(oldest_key, None)
    _answer_cache[question_hash] = (time.time(), answer)

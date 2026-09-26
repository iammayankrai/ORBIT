import time
from collections import defaultdict, deque

from fastapi import Request


def client_identifier(request: Request) -> str:
    """Best-effort anonymous client identity for rate limiting. Trusts
    X-Forwarded-For's first hop since this API expects to sit behind a
    single reverse proxy (Render/Railway/nginx) in front of it."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class SlidingWindowLimiter:
    """A minimal in-process request-rate limiter — enough to blunt casual
    scripted abuse on a single-instance free-tier deployment. Swap for a
    Redis-backed limiter (e.g. slowapi + redis) if this ever runs as more
    than one process."""

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window_seconds:
            hits.popleft()
        if len(hits) >= self.max_requests:
            return False
        hits.append(now)
        return True


general_limiter = SlidingWindowLimiter(max_requests=60, window_seconds=60)

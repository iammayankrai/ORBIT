import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import ai, analytics, health, inventory
from app.config import settings
from app.utils.security import client_identifier, general_limiter

logger = logging.getLogger("orbit")

app = FastAPI(title=f"{settings.BRAND_NAME} API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def enforce_request_limits(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.MAX_REQUEST_BODY_BYTES:
        return JSONResponse(status_code=413, content={"detail": "Request body too large."})

    if not general_limiter.allow(client_identifier(request)):
        return JSONResponse(status_code=429, content={"detail": "Too many requests. Please slow down."})

    return await call_next(request)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong while analysing your data. Please try again."},
    )


app.include_router(health.router)
app.include_router(ai.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")

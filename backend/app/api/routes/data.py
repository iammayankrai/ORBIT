from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.config import settings
from app.schemas.data import AnalyzeResponse, AskResponse
from app.services import ai_service, data_analysis_service as das, rate_limiter
from app.utils.security import client_identifier

router = APIRouter(prefix="/data", tags=["data"])

# Comfortably fits a spreadsheet with tens of thousands of rows while
# keeping this free-tier demo safe from oversized uploads.
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


async def _load_dataframe(file: UploadFile | None, use_sample: bool):
    if use_sample:
        return das.load_sample_dataframe(), das.SAMPLE_DATASET_LABEL, None

    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail="Please upload a file or try the sample dataset.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="That file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="That file is larger than the 8MB limit for this demo.")

    try:
        df = das.load_dataframe(file.filename, content)
    except das.DatasetError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return df, file.filename, content


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile | None = File(None), use_sample: bool = Form(False)):
    df, dataset_name, _ = await _load_dataframe(file, use_sample)
    return das.analyze(df, dataset_name)


@router.post("/ask", response_model=AskResponse)
async def ask(
    request: Request,
    question: str = Form(...),
    file: UploadFile | None = File(None),
    use_sample: bool = Form(False),
):
    question = question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if len(question) > settings.AI_MAX_PROMPT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Questions are limited to {settings.AI_MAX_PROMPT_LENGTH} characters.")

    df, dataset_name, content = await _load_dataframe(file, use_sample)

    dataset_key = rate_limiter.hash_dataset(content, dataset_name)
    question_hash = rate_limiter.hash_question(dataset_key, question)

    cached = rate_limiter.get_cached_answer(question_hash)
    if cached is not None:
        return {**cached, "source": "cache"}

    client_key = rate_limiter.hash_client(client_identifier(request))
    if rate_limiter.is_rate_limited(client_key):
        raise HTTPException(
            status_code=429,
            detail=f"You've reached today's free question limit ({settings.AI_DAILY_LIMIT}/day). Try again tomorrow.",
        )

    schema = das.detect_schema(df)
    result = ai_service.ask(df, schema, question)

    rate_limiter.record_hit(client_key)
    rate_limiter.cache_answer(question_hash, result)

    source = "live" if settings.is_live_ai else "demo"
    return {**result, "source": source}

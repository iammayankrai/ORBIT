from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class AIAskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class AIMetric(BaseModel):
    label: str
    value: str


class AIDriver(BaseModel):
    label: str
    value: Optional[str] = None
    impact: Optional[str] = None


class AIChart(BaseModel):
    type: str
    data: Optional[list[dict[str, Any]]] = None
    nameKey: Optional[str] = None
    valueKey: Optional[str] = None
    suffix: Optional[str] = None


class AIAskResponse(BaseModel):
    question: str
    intent: str
    answer: str
    metrics: list[AIMetric] = []
    drivers: list[AIDriver] = []
    chart: AIChart
    recommendation: Optional[str] = None
    sql: Optional[str] = None
    source: Literal["live", "demo", "cache"] = "demo"

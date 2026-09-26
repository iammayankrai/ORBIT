from typing import Any, Literal, Optional

from pydantic import BaseModel


class HealthReport(BaseModel):
    score: int
    rows_analyzed: int
    columns_detected: int
    missing_pct: float
    duplicate_pct: float
    anomaly_count: int
    date_span_label: Optional[str] = None


class KPI(BaseModel):
    id: str
    label: str
    value: str
    raw_value: float
    change_pct: Optional[float] = None
    direction: Optional[Literal["up", "down"]] = None
    good_direction: Literal["up", "down"] = "up"
    unit: str


class Insight(BaseModel):
    type: Literal["positive", "negative", "warning", "info"]
    text: str


class SchemaColumn(BaseModel):
    name: str
    role: str


class DatasetSchemaOut(BaseModel):
    date_column: Optional[str] = None
    measures: list[SchemaColumn] = []
    dimensions: list[SchemaColumn] = []


class AnalyzeResponse(BaseModel):
    dataset_name: str
    rows: int
    columns: int
    health: HealthReport
    kpis: list[KPI]
    # Chart shape genuinely varies by type (trend/bar-horizontal/donut each
    # carry a different subset of keys) — kept loose rather than forcing a
    # brittle union onto every chart-generation tweak.
    charts: list[dict[str, Any]]
    insights: list[Insight]
    dataset_schema: DatasetSchemaOut


class AIMetric(BaseModel):
    label: str
    value: str


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    question: str
    intent: str
    answer: str
    metrics: list[AIMetric] = []
    chart: Optional[dict[str, Any]] = None
    recommendation: Optional[str] = None
    basis: Optional[str] = None
    source: Literal["live", "demo", "cache"] = "demo"

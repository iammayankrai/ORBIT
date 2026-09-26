"""AIService: decides intent from a free-text question about the uploaded
dataset, computes the real numbers via data_analysis_service (pandas), and
asks a provider to phrase the explanation. Costs stay controlled because a
provider is only ever asked to explain numbers already computed here — it
never invents or recalculates them.

    AIService
      -> DemoProvider   (default, free, deterministic)
      -> GeminiProvider (when AI_MODE=live and GEMINI_API_KEY is set)
"""

from __future__ import annotations

import re
from typing import Any, Callable

import pandas as pd

from app.config import settings
from app.services import data_analysis_service as das
from app.services.providers.base import AIProvider
from app.services.providers.demo_provider import DemoProvider

_INTENTS: list[tuple[str, re.Pattern]] = [
    ("decline_reason", re.compile(r"declin|drop|fell|fall|decreas|why.*(sale|revenue|profit)|worse|went down", re.I)),
    ("top_ranking", re.compile(r"top (products?|items?|customers?|managers?|reps?|sellers?|performers?)|best[- ]sell|highest", re.I)),
    ("best_dimension", re.compile(r"\bbest\b|which (region|category|city|segment|zone)|perform", re.I)),
    ("investigate", re.compile(r"investigat|anomal|unusual|attention|closer look|\brisk\b|wrong", re.I)),
]

_DIMENSION_HINTS: list[tuple[str, re.Pattern]] = [
    ("region", re.compile(r"region|zone", re.I)),
    ("location", re.compile(r"city|location|store|branch|outlet", re.I)),
    ("category", re.compile(r"categor|segment|department", re.I)),
    ("product", re.compile(r"product|item|sku", re.I)),
    ("entity", re.compile(r"manager|\brep\b|agent|employee", re.I)),
    ("customer", re.compile(r"customer|client|account", re.I)),
]


def detect_intent(question: str) -> str:
    for name, pattern in _INTENTS:
        if pattern.search(question):
            return name
    return "fallback"


def _dimension_hint(question: str) -> str | None:
    for role, pattern in _DIMENSION_HINTS:
        if pattern.search(question):
            return role
    return None


def _get_provider() -> AIProvider:
    if settings.is_live_ai:
        from app.services.providers.gemini_provider import GeminiProvider  # lazy: avoid requiring the SDK/key in demo mode

        return GeminiProvider()
    return DemoProvider()


def _primary_measure(schema: das.DatasetSchema) -> das.ColumnInfo | None:
    by_role = {m.role: m for m in schema.measures}
    return by_role.get("revenue") or by_role.get("profit") or by_role.get("quantity") or (schema.measures[0] if schema.measures else None)


def _first_dim(schema: das.DatasetSchema, *roles: str) -> das.ColumnInfo | None:
    by_role = {d.role: d for d in schema.dimensions}
    for role in roles:
        if role and role in by_role:
            return by_role[role]
    return None


def _scaled(value: float, unit: str) -> float:
    return value / 1e7 if unit == "cr" else value


def _decline_reason(df: pd.DataFrame, schema: das.DatasetSchema, question: str) -> dict[str, Any] | None:
    primary = _primary_measure(schema)
    bounds = das.period_bounds(df[schema.date_column]) if schema.date_column and primary else None
    if not primary or not bounds:
        return None

    unit = das.unit_for(primary.role)
    series = pd.to_numeric(df[primary.name], errors="coerce").fillna(0)
    prior = float(series[bounds["prior_mask"]].sum())
    current = float(series[bounds["current_mask"]].sum())
    change_pct = round((current - prior) / prior * 100, 1) if prior else 0.0

    geo_dim = _first_dim(schema, "region", "location")
    cat_dim = _first_dim(schema, "category")
    candidates: list[dict] = []
    for dim in (geo_dim, cat_dim):
        if dim:
            candidates.extend(
                {**row, "dim_noun": dim.name.lower()} for row in das.dimension_period_changes(df, dim.name, primary.name, bounds)
            )
    worst = min(candidates, key=lambda r: r["change_pct"]) if candidates else None

    context = {
        "measure": primary.name,
        "unit": unit,
        "change_pct": change_pct,
        "prior_value": _scaled(prior, unit),
        "current_value": _scaled(current, unit),
        "worst_mover": worst,
    }
    metrics = [
        {"label": f"Prior period {primary.name}", "value": das.format_value(context["prior_value"], unit)},
        {"label": f"Current period {primary.name}", "value": das.format_value(context["current_value"], unit)},
        {"label": "Change", "value": das.format_pct(change_pct, signed=True)},
    ]
    chart = None
    if candidates:
        ranked = sorted(candidates, key=lambda r: r["change_pct"])[:8]
        chart = {
            "type": "dumbbell",
            "data": ranked,
            "priorKey": "prior",
            "currentKey": "current",
            "nameKey": "name",
            "changeKey": "change_pct",
            "priorLabel": "Prior period",
            "currentLabel": "Current period",
        }
    recommendation = (
        f"Start with {worst['name']} — it's the steepest decliner at {das.format_pct(worst['change_pct'])}."
        if worst and worst["change_pct"] < -3
        else None
    )
    dims_used = ", ".join(d.name for d in (geo_dim, cat_dim) if d) or "the available categories"
    basis = (
        f"Split your data's date range in half and compared {primary.name} in the most recent half "
        f"against the prior half, broken down by {dims_used}."
    )

    return {
        "intent": "decline_reason",
        "context": context,
        "metrics": metrics,
        "chart": chart,
        "recommendation": recommendation,
        "basis": basis,
    }


def _best_dimension(df: pd.DataFrame, schema: das.DatasetSchema, question: str) -> dict[str, Any] | None:
    primary = _primary_measure(schema)
    if not primary or not schema.dimensions:
        return None

    hinted_role = _dimension_hint(question)
    dim = _first_dim(schema, hinted_role) if hinted_role else None
    dim = dim or _first_dim(schema, "region", "location", "category", "product", "entity", "customer")
    if not dim:
        return None

    unit = das.unit_for(primary.role)
    series = pd.to_numeric(df[primary.name], errors="coerce").fillna(0)
    ranked = das.top_n_breakdown(df, dim.name, series, 10, unit)
    if len(ranked) < 2:
        return None

    best, worst = ranked[0], ranked[-1]
    context = {"dimension": dim.name, "measure": primary.name, "unit": unit, "best": best, "worst": worst}
    metrics = [
        {"label": f"Best {dim.name}", "value": f"{best['name']} · {das.format_value(best['value'], unit)}"},
        {"label": f"Weakest {dim.name}", "value": f"{worst['name']} · {das.format_value(worst['value'], unit)}"},
    ]
    chart = {"type": "bar-horizontal", "data": ranked, "nameKey": "name", "valueKey": "value", "unit": unit}
    recommendation = f"Study what {best['name']} is doing differently from {worst['name']} — that gap is your biggest lever."
    basis = f"Grouped your data by {dim.name} and summed {primary.name} for each, ranked highest to lowest."

    return {
        "intent": "best_dimension",
        "context": context,
        "metrics": metrics,
        "chart": chart,
        "recommendation": recommendation,
        "basis": basis,
    }


def _top_ranking(df: pd.DataFrame, schema: das.DatasetSchema, question: str) -> dict[str, Any] | None:
    primary = _primary_measure(schema)
    rank_dim = _first_dim(schema, "product", "entity", "customer") or _first_dim(schema, "category", "region", "location")
    if not primary or not rank_dim:
        return None

    unit = das.unit_for(primary.role)
    series = pd.to_numeric(df[primary.name], errors="coerce").fillna(0)
    ranked = das.top_n_breakdown(df, rank_dim.name, series, 8, unit)
    if not ranked:
        return None

    context = {"dimension": rank_dim.name, "measure": primary.name, "unit": unit, "ranked": ranked}
    metrics = [{"label": r["name"], "value": das.format_value(r["value"], unit)} for r in ranked[:3]]
    chart = {"type": "bar-horizontal", "data": ranked, "nameKey": "name", "valueKey": "value", "unit": unit}
    recommendation = f"{ranked[0]['name']} is your strongest performer by {primary.name} — make sure it stays well supported."
    basis = f"Grouped your data by {rank_dim.name} and summed {primary.name}, showing the top {len(ranked)}."

    return {
        "intent": "top_ranking",
        "context": context,
        "metrics": metrics,
        "chart": chart,
        "recommendation": recommendation,
        "basis": basis,
    }


def _investigate(df: pd.DataFrame, schema: das.DatasetSchema, question: str) -> dict[str, Any] | None:
    primary = _primary_measure(schema)
    bounds = das.period_bounds(df[schema.date_column]) if schema.date_column and primary else None
    rank_dim = _first_dim(schema, "product", "entity", "customer") or _first_dim(schema, "region", "location", "category")
    if not primary or not bounds or not rank_dim:
        return None

    unusual = das.detect_unusual_groups(df, rank_dim.name, primary.name, bounds)
    ranked = sorted(unusual, key=lambda r: abs(r["change_pct"]), reverse=True)[:8]

    context = {"dimension": rank_dim.name, "measure": primary.name, "unusual": ranked}
    metrics = [{"label": r["name"], "value": das.format_pct(r["change_pct"], signed=True)} for r in ranked[:3]]
    chart = (
        {"type": "bar-horizontal", "data": ranked, "nameKey": "name", "valueKey": "change_pct", "suffix": "%", "colorBySign": True}
        if ranked
        else None
    )
    recommendation = (
        f"Look into {ranked[0]['name']} first — its change is the most statistically unusual in the dataset." if ranked else None
    )
    basis = (
        f"Compared each {rank_dim.name}'s change between the two halves of your data's date range and flagged "
        "the ones whose swing is statistically unusual versus the rest."
    )

    return {
        "intent": "investigate",
        "context": context,
        "metrics": metrics,
        "chart": chart,
        "recommendation": recommendation,
        "basis": basis,
    }


def _fallback_context(df: pd.DataFrame, schema: das.DatasetSchema) -> dict[str, Any]:
    primary = _primary_measure(schema)
    span_label = None
    if schema.date_column:
        dates = df[schema.date_column].dropna()
        if len(dates):
            span_label = das.format_span_label((dates.max() - dates.min()).days)

    context: dict[str, Any] = {
        "rows": schema.row_count,
        "columns": schema.column_count,
        "span_label": span_label,
        "measures": [m.name for m in schema.measures[:4]],
        "dimensions": [d.name for d in schema.dimensions[:4]],
    }
    metrics = []
    if primary:
        unit = das.unit_for(primary.role)
        total = float(pd.to_numeric(df[primary.name], errors="coerce").fillna(0).sum())
        context["primary_measure"] = primary.name
        context["primary_total"] = _scaled(total, unit)
        context["primary_unit"] = unit
        metrics.append({"label": f"Total {primary.name}", "value": das.format_value(context["primary_total"], unit)})

    return {
        "intent": "fallback",
        "context": context,
        "metrics": metrics,
        "chart": None,
        "recommendation": None,
        "basis": "Read directly from your uploaded data's shape and detected columns.",
    }


_HANDLERS: dict[str, Callable[[pd.DataFrame, das.DatasetSchema, str], dict[str, Any] | None]] = {
    "decline_reason": _decline_reason,
    "best_dimension": _best_dimension,
    "top_ranking": _top_ranking,
    "investigate": _investigate,
}


def ask(df: pd.DataFrame, schema: das.DatasetSchema, question: str) -> dict[str, Any]:
    intent = detect_intent(question)
    handler = _HANDLERS.get(intent)
    built = handler(df, schema, question) if handler else None
    if built is None:
        built = _fallback_context(df, schema)

    provider = _get_provider()
    answer = provider.explain(intent=built["intent"], question=question, context=built["context"])

    return {
        "question": question,
        "intent": built["intent"],
        "answer": answer,
        "metrics": built["metrics"],
        "chart": built["chart"],
        "recommendation": built["recommendation"],
        "basis": built["basis"],
    }

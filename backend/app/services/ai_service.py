"""AIService: the one place that decides intent, fetches real numbers via
SQL, and asks a provider to phrase the explanation. Costs stay controlled
because the provider is only ever asked to explain numbers that were already
computed — never to compute them itself.

    AIService
      -> DemoProvider   (default, free, deterministic)
      -> GeminiProvider (when AI_MODE=live and GEMINI_API_KEY is set)
"""

from __future__ import annotations

import re
from typing import Any, Callable

from sqlalchemy.orm import Session

from app.config import settings
from app.services import sql_service
from app.services.providers.base import AIProvider
from app.services.providers.demo_provider import DemoProvider

_INTENTS: list[tuple[str, re.Pattern]] = [
    ("revenue_decline", re.compile(r"declin|drop|fell|fall|decreas|why.*revenue|q2|quarter", re.I)),
    ("top_regions", re.compile(r"top.*region|best.*region|region.*perform|which region", re.I)),
    ("inventory_risk", re.compile(r"inventory|ageing|aging|stock risk|slow.moving", re.I)),
    ("declining_products", re.compile(r"product.*(attention|declin)|which products|declining sales", re.I)),
    ("compare_yoy", re.compile(r"last year|year.over.year|yoy|annual", re.I)),
    ("sales_manager", re.compile(r"manager|missed target|target", re.I)),
    ("reorder", re.compile(r"reorder|restock|replenish", re.I)),
]


def detect_intent(question: str) -> str:
    for name, pattern in _INTENTS:
        if pattern.search(question):
            return name
    return "fallback"


def _get_provider() -> AIProvider:
    if settings.is_live_ai:
        from app.services.providers.gemini_provider import GeminiProvider  # lazy: avoid requiring the SDK/key in demo mode

        return GeminiProvider()
    return DemoProvider()


def _revenue_decline(db: Session) -> dict[str, Any]:
    bounds = sql_service.get_period_bounds(db)
    kpis = sql_service.kpi_summary(db)
    regions = sql_service.revenue_by_region(db, bounds["current_start"], bounds["prior_start"])
    categories = sql_service.revenue_by_category(db, bounds["current_start"], bounds["prior_start"])

    change_pct = (
        (kpis["current_revenue"] - kpis["prior_revenue"]) / kpis["prior_revenue"] * 100
        if kpis["prior_revenue"]
        else 0
    )
    top_region = max(regions, key=lambda r: r["prior_revenue"] - r["current_revenue"]) if regions else None
    top_category = max(categories, key=lambda r: r["prior_revenue"] - r["current_revenue"]) if categories else None

    context = {
        "change_pct": round(change_pct, 1),
        "current_revenue": kpis["current_revenue"],
        "prior_revenue": kpis["prior_revenue"],
        "prior_label": "last month",
    }
    drivers = []
    if top_region and top_region["prior_revenue"] > 0:
        region_change = (top_region["current_revenue"] - top_region["prior_revenue"]) / top_region["prior_revenue"] * 100
        drivers.append({"label": f"{top_region['region']} region", "value": f"{region_change:.1f}%", "impact": "primary"})
    if top_category and top_category["prior_revenue"] > 0:
        cat_change = (top_category["current_revenue"] - top_category["prior_revenue"]) / top_category["prior_revenue"] * 100
        drivers.append({"label": f"{top_category['category']} category", "value": f"{cat_change:.1f}%", "impact": "secondary"})

    return {
        "context": context,
        "metrics": [
            {"label": "Prior revenue", "value": f"₹{kpis['prior_revenue'] / 1e7:.2f} Cr"},
            {"label": "Current revenue", "value": f"₹{kpis['current_revenue'] / 1e7:.2f} Cr"},
            {"label": "Change", "value": f"{change_pct:.1f}%"},
        ],
        "drivers": drivers,
        "chart": {
            "type": "dumbbell",
            # Inline answer chart: show the biggest movers only, not every
            # region — with 20 regions the full list buries the story.
            "data": sorted(
                (
                    {
                        "name": r["region"],
                        "june": r["prior_revenue"] / 1e7,
                        "july": r["current_revenue"] / 1e7,
                        "changePct": ((r["current_revenue"] - r["prior_revenue"]) / r["prior_revenue"] * 100) if r["prior_revenue"] else 0,
                    }
                    for r in regions
                    if r["prior_revenue"] > 0
                ),
                key=lambda r: abs(r["changePct"]),
                reverse=True,
            )[:8],
        },
        "recommendation": f"Investigate the change in {top_region['region'] if top_region else 'the affected'} region and review inventory availability for the SKUs involved.",
        "sql": "SELECT region, SUM(revenue) FROM sales JOIN regions ... GROUP BY region, month",
    }


def _top_regions(db: Session) -> dict[str, Any]:
    bounds = sql_service.get_period_bounds(db)
    attainment = sql_service.sales_manager_attainment(db, bounds["current_start"])
    by_region: dict[str, list[float]] = {}
    for row in attainment:
        pct = (row["actual_amount"] / row["target_amount"] * 100) if row["target_amount"] else 0
        by_region.setdefault(row["region"], []).append(pct)
    ranked = sorted(
        ({"name": region, "attainment": sum(vals) / len(vals)} for region, vals in by_region.items()),
        key=lambda r: r["attainment"],
        reverse=True,
    )
    return {
        "context": {"ranked": ranked},
        "metrics": [{"label": r["name"], "value": f"{r['attainment']:.0f}%"} for r in ranked[:3]],
        "drivers": [{"label": r["name"], "value": f"{r['attainment']:.0f}% of target", "impact": "positive"} for r in ranked[:3]],
        "chart": {"type": "bars-horizontal", "data": ranked, "nameKey": "name", "valueKey": "attainment", "suffix": "%"},
        "recommendation": f"Study what {ranked[0]['name']} is doing differently versus {ranked[-1]['name']}." if len(ranked) > 1 else None,
        "sql": "SELECT region, AVG(actual/target*100) FROM sales_targets JOIN orders ... GROUP BY region",
    }


def _inventory_risk(db: Session) -> dict[str, Any]:
    risk_rows = sql_service.inventory_risk(db)
    buckets = sql_service.inventory_ageing_buckets(db)
    risk_value = sum(r["value"] for r in risk_rows)
    return {
        "context": {"risk_sku_count": len(risk_rows), "risk_value": risk_value},
        "metrics": [
            {"label": "At-risk SKUs", "value": str(len(risk_rows))},
            {"label": "Ageing value", "value": f"₹{risk_value / 1e7:.2f} Cr"},
        ],
        "drivers": [{"label": r["name"], "value": f"{r['days_ageing']} days · ₹{r['value'] / 1e5:.1f} L", "impact": "negative"} for r in risk_rows[:3]],
        "chart": {"type": "columns", "data": buckets, "nameKey": "bucket", "valueKey": "value"},
        "recommendation": "Discount or bundle the highest-ageing SKUs before their value erodes further.",
        "sql": "SELECT sku, EXTRACT(day FROM now()-received_date), value FROM inventory WHERE ... ORDER BY value DESC",
    }


def _declining_products(db: Session) -> dict[str, Any]:
    bounds = sql_service.get_period_bounds(db)
    rows = sql_service.declining_products(db, bounds["current_start"], bounds["prior_start"])
    products = []
    for r in rows:
        change = (r["current_revenue"] - r["prior_revenue"]) / r["prior_revenue"] * 100 if r["prior_revenue"] else 0
        if change < 0:
            products.append({"name": r["name"], "category": r["category"], "region": r["region"], "changePct": round(change, 1)})
    return {
        "context": {"products": products},
        "metrics": [{"label": p["name"], "value": f"{p['changePct']:.1f}%"} for p in products[:3]],
        "drivers": [{"label": p["name"], "value": f"{p['category']} · {p['region']}", "impact": "negative"} for p in products[:3]],
        "chart": {"type": "bars-horizontal", "data": products, "nameKey": "name", "valueKey": "changePct", "suffix": "%"},
        "recommendation": "Review pricing and stock availability for the fastest-declining SKUs first.",
        "sql": "SELECT sku, name, revenue_change_pct FROM product_performance WHERE change < 0 ORDER BY change ASC",
    }


def _compare_yoy(db: Session) -> dict[str, Any]:
    trend = sql_service.revenue_trend(db, months=13)
    if len(trend) < 13:
        current_revenue, prior_year_revenue = (trend[-1]["revenue"], trend[0]["revenue"]) if trend else (0, 0)
    else:
        current_revenue, prior_year_revenue = trend[-1]["revenue"], trend[-13]["revenue"]
    yoy_pct = (current_revenue - prior_year_revenue) / prior_year_revenue * 100 if prior_year_revenue else 0
    return {
        "context": {"yoy_pct": round(yoy_pct, 1), "current_revenue": current_revenue, "prior_year_revenue": prior_year_revenue},
        "metrics": [
            {"label": "This month", "value": f"₹{current_revenue / 1e7:.2f} Cr"},
            {"label": "Same month last year", "value": f"₹{prior_year_revenue / 1e7:.2f} Cr"},
            {"label": "YoY change", "value": f"{yoy_pct:.1f}%"},
        ],
        "drivers": [],
        "chart": {"type": "trend", "data": [{"month": r["month"].strftime("%b '%y"), "revenue": r["revenue"] / 1e7} for r in trend]},
        "recommendation": "Use the year-on-year trend as the health check; investigate month-over-month moves separately.",
        "sql": "SELECT date_trunc('month', order_date), SUM(revenue) FROM sales GROUP BY 1 ORDER BY 1",
    }


def _sales_manager(db: Session) -> dict[str, Any]:
    bounds = sql_service.get_period_bounds(db)
    rows = sql_service.sales_manager_attainment(db, bounds["current_start"])
    ranked = [
        {"name": r["name"], "region": r["region"], "target": r["target_amount"], "actual": r["actual_amount"],
         "attainment": (r["actual_amount"] / r["target_amount"] * 100) if r["target_amount"] else 0}
        for r in rows
    ]
    return {
        "context": {"ranked": ranked},
        "metrics": [{"label": m["name"], "value": f"{m['attainment']:.0f}%"} for m in ranked[:3]],
        "drivers": [{"label": f"{m['name']} · {m['region']}", "value": f"₹{m['actual'] / 1e5:.1f} L of ₹{m['target'] / 1e5:.1f} L", "impact": "negative"} for m in ranked[:3]],
        "chart": {"type": "bars-horizontal", "data": ranked[:10], "nameKey": "name", "valueKey": "attainment", "suffix": "%"},
        "recommendation": f"Review account coverage and stock allocation with {ranked[0]['name']} before next month's target-setting." if ranked else None,
        "sql": "SELECT name, region, target, actual FROM sales_managers JOIN sales_targets ... ORDER BY attainment ASC",
    }


def _reorder(db: Session) -> dict[str, Any]:
    candidates = sql_service.reorder_candidates(db)
    return {
        "context": {"candidates": candidates},
        "metrics": [{"label": c["name"], "value": f"{c['quantity_on_hand']}/{c['reorder_point']}"} for c in candidates[:3]],
        "drivers": [{"label": c["name"], "value": f"{c['region']} · {c['quantity_on_hand']} on hand", "impact": "negative"} for c in candidates[:3]],
        "chart": {"type": "bars-horizontal", "data": candidates, "nameKey": "name", "valueKey": "quantity_on_hand"},
        "recommendation": "Prioritise the SKUs furthest below their reorder point.",
        "sql": "SELECT sku, quantity_on_hand, reorder_point FROM inventory WHERE quantity_on_hand < reorder_point",
    }


_HANDLERS: dict[str, Callable[[Session], dict[str, Any]]] = {
    "revenue_decline": _revenue_decline,
    "top_regions": _top_regions,
    "inventory_risk": _inventory_risk,
    "declining_products": _declining_products,
    "compare_yoy": _compare_yoy,
    "sales_manager": _sales_manager,
    "reorder": _reorder,
}


def ask(db: Session, question: str) -> dict[str, Any]:
    intent = detect_intent(question)
    handler = _HANDLERS.get(intent)

    if handler is None:
        return {
            "question": question,
            "intent": "fallback",
            "answer": "I can help with revenue, regions, products, inventory and sales targets. Try asking about a specific region, product or month.",
            "metrics": [],
            "drivers": [],
            "chart": {"type": "none"},
            "recommendation": None,
            "sql": None,
        }

    built = handler(db)
    provider = _get_provider()
    answer = provider.explain(intent=intent, question=question, context=built["context"])

    return {
        "question": question,
        "intent": intent,
        "answer": answer,
        "metrics": built["metrics"],
        "drivers": built["drivers"],
        "chart": built["chart"],
        "recommendation": built["recommendation"],
        "sql": built["sql"],
    }

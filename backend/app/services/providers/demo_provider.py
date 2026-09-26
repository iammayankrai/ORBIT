from typing import Any

from app.services import data_analysis_service as das
from app.services.providers.base import AIProvider


class DemoProvider(AIProvider):
    """Free, deterministic explanations built from the real numbers
    ai_service already computed via pandas. No external API, no cost, and
    the site works even with GEMINI_API_KEY unset."""

    def explain(self, *, intent: str, question: str, context: dict[str, Any]) -> str:
        handler = getattr(self, f"_{intent}", self._fallback)
        return handler(context)

    def _decline_reason(self, c: dict[str, Any]) -> str:
        worst = c.get("worst_mover")
        prior, current = das.format_value(c["prior_value"], c["unit"]), das.format_value(c["current_value"], c["unit"])
        if c["change_pct"] >= 0:
            sentence = f"Overall {c['measure']} actually grew {c['change_pct']:.1f}% compared with the prior period (from {prior} to {current})."
            if worst and worst["change_pct"] < -3:
                sentence += f" The one weak spot was {worst['name']} ({worst['dim_noun']}), down {abs(worst['change_pct']):.1f}%."
            return sentence
        sentence = f"{c['measure']} decreased {abs(c['change_pct']):.1f}% compared with the prior period, from {prior} to {current}."
        if worst and worst["change_pct"] < -3:
            sentence += f" The biggest drag was {worst['name']} ({worst['dim_noun']}), down {abs(worst['change_pct']):.1f}%."
        return sentence

    def _best_dimension(self, c: dict[str, Any]) -> str:
        best, worst = c["best"], c["worst"]
        return (
            f"{best['name']} is your best-performing {c['dimension'].lower()} by {c['measure']}, at "
            f"{das.format_value(best['value'], c['unit'])}. {worst['name']} trails at {das.format_value(worst['value'], c['unit'])}."
        )

    def _top_ranking(self, c: dict[str, Any]) -> str:
        names = ", ".join(r["name"] for r in c["ranked"][:3])
        return f"Ranked by {c['measure']}, your top {c['dimension'].lower()} entries are {names}."

    def _investigate(self, c: dict[str, Any]) -> str:
        unusual = c.get("unusual") or []
        if not unusual:
            return f"Nothing stands out as statistically unusual across {c['dimension'].lower()} — the data looks consistent."
        names = ", ".join(u["name"] for u in unusual[:3])
        return f"{len(unusual)} {c['dimension'].lower()} entries show unusual swings and are worth a closer look, led by {names}."

    def _fallback(self, c: dict[str, Any]) -> str:
        rows, columns = c.get("rows", 0), c.get("columns", 0)
        span = f", spanning {c['span_label']}" if c.get("span_label") else ""
        measures = ", ".join(c.get("measures") or []) or "no clear numeric measures"
        dimensions = ", ".join(c.get("dimensions") or []) or "no clear categories"
        totals = ""
        if c.get("primary_measure"):
            totals = f" Total {c['primary_measure']} is {das.format_value(c['primary_total'], c['primary_unit'])}."
        return (
            f"Your dataset has {rows:,} rows and {columns} columns{span}. It tracks {measures} across {dimensions}."
            f"{totals} Try asking about trends, top performers or what's declining."
        )

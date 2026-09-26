from typing import Any

from app.services.providers.base import AIProvider


def _pct(value: float, signed: bool = False) -> str:
    sign = "+" if signed and value > 0 else ""
    return f"{sign}{value:.1f}%"


def _inr(value: float) -> str:
    cr = value / 1e7
    if abs(cr) >= 1:
        return f"₹{cr:.2f} Cr"
    return f"₹{cr * 100:.0f} L"


class DemoProvider(AIProvider):
    """Free, deterministic explanations built from the real numbers
    `ai_service` already computed via SQL. No external API, no cost, and the
    site works even with GEMINI_API_KEY unset."""

    def explain(self, *, intent: str, question: str, context: dict[str, Any]) -> str:
        handler = getattr(self, f"_{intent}", self._fallback)
        return handler(context)

    def _revenue_decline(self, c: dict[str, Any]) -> str:
        return (
            f"Revenue {'declined' if c['change_pct'] < 0 else 'grew'} {_pct(abs(c['change_pct']))} "
            f"compared with {c['prior_label']}, from {_inr(c['prior_revenue'])} to {_inr(c['current_revenue'])}."
        )

    def _top_regions(self, c: dict[str, Any]) -> str:
        best = c["ranked"][0]
        worst = c["ranked"][-1]
        return (
            f"{best['name']} is performing best this month at {best['attainment']:.0f}% of target, "
            f"while {worst['name']} trails at {worst['attainment']:.0f}%."
        )

    def _inventory_risk(self, c: dict[str, Any]) -> str:
        return (
            f"{c['risk_sku_count']} SKUs are showing elevated inventory risk, "
            f"representing {_inr(c['risk_value'])} of ageing stock."
        )

    def _declining_products(self, c: dict[str, Any]) -> str:
        names = ", ".join(p["name"] for p in c["products"][:3])
        return f"{len(c['products'])} products need attention this month, led by {names}."

    def _compare_yoy(self, c: dict[str, Any]) -> str:
        return (
            f"Revenue is {_pct(c['yoy_pct'], signed=True)} versus the same month last year "
            f"({_inr(c['prior_year_revenue'])} → {_inr(c['current_revenue'])})."
        )

    def _sales_manager(self, c: dict[str, Any]) -> str:
        worst = c["ranked"][0]
        return (
            f"{worst['name']} ({worst['region']}) missed target by the widest margin — "
            f"{worst['attainment']:.0f}% attainment against a {_inr(worst['target'])} target."
        )

    def _reorder(self, c: dict[str, Any]) -> str:
        return f"{len(c['candidates'])} SKUs are below their reorder point and need restocking."

    def _fallback(self, c: dict[str, Any]) -> str:
        return (
            "I can help with revenue, regions, products, inventory and sales targets. "
            "Try asking about a specific region, product or month."
        )

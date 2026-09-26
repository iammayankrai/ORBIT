"""Read-only, parameterized analytical queries against the synthetic dataset.

Every query here is a fixed, hand-written SELECT — no string-built SQL, no
user input ever reaches a query string. This is the layer that answers "what
happened" cheaply, in plain SQL, before any AI is involved (see ai_service.py
for how intents route here first and only ask an LLM to explain the result).
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session


def _first_of_month(d: date) -> date:
    return d.replace(day=1)


def _prev_month(d: date) -> date:
    first = _first_of_month(d)
    return _first_of_month(first - timedelta(days=1))


def get_period_bounds(db: Session) -> dict[str, date]:
    latest = db.execute(text("SELECT MAX(order_date) FROM sales")).scalar()
    if latest is None:
        today = date.today()
        latest = today
    current_start = _first_of_month(latest)
    prior_start = _prev_month(latest)
    return {"current_start": current_start, "prior_start": prior_start}


def kpi_summary(db: Session) -> dict[str, Any]:
    bounds = get_period_bounds(db)
    row = db.execute(
        text(
            """
            SELECT
              COALESCE(SUM(revenue) FILTER (WHERE order_date >= :cur), 0) AS current_revenue,
              COALESCE(SUM(revenue) FILTER (WHERE order_date >= :prior AND order_date < :cur), 0) AS prior_revenue,
              COUNT(DISTINCT order_id) FILTER (WHERE order_date >= :cur) AS current_orders,
              COUNT(DISTINCT order_id) FILTER (WHERE order_date >= :prior AND order_date < :cur) AS prior_orders
            FROM sales
            WHERE order_date >= :prior
            """
        ),
        {"cur": bounds["current_start"], "prior": bounds["prior_start"]},
    ).mappings().first()

    inventory_row = db.execute(
        text("SELECT COALESCE(SUM(quantity_on_hand * unit_cost), 0) AS value FROM inventory")
    ).scalar()

    return {
        "current_revenue": float(row["current_revenue"]),
        "prior_revenue": float(row["prior_revenue"]),
        "current_orders": int(row["current_orders"]),
        "prior_orders": int(row["prior_orders"]),
        "inventory_value": float(inventory_row or 0),
        "period": bounds,
    }


def revenue_by_region(db: Session, current_start: date, prior_start: date) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT r.name AS region,
                   COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :cur), 0) AS current_revenue,
                   COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :prior AND s.order_date < :cur), 0) AS prior_revenue
            FROM regions r
            LEFT JOIN sales s ON s.region_id = r.id AND s.order_date >= :prior
            GROUP BY r.name
            ORDER BY current_revenue DESC
            """
        ),
        {"cur": current_start, "prior": prior_start},
    ).mappings().all()
    return [dict(r) for r in rows]


def revenue_by_category(db: Session, current_start: date, prior_start: date) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT p.category AS category,
                   COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :cur), 0) AS current_revenue,
                   COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :prior AND s.order_date < :cur), 0) AS prior_revenue
            FROM products p
            LEFT JOIN sales s ON s.product_id = p.id AND s.order_date >= :prior
            GROUP BY p.category
            ORDER BY current_revenue DESC
            """
        ),
        {"cur": current_start, "prior": prior_start},
    ).mappings().all()
    return [dict(r) for r in rows]


def declining_products(db: Session, current_start: date, prior_start: date, limit: int = 8) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT p.sku, p.name, p.category, r.name AS region,
                   COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :cur), 0) AS current_revenue,
                   COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :prior AND s.order_date < :cur), 0) AS prior_revenue
            FROM products p
            JOIN sales s ON s.product_id = p.id AND s.order_date >= :prior
            JOIN regions r ON r.id = s.region_id
            GROUP BY p.sku, p.name, p.category, r.name
            HAVING COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :prior AND s.order_date < :cur), 0) > 0
            ORDER BY (
              COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :cur), 0)
              - COALESCE(SUM(s.revenue) FILTER (WHERE s.order_date >= :prior AND s.order_date < :cur), 0)
            ) ASC
            LIMIT :limit
            """
        ),
        {"cur": current_start, "prior": prior_start, "limit": limit},
    ).mappings().all()
    return [dict(r) for r in rows]


def inventory_risk(db: Session, limit: int = 10) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT p.sku, p.name, r.name AS region,
                   EXTRACT(day FROM now() - i.received_date)::int AS days_ageing,
                   (i.quantity_on_hand * i.unit_cost) AS value
            FROM inventory i
            JOIN products p ON p.id = i.product_id
            JOIN regions r ON r.id = i.region_id
            WHERE EXTRACT(day FROM now() - i.received_date) > 60
            ORDER BY value DESC
            LIMIT :limit
            """
        ),
        {"limit": limit},
    ).mappings().all()
    return [dict(r) for r in rows]


def inventory_ageing_buckets(db: Session) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT
              CASE
                WHEN age_days <= 30 THEN '0-30 days'
                WHEN age_days <= 60 THEN '31-60 days'
                WHEN age_days <= 90 THEN '61-90 days'
                ELSE '90+ days'
              END AS bucket,
              SUM(value) AS value
            FROM (
              SELECT EXTRACT(day FROM now() - received_date)::int AS age_days, quantity_on_hand * unit_cost AS value
              FROM inventory
            ) t
            GROUP BY 1
            ORDER BY MIN(age_days)
            """
        )
    ).mappings().all()
    return [dict(r) for r in rows]


def sales_manager_attainment(db: Session, current_start: date) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT sm.name, r.name AS region, st.target_amount,
                   COALESCE(SUM(o.total_amount), 0) AS actual_amount
            FROM sales_managers sm
            JOIN regions r ON r.id = sm.region_id
            JOIN sales_targets st ON st.sales_manager_id = sm.id AND st.period = :cur
            LEFT JOIN orders o ON o.sales_manager_id = sm.id AND o.order_date >= :cur
            GROUP BY sm.name, r.name, st.target_amount
            ORDER BY (COALESCE(SUM(o.total_amount), 0) / NULLIF(st.target_amount, 0)) ASC
            """
        ),
        {"cur": current_start},
    ).mappings().all()
    return [dict(r) for r in rows]


def revenue_trend(db: Session, months: int = 12) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT date_trunc('month', order_date)::date AS month, SUM(revenue) AS revenue
            FROM sales
            WHERE order_date >= (SELECT date_trunc('month', MAX(order_date)) - (:months || ' months')::interval FROM sales)
            GROUP BY 1
            ORDER BY 1
            """
        ),
        {"months": months},
    ).mappings().all()
    return [dict(r) for r in rows]


def reorder_candidates(db: Session, limit: int = 8) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT p.sku, p.name, r.name AS region, i.quantity_on_hand, i.reorder_point
            FROM inventory i
            JOIN products p ON p.id = i.product_id
            JOIN regions r ON r.id = i.region_id
            WHERE i.quantity_on_hand < i.reorder_point
            ORDER BY (i.reorder_point - i.quantity_on_hand) DESC
            LIMIT :limit
            """
        ),
        {"limit": limit},
    ).mappings().all()
    return [dict(r) for r in rows]

"""The deterministic pandas engine behind /api/data/analyze and /api/data/ask.

Every number shown on the site is computed here, from whatever spreadsheet
was uploaded — nothing is hardcoded to one dataset's column names. An AI
provider is only ever asked to phrase an explanation of numbers this module
already computed; it never invents or recalculates them.

Pipeline: load_dataframe() -> detect_schema() -> compute_health() /
compute_kpis() / compute_charts() / compute_insights(), tied together by
analyze(). The /ask route reuses the same schema detection plus the
dimension_period_changes()/detect_unusual_groups() helpers to answer
free-form questions about the same dataset.
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

MAX_CHARTS = 7
MAX_ROWS = 200_000
SAMPLE_DATASET_LABEL = "Sales_Data_Demo.xlsx"
_SAMPLE_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_sales_data.csv"


class DatasetError(Exception):
    """Raised for any problem with the uploaded file that the user can fix
    (wrong format, empty file, unreadable content) — routes turn this into
    a 400 with the message shown here, never a 500."""


# --------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------


def load_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    try:
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(content))
        elif ext in ("xlsx", "xlsm"):
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        elif ext == "xls":
            df = pd.read_excel(io.BytesIO(content), engine="xlrd")
        else:
            raise DatasetError("Please upload a .csv, .xlsx or .xls file.")
    except DatasetError:
        raise
    except Exception as exc:  # noqa: BLE001 — any parse failure becomes a friendly 400
        raise DatasetError(
            "We couldn't read that file. Please check it's a valid Excel or CSV export."
        ) from exc

    df = df.dropna(axis=1, how="all")
    df.columns = [str(c).strip() for c in df.columns]
    df = df.loc[:, [c for c in df.columns if c and not c.startswith("Unnamed:")]]

    if df.shape[1] == 0 or df.dropna(how="all").empty:
        raise DatasetError("That file doesn't have any data we can analyse.")
    if len(df) > MAX_ROWS:
        df = df.head(MAX_ROWS)
    return df


def load_sample_dataframe() -> pd.DataFrame:
    return pd.read_csv(_SAMPLE_PATH, parse_dates=["Date"])


# --------------------------------------------------------------------------
# Schema detection
# --------------------------------------------------------------------------

_ID_PATTERN = re.compile(r"(^id$|_id$|\bid$|^sr\.?\s*no\.?$|^s\.?\s*no\.?$|code$|^no\.?$|number$)", re.I)
_DATE_NAME_PATTERN = re.compile(r"date|time|day|month|year|period", re.I)

_MEASURE_ROLE_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("revenue", re.compile(r"revenue|sales|amount|turnover|gmv", re.I)),
    ("profit", re.compile(r"profit|margin", re.I)),
    ("cost", re.compile(r"cost|expense|expenditure", re.I)),
    ("quantity", re.compile(r"qty|quantity|units?|volume", re.I)),
    ("discount", re.compile(r"discount|rebate", re.I)),
    ("price", re.compile(r"price|rate|mrp", re.I)),
]

_DIMENSION_ROLE_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("region", re.compile(r"region|zone|state|territory", re.I)),
    ("location", re.compile(r"city|location|branch|store|outlet|country", re.I)),
    ("category", re.compile(r"\bcategory\b|\bdepartment\b", re.I)),
    ("product", re.compile(r"product|item|sku|service", re.I)),
    ("entity", re.compile(r"manager|rep\b|agent|employee|owner|salesperson", re.I)),
    ("customer", re.compile(r"customer|client|account|buyer", re.I)),
]


@dataclass
class ColumnInfo:
    name: str
    role: str


@dataclass
class DatasetSchema:
    date_column: str | None
    measures: list[ColumnInfo] = field(default_factory=list)
    dimensions: list[ColumnInfo] = field(default_factory=list)
    ids: list[str] = field(default_factory=list)
    ignored: list[str] = field(default_factory=list)
    row_count: int = 0
    column_count: int = 0


def detect_schema(df: pd.DataFrame) -> DatasetSchema:
    n = len(df)
    date_col = _detect_date_column(df)

    measures: list[ColumnInfo] = []
    dimensions: list[ColumnInfo] = []
    ids: list[str] = []
    ignored: list[str] = []

    for col in df.columns:
        if col == date_col:
            continue
        if _ID_PATTERN.search(col):
            ids.append(col)
            continue

        series = df[col]

        if pd.api.types.is_numeric_dtype(series):
            if series.nunique(dropna=True) <= 1:
                ignored.append(col)
                continue
            role = next((r for r, pat in _MEASURE_ROLE_PATTERNS if pat.search(col)), "measure")
            measures.append(ColumnInfo(name=col, role=role))
            continue

        nunique = series.nunique(dropna=True)
        if nunique <= 1:
            ignored.append(col)
            continue
        cardinality_ratio = nunique / n if n else 1

        role = next((r for r, pat in _DIMENSION_ROLE_PATTERNS if pat.search(col)), None)
        if role is None:
            if nunique > 60 or cardinality_ratio > 0.5:
                ids.append(col)
                continue
            role = "dimension"
        else:
            if nunique > 1000 or cardinality_ratio > 0.9:
                ids.append(col)
                continue

        dimensions.append(ColumnInfo(name=col, role=role))

    return DatasetSchema(
        date_column=date_col,
        measures=measures,
        dimensions=dimensions,
        ids=ids,
        ignored=ignored,
        row_count=n,
        column_count=len(df.columns),
    )


def _detect_date_column(df: pd.DataFrame) -> str | None:
    best: tuple[str, float] | None = None
    for col in df.columns:
        series = df[col]
        if pd.api.types.is_datetime64_any_dtype(series):
            return col
        if series.dtype != object:
            continue
        name_hint = bool(_DATE_NAME_PATTERN.search(col))
        if not name_hint and df[col].dropna().shape[0] > 0 and not isinstance(df[col].dropna().iloc[0], str):
            continue
        parsed = pd.to_datetime(series, errors="coerce", format="mixed") if hasattr(pd, "to_datetime") else None
        valid_ratio = parsed.notna().mean() if parsed is not None and len(series) else 0
        if valid_ratio > 0.8 and (name_hint or valid_ratio > 0.95):
            if best is None or valid_ratio > best[1]:
                best = (col, valid_ratio)
    if best:
        df[best[0]] = pd.to_datetime(df[best[0]], errors="coerce", format="mixed")
        return best[0]
    return None


# --------------------------------------------------------------------------
# Formatting helpers (mirrors frontend/src/utils/format.js exactly, so
# server-rendered strings and client-rendered numbers never disagree)
# --------------------------------------------------------------------------


def format_currency_cr(cr_value: float) -> str:
    sign = "-" if cr_value < 0 else ""
    abs_v = abs(cr_value)
    if abs_v >= 1:
        return f"{sign}₹{abs_v:.1f} Cr" if abs_v >= 10 else f"{sign}₹{abs_v:.2f} Cr"
    return f"{sign}₹{round(abs_v * 100):,} L"


def format_number(value: float) -> str:
    n = round(value)
    s = str(abs(n))
    if len(s) > 3:
        rest, last3 = s[:-3], s[-3:]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        s = ",".join([*parts, last3])
    return f"{'-' if n < 0 else ''}{s}"


def format_pct(value: float, signed: bool = False, decimals: int = 1) -> str:
    sign = "+" if signed and value > 0 else ""
    return f"{sign}{value:.{decimals}f}%"


def format_currency_plain(value: float) -> str:
    sign = "-" if value < 0 else ""
    return f"{sign}₹{format_number(abs(value))}"


def format_value(value: float, unit: str) -> str:
    if unit == "cr":
        return format_currency_cr(value)
    if unit == "inr":
        return format_currency_plain(value)
    if unit == "pct":
        return format_pct(value)
    return format_number(value)


def unit_for(role: str) -> str:
    return "cr" if role in ("revenue", "profit", "cost", "price") else "number"


# --------------------------------------------------------------------------
# Period bounds — generic current-vs-prior split via date-range bisection,
# so this works for any span (days, months, years) without assuming
# monthly granularity.
# --------------------------------------------------------------------------


def period_bounds(date_series: pd.Series) -> dict | None:
    valid = date_series.dropna()
    if len(valid) < 4:
        return None
    lo, hi = valid.min(), valid.max()
    if hi <= lo:
        return None
    mid = lo + (hi - lo) / 2
    prior_mask = (date_series < mid).fillna(False)
    current_mask = (date_series >= mid).fillna(False)
    return {"start": lo, "mid": mid, "end": hi, "prior_mask": prior_mask, "current_mask": current_mask}


def format_span_label(days: int) -> str:
    if days >= 700:
        years = round(days / 365, 1)
        return f"{years:g} years of data"
    if days >= 60:
        return f"{round(days / 30)} months of data"
    return f"{max(days, 1)} days of data"


# --------------------------------------------------------------------------
# Health
# --------------------------------------------------------------------------


def _iqr_outlier_mask(series: pd.Series) -> pd.Series:
    q1, q3 = series.quantile(0.25), series.quantile(0.75)
    iqr = q3 - q1
    if not iqr or pd.isna(iqr):
        return pd.Series(False, index=series.index)
    lower, upper = q1 - 3 * iqr, q3 + 3 * iqr
    return (series < lower) | (series > upper)


def _grouped_outlier_mask(df: pd.DataFrame, group_col: str, measure_col: str) -> pd.Series:
    """IQR fences computed within each group, not across the whole column —
    a dataset mixing a ₹350 shampoo and a ₹7,000 camera has no useful global
    fence: nearly every camera row would look like an outlier next to the
    shampoos. Comparing each row only to its own product/category avoids
    that false-positive flood."""
    s = pd.to_numeric(df[measure_col], errors="coerce")
    tmp = pd.DataFrame({"_g": df[group_col], "_v": s})
    q1 = tmp.groupby("_g")["_v"].quantile(0.25)
    q3 = tmp.groupby("_g")["_v"].quantile(0.75)
    iqr = q3 - q1
    lower = (q1 - 3 * iqr).reindex(tmp["_g"]).to_numpy()
    upper = (q3 + 3 * iqr).reindex(tmp["_g"]).to_numpy()
    values = tmp["_v"].to_numpy()
    mask = (values < lower) | (values > upper)
    return pd.Series(mask, index=df.index).fillna(False)


def count_anomalies(df: pd.DataFrame, schema: DatasetSchema) -> int:
    if not schema.measures:
        return 0
    group_col = next(
        (d.name for role in ("product", "category", "region") for d in schema.dimensions if d.role == role),
        None,
    )
    flagged = pd.Series(False, index=df.index)
    for m in schema.measures:
        if group_col:
            flagged |= _grouped_outlier_mask(df, group_col, m.name)
        else:
            flagged |= _iqr_outlier_mask(pd.to_numeric(df[m.name], errors="coerce"))
    return int(flagged.sum())


def compute_health(df: pd.DataFrame, schema: DatasetSchema) -> dict:
    n_rows, n_cols = len(df), len(df.columns)
    total_cells = n_rows * n_cols
    missing_cells = int(df.isna().sum().sum())
    missing_pct = round(missing_cells / total_cells * 100, 1) if total_cells else 0.0
    duplicate_rows = int(df.duplicated().sum())
    duplicate_pct = round(duplicate_rows / n_rows * 100, 1) if n_rows else 0.0
    anomaly_count = count_anomalies(df, schema)

    score = 100.0
    score -= min(30, missing_pct * 3)
    score -= min(20, duplicate_pct * 4)
    score -= min(15, (anomaly_count / max(n_rows, 1)) * 100 * 5)
    score = max(0, round(score))

    date_span_label = None
    if schema.date_column:
        dates = df[schema.date_column].dropna()
        if len(dates):
            date_span_label = format_span_label((dates.max() - dates.min()).days)

    return {
        "score": int(score),
        "rows_analyzed": n_rows,
        "columns_detected": n_cols,
        "missing_pct": missing_pct,
        "duplicate_pct": duplicate_pct,
        "anomaly_count": anomaly_count,
        "date_span_label": date_span_label,
    }


# --------------------------------------------------------------------------
# KPIs
# --------------------------------------------------------------------------


def _count_kpi(df: pd.DataFrame, schema: DatasetSchema, bounds: dict | None) -> dict:
    order_col = next((c for c in schema.ids if re.search(r"order|invoice|transaction|txn", c, re.I)), None)
    label = "Orders" if order_col else "Records"
    if order_col:
        series = df[order_col]
        total = series.nunique(dropna=True)
    else:
        total = len(df)

    change_pct = None
    if bounds is not None:
        if order_col:
            prior = df.loc[bounds["prior_mask"], order_col].nunique(dropna=True)
            current = df.loc[bounds["current_mask"], order_col].nunique(dropna=True)
        else:
            prior = int(bounds["prior_mask"].sum())
            current = int(bounds["current_mask"].sum())
        if prior > 0:
            change_pct = round((current - prior) / prior * 100, 1)

    return {
        "id": "orders" if order_col else "records",
        "label": label,
        "value": format_number(total),
        "raw_value": total,
        "change_pct": change_pct,
        "direction": None if change_pct is None else ("up" if change_pct >= 0 else "down"),
        "good_direction": "up",
        "unit": "number",
    }


def _measure_kpi(label: str, measure: ColumnInfo, df: pd.DataFrame, bounds: dict | None, good_direction: str) -> dict:
    unit = unit_for(measure.role)
    series = pd.to_numeric(df[measure.name], errors="coerce").fillna(0)
    total = float(series.sum())

    change_pct = None
    if bounds is not None:
        prior_sum = float(series[bounds["prior_mask"]].sum())
        current_sum = float(series[bounds["current_mask"]].sum())
        if prior_sum > 0:
            change_pct = round((current_sum - prior_sum) / prior_sum * 100, 1)

    raw_value = total / 1e7 if unit == "cr" else total
    return {
        "id": re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_"),
        "label": label,
        "value": format_value(raw_value, unit),
        "raw_value": round(raw_value, 3),
        "change_pct": change_pct,
        "direction": None if change_pct is None else ("up" if change_pct >= 0 else "down"),
        "good_direction": good_direction,
        "unit": unit,
    }


def _margin_kpi(revenue: ColumnInfo, profit: ColumnInfo, df: pd.DataFrame, bounds: dict | None) -> dict:
    rev = pd.to_numeric(df[revenue.name], errors="coerce").fillna(0)
    prof = pd.to_numeric(df[profit.name], errors="coerce").fillna(0)
    total_rev, total_profit = float(rev.sum()), float(prof.sum())
    margin = round(total_profit / total_rev * 100, 1) if total_rev else 0.0

    change_pct = None
    if bounds is not None:
        prior_rev, current_rev = float(rev[bounds["prior_mask"]].sum()), float(rev[bounds["current_mask"]].sum())
        prior_profit, current_profit = float(prof[bounds["prior_mask"]].sum()), float(prof[bounds["current_mask"]].sum())
        if prior_rev > 0 and current_rev > 0:
            prior_margin = prior_profit / prior_rev * 100
            current_margin = current_profit / current_rev * 100
            if prior_margin:
                change_pct = round(current_margin - prior_margin, 1)

    return {
        "id": "margin",
        "label": "Margin",
        "value": format_value(margin, "pct"),
        "raw_value": margin,
        "change_pct": change_pct,
        "direction": None if change_pct is None else ("up" if change_pct >= 0 else "down"),
        "good_direction": "up",
        "unit": "pct",
    }


def _avg_value_kpi(measure: ColumnInfo, order_col: str | None, df: pd.DataFrame, bounds: dict | None) -> dict | None:
    """Average per-order (or per-row) value — a distinct, commonly-expected
    business KPI, not just a smaller copy of the measure's total."""
    series = pd.to_numeric(df[measure.name], errors="coerce").fillna(0)

    def _avg(mask: pd.Series | None) -> float:
        s = series[mask] if mask is not None else series
        if order_col:
            cnt = (df.loc[mask, order_col] if mask is not None else df[order_col]).nunique(dropna=True)
        else:
            cnt = int(mask.sum()) if mask is not None else len(df)
        return (float(s.sum()) / cnt) if cnt else 0.0

    total_avg = _avg(None)
    if total_avg <= 0:
        return None

    change_pct = None
    if bounds is not None:
        prior_avg, current_avg = _avg(bounds["prior_mask"]), _avg(bounds["current_mask"])
        if prior_avg > 0:
            change_pct = round((current_avg - prior_avg) / prior_avg * 100, 1)

    noun = "Order" if order_col else "Record"
    return {
        "id": "avg_order_value",
        "label": f"Avg {noun} Value",
        "value": format_value(total_avg, "inr"),
        "raw_value": round(total_avg, 2),
        "change_pct": change_pct,
        "direction": None if change_pct is None else ("up" if change_pct >= 0 else "down"),
        "good_direction": "up",
        "unit": "inr",
    }


def compute_kpis(df: pd.DataFrame, schema: DatasetSchema) -> list[dict]:
    bounds = period_bounds(df[schema.date_column]) if schema.date_column else None
    kpis = [_count_kpi(df, schema, bounds)]

    if not schema.measures:
        return kpis

    by_role: dict[str, ColumnInfo] = {}
    for m in schema.measures:
        by_role.setdefault(m.role, m)

    revenue, profit = by_role.get("revenue"), by_role.get("profit")
    quantity, cost = by_role.get("quantity"), by_role.get("cost")

    primary = revenue or profit or quantity or cost or schema.measures[0]
    primary_label = "Revenue" if primary is revenue else primary.name
    kpis.append(_measure_kpi(primary_label, primary, df, bounds, good_direction="down" if primary is cost else "up"))
    used_measures = {id(primary)}

    second = next((m for m in (profit, quantity, cost) if m is not None and id(m) not in used_measures), None)
    if second is not None:
        label = "Profit" if second is profit else ("Cost" if second is cost else second.name)
        kpis.append(_measure_kpi(label, second, df, bounds, good_direction="down" if second is cost else "up"))
        used_measures.add(id(second))

    if revenue and profit:
        kpis.append(_margin_kpi(revenue, profit, df, bounds))
    else:
        third = next((m for m in schema.measures if id(m) not in used_measures), None)
        if third is not None:
            kpis.append(_measure_kpi(third.name, third, df, bounds, good_direction="down" if third.role == "cost" else "up"))
            used_measures.add(id(third))

    order_col = next((c for c in schema.ids if re.search(r"order|invoice|transaction|txn", c, re.I)), None)
    if primary.role in ("revenue", "profit", "cost", "price") and len(kpis) < 6:
        avg_kpi = _avg_value_kpi(primary, order_col, df, bounds)
        if avg_kpi is not None:
            kpis.append(avg_kpi)

    if len(kpis) < 6:
        extra = next((m for m in schema.measures if id(m) not in used_measures), None)
        if extra is not None:
            kpis.append(_measure_kpi(extra.name, extra, df, bounds, good_direction="down" if extra.role == "cost" else "up"))
            used_measures.add(id(extra))

    return kpis[:6]


# --------------------------------------------------------------------------
# Charts
# --------------------------------------------------------------------------


def build_trend_series(df: pd.DataFrame, date_col: str, series: pd.Series, unit: str) -> list[dict]:
    dates = df[date_col]
    valid = dates.notna()
    if valid.sum() < 2:
        return []
    span_days = (dates[valid].max() - dates[valid].min()).days
    if span_days <= 0:
        return []

    if span_days <= 60:
        freq, fmt = "D", "%d %b"
    elif span_days <= 365 * 6:
        freq, fmt = "M", "%b '%y"
    else:
        freq, fmt = "Y", "%Y"

    grouped = series[valid].groupby(dates[valid].dt.to_period(freq)).sum().sort_index()
    if len(grouped) > 36 and freq == "M":
        grouped = series[valid].groupby(dates[valid].dt.to_period("Q")).sum().sort_index()
        fmt = "Q%q '%y"

    scale = 1e7 if unit == "cr" else 1
    out = []
    for period, value in grouped.items():
        ts = period.to_timestamp()
        label = f"Q{period.quarter} '{ts.strftime('%y')}" if fmt.startswith("Q%q") else ts.strftime(fmt)
        out.append({"period": label, "value": round(float(value) / scale, 3)})
    return out


def top_n_breakdown(df: pd.DataFrame, dim_col: str, series: pd.Series, n: int, unit: str, ascending: bool = False) -> list[dict]:
    mask = df[dim_col].notna()
    grouped = series[mask].groupby(df.loc[mask, dim_col]).sum().sort_values(ascending=ascending).head(n)
    scale = 1e7 if unit == "cr" else 1
    return [{"name": str(idx), "value": round(float(v) / scale, 3)} for idx, v in grouped.items()]


def margin_breakdown(df: pd.DataFrame, dim_col: str, revenue_col: str, profit_col: str, n: int = 8) -> list[dict]:
    mask = df[dim_col].notna()
    rev = pd.to_numeric(df.loc[mask, revenue_col], errors="coerce").fillna(0)
    prof = pd.to_numeric(df.loc[mask, profit_col], errors="coerce").fillna(0)
    g = pd.DataFrame({"dim": df.loc[mask, dim_col], "revenue": rev, "profit": prof}).groupby("dim").sum()
    g = g[g["revenue"] > 0]
    if g.empty:
        return []
    g["margin"] = g["profit"] / g["revenue"] * 100
    g = g.sort_values("margin", ascending=False).head(n)
    return [{"name": str(idx), "value": round(float(v), 1)} for idx, v in g["margin"].items()]


def compute_charts(df: pd.DataFrame, schema: DatasetSchema) -> list[dict]:
    if not schema.measures:
        return []

    by_role_measure: dict[str, ColumnInfo] = {}
    for m in schema.measures:
        by_role_measure.setdefault(m.role, m)
    primary = by_role_measure.get("revenue") or by_role_measure.get("profit") or by_role_measure.get("quantity") or schema.measures[0]

    unit = unit_for(primary.role)
    series = pd.to_numeric(df[primary.name], errors="coerce").fillna(0)
    charts: list[dict] = []

    if schema.date_column:
        trend_data = build_trend_series(df, schema.date_column, series, unit)
        if len(trend_data) >= 2:
            charts.append(
                {
                    "id": "trend",
                    "title": f"{primary.name} Trend",
                    "type": "trend",
                    "xKey": "period",
                    "yKey": "value",
                    "unit": unit,
                    "data": trend_data,
                }
            )

    by_role_dim: dict[str, ColumnInfo] = {}
    for d in schema.dimensions:
        by_role_dim.setdefault(d.role, d)

    used_dims: set[str] = set()

    geo_dim = by_role_dim.get("region") or by_role_dim.get("location")
    if geo_dim:
        data = top_n_breakdown(df, geo_dim.name, series, 10, unit)
        if len(data) >= 2:
            charts.append(
                {
                    "id": "by_region",
                    "title": f"{primary.name} by {geo_dim.name}",
                    "type": "bar-horizontal",
                    "nameKey": "name",
                    "valueKey": "value",
                    "unit": unit,
                    "data": data,
                }
            )
            used_dims.add(geo_dim.name)

    cat_dim = by_role_dim.get("category")
    if cat_dim and cat_dim.name not in used_dims:
        data = top_n_breakdown(df, cat_dim.name, series, 6, unit)
        if 2 <= len(data) <= 12:
            charts.append(
                {
                    "id": "by_category",
                    "title": f"{primary.name} by {cat_dim.name}",
                    "type": "donut",
                    "nameKey": "name",
                    "valueKey": "value",
                    "unit": unit,
                    "data": data,
                }
            )
            used_dims.add(cat_dim.name)

    rank_dim = by_role_dim.get("product") or by_role_dim.get("entity") or by_role_dim.get("customer")
    if rank_dim and rank_dim.name not in used_dims and len(charts) < MAX_CHARTS:
        data = top_n_breakdown(df, rank_dim.name, series, 8, unit)
        if len(data) >= 2:
            charts.append(
                {
                    "id": f"top_{rank_dim.role}",
                    "title": f"Top {rank_dim.name} by {primary.name}",
                    "type": "bar-horizontal",
                    "nameKey": "name",
                    "valueKey": "value",
                    "unit": unit,
                    "data": data,
                }
            )
            used_dims.add(rank_dim.name)

            if len(data) >= 5 and len(charts) < MAX_CHARTS:
                bottom_data = top_n_breakdown(df, rank_dim.name, series, 6, unit, ascending=True)
                if len(bottom_data) >= 2:
                    charts.append(
                        {
                            "id": f"bottom_{rank_dim.role}",
                            "title": f"Lowest {rank_dim.name} by {primary.name}",
                            "type": "bar-horizontal",
                            "nameKey": "name",
                            "valueKey": "value",
                            "unit": unit,
                            "data": bottom_data,
                        }
                    )

    # A second ranking dimension (e.g. sales reps alongside products) — the
    # same idea as rank_dim above, just not letting only the first-found one
    # crowd out the others when a dataset offers more than one.
    rank_dim2 = next(
        (
            by_role_dim[r]
            for r in ("product", "entity", "customer")
            if by_role_dim.get(r) and by_role_dim[r].name not in used_dims
        ),
        None,
    )
    if rank_dim2 and len(charts) < MAX_CHARTS:
        data2 = top_n_breakdown(df, rank_dim2.name, series, 8, unit)
        if len(data2) >= 2:
            charts.append(
                {
                    "id": f"top_{rank_dim2.role}",
                    "title": f"Top {rank_dim2.name} by {primary.name}",
                    "type": "bar-horizontal",
                    "nameKey": "name",
                    "valueKey": "value",
                    "unit": unit,
                    "data": data2,
                }
            )
            used_dims.add(rank_dim2.name)

    revenue_m, profit_m = by_role_measure.get("revenue"), by_role_measure.get("profit")
    margin_dim = cat_dim or geo_dim
    if revenue_m and profit_m and margin_dim and len(charts) < MAX_CHARTS:
        data = margin_breakdown(df, margin_dim.name, revenue_m.name, profit_m.name)
        if len(data) >= 2:
            charts.append(
                {
                    "id": f"margin_by_{margin_dim.role}",
                    "title": f"Profit Margin by {margin_dim.name}",
                    "type": "bar-horizontal",
                    "nameKey": "name",
                    "valueKey": "value",
                    "unit": "pct",
                    "suffix": "%",
                    "data": data,
                }
            )

    if len(charts) < 2:
        for m in schema.measures:
            if m is primary or len(charts) >= 3:
                continue
            other_unit = unit_for(m.role)
            other_series = pd.to_numeric(df[m.name], errors="coerce").fillna(0)
            if schema.date_column:
                trend_data = build_trend_series(df, schema.date_column, other_series, other_unit)
                if len(trend_data) >= 2:
                    charts.append(
                        {
                            "id": f"trend_{m.role}",
                            "title": f"{m.name} Trend",
                            "type": "trend",
                            "xKey": "period",
                            "yKey": "value",
                            "unit": other_unit,
                            "data": trend_data,
                        }
                    )

    return charts[:MAX_CHARTS]


# --------------------------------------------------------------------------
# Insights ("What your data is telling you")
# --------------------------------------------------------------------------


def dimension_period_changes(df: pd.DataFrame, dim_col: str, measure_col: str, bounds: dict) -> list[dict]:
    mask = df[dim_col].notna()
    s = pd.to_numeric(df[measure_col], errors="coerce").fillna(0)
    prior_mask, current_mask = bounds["prior_mask"] & mask, bounds["current_mask"] & mask
    prior = s[prior_mask].groupby(df.loc[prior_mask, dim_col]).sum()
    current = s[current_mask].groupby(df.loc[current_mask, dim_col]).sum()

    out = []
    for key in set(prior.index) | set(current.index):
        p, c = float(prior.get(key, 0)), float(current.get(key, 0))
        if p <= 0:
            continue
        out.append({"name": str(key), "change_pct": round((c - p) / p * 100, 1), "prior": p, "current": c})
    return out


def detect_unusual_groups(df: pd.DataFrame, dim_col: str, measure_col: str, bounds: dict, z_thresh: float = 1.6) -> list[dict]:
    changes = dimension_period_changes(df, dim_col, measure_col, bounds)
    if len(changes) < 4:
        return []
    values = np.array([c["change_pct"] for c in changes])
    std = values.std()
    if std == 0:
        return []
    mean = values.mean()
    return [c for c, z in zip(changes, (values - mean) / std) if abs(z) >= z_thresh]


def compute_insights(df: pd.DataFrame, schema: DatasetSchema) -> list[dict]:
    insights: list[dict] = []
    by_role_measure = {m.role: m for m in reversed(schema.measures)}
    by_role_dim = {d.role: d for d in reversed(schema.dimensions)}
    bounds = period_bounds(df[schema.date_column]) if schema.date_column else None

    primary = by_role_measure.get("revenue") or (schema.measures[0] if schema.measures else None)
    primary_label = "Revenue" if primary and primary.role == "revenue" else (primary.name if primary else None)
    geo_dim = by_role_dim.get("region") or by_role_dim.get("location")
    cat_dim = by_role_dim.get("category")
    revenue_m, profit_m = by_role_measure.get("revenue"), by_role_measure.get("profit")
    rank_dim = by_role_dim.get("product") or by_role_dim.get("entity") or by_role_dim.get("customer")

    if primary and bounds:
        s = pd.to_numeric(df[primary.name], errors="coerce").fillna(0)
        prior, current = float(s[bounds["prior_mask"]].sum()), float(s[bounds["current_mask"]].sum())
        if prior > 0:
            change = round((current - prior) / prior * 100, 1)
            insights.append(
                {
                    "type": "positive" if change >= 0 else "negative",
                    "text": f"{primary_label} {'increased' if change >= 0 else 'decreased'} {abs(change)}% compared to the previous period.",
                }
            )

    if primary and bounds and (geo_dim or cat_dim):
        candidates = []
        for dim in (geo_dim, cat_dim):
            if not dim:
                continue
            for row in dimension_period_changes(df, dim.name, primary.name, bounds):
                candidates.append({**row, "dim_noun": dim.name.lower()})

        if candidates:
            worst = min(candidates, key=lambda r: r["change_pct"])
            best = max(candidates, key=lambda r: r["change_pct"])
            if worst["change_pct"] < -3:
                insights.append(
                    {
                        "type": "negative",
                        "text": f"{worst['name']} {worst['dim_noun']} declined {abs(worst['change_pct'])}%, the weakest performer.",
                    }
                )
            if best["change_pct"] > 3 and best["name"] != worst["name"]:
                insights.append(
                    {
                        "type": "positive",
                        "text": f"{best['name']} contributed the most to growth, up {best['change_pct']}%.",
                    }
                )

    if primary and rank_dim and len(insights) < 8:
        s = pd.to_numeric(df[primary.name], errors="coerce").fillna(0)
        grand_total = float(s.sum())
        top = top_n_breakdown(df, rank_dim.name, s, 1, "number")  # unscaled — only the share ratio matters here
        if top and grand_total > 0:
            share = round(top[0]["value"] / grand_total * 100, 1)
            if share >= 3:
                insights.append(
                    {
                        "type": "positive",
                        "text": f"{top[0]['name']} is your top {rank_dim.name.lower()}, contributing {share}% of total {primary_label}.",
                    }
                )

    if revenue_m and profit_m and (cat_dim or geo_dim) and len(insights) < 8:
        margin_dim = cat_dim or geo_dim
        margins = margin_breakdown(df, margin_dim.name, revenue_m.name, profit_m.name, n=50)
        if len(margins) >= 2:
            best_margin, worst_margin = margins[0], margins[-1]
            if best_margin["name"] != worst_margin["name"]:
                insights.append(
                    {
                        "type": "info",
                        "text": (
                            f"{best_margin['name']} has the strongest profit margin at {best_margin['value']:.1f}%, "
                            f"versus {worst_margin['value']:.1f}% for {worst_margin['name']}."
                        ),
                    }
                )

    if primary and bounds and rank_dim and len(insights) < 8:
        unusual = detect_unusual_groups(df, rank_dim.name, primary.name, bounds)
        if unusual:
            noun = "products" if rank_dim.role == "product" else f"{rank_dim.name.lower()} entries"
            insights.append(
                {
                    "type": "warning",
                    "text": f"{len(unusual)} {noun} show unusual performance and may be worth a closer look.",
                }
            )

    if not bounds and primary:
        dim = geo_dim or cat_dim or rank_dim
        if dim:
            top = top_n_breakdown(df, dim.name, pd.to_numeric(df[primary.name], errors="coerce").fillna(0), 1, unit_for(primary.role))
            if top:
                insights.append(
                    {
                        "type": "positive",
                        "text": f"{top[0]['name']} is your top {dim.name.lower()} by {primary_label}.",
                    }
                )

    if len(insights) < 8:
        missing_by_col = df.isna().sum().sort_values(ascending=False)
        missing_by_col = missing_by_col[missing_by_col > 0]
        if len(missing_by_col):
            pct_missing = round(float(missing_by_col.iloc[0]) / len(df) * 100, 1)
            if pct_missing >= 5:
                insights.append(
                    {
                        "type": "info",
                        "text": f"{missing_by_col.index[0]} has {pct_missing}% missing values — worth checking your export.",
                    }
                )

    return insights[:8]


# --------------------------------------------------------------------------
# Top-level entry point for /api/data/analyze
# --------------------------------------------------------------------------


def analyze(df: pd.DataFrame, dataset_name: str) -> dict[str, Any]:
    schema = detect_schema(df)
    health = compute_health(df, schema)
    kpis = compute_kpis(df, schema)
    charts = compute_charts(df, schema)
    insights = compute_insights(df, schema)

    return {
        "dataset_name": dataset_name,
        "rows": schema.row_count,
        "columns": schema.column_count,
        "health": health,
        "kpis": kpis,
        "charts": charts,
        "insights": insights,
        "dataset_schema": {
            "date_column": schema.date_column,
            "measures": [{"name": m.name, "role": m.role} for m in schema.measures],
            "dimensions": [{"name": d.name, "role": d.role} for d in schema.dimensions],
        },
    }

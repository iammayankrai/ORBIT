"""Generates the extra bundled demo datasets used by the Orbit "Demos" gallery.

Every dataset is fully synthetic (seeded, so the output is reproducible) and
each one is built around a small story the dashboard can surface:

  * inventory    - ageing stock builds up in one warehouse + one category
  * procurement  - one supplier slips on delivery; spend inflates in Q4
  * workforce    - attrition and overtime climb in a single department
  * receivables  - collections slow for a customer segment; overdue grows
  * manufacturing- one plant's OEE and yield decay across the last months

Run:    python scripts/generate_demo_datasets.py
Output: app/data/sample_<id>_data.csv  (one file per dataset)

No real company data is used anywhere - these only borrow the *shape* of the
business domains (inventory, procurement, HR, finance, manufacturing).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

OUT_DIR = Path(__file__).resolve().parent.parent / "app" / "data"


def _write(df: pd.DataFrame, name: str) -> None:
    path = OUT_DIR / f"sample_{name}_data.csv"
    df.to_csv(path, index=False, date_format="%Y-%m-%d")
    print(f"{path.name}: {len(df):,} rows, {path.stat().st_size / 1024:.0f} KB")


def _pick(rng: np.random.Generator, options, n, p=None):
    return rng.choice(np.array(options, dtype=object), size=n, p=p)


# --------------------------------------------------------------------------
# Inventory - monthly stock snapshot per SKU x warehouse
# --------------------------------------------------------------------------


def inventory(rng: np.random.Generator) -> pd.DataFrame:
    warehouses = {
        "Bhiwandi WH": "West",
        "Gurugram WH": "North",
        "Hosur WH": "South",
        "Kolkata WH": "East",
        "Nagpur WH": "Central",
    }
    categories = {
        "Raw Materials": (180, 0.9),
        "Packaging": (60, 1.1),
        "Finished Goods": (420, 1.0),
        "Spares & Consumables": (95, 0.8),
        "Trading Goods": (310, 1.05),
    }
    suppliers = ["Apex Industries", "Bharat Polymers", "Cosmo Packaging", "Delta Chem", "EverGreen Agro",
                 "Fortune Traders", "Global Ingredients", "Hind Plastics"]

    skus = []
    for i in range(1, 61):
        cat = list(categories)[(i * 7) % len(categories)]
        base_price, _ = categories[cat]
        skus.append({
            "code": f"SKU-{1000 + i}",
            "name": f"{cat.split()[0]} Item {i:02d}",
            "category": cat,
            "price": base_price * rng.uniform(0.6, 1.8),
            "supplier": suppliers[rng.integers(len(suppliers))],
            "demand": rng.uniform(40, 420),
        })

    months = pd.date_range("2024-01-31", "2025-12-31", freq="ME")
    rows = []
    for sku in skus:
        wh_names = list(rng.choice(list(warehouses), size=3, replace=False))
        for wh in wh_names:
            stock = sku["demand"] * rng.uniform(1.0, 2.4)
            for mi, month in enumerate(months):
                season = 1 + 0.18 * np.sin((month.month - 2) / 12 * 2 * np.pi)
                demand = sku["demand"] * season * rng.uniform(0.8, 1.2)
                # Story: Bhiwandi + Finished Goods start over-stocking in 2025.
                overstock = 1.0
                if wh == "Bhiwandi WH" and sku["category"] in ("Finished Goods", "Trading Goods") and month >= pd.Timestamp("2025-03-31"):
                    overstock = 1.0 + 0.07 * (month.month - 2)
                inbound = demand * rng.uniform(0.85, 1.15) * overstock
                stock = max(stock + inbound - demand, 0)
                aged_share = np.clip(rng.normal(0.12, 0.05) + (0.045 * max(month.month - 2, 0) if overstock > 1 else 0), 0, 0.85)
                price = sku["price"] * (1 + 0.012 * mi / 12)
                rows.append({
                    "Date": month,
                    "Warehouse": wh,
                    "Region": warehouses[wh],
                    "Category": sku["category"],
                    "Product": sku["name"],
                    "SKU Code": sku["code"],
                    "Supplier": sku["supplier"],
                    "Stock Qty": round(stock),
                    "Stock Value": round(stock * price, 2),
                    "Aged Stock Value": round(stock * price * aged_share, 2),
                    "Units Sold": round(demand),
                    "Days of Cover": round(stock / max(demand, 1) * 30, 1),
                })
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------
# Procurement - purchase order lines
# --------------------------------------------------------------------------


def procurement(rng: np.random.Generator) -> pd.DataFrame:
    n = 9_200
    dates = pd.to_datetime("2024-01-01") + pd.to_timedelta(rng.integers(0, 730, n), unit="D")
    dates = dates.sort_values()
    month = dates.month.to_numpy()

    suppliers = {
        "Apex Industries": 0.94, "Bharat Polymers": 0.90, "Cosmo Packaging": 0.88, "Delta Chem": 0.92,
        "EverGreen Agro": 0.86, "Fortune Traders": 0.82, "Global Ingredients": 0.91, "Hind Plastics": 0.89,
        "Indus Logistics": 0.87, "Jupiter Metals": 0.85,
    }
    sup_names = list(suppliers)
    supplier = _pick(rng, sup_names, n, p=np.array([0.17, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.08, 0.06, 0.06]))
    categories = ["Raw Material", "Packaging", "Services", "Capex", "Spares"]
    category = _pick(rng, categories, n, p=[0.42, 0.22, 0.16, 0.08, 0.12])
    cat_price = {"Raw Material": 310, "Packaging": 48, "Services": 2200, "Capex": 85000, "Spares": 940}
    plants = ["Plant A - Pune", "Plant B - Hosur", "Plant C - Baddi", "Plant D - Nagpur"]
    plant = _pick(rng, plants, n, p=[0.35, 0.28, 0.22, 0.15])
    buyers = ["Anita Desai", "Rahul Verma", "Kiran Joshi", "Suresh Pillai", "Meera Iyer", "Deepak Rao"]
    buyer = _pick(rng, buyers, n)

    qty = np.maximum(1, (rng.lognormal(4.2, 0.9, n) / np.array([cat_price[c] for c in category]) ** 0.25)).round()
    price = np.array([cat_price[c] for c in category]) * rng.uniform(0.85, 1.2, n)
    # Story: prices inflate in Q4 2025.
    inflation = np.where(dates >= "2025-10-01", 1.11, 1.0)
    price = price * inflation * (1 + 0.01 * (dates.year.to_numpy() - 2024))
    value = (qty * price).round(2)

    on_time_p = np.array([suppliers[s] for s in supplier])
    # Story: Fortune Traders slips in the second half of 2025.
    slip = (supplier == "Fortune Traders") & (dates >= "2025-07-01")
    on_time_p = np.where(slip, 0.52, on_time_p)
    on_time = (rng.random(n) < on_time_p).astype(int)
    delay = np.where(on_time == 1, rng.integers(-2, 1, n), rng.integers(2, 16, n))

    return pd.DataFrame({
        "PO Date": dates.strftime("%Y-%m-%d"),
        "PO Number": [f"PO-{500000 + i}" for i in range(n)],
        "Supplier": supplier,
        "Category": category,
        "Plant": plant,
        "Buyer": buyer,
        "Order Qty": qty.astype(int),
        "Unit Price": price.round(2),
        "PO Value": value,
        "Delay Days": delay,
        "On Time %": on_time * 100,
        "Month": month,
    }).drop(columns=["Month"])


# --------------------------------------------------------------------------
# Workforce - monthly employee records
# --------------------------------------------------------------------------


def workforce(rng: np.random.Generator) -> pd.DataFrame:
    depts = {"Manufacturing": 150, "Sales": 90, "Supply Chain": 70, "Finance": 35, "HR & Admin": 25, "R&D": 45, "IT": 35}
    locations = ["Pune", "Hosur", "Baddi", "Mumbai", "Delhi", "Bengaluru"]
    grades = ["G1", "G2", "G3", "G4", "G5"]
    managers = {d: [f"{d.split()[0]} Lead {i}" for i in (1, 2, 3)] for d in depts}
    months = pd.date_range("2024-01-31", "2025-12-31", freq="ME")
    base_cost = {"G1": 28000, "G2": 42000, "G3": 68000, "G4": 105000, "G5": 160000}

    emps = []
    eid = 1
    for dept, count in depts.items():
        for _ in range(count):
            grade = str(rng.choice(grades, p=[0.3, 0.3, 0.2, 0.14, 0.06]))
            emps.append({
                "id": f"EMP-{2000 + eid}", "dept": dept, "grade": grade, "loc": str(rng.choice(locations)),
                "mgr": managers[dept][int(rng.integers(3))],
                "cost": base_cost[grade] * rng.uniform(0.9, 1.15),
                "tenure": rng.uniform(0.5, 14),
                "fte": float(rng.choice([1.0, 0.8, 0.5], p=[0.9, 0.06, 0.04])),
                "left_at": None,
            })
            eid += 1

    # Story: Sales + Manufacturing attrition climbs through 2025.
    for e in emps:
        for mi, m in enumerate(months):
            hazard = 0.004
            if e["dept"] in ("Sales", "Manufacturing") and m >= pd.Timestamp("2025-04-30"):
                hazard = 0.017
            if e["left_at"] is None and rng.random() < hazard:
                e["left_at"] = m
    rows = []
    for e in emps:
        for m in months:
            if e["left_at"] is not None and m > e["left_at"]:
                continue
            ot_base = 6 if e["dept"] == "Manufacturing" else 2
            ot = max(0, rng.normal(ot_base * (1.5 if m >= pd.Timestamp("2025-04-30") and e["dept"] == "Manufacturing" else 1), 3))
            rows.append({
                "Month": m,
                "Department": e["dept"],
                "Location": e["loc"],
                "Grade": e["grade"],
                "Employee Code": e["id"],
                "Reporting Manager": e["mgr"],
                "FTE": e["fte"],
                "Exits": 1 if e["left_at"] == m else 0,
                "Overtime Hours": round(ot, 1),
                "Absence Days": int(rng.poisson(0.9)),
                "Salary Cost": round(e["cost"] * (1 + 0.04 * (m.year - 2024)), 2),
                "Engagement Score": round(float(np.clip(rng.normal(74 - (7 if (e["dept"] in ("Sales", "Manufacturing") and m >= pd.Timestamp("2025-04-30")) else 0), 9), 20, 100)), 1),
            })
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------
# Receivables - invoices
# --------------------------------------------------------------------------


def receivables(rng: np.random.Generator) -> pd.DataFrame:
    n = 9_000
    dates = (pd.to_datetime("2024-01-01") + pd.to_timedelta(rng.integers(0, 730, n), unit="D")).sort_values()
    regions = ["North", "South", "East", "West", "Central"]
    region = _pick(rng, regions, n, p=[0.24, 0.26, 0.12, 0.28, 0.10])
    segments = ["Distributors", "Modern Trade", "E-commerce", "Institutional", "Exports"]
    segment = _pick(rng, segments, n, p=[0.34, 0.2, 0.18, 0.16, 0.12])
    customers = [f"{p} {s}" for p in ("Apollo", "Bluestar", "Capital", "Dhanlaxmi", "Everest", "Flagship", "Gemini", "Horizon", "Indigo", "Jaguar")
                 for s in ("Traders", "Retail", "Foods")]
    customer = _pick(rng, customers, n)
    managers = ["Neha Kulkarni", "Aakash Shah", "Arjun Reddy", "Divya Nair", "Rohit Malhotra", "Simran Kaur", "Sourav Banerjee", "Priya Das"]
    manager = _pick(rng, managers, n)

    amount = rng.lognormal(11.2, 0.85, n).round(2)
    amount *= np.where(segment == "Exports", 2.4, 1.0)
    terms = {"Distributors": 45, "Modern Trade": 60, "E-commerce": 21, "Institutional": 75, "Exports": 90}
    term = np.array([terms[s] for s in segment])
    pay_days = rng.normal(term + 4, 11).clip(5, 220)
    # Story: Modern Trade + East start paying late from mid-2025.
    late = ((segment == "Modern Trade") | (region == "East")) & (dates >= "2025-06-01")
    pay_days = np.where(late, pay_days + rng.normal(28, 9, n).clip(0), pay_days)

    age = (pd.Timestamp("2025-12-31") - dates).days.to_numpy()
    paid_in_full = (pay_days <= age) & (rng.random(n) < 0.97)
    collected = np.where(paid_in_full, amount, np.where(rng.random(n) < 0.35, (amount * rng.uniform(0.2, 0.8, n)).round(2), 0.0))
    outstanding = (amount - collected).round(2)
    overdue_days = np.where(outstanding > 0, np.maximum(age - term, 0), 0)
    bucket = np.select(
        [outstanding <= 0, overdue_days <= 0, overdue_days <= 30, overdue_days <= 60, overdue_days <= 90],
        ["Settled", "Not Due", "1-30 Days", "31-60 Days", "61-90 Days"], default="90+ Days",
    )
    return pd.DataFrame({
        "Invoice Date": dates.strftime("%Y-%m-%d"),
        "Invoice No": [f"INV-{700000 + i}" for i in range(n)],
        "Customer": customer,
        "Region": region,
        "Segment": segment,
        "Account Manager": manager,
        "Ageing Bucket": bucket,
        "Invoice Amount": amount,
        "Amount Collected": collected,
        "Outstanding Amount": outstanding,
        "Days To Pay": np.where(paid_in_full, pay_days.round(0), np.nan),
    })


# --------------------------------------------------------------------------
# Manufacturing - production runs per line per shift
# --------------------------------------------------------------------------


def manufacturing(rng: np.random.Generator) -> pd.DataFrame:
    plants = {"Pune": ["Line 1", "Line 2"], "Hosur": ["Line 1", "Line 2"], "Baddi": ["Line 1", "Line 2"]}
    products = ["Capsules", "Tablets", "Softgels", "Powder Sachets", "Liquid Fill"]
    days = pd.date_range("2024-10-01", "2025-12-31", freq="D")
    rows = []
    for plant, lines in plants.items():
        for line in lines:
            for d in days:
                if d.dayofweek == 6:
                    continue
                for shift in ("Day", "Night"):
                    planned = rng.integers(8_000, 14_000)
                    oee = np.clip(rng.normal(0.82 if plant != "Hosur" else 0.80, 0.045), 0.45, 0.97)
                    # Story: Hosur decays from Sep-2025 onwards.
                    if plant == "Hosur" and d >= pd.Timestamp("2025-09-01"):
                        oee = np.clip(oee - 0.0012 * (d - pd.Timestamp("2025-09-01")).days - 0.04, 0.4, 0.9)
                    if shift == "Night":
                        oee -= 0.025
                    produced = round(planned * oee * rng.uniform(1.02, 1.12))
                    reject_rate = np.clip(rng.normal(0.018 + (0.02 if plant == "Hosur" and d >= pd.Timestamp("2025-09-01") else 0), 0.006), 0.002, 0.12)
                    rows.append({
                        "Date": d,
                        "Plant": plant,
                        "Line": f"{plant} {line}",
                        "Product": products[int(rng.integers(len(products)))],
                        "Shift": shift,
                        "Batch Code": f"B{d.strftime('%y%m%d')}-{plant[:2].upper()}{line[-1]}{shift[0]}",
                        "Planned Qty": int(planned),
                        "Produced Qty": int(produced),
                        "Rejected Qty": int(round(produced * reject_rate)),
                        "Downtime Minutes": int(np.clip(rng.normal(55 + (140 * (1 - oee)), 22), 0, 360)),
                        "OEE %": round(float(oee * 100), 1),
                        "Energy Cost": round(float(produced * rng.uniform(0.9, 1.35)), 2),
                    })
    return pd.DataFrame(rows)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, fn, seed in (
        ("inventory", inventory, 11),
        ("procurement", procurement, 22),
        ("workforce", workforce, 33),
        ("receivables", receivables, 44),
        ("manufacturing", manufacturing, 55),
    ):
        _write(fn(np.random.default_rng(seed)), name)


if __name__ == "__main__":
    main()

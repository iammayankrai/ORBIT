"""Synthetic FMCG/retail data generator.

Produces a realistic, internally-correlated dataset: sales vary by region,
month, category and season; a subset of products are intentionally declining
or stocked out; inventory ageing correlates with slow-moving products; sales
targets are set from trailing performance, so some managers naturally miss
them once a regional demand shock hits.

Scale is configurable so contributors can seed a small dataset in seconds for
local development, or the full scale described in the project README for a
production-like demo. Defaults below favour fast local iteration.

    python -m app.database.seed                     # default (small) scale
    python -m app.database.seed --scale full         # ~spec scale (slow)
    python -m app.database.seed --customers 50000 --products 5000 --months 36
"""

from __future__ import annotations

import argparse
import random
from dataclasses import dataclass
from datetime import date, timedelta

import numpy as np
import pandas as pd
from sqlalchemy import text

from app.database.session import Base, SessionLocal, engine
from app.models.db_models import (  # noqa: F401 - registers tables on Base.metadata
    AIQueryLog,
    Customer,
    Inventory,
    Order,
    Product,
    Region,
    Sale,
    SalesManager,
    SalesTarget,
)

RNG_SEED = 42

REGIONS = [
    ("Delhi NCR", "North"), ("Chandigarh", "North"), ("Lucknow", "North"), ("Jaipur", "North"),
    ("Mumbai", "West"), ("Ahmedabad", "West"), ("Surat", "West"), ("Pune", "West"),
    ("Bangalore", "South"), ("Chennai", "South"), ("Hyderabad", "South"), ("Kochi", "South"), ("Coimbatore", "South"),
    ("Kolkata", "East"), ("Patna", "East"), ("Bhubaneswar", "East"), ("Guwahati", "East"),
    ("Bhopal", "Central"), ("Indore", "Central"), ("Nagpur", "Central"),
]

CATEGORIES = {
    "Home Appliances": {"code": "HA", "price": (1200, 18000), "seasonality": 0.18},
    "Personal Care": {"code": "PC", "price": (60, 650), "seasonality": 0.08},
    "Packaged Foods": {"code": "PF", "price": (40, 480), "seasonality": 0.12},
    "Beverages": {"code": "BV", "price": (30, 320), "seasonality": 0.22},
    "Home & Kitchen": {"code": "HK", "price": (150, 3200), "seasonality": 0.10},
    "Health & Wellness": {"code": "HW", "price": (200, 4500), "seasonality": 0.09},
    "Electronics Accessories": {"code": "EA", "price": (250, 5200), "seasonality": 0.14},
}

SEGMENTS = ["Retail", "Wholesale", "Modern Trade", "E-commerce"]
LIFECYCLES = ["normal", "normal", "normal", "normal", "normal", "declining", "growing", "new"]

SHOCK_ZONE = "West"
SHOCK_CATEGORY = "Home Appliances"

ADJECTIVES = ["Aero", "Pure", "Nova", "Arctic", "Velvet", "Golden", "Crystal", "Urban", "Prime", "Coastal",
              "Harvest", "Morning", "Clear", "Frost", "Citrus", "Royal", "Swift", "Lush", "Bright", "Silver"]
NOUNS = ["Fan", "Purifier", "Oil", "Mixer", "Snack Mix", "Cooler", "Blender", "Storage Set", "Kettle", "Trimmer",
         "Sparkling Drink", "Muesli", "Detergent", "Cream", "Refrigerator", "Filter Coffee", "Iron", "Speaker",
         "Charger", "Toaster"]
BUSINESS_SUFFIX = ["Traders", "Retail Chain", "Mart", "Distributors", "Enterprises", "Stores", "Wholesale Co",
                    "FreshMart Chain", "Supermart", "General Store"]
BUSINESS_ROOT = ["Sundaram", "Coastal", "Metro", "Shreeji", "Unity", "National", "Prime", "Everyday", "Horizon",
                  "Sunrise", "Greenfield", "Capital", "Heritage", "Vantage", "Anchor"]
PERSON_FIRST = ["Karan", "Ishaan", "Ritu", "Sanjay", "Priya", "Arjun", "Meera", "Devansh", "Ananya", "Vikram",
                "Neha", "Rohan", "Kavya", "Aditya", "Pooja", "Rahul", "Simran", "Varun", "Divya", "Manish"]
PERSON_LAST = ["Mehta", "Kapoor", "Chawla", "Iyer", "Nair", "Bhatia", "Krishnan", "Rao", "Singh", "Verma",
               "Gupta", "Menon", "Reddy", "Malhotra", "Joshi"]


def month_range(n_months: int, end: date) -> list[date]:
    months = []
    y, m = end.year, end.month
    for _ in range(n_months):
        months.append(date(y, m, 1))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(months))


def seasonal_factor(month: int) -> float:
    # Indian retail: festive peak Oct-Nov, monsoon dip Jun-Aug, New Year bump Jan.
    factors = [1.02, 0.98, 1.0, 1.0, 0.99, 0.94, 0.92, 0.93, 1.03, 1.14, 1.18, 1.08]
    return factors[month - 1]


@dataclass
class ScaleConfig:
    n_regions: int
    n_managers: int
    n_customers: int
    n_products: int
    n_months: int
    orders_per_region_month: int


SCALES = {
    "small": ScaleConfig(20, 60, 3000, 500, 18, 60),
    "demo": ScaleConfig(20, 100, 6000, 900, 24, 90),
    "full": ScaleConfig(20, 100, 50000, 5000, 36, 900),
}


def build_regions(rng: random.Random) -> pd.DataFrame:
    return pd.DataFrame([{"id": i + 1, "name": n, "zone": z} for i, (n, z) in enumerate(REGIONS)])


def build_managers(cfg: ScaleConfig, regions: pd.DataFrame, rng: random.Random) -> pd.DataFrame:
    # Sample names without replacement — with only a small first/last name
    # pool, independent random choices collide often enough (~100 draws from
    # 300 combos) to duplicate a manager's display name, which breaks any
    # chart that keys rows by name. Guaranteed-unique pairs sidestep that.
    all_pairs = [(f, l) for f in PERSON_FIRST for l in PERSON_LAST]
    rng.shuffle(all_pairs)
    if cfg.n_managers > len(all_pairs):
        raise ValueError(f"n_managers ({cfg.n_managers}) exceeds unique name pool ({len(all_pairs)})")
    rows = []
    for i in range(cfg.n_managers):
        region = regions.iloc[i % len(regions)]
        first, last = all_pairs[i]
        rows.append({
            "id": i + 1,
            "name": f"{first} {last}",
            "region_id": int(region["id"]),
        })
    return pd.DataFrame(rows)


def region_weight(zone: str) -> float:
    # Metro-heavy zones carry more customers/orders, mirroring real population skew.
    return {"North": 1.15, "West": 1.3, "South": 1.25, "East": 0.85, "Central": 0.75}.get(zone, 1.0)


def build_customers(cfg: ScaleConfig, regions: pd.DataFrame, rng: random.Random, np_rng: np.random.Generator) -> pd.DataFrame:
    weights = regions["zone"].map(region_weight).to_numpy()
    weights = weights / weights.sum()
    region_ids = np_rng.choice(regions["id"].to_numpy(), size=cfg.n_customers, p=weights)
    start = date.today() - timedelta(days=3 * 365)
    rows = []
    for i in range(cfg.n_customers):
        signup = start + timedelta(days=int(np_rng.integers(0, 3 * 365)))
        rows.append({
            "id": i + 1,
            "name": f"{rng.choice(BUSINESS_ROOT)} {rng.choice(BUSINESS_SUFFIX)}",
            "region_id": int(region_ids[i]),
            "segment": rng.choices(SEGMENTS, weights=[0.45, 0.2, 0.25, 0.1])[0],
            "signup_date": signup,
        })
    return pd.DataFrame(rows)


def build_products(cfg: ScaleConfig, rng: random.Random, np_rng: np.random.Generator) -> pd.DataFrame:
    cat_names = list(CATEGORIES.keys())
    rows = []
    counters = {c: 0 for c in cat_names}
    for i in range(cfg.n_products):
        category = rng.choice(cat_names)
        meta = CATEGORIES[category]
        counters[category] += 1
        low, high = meta["price"]
        unit_price = round(float(np_rng.uniform(low, high)), 2)
        lifecycle = rng.choice(LIFECYCLES)
        rows.append({
            "id": i + 1,
            "sku": f"{meta['code']}-{counters[category]:04d}",
            "name": f"{rng.choice(ADJECTIVES)}{rng.choice(ADJECTIVES)} {rng.choice(NOUNS)}"[:160],
            "category": category,
            "unit_price": unit_price,
            "lifecycle": lifecycle,
        })
    return pd.DataFrame(rows)


def product_month_multiplier(lifecycle: str, month_idx: int, n_months: int, np_rng: np.random.Generator) -> float:
    progress = month_idx / max(n_months - 1, 1)
    if lifecycle == "declining":
        return max(0.15, 1.25 - progress * 1.1) * float(np_rng.uniform(0.85, 1.15))
    if lifecycle == "growing":
        return (0.6 + progress * 1.0) * float(np_rng.uniform(0.85, 1.15))
    if lifecycle == "new":
        return 0.0 if progress < 0.55 else min(1.4, (progress - 0.55) / 0.45 * 1.4) * float(np_rng.uniform(0.85, 1.15))
    return float(np_rng.uniform(0.85, 1.15))


def generate_transactions(cfg: ScaleConfig, regions, managers, customers, products, months, rng, np_rng):
    orders, sales = [], []
    order_id = 1
    sale_id = 1

    managers_by_region = managers.groupby("region_id")["id"].apply(list).to_dict()
    customers_by_region = customers.groupby("region_id")["id"].apply(list).to_dict()
    products_by_category = products.groupby("category")["id"].apply(list).to_dict()
    product_lookup = products.set_index("id")
    cat_weights = np.array([1.4, 1.1, 1.2, 1.3, 0.9, 0.7, 0.6])  # rough popularity by CATEGORIES order
    cat_weights = cat_weights / cat_weights.sum()
    cat_names = list(CATEGORIES.keys())

    for month_idx, month in enumerate(months):
        seasonal = seasonal_factor(month.month)
        growth = 1.0 + 0.006 * month_idx  # gentle underlying growth over time
        is_shock_month = month_idx == len(months) - 1

        for _, region in regions.iterrows():
            region_id = int(region["id"])
            zone_factor = region_weight(region["zone"])
            demand = cfg.orders_per_region_month * seasonal * growth * zone_factor * float(np_rng.uniform(0.92, 1.08))

            if is_shock_month and region["zone"] == SHOCK_ZONE:
                demand *= 0.72  # regional demand shock driving the "why did revenue decline" story

            n_orders = max(1, int(round(demand)))
            region_customers = customers_by_region.get(region_id) or list(customers["id"])
            region_managers = managers_by_region.get(region_id) or list(managers["id"])

            for _ in range(n_orders):
                order_date = month + timedelta(days=int(rng.randint(0, 27)))
                customer_id = rng.choice(region_customers)
                manager_id = rng.choice(region_managers)

                n_items = rng.choices([1, 2, 3], weights=[0.55, 0.32, 0.13])[0]
                order_total = 0.0
                for _ in range(n_items):
                    category = np_rng.choice(cat_names, p=cat_weights)
                    if is_shock_month and region["zone"] == SHOCK_ZONE and category == SHOCK_CATEGORY and rng.random() < 0.55:
                        continue  # stock-out: the sale simply doesn't happen
                    candidates = products_by_category.get(category)
                    if not candidates:
                        continue
                    product_id = rng.choice(candidates)
                    product = product_lookup.loc[product_id]
                    mult = product_month_multiplier(product["lifecycle"], month_idx, len(months), np_rng)
                    if mult <= 0:
                        continue
                    quantity = max(1, int(round(rng.uniform(1, 6) * mult)))
                    discount_pct = round(rng.uniform(0, 12) + (6 if rng.random() < 0.15 else 0), 1)
                    unit_price = round(product["unit_price"] * float(np_rng.uniform(0.97, 1.03)), 2)
                    revenue = round(quantity * unit_price * (1 - discount_pct / 100), 2)
                    returned = rng.random() < 0.02

                    sales.append({
                        "id": sale_id, "order_id": order_id, "product_id": int(product_id),
                        "region_id": region_id, "order_date": order_date, "quantity": quantity,
                        "unit_price": unit_price, "discount_pct": discount_pct,
                        "revenue": 0.0 if returned else revenue, "returned": returned,
                    })
                    order_total += 0 if returned else revenue
                    sale_id += 1

                orders.append({
                    "id": order_id, "customer_id": int(customer_id), "region_id": region_id,
                    "sales_manager_id": int(manager_id), "order_date": order_date,
                    "status": "completed", "total_amount": round(order_total, 2),
                })
                order_id += 1

    return pd.DataFrame(orders), pd.DataFrame(sales)


def build_inventory(products: pd.DataFrame, regions: pd.DataFrame, sales: pd.DataFrame, months: list[date], rng, np_rng) -> pd.DataFrame:
    last_month = months[-1]
    velocity = sales.groupby("product_id")["quantity"].sum() if not sales.empty else pd.Series(dtype=float)
    rows = []
    inv_id = 1
    for _, product in products.iterrows():
        n_regions = rng.choice([1, 2, 2, 3])
        stock_regions = regions.sample(n=min(n_regions, len(regions)), random_state=rng.randint(0, 10_000))
        product_velocity = float(velocity.get(product["id"], 0))
        for _, region in stock_regions.iterrows():
            if region["zone"] == SHOCK_ZONE and product["category"] == SHOCK_CATEGORY:
                on_hand = int(rng.uniform(0, 40))  # the stock-out SKUs — takes priority over lifecycle
                age_days = int(rng.uniform(5, 45))
            elif product["lifecycle"] == "declining":
                on_hand = int(rng.uniform(400, 1200))
                age_days = int(rng.uniform(70, 220))
            else:
                on_hand = int(max(20, product_velocity / max(len(months), 1) * rng.uniform(0.8, 2.2)))
                age_days = int(rng.uniform(5, 95))

            rows.append({
                "id": inv_id,
                "product_id": int(product["id"]),
                "region_id": int(region["id"]),
                "quantity_on_hand": on_hand,
                "unit_cost": round(product["unit_price"] * rng.uniform(0.6, 0.75), 2),
                "received_date": last_month - timedelta(days=age_days),
                "reorder_point": int(max(10, product_velocity / max(len(months), 1) * 0.5)),
            })
            inv_id += 1
    return pd.DataFrame(rows)


def build_targets(managers: pd.DataFrame, orders: pd.DataFrame, months: list[date], rng) -> pd.DataFrame:
    rows = []
    target_id = 1
    manager_region = managers.set_index("id")["region_id"].to_dict()
    for _, manager in managers.iterrows():
        manager_orders = orders[orders["sales_manager_id"] == manager["id"]] if not orders.empty else orders
        trailing_avg = manager_orders["total_amount"].mean() if len(manager_orders) else 50000
        trailing_avg = trailing_avg * 3 if trailing_avg == trailing_avg else 150000  # guard NaN
        for month in months:
            month_orders = manager_orders[manager_orders["order_date"].apply(lambda d: d.month == month.month and d.year == month.year)] if len(manager_orders) else manager_orders
            baseline = month_orders["total_amount"].sum() if len(month_orders) else trailing_avg
            target = round(max(baseline, 1) * rng.uniform(1.02, 1.12), 2)
            rows.append({
                "id": target_id, "sales_manager_id": int(manager["id"]),
                "region_id": int(manager_region[manager["id"]]), "period": month, "target_amount": target,
            })
            target_id += 1
    return pd.DataFrame(rows)


def bulk_insert(df: pd.DataFrame, table_name: str) -> None:
    if df.empty:
        return
    with engine.begin() as conn:
        df.to_sql(table_name, conn, if_exists="append", index=False, method="multi", chunksize=2000)


def run(scale: str, overrides: dict) -> None:
    cfg = SCALES[scale]
    valid_fields = set(cfg.__dict__.keys())
    filtered = {k: v for k, v in overrides.items() if v is not None and k in valid_fields}
    cfg = ScaleConfig(**{**cfg.__dict__, **filtered})

    rng = random.Random(RNG_SEED)
    np_rng = np.random.default_rng(RNG_SEED)

    print(f"Seeding at scale={scale}: {cfg}")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    regions = build_regions(rng)
    managers = build_managers(cfg, regions, rng)
    customers = build_customers(cfg, regions, rng, np_rng)
    products = build_products(cfg, rng, np_rng)
    months = month_range(cfg.n_months, date.today().replace(day=1) - timedelta(days=1))

    print(f"Generating transactions across {len(months)} months x {len(regions)} regions...")
    orders, sales = generate_transactions(cfg, regions, managers, customers, products, months, rng, np_rng)
    print(f"  -> {len(orders):,} orders, {len(sales):,} sale lines")

    inventory = build_inventory(products, regions, sales, months, rng, np_rng)
    targets = build_targets(managers, orders, months, rng)

    print("Writing to database...")
    bulk_insert(regions, "regions")
    bulk_insert(managers, "sales_managers")
    bulk_insert(customers, "customers")
    bulk_insert(products, "products")
    bulk_insert(orders, "orders")
    bulk_insert(sales, "sales")
    bulk_insert(inventory, "inventory")
    bulk_insert(targets, "sales_targets")

    with engine.begin() as conn:
        for seq, table, col in [
            ("regions_id_seq", "regions", "id"), ("sales_managers_id_seq", "sales_managers", "id"),
            ("customers_id_seq", "customers", "id"), ("products_id_seq", "products", "id"),
            ("orders_id_seq", "orders", "id"), ("sales_id_seq", "sales", "id"),
            ("inventory_id_seq", "inventory", "id"), ("sales_targets_id_seq", "sales_targets", "id"),
        ]:
            conn.execute(text(f"SELECT setval('{seq}', COALESCE((SELECT MAX({col}) FROM {table}), 1))"))

    print("Done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scale", choices=list(SCALES.keys()), default="small")
    parser.add_argument("--customers", type=int, default=None, dest="n_customers")
    parser.add_argument("--products", type=int, default=None, dest="n_products")
    parser.add_argument("--managers", type=int, default=None, dest="n_managers")
    parser.add_argument("--months", type=int, default=None, dest="n_months")
    parser.add_argument("--orders-per-region-month", type=int, default=None, dest="orders_per_region_month")
    args = parser.parse_args()
    run(args.scale, vars(args))

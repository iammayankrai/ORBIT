"""Generates the bundled demo dataset used by "Try Sample Data".

Not random noise — every row is built so the numbers tell a specific,
discoverable story (see the trend functions below): overall revenue grows
across the 3-year span with festive-season seasonality, the West region
tips into decline in the most recent period, Electronics is the strongest
growth category, a handful of products carry a "declining" or "new"
lifecycle, five products carry an injected demand spike (anomalies), and
Sales/Cost/Profit are always arithmetically consistent (profit = sales -
cost, never independently randomised).

Run: .venv/bin/python scripts/generate_sample_data.py
Output: app/data/sample_sales_data.csv
"""

from __future__ import annotations

import csv
import math
import random
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

SEED = 20240601
N_BASE_ROWS = 12_400
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "app" / "data" / "sample_sales_data.csv"

START_DATE = date(2023, 1, 1)
END_DATE = date(2025, 12, 31)
TOTAL_DAYS = (END_DATE - START_DATE).days

REGIONS = ["North", "South", "East", "West", "Central"]

CITIES = {
    "North": ["Delhi", "Jaipur", "Lucknow", "Chandigarh"],
    "South": ["Bengaluru", "Chennai", "Hyderabad", "Kochi"],
    "East": ["Kolkata", "Guwahati", "Patna"],
    "West": ["Mumbai", "Pune", "Ahmedabad", "Surat"],
    "Central": ["Bhopal", "Indore", "Nagpur"],
}

SEGMENTS = ["Retail", "Wholesale", "Modern Trade", "E-commerce"]
SEGMENT_WEIGHTS = [0.35, 0.20, 0.25, 0.20]

SALES_MANAGERS = {
    "North": ["Rohit Malhotra", "Simran Kaur"],
    "South": ["Arjun Reddy", "Divya Nair"],
    "East": ["Sourav Banerjee", "Priya Das"],
    "West": ["Aakash Shah", "Neha Kulkarni"],
    "Central": ["Vikram Singh", "Ritu Chouhan"],
}


@dataclass
class Product:
    name: str
    category: str
    price: float
    lifecycle: str  # growing | declining | stable | new | seasonal
    cogs_ratio: float


PRODUCTS: list[Product] = [
    Product("Wireless Earbuds Pro", "Electronics", 2499, "growing", 0.62),
    Product("Smart Fitness Band", "Electronics", 1899, "growing", 0.60),
    Product("Bluetooth Speaker Mini", "Electronics", 1499, "stable", 0.58),
    Product("4K Action Camera", "Electronics", 6999, "new", 0.65),
    Product("Portable Power Bank 20K", "Electronics", 1299, "stable", 0.55),
    Product("Smart LED Desk Lamp", "Electronics", 899, "declining", 0.50),
    Product("Noise Cancelling Headphones", "Electronics", 4499, "growing", 0.63),
    Product("USB-C Fast Charger", "Electronics", 699, "stable", 0.48),
    Product("Men's Running Shoes", "Apparel", 2199, "stable", 0.52),
    Product("Women's Yoga Leggings", "Apparel", 1299, "growing", 0.45),
    Product("Men's Casual Shirt", "Apparel", 999, "declining", 0.50),
    Product("Women's Denim Jacket", "Apparel", 1799, "stable", 0.48),
    Product("Kids' Graphic T-Shirt", "Apparel", 499, "seasonal", 0.42),
    Product("Unisex Hooded Sweatshirt", "Apparel", 1399, "growing", 0.47),
    Product("Non-Stick Cookware Set", "Home & Kitchen", 2999, "stable", 0.55),
    Product("Electric Kettle 1.5L", "Home & Kitchen", 899, "stable", 0.50),
    Product("Air Fryer Digital", "Home & Kitchen", 4999, "growing", 0.58),
    Product("Memory Foam Pillow", "Home & Kitchen", 799, "growing", 0.44),
    Product("Ceramic Dinner Set", "Home & Kitchen", 1899, "declining", 0.52),
    Product("Stainless Steel Water Bottle", "Home & Kitchen", 499, "stable", 0.40),
    Product("Yoga Mat Premium", "Sports & Fitness", 899, "growing", 0.42),
    Product("Adjustable Dumbbell Set", "Sports & Fitness", 3499, "growing", 0.55),
    Product("Resistance Bands Kit", "Sports & Fitness", 599, "stable", 0.38),
    Product("Cricket Bat Kashmir Willow", "Sports & Fitness", 1599, "seasonal", 0.50),
    Product("Cycling Helmet", "Sports & Fitness", 1299, "declining", 0.48),
    Product("Vitamin C Face Serum", "Beauty & Personal Care", 799, "growing", 0.35),
    Product("Herbal Shampoo 400ml", "Beauty & Personal Care", 349, "stable", 0.32),
    Product("Electric Trimmer", "Beauty & Personal Care", 1299, "stable", 0.50),
    Product("Sunscreen SPF 50", "Beauty & Personal Care", 549, "growing", 0.34),
    Product("Anti-Ageing Night Cream", "Beauty & Personal Care", 1199, "new", 0.38),
]

CATEGORIES = sorted({p.category for p in PRODUCTS})
PRODUCTS_BY_CATEGORY = {c: [p for p in PRODUCTS if p.category == c] for c in CATEGORIES}

CUSTOMER_PREFIXES = [
    "Metro", "Sunrise", "Prime", "Apex", "Silver", "Golden", "Royal", "Urban",
    "Horizon", "Elite", "Blue Sky", "Green Valley", "Star", "Classic", "Modern",
    "National", "Unity", "Bright", "Grand", "Coastal",
]
CUSTOMER_SUFFIXES = [
    "Retail", "Traders", "Mart", "Enterprises", "Stores", "Distributors",
    "Trading Co.", "Supermart", "Ventures", "Agencies",
]


def build_customers(rng: random.Random) -> list[str]:
    names = [f"{p} {s}" for p in CUSTOMER_PREFIXES for s in CUSTOMER_SUFFIXES]
    rng.shuffle(names)
    return names[:160]


def overall_seasonal_factor(day_of_year: int) -> float:
    """Festive-season bump (~Oct-Dec), soft dip in Jan-Feb."""
    angle = 2 * math.pi * (day_of_year - 1) / 365
    return 1.0 + 0.22 * math.sin(angle - math.pi / 2 + 0.9)


def region_factor(region: str, t: float) -> float:
    if region == "West":
        # Steadily loses share across the window, enough to net out as a
        # real decline in the current-vs-prior-period comparison even
        # against the market's overall growth tailwind.
        return 1.37 - 0.70 * t
    if region == "South":
        return 0.85 + 0.55 * t
    if region == "East":
        return 0.95 + 0.15 * t
    if region == "North":
        return 0.95 + 0.10 * t
    if region == "Central":
        return 1.05 - 0.15 * t
    return 1.0


def category_factor(category: str, t: float) -> float:
    return {
        "Electronics": 0.75 + 0.75 * t,
        "Apparel": 0.95 + 0.15 * t,
        "Home & Kitchen": 0.95 + 0.10 * t,
        "Sports & Fitness": 0.85 + 0.40 * t,
        "Beauty & Personal Care": 0.80 + 0.55 * t,
    }.get(category, 1.0)


def lifecycle_factor(lifecycle: str, t: float) -> float:
    if lifecycle == "growing":
        return 0.65 + 0.7 * t
    if lifecycle == "declining":
        return 1.35 - 0.85 * t
    if lifecycle == "new":
        return 0.05 if t < 0.5 else min(1.4, (t - 0.5) * 2.6)
    return 1.0  # stable / seasonal (seasonal handled by month weighting below)


def month_seasonal_boost(lifecycle: str, month: int) -> float:
    if lifecycle != "seasonal":
        return 1.0
    return 2.2 if month in (10, 11, 12) else 0.7


def quantity_and_discount(rng: random.Random, segment: str) -> tuple[int, float]:
    if segment == "Wholesale":
        return rng.randint(20, 80), round(rng.uniform(0.10, 0.25), 3)
    if segment == "Modern Trade":
        return rng.randint(10, 40), round(rng.uniform(0.08, 0.20), 3)
    if segment == "E-commerce":
        return rng.randint(1, 6), round(rng.uniform(0.0, 0.15), 3)
    return rng.randint(1, 5), round(rng.uniform(0.0, 0.10), 3)  # Retail


def make_row(rng: random.Random, order_seq: int, day: date, customers: list[str]) -> dict:
    t = (day - START_DATE).days / TOTAL_DAYS

    region_weights = [region_factor(r, t) for r in REGIONS]
    region = rng.choices(REGIONS, weights=region_weights, k=1)[0]

    category_weights = [category_factor(c, t) for c in CATEGORIES]
    category = rng.choices(CATEGORIES, weights=category_weights, k=1)[0]

    products = PRODUCTS_BY_CATEGORY[category]
    product_weights = [
        lifecycle_factor(p.lifecycle, t) * month_seasonal_boost(p.lifecycle, day.month) for p in products
    ]
    product = rng.choices(products, weights=product_weights, k=1)[0]

    city = rng.choice(CITIES[region])
    segment = rng.choices(SEGMENTS, weights=SEGMENT_WEIGHTS, k=1)[0]
    manager = rng.choice(SALES_MANAGERS[region])
    customer = rng.choice(customers)

    quantity, discount = quantity_and_discount(rng, segment)
    unit_price = product.price * rng.uniform(0.97, 1.03)
    sales = round(quantity * unit_price * (1 - discount), 2)
    cost = round(sales * max(0.2, product.cogs_ratio + rng.uniform(-0.03, 0.03)), 2)
    profit = round(sales - cost, 2)

    return {
        "Date": day.isoformat(),
        "Order ID": f"ORD-{100000 + order_seq}",
        "Customer": customer,
        "Region": region,
        "City": city,
        "Segment": segment,
        "Product": product.name,
        "Category": category,
        "Sales": sales,
        "Quantity": quantity,
        "Discount": discount,
        "Cost": cost,
        "Profit": profit,
        "Sales Manager": manager,
    }


def inject_anomalies(rng: random.Random, rows: list[dict], order_seq_start: int) -> None:
    """Five products get a one-off demand spike: a burst of unusually large
    orders on a single day, so they surface as statistical outliers."""
    anomaly_products = rng.sample(PRODUCTS, 5)
    seq = order_seq_start
    for product in anomaly_products:
        spike_day = START_DATE + timedelta(days=rng.randint(int(TOTAL_DAYS * 0.2), int(TOTAL_DAYS * 0.95)))
        region = rng.choice(REGIONS)
        city = rng.choice(CITIES[region])
        manager = rng.choice(SALES_MANAGERS[region])
        for _ in range(rng.randint(3, 5)):
            quantity = rng.randint(180, 320)
            unit_price = product.price * rng.uniform(0.97, 1.03)
            discount = round(rng.uniform(0.05, 0.15), 3)
            sales = round(quantity * unit_price * (1 - discount), 2)
            cost = round(sales * max(0.2, product.cogs_ratio + rng.uniform(-0.02, 0.02)), 2)
            profit = round(sales - cost, 2)
            rows.append(
                {
                    "Date": spike_day.isoformat(),
                    "Order ID": f"ORD-{100000 + seq}",
                    "Customer": rng.choice(["Metro Retail", "Prime Distributors", "Grand Ventures"]),
                    "Region": region,
                    "City": city,
                    "Segment": "Wholesale",
                    "Product": product.name,
                    "Category": product.category,
                    "Sales": sales,
                    "Quantity": quantity,
                    "Discount": discount,
                    "Cost": cost,
                    "Profit": profit,
                    "Sales Manager": manager,
                }
            )
            seq += 1


def apply_data_quality_blemishes(rng: random.Random, rows: list[dict]) -> list[dict]:
    """~1.8% missing values overall (confined to non-critical columns) and
    ~0.4% exact duplicate rows — realistic Excel-export noise, not enough
    to break the maths."""
    nullable_cols = ["Discount", "City", "Sales Manager", "Segment"]
    for row in rows:
        for col in nullable_cols:
            if rng.random() < 0.063:
                row[col] = ""

    n_dupes = max(1, round(len(rows) * 0.004))
    dupes = [dict(rng.choice(rows)) for _ in range(n_dupes)]
    rows.extend(dupes)
    return rows


def main() -> None:
    rng = random.Random(SEED)
    customers = build_customers(rng)

    daily_weights = []
    days = []
    for offset in range(TOTAL_DAYS + 1):
        day = START_DATE + timedelta(days=offset)
        t = offset / TOTAL_DAYS
        weight = overall_seasonal_factor(day.timetuple().tm_yday) * (1.0 + 0.15 * t)
        days.append(day)
        daily_weights.append(weight)

    sampled_days = rng.choices(days, weights=daily_weights, k=N_BASE_ROWS)
    sampled_days.sort()

    rows = [make_row(rng, i, day, customers) for i, day in enumerate(sampled_days)]
    inject_anomalies(rng, rows, order_seq_start=len(rows))
    rows = apply_data_quality_blemishes(rng, rows)

    rows.sort(key=lambda r: r["Date"])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

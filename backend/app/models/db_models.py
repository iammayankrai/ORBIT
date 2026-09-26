from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Region(Base):
    __tablename__ = "regions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    zone: Mapped[str] = mapped_column(String(40), nullable=False)  # North/South/East/West/Central


class SalesManager(Base):
    __tablename__ = "sales_managers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)
    segment: Mapped[str] = mapped_column(String(40), nullable=False)  # Retail/Wholesale/Modern Trade/E-commerce
    signup_date: Mapped[Date] = mapped_column(Date, nullable=False)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sku: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    # Drives synthetic trend generation: normal / declining / growing / new / seasonal
    lifecycle: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)
    sales_manager_id: Mapped[int] = mapped_column(ForeignKey("sales_managers.id"), nullable=False, index=True)
    order_date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="completed")  # completed/returned/cancelled
    total_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    __table_args__ = (Index("ix_orders_date_region", "order_date", "region_id"),)


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)
    order_date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    discount_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    revenue: Mapped[float] = mapped_column(Float, nullable=False)
    returned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    __table_args__ = (
        Index("ix_sales_date_region", "order_date", "region_id"),
        Index("ix_sales_date_product", "order_date", "product_id"),
    )


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)
    quantity_on_hand: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, nullable=False)
    received_date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    reorder_point: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class SalesTarget(Base):
    __tablename__ = "sales_targets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sales_manager_id: Mapped[int] = mapped_column(ForeignKey("sales_managers.id"), nullable=False, index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)
    period: Mapped[Date] = mapped_column(Date, nullable=False)  # first day of the month
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)

    __table_args__ = (UniqueConstraint("sales_manager_id", "period", name="uq_target_manager_period"),)


class AIQueryLog(Base):
    """Tracks anonymous/daily AI usage for rate limiting, and doubles as a
    cache of recent question -> answer pairs to avoid re-billing the AI
    provider for repeated questions."""

    __tablename__ = "ai_query_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_key: Mapped[str] = mapped_column(String(120), nullable=False, index=True)  # hashed IP or session id
    question: Mapped[str] = mapped_column(String(500), nullable=False)
    question_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    answer_json: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False, index=True)

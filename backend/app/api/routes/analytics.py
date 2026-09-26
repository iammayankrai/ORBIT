from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services import sql_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/kpis")
def kpis(db: Session = Depends(get_db)):
    return sql_service.kpi_summary(db)


@router.get("/revenue-trend")
def revenue_trend(months: int = Query(12, ge=1, le=36), db: Session = Depends(get_db)):
    return sql_service.revenue_trend(db, months=months)


@router.get("/regions")
def regions(db: Session = Depends(get_db)):
    bounds = sql_service.get_period_bounds(db)
    return sql_service.revenue_by_region(db, bounds["current_start"], bounds["prior_start"])


@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    bounds = sql_service.get_period_bounds(db)
    return sql_service.revenue_by_category(db, bounds["current_start"], bounds["prior_start"])


@router.get("/targets")
def targets(db: Session = Depends(get_db)):
    bounds = sql_service.get_period_bounds(db)
    return sql_service.sales_manager_attainment(db, bounds["current_start"])

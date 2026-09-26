from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services import sql_service

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/ageing")
def ageing(db: Session = Depends(get_db)):
    return sql_service.inventory_ageing_buckets(db)


@router.get("/risk")
def risk(db: Session = Depends(get_db)):
    return sql_service.inventory_risk(db)


@router.get("/reorder")
def reorder(db: Session = Depends(get_db)):
    return sql_service.reorder_candidates(db)

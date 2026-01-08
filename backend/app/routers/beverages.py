from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from typing import List
import logging
from datetime import datetime

from ..database import get_db
from ..models import Beverage
from ..schemas import BeverageBase, BeverageCreate, BeverageUpdate

router = APIRouter(prefix="/api", tags=["beverages"])
logger = logging.getLogger(__name__)


@router.get("/beverages", response_model=List[BeverageBase])
def get_beverages(db: DBSession = Depends(get_db)):
    """Get all beverages in inventory"""
    beverages = db.query(Beverage).order_by(Beverage.name).all()
    return beverages


@router.post("/beverages", response_model=BeverageBase)
def create_beverage(beverage: BeverageCreate, db: DBSession = Depends(get_db)):
    """Add new beverage to inventory"""
    db_beverage = Beverage(
        name=beverage.name,
        quantity=beverage.quantity,
        pricePerUnit=beverage.pricePerUnit
    )
    db.add(db_beverage)
    db.commit()
    db.refresh(db_beverage)

    logger.info(f"Created beverage: {beverage.name} (qty: {beverage.quantity}, price: ${beverage.pricePerUnit})")
    return db_beverage


@router.patch("/beverages/{beverage_id}", response_model=BeverageBase)
def update_beverage(
    beverage_id: int,
    beverage_update: BeverageUpdate,
    db: DBSession = Depends(get_db)
):
    """Update beverage information"""
    beverage = db.query(Beverage).filter(Beverage.id == beverage_id).first()

    if not beverage:
        raise HTTPException(status_code=404, detail="Beverage not found")

    update_data = beverage_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(beverage, field, value)

    beverage.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(beverage)

    logger.info(f"Updated beverage {beverage_id}: {beverage.name}")
    return beverage


@router.delete("/beverages/{beverage_id}")
def delete_beverage(beverage_id: int, db: DBSession = Depends(get_db)):
    """Remove beverage from inventory"""
    beverage = db.query(Beverage).filter(Beverage.id == beverage_id).first()

    if not beverage:
        raise HTTPException(status_code=404, detail="Beverage not found")

    beverage_name = beverage.name
    db.delete(beverage)
    db.commit()

    logger.info(f"Deleted beverage: {beverage_name}")
    return {"status": "success", "message": f"Beverage '{beverage_name}' deleted"}

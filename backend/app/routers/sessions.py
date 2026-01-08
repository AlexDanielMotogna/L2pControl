from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, date
from typing import List, Optional
import logging

from ..database import get_db
from ..models import Session, PaidStatus
from ..schemas import SessionBase, SessionUpdate
from ..services.websocket_manager import manager
from .websocket import get_pcs_with_sessions

router = APIRouter(prefix="/api", tags=["sessions"])
logger = logging.getLogger(__name__)


@router.get("/sessions", response_model=List[SessionBase])
def get_sessions(
    status: Optional[str] = Query(None, description="Filter by paid status (PAID/UNPAID)"),
    pcId: Optional[str] = Query(None, description="Filter by PC ID"),
    user: Optional[str] = Query(None, description="Filter by user name"),
    dateFrom: Optional[date] = Query(None, description="Filter from date"),
    dateTo: Optional[date] = Query(None, description="Filter to date"),
    db: DBSession = Depends(get_db)
):
    query = db.query(Session)

    if status:
        query = query.filter(Session.paidStatus == status)

    if pcId:
        query = query.filter(Session.pcId == pcId)

    if user:
        query = query.filter(Session.userName.ilike(f"%{user}%"))

    if dateFrom:
        query = query.filter(Session.startAt >= datetime.combine(dateFrom, datetime.min.time()))

    if dateTo:
        query = query.filter(Session.startAt <= datetime.combine(dateTo, datetime.max.time()))

    sessions = query.order_by(Session.startAt.desc()).all()
    return sessions


@router.patch("/sessions/{session_id}", response_model=SessionBase)
async def update_session(
    session_id: int,
    session_update: SessionUpdate,
    db: DBSession = Depends(get_db)
):
    session = db.query(Session).filter(Session.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    update_data = session_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "paidStatus" and value:
            setattr(session, field, PaidStatus(value))
        else:
            setattr(session, field, value)

    db.commit()
    db.refresh(session)

    # Broadcast update to all WebSocket clients
    try:
        pcs = get_pcs_with_sessions(db)
        await manager.broadcast({
            "type": "update",
            "data": [pc.model_dump() for pc in pcs]
        })
    except Exception as e:
        logger.error(f"Failed to broadcast WebSocket update: {e}")

    return session


@router.post("/sessions/{session_id}/close", response_model=SessionBase)
async def close_session(
    session_id: int,
    db: DBSession = Depends(get_db)
):
    session = db.query(Session).filter(Session.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.endAt:
        raise HTTPException(status_code=400, detail="Session already closed")

    session.endAt = datetime.utcnow()
    session.durationSeconds = int(
        (session.endAt - session.startAt).total_seconds()
    )

    db.commit()
    db.refresh(session)

    # Broadcast update to all WebSocket clients
    try:
        pcs = get_pcs_with_sessions(db)
        await manager.broadcast({
            "type": "update",
            "data": [pc.model_dump() for pc in pcs]
        })
    except Exception as e:
        logger.error(f"Failed to broadcast WebSocket update: {e}")

    return session

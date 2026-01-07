from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timezone
import asyncio
import logging

from ..database import get_db
from ..models import PC, Session, PCStatus, PaidStatus
from ..schemas import EventCreate
from ..services.websocket_manager import manager
from .websocket import get_pcs_with_sessions

router = APIRouter(prefix="/api", tags=["events"])
logger = logging.getLogger(__name__)


def normalize_timestamp(dt: datetime) -> datetime:
    """Convert timezone-aware datetime to timezone-naive UTC datetime for SQLite"""
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


@router.post("/events")
def handle_event(event: EventCreate, db: DBSession = Depends(get_db)):
    try:
        # Normalize timestamp for SQLite compatibility
        timestamp = normalize_timestamp(event.timestamp)

        # Find or create PC
        pc = db.query(PC).filter(PC.pcId == event.pcId).first()

        if not pc:
            pc = PC(
                pcId=event.pcId,
                clientUuid=event.clientUuid,
                lastSeenAt=timestamp,
                status=PCStatus.OFFLINE
            )
            db.add(pc)
            db.commit()
            db.refresh(pc)

        # Update lastSeenAt
        pc.lastSeenAt = timestamp

        if event.type == "start":
            pc.status = PCStatus.ONLINE

            # Close any existing open session for this PC
            open_session = db.query(Session).filter(
                Session.pcId == event.pcId,
                Session.endAt.is_(None)
            ).first()

            if open_session:
                open_session.endAt = timestamp
                open_session.durationSeconds = int(
                    (timestamp - open_session.startAt).total_seconds()
                )

            # Create new session
            new_session = Session(
                pcId=event.pcId,
                startAt=timestamp,
                paidStatus=PaidStatus.UNPAID
            )
            db.add(new_session)

        elif event.type == "heartbeat":
            pc.status = PCStatus.ONLINE

            # Auto-create session if PC is online but has no active session
            open_session = db.query(Session).filter(
                Session.pcId == event.pcId,
                Session.endAt.is_(None)
            ).first()

            if not open_session:
                # No active session exists - create one automatically
                logger.info(f"Auto-creating session for {event.pcId} (heartbeat received without active session)")
                new_session = Session(
                    pcId=event.pcId,
                    startAt=timestamp,
                    paidStatus=PaidStatus.UNPAID
                )
                db.add(new_session)

        elif event.type == "stop":
            pc.status = PCStatus.OFFLINE

            # Close open session
            open_session = db.query(Session).filter(
                Session.pcId == event.pcId,
                Session.endAt.is_(None)
            ).first()

            if open_session:
                open_session.endAt = timestamp
                open_session.durationSeconds = int(
                    (timestamp - open_session.startAt).total_seconds()
                )

        db.commit()

        # Broadcast update to all WebSocket clients
        try:
            pcs = get_pcs_with_sessions(db)
            asyncio.create_task(manager.broadcast({
                "type": "update",
                "data": [pc.model_dump() for pc in pcs]
            }))
        except Exception as e:
            logger.error(f"Failed to broadcast WebSocket update: {e}")

        return {"status": "ok", "pcId": event.pcId, "eventType": event.type}
    except Exception as e:
        db.rollback()
        print(f"Error handling event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing event: {str(e)}")

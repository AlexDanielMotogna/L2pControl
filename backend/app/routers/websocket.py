from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta
import logging

from ..database import SessionLocal
from ..services.websocket_manager import manager
from ..models import PC, Session, PCStatus
from ..schemas import PCWithSession, SessionBase

router = APIRouter(tags=["websocket"])
logger = logging.getLogger(__name__)

# Same threshold as pcs.py
OFFLINE_THRESHOLD_MINUTES = 1.5


def get_pcs_with_sessions(db: DBSession):
    """Get all PCs with their active sessions (same logic as /api/pcs endpoint)"""
    # Update offline status for PCs that haven't sent heartbeat
    threshold = datetime.utcnow() - timedelta(minutes=OFFLINE_THRESHOLD_MINUTES)

    stale_pcs = db.query(PC).filter(
        PC.status == PCStatus.ONLINE,
        PC.lastSeenAt < threshold
    ).all()

    for pc in stale_pcs:
        pc.status = PCStatus.OFFLINE
        # Close any open sessions
        open_session = db.query(Session).filter(
            Session.pcId == pc.pcId,
            Session.endAt.is_(None)
        ).first()
        if open_session:
            open_session.endAt = pc.lastSeenAt
            open_session.durationSeconds = int(
                (pc.lastSeenAt - open_session.startAt).total_seconds()
            )

    db.commit()

    # Get all PCs with their active sessions
    pcs = db.query(PC).order_by(PC.pcId).all()
    result = []

    for pc in pcs:
        active_session = db.query(Session).filter(
            Session.pcId == pc.pcId,
            Session.endAt.is_(None)
        ).first()

        pc_data = PCWithSession(
            id=pc.id,
            pcId=pc.pcId,
            clientUuid=pc.clientUuid,
            lastSeenAt=pc.lastSeenAt,
            status=pc.status.value,
            activeSession=SessionBase.model_validate(active_session) if active_session else None
        )
        result.append(pc_data)

    return result


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        # Send initial state immediately upon connection
        db: DBSession = SessionLocal()
        try:
            pcs = get_pcs_with_sessions(db)
            await websocket.send_json({
                "type": "initial_state",
                "data": [pc.model_dump() for pc in pcs]
            })
        finally:
            db.close()

        # Keep connection alive - listen for pings
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info("Client disconnected normally")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

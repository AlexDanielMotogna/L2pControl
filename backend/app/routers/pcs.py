from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta
from typing import List

from ..database import get_db
from ..models import PC, Session, PCStatus
from ..schemas import PCWithSession, SessionBase

router = APIRouter(prefix="/api", tags=["pcs"])

OFFLINE_THRESHOLD_MINUTES = 2


@router.get("/pcs", response_model=List[PCWithSession])
def get_pcs(db: DBSession = Depends(get_db)):
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

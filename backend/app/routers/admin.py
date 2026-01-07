from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
import logging

from ..database import get_db
from ..models import PC, Session

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)


@router.delete("/reset-database")
def reset_database(db: DBSession = Depends(get_db)):
    """
    DANGER: Delete all PCs and sessions from the database.
    This is irreversible and should only be used before production deployment.
    """
    try:
        # Delete all sessions first (foreign key constraint)
        sessions_deleted = db.query(Session).delete()

        # Delete all PCs
        pcs_deleted = db.query(PC).delete()

        db.commit()

        logger.info(f"Database reset: Deleted {pcs_deleted} PCs and {sessions_deleted} sessions")

        return {
            "status": "success",
            "message": "Database cleared successfully",
            "deleted": {
                "pcs": pcs_deleted,
                "sessions": sessions_deleted
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to reset database: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset database: {str(e)}")

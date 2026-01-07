from pydantic import BaseModel, field_serializer
from datetime import datetime, timezone
from typing import Optional, Literal


class EventCreate(BaseModel):
    pcId: str
    clientUuid: str
    type: Literal["start", "heartbeat", "stop"]
    timestamp: datetime


class SessionBase(BaseModel):
    id: int
    pcId: str
    userName: Optional[str] = None
    startAt: datetime
    endAt: Optional[datetime] = None
    durationSeconds: Optional[int] = None
    paidStatus: str
    amountDue: Optional[float] = None
    amountPaid: Optional[float] = None
    notes: Optional[str] = None

    @field_serializer('startAt', 'endAt')
    def serialize_datetime(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        # Ensure datetime is treated as UTC and serialized with timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    class Config:
        from_attributes = True


class SessionUpdate(BaseModel):
    userName: Optional[str] = None
    paidStatus: Optional[Literal["PAID", "UNPAID"]] = None
    amountDue: Optional[float] = None
    amountPaid: Optional[float] = None
    notes: Optional[str] = None


class PCBase(BaseModel):
    id: int
    pcId: str
    clientUuid: str
    lastSeenAt: datetime
    status: str

    @field_serializer('lastSeenAt')
    def serialize_datetime(self, dt: datetime, _info) -> str:
        # Ensure datetime is treated as UTC and serialized with timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    class Config:
        from_attributes = True


class PCWithSession(PCBase):
    activeSession: Optional[SessionBase] = None

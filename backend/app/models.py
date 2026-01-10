from sqlalchemy import Column, Integer, String, DateTime, Enum, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base


class PCStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"


class PaidStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PAID = "PAID"


class PC(Base):
    __tablename__ = "pcs"

    id = Column(Integer, primary_key=True, index=True)
    pcId = Column(String(100), unique=True, index=True, nullable=False)
    clientUuid = Column(String(100), unique=True, nullable=False)
    lastSeenAt = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(PCStatus), default=PCStatus.OFFLINE)

    sessions = relationship("Session", back_populates="pc")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    pcId = Column(String(100), ForeignKey("pcs.pcId"), nullable=False)
    userName = Column(String(100), nullable=True)
    startAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    endAt = Column(DateTime, nullable=True)
    durationSeconds = Column(Integer, nullable=True)
    paidStatus = Column(Enum(PaidStatus), default=PaidStatus.UNPAID)
    amountDue = Column(Float, nullable=True)
    amountPaid = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    pc = relationship("PC", back_populates="sessions")


class Beverage(Base):
    __tablename__ = "beverages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)  # Actual counted stock
    expectedStock = Column("expectedstock", Integer, default=0, nullable=False)  # Only this column was added manually with lowercase
    pricePerUnit = Column(Float, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

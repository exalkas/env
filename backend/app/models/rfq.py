from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base

class RFQStatus(enum.Enum):
    PENDING = "PENDING"
    QUOTED = "QUOTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    CANCELLED = "CANCELLED"

class RFQType(enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    rfq_type = Column(String, nullable=False, index=True)  # BUY or SELL
    quantity = Column(Float, nullable=False)
    requested_price = Column(Float, nullable=True)  # User's requested price (optional)
    quoted_price = Column(Float, nullable=True)  # Admin's quoted price
    total_amount = Column(Float, nullable=True)  # Final calculated amount
    status = Column(String, index=True, default="PENDING")
    notes = Column(Text, nullable=True)  # User notes/requirements
    admin_notes = Column(Text, nullable=True)  # Admin internal notes
    expires_at = Column(DateTime, nullable=True)  # Quote expiration
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    quoted_at = Column(DateTime, nullable=True)  # When admin provided quote
    executed_at = Column(DateTime, nullable=True)  # When trade was executed
    quoted_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin user ID who provided quote
    executed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin user ID who executed trade
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    asset = relationship("Asset")
    quoted_by_user = relationship("User", foreign_keys=[quoted_by])
    executed_by_user = relationship("User", foreign_keys=[executed_by]) 
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, Text, Numeric
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base

class OrderStatus(enum.Enum):
    SUBMITTED = "SUBMITTED"
    PROCESSING = "PROCESSING" 
    QUOTED = "QUOTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class OrderType(enum.Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"

class OrderSide(enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    
    # Order details
    side = Column(String, nullable=False, index=True)  # BUY or SELL
    order_type = Column(String, nullable=False, default="LIMIT")  # MARKET or LIMIT
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="MT")  # MT (metric tons), MWh, etc.
    
    # Pricing
    requested_price = Column(Float, nullable=True)  # User's desired price (for LIMIT orders)
    indicative_price = Column(Float, nullable=True)  # Platform's indicative price at time of order
    quoted_price = Column(Float, nullable=True)  # Admin's final quoted price
    markup_amount = Column(Float, nullable=True)  # Platform's markup/commission
    total_amount = Column(Float, nullable=True)  # Final calculated amount
    
    # Delivery period
    delivery_start = Column(Date, nullable=True)
    delivery_end = Column(Date, nullable=True)
    
    # EUA specific fields
    vintage_year = Column(Integer, nullable=True)  # e.g., 2024, 2025
    registry = Column(String, nullable=True)  # EU Registry, etc.
    serial_numbers = Column(Text, nullable=True)  # For settlement tracking
    
    # Order management
    status = Column(String, index=True, default="SUBMITTED")
    priority = Column(String, default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    expires_at = Column(DateTime, nullable=True)  # Order expiration
    
    # Notes and instructions
    notes = Column(Text, nullable=True)  # User notes/requirements
    admin_notes = Column(Text, nullable=True)  # Admin internal notes
    special_instructions = Column(Text, nullable=True)  # Trading instructions
    
    # External tracking
    external_trade_ref = Column(String, nullable=True)  # Reference with external provider
    settlement_ref = Column(String, nullable=True)  # Settlement tracking reference
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    quoted_at = Column(DateTime, nullable=True)  # When admin provided quote
    accepted_at = Column(DateTime, nullable=True)  # When user accepted quote
    executed_at = Column(DateTime, nullable=True)  # When trade was executed
    settled_at = Column(DateTime, nullable=True)  # When settlement completed
    
    # User tracking
    quoted_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who provided quote
    executed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who executed trade
    settled_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who completed settlement
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="orders")
    asset = relationship("Asset")
    quoted_by_user = relationship("User", foreign_keys=[quoted_by])
    executed_by_user = relationship("User", foreign_keys=[executed_by])
    settled_by_user = relationship("User", foreign_keys=[settled_by])

    @property
    def is_expired(self):
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return True
        return False
    
    @property
    def days_to_expiry(self):
        if self.expires_at:
            delta = self.expires_at - datetime.utcnow()
            return delta.days
        return None 
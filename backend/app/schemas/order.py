from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from enum import Enum

class OrderStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    PROCESSING = "PROCESSING"
    QUOTED = "QUOTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"

class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class Priority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"

class OrderBase(BaseModel):
    asset_id: int
    side: OrderSide
    order_type: OrderType = OrderType.LIMIT
    quantity: float = Field(gt=0, description="Quantity must be positive")
    unit: str = "MT"
    requested_price: Optional[float] = Field(None, ge=0, description="Price must be non-negative")
    delivery_start: Optional[date] = None
    delivery_end: Optional[date] = None
    vintage_year: Optional[int] = Field(None, ge=2020, le=2030, description="Vintage year must be between 2020-2030")
    registry: Optional[str] = None
    notes: Optional[str] = None
    special_instructions: Optional[str] = None
    expires_at: Optional[datetime] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    requested_price: Optional[float] = Field(None, ge=0)
    delivery_start: Optional[date] = None
    delivery_end: Optional[date] = None
    vintage_year: Optional[int] = Field(None, ge=2020, le=2030)
    registry: Optional[str] = None
    notes: Optional[str] = None
    special_instructions: Optional[str] = None
    expires_at: Optional[datetime] = None

class OrderQuote(BaseModel):
    quoted_price: float = Field(gt=0, description="Quoted price must be positive")
    markup_amount: Optional[float] = Field(None, ge=0, description="Markup must be non-negative")
    admin_notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    external_trade_ref: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    admin_notes: Optional[str] = None
    priority: Optional[Priority] = None

class OrderExecution(BaseModel):
    executed_price: Optional[float] = Field(None, gt=0)
    external_trade_ref: Optional[str] = None
    admin_notes: Optional[str] = None

class OrderSettlement(BaseModel):
    settlement_ref: Optional[str] = None
    serial_numbers: Optional[str] = None
    admin_notes: Optional[str] = None

class Order(OrderBase):
    id: int
    user_id: int
    indicative_price: Optional[float] = None
    quoted_price: Optional[float] = None
    markup_amount: Optional[float] = None
    total_amount: Optional[float] = None
    serial_numbers: Optional[str] = None
    status: OrderStatus
    priority: Priority = Priority.NORMAL
    admin_notes: Optional[str] = None
    external_trade_ref: Optional[str] = None
    settlement_ref: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    quoted_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    settled_at: Optional[datetime] = None
    quoted_by: Optional[int] = None
    executed_by: Optional[int] = None
    settled_by: Optional[int] = None

    class Config:
        from_attributes = True

class OrderWithDetails(Order):
    user_email: Optional[str] = None
    asset_name: Optional[str] = None
    asset_symbol: Optional[str] = None
    quoted_by_name: Optional[str] = None
    executed_by_name: Optional[str] = None
    settled_by_name: Optional[str] = None
    is_expired: Optional[bool] = None
    days_to_expiry: Optional[int] = None

class OrderResponse(BaseModel):
    orders: List[OrderWithDetails]
    total: int
    page: int
    size: int
    
class OrderStats(BaseModel):
    total_orders: int
    pending_orders: int
    quoted_orders: int
    accepted_orders: int
    executed_orders: int
    settled_orders: int
    cancelled_orders: int
    expired_orders: int
    total_volume: float
    total_value: float 
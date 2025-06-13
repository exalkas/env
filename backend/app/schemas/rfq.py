from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class RFQBase(BaseModel):
    asset_id: int
    rfq_type: str  # BUY or SELL
    quantity: float
    requested_price: Optional[float] = None
    notes: Optional[str] = None

class RFQCreate(RFQBase):
    pass

class RFQUpdate(BaseModel):
    quantity: Optional[float] = None
    requested_price: Optional[float] = None
    notes: Optional[str] = None

class RFQQuote(BaseModel):
    quoted_price: float
    admin_notes: Optional[str] = None
    expires_at: Optional[datetime] = None

class RFQStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class RFQExecution(BaseModel):
    executed_price: Optional[float] = None
    admin_notes: Optional[str] = None

class RFQ(RFQBase):
    id: int
    user_id: int
    quoted_price: Optional[float] = None
    total_amount: Optional[float] = None
    status: str
    admin_notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    quoted_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    quoted_by: Optional[int] = None
    executed_by: Optional[int] = None

    class Config:
        from_attributes = True

class RFQWithDetails(RFQ):
    user_email: Optional[str] = None
    asset_name: Optional[str] = None
    asset_symbol: Optional[str] = None

class RFQResponse(BaseModel):
    rfqs: List[RFQWithDetails]
    total: int
    page: int
    size: int 
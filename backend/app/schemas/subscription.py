from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# Shared properties
class SubscriptionBase(BaseModel):
    type: str
    start_date: datetime
    end_date: datetime
    is_active: bool = True

# Properties to receive via API on creation
class SubscriptionCreate(SubscriptionBase):
    user_id: int
    payment_id: Optional[str] = None

# Properties to receive via API on update
class SubscriptionUpdate(SubscriptionBase):
    is_active: Optional[bool] = None
    payment_id: Optional[str] = None

class SubscriptionInDBBase(SubscriptionBase):
    id: int
    user_id: int
    payment_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Properties to return via API
class Subscription(SubscriptionInDBBase):
    pass

# Properties stored in DB
class SubscriptionInDB(SubscriptionInDBBase):
    pass 
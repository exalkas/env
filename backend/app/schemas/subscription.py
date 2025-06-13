from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal

# Shared properties
class SubscriptionBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    price: Decimal
    duration_days: int = 30
    is_active: bool = True
    features: Optional[str] = None
    max_concurrent_users: int = 1

# Properties to receive via API on creation
class SubscriptionCreate(SubscriptionBase):
    pass

# Properties to receive via API on update
class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    duration_days: Optional[int] = None
    is_active: Optional[bool] = None
    features: Optional[str] = None
    max_concurrent_users: Optional[int] = None

# Properties shared by models stored in DB
class SubscriptionInDBBase(SubscriptionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return via API
class Subscription(SubscriptionInDBBase):
    pass

# Properties stored in DB
class SubscriptionInDB(SubscriptionInDBBase):
    pass 
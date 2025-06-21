from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# Asset schemas
class AssetBase(BaseModel):
    name: str
    symbol: str
    asset_type: str
    description: Optional[str] = None
    current_price: float
    requires_kyc: bool = False

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    current_price: Optional[float] = None
    is_active: Optional[bool] = None
    requires_kyc: Optional[bool] = None

class Asset(AssetBase):
    id: int
    last_updated: datetime
    is_active: bool

    class Config:
        from_attributes = True

# MarketOrder schemas (for marketplace functionality)
class MarketOrderBase(BaseModel):
    asset_id: int
    order_type: str  # BUY or SELL
    quantity: float
    price: float

class MarketOrderCreate(MarketOrderBase):
    pass

class MarketOrderUpdate(BaseModel):
    quantity: Optional[float] = None
    price: Optional[float] = None
    status: Optional[str] = None

class MarketOrder(MarketOrderBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Transaction schemas (for marketplace functionality)
class TransactionBase(BaseModel):
    order_id: int
    buyer_id: int
    seller_id: int
    asset_id: int
    quantity: float
    price: float
    total_amount: float

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Extended schemas for relationships
class AssetWithMarketOrders(Asset):
    market_orders: List[MarketOrder] = []

class MarketOrderWithTransactions(MarketOrder):
    transactions: List[Transaction] = []
    
class MarketOrderWithAsset(MarketOrder):
    asset: Asset 
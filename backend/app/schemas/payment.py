from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from app.models.payment import PaymentGatewayType, PaymentMethodType, TransactionStatus

# Base schemas
class PaymentGatewayBase(BaseModel):
    name: str
    type: PaymentGatewayType
    is_active: bool = True
    is_live: bool = False
    config: Optional[str] = None
    description: Optional[str] = None

class PaymentGatewayCreate(PaymentGatewayBase):
    pass

class PaymentGatewayUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    is_live: Optional[bool] = None
    config: Optional[str] = None
    description: Optional[str] = None

class PaymentGateway(PaymentGatewayBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Payment Method schemas
class PaymentMethodBase(BaseModel):
    name: str
    type: PaymentMethodType
    gateway_id: int
    is_active: bool = True
    is_instant: bool = True
    processing_time: Optional[str] = None
    fee_percentage: Decimal = Decimal('0')
    fee_fixed: Decimal = Decimal('0')
    currency: str = "EUR"
    description: Optional[str] = None
    icon_url: Optional[str] = None
    display_order: int = 0

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    is_instant: Optional[bool] = None
    processing_time: Optional[str] = None
    fee_percentage: Optional[Decimal] = None
    fee_fixed: Optional[Decimal] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    display_order: Optional[int] = None

class PaymentMethod(PaymentMethodBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    gateway: Optional[PaymentGateway] = None

    class Config:
        from_attributes = True

# Transaction schemas
class PaymentTransactionBase(BaseModel):
    user_id: int
    subscription_id: Optional[int] = None
    gateway_id: int
    payment_method_id: int
    amount: Decimal
    currency: str = "EUR"
    gateway_transaction_id: Optional[str] = None
    gateway_reference: Optional[str] = None
    transaction_metadata: Optional[str] = None
    notes: Optional[str] = None

class PaymentTransactionCreate(PaymentTransactionBase):
    pass

class PaymentTransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    gateway_transaction_id: Optional[str] = None
    gateway_reference: Optional[str] = None
    transaction_metadata: Optional[str] = None
    failure_reason: Optional[str] = None
    notes: Optional[str] = None
    processed_at: Optional[datetime] = None

class PaymentTransaction(PaymentTransactionBase):
    id: int
    status: TransactionStatus
    failure_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    
    # Related objects
    gateway: Optional[PaymentGateway] = None
    payment_method: Optional[PaymentMethod] = None

    class Config:
        from_attributes = True

# Bank Transfer schemas
class BankTransferDetailsBase(BaseModel):
    bank_name: str
    account_name: str
    account_number: str
    routing_number: Optional[str] = None
    iban: Optional[str] = None
    swift_code: Optional[str] = None
    is_active: bool = True
    is_primary: bool = False
    currency: str = "EUR"
    country: Optional[str] = None
    payment_instructions: Optional[str] = None
    reference_format: Optional[str] = None

class BankTransferDetailsCreate(BankTransferDetailsBase):
    pass

class BankTransferDetailsUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    routing_number: Optional[str] = None
    iban: Optional[str] = None
    swift_code: Optional[str] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None
    payment_instructions: Optional[str] = None
    reference_format: Optional[str] = None

class BankTransferDetails(BankTransferDetailsBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Combined response schemas
class PaymentMethodWithGateway(PaymentMethod):
    gateway: PaymentGateway

class TransactionWithDetails(PaymentTransaction):
    gateway: PaymentGateway
    payment_method: PaymentMethod

# Statistics schemas
class PaymentStats(BaseModel):
    total_transactions: int
    pending_transactions: int
    completed_transactions: int
    failed_transactions: int
    total_amount: Decimal
    completed_amount: Decimal
    success_rate: float

class PaymentMethodStats(BaseModel):
    payment_method: PaymentMethod
    transaction_count: int
    total_amount: Decimal
    success_rate: float

# List response schemas
class PaymentGatewayList(BaseModel):
    gateways: List[PaymentGateway]
    total: int

class PaymentMethodList(BaseModel):
    methods: List[PaymentMethodWithGateway]
    total: int

class PaymentTransactionList(BaseModel):
    transactions: List[TransactionWithDetails]
    total: int
    stats: PaymentStats

class BankTransferDetailsList(BaseModel):
    bank_details: List[BankTransferDetails]
    total: int 
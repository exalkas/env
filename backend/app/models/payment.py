from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from app.db.base_class import Base

class PaymentGatewayType(str, Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    ADYEN = "adyen"

class PaymentMethodType(str, Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    SEPA_DEBIT = "sepa_debit"
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"
    BANCONTACT = "bancontact"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentGateway(Base):
    """Payment gateway configurations (Stripe, PayPal, etc.)"""
    __tablename__ = "payment_gateways"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "Stripe", "PayPal", etc.
    type = Column(SQLEnum(PaymentGatewayType, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    is_active = Column(Boolean, default=True)
    is_live = Column(Boolean, default=False)  # Test vs Live mode
    
    # Configuration (stored as JSON-like text)
    config = Column(Text)  # API keys, webhook URLs, etc.
    
    # Metadata
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    payment_methods = relationship("PaymentMethod", back_populates="gateway")
    transactions = relationship("PaymentTransaction", back_populates="gateway")

class PaymentMethod(Base):
    """Available payment methods for users"""
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "Credit Card", "SEPA Direct Debit"
    type = Column(SQLEnum(PaymentMethodType, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    
    # Gateway relationship
    gateway_id = Column(Integer, ForeignKey("payment_gateways.id"))
    gateway = relationship("PaymentGateway", back_populates="payment_methods")
    
    # Configuration
    is_active = Column(Boolean, default=True)
    is_instant = Column(Boolean, default=True)  # Instant vs delayed processing
    processing_time = Column(String(50))  # "Instant", "1-3 days", etc.
    
    # Fees
    fee_percentage = Column(Numeric(5, 2), default=0)  # 2.9 for 2.9%
    fee_fixed = Column(Numeric(10, 2), default=0)  # 0.25 for €0.25
    currency = Column(String(3), default="EUR")
    
    # Display
    description = Column(Text)
    icon_url = Column(String(255))
    display_order = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    transactions = relationship("PaymentTransaction", back_populates="payment_method")

class PaymentTransaction(Base):
    """Payment transactions and their status"""
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    
    # User and subscription
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    
    # Payment details
    gateway_id = Column(Integer, ForeignKey("payment_gateways.id"), nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=False)
    
    # Transaction data
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="EUR")
    status = Column(SQLEnum(TransactionStatus, values_callable=lambda obj: [e.value for e in obj]), default=TransactionStatus.PENDING)
    
    # External references
    gateway_transaction_id = Column(String(255))  # Stripe payment intent ID, etc.
    gateway_reference = Column(String(255))  # External reference from gateway
    
    # Additional data
    transaction_metadata = Column(Text)  # JSON data for gateway-specific info
    failure_reason = Column(Text)
    notes = Column(Text)  # Admin notes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User")
    subscription = relationship("Subscription")
    gateway = relationship("PaymentGateway", back_populates="transactions")
    payment_method = relationship("PaymentMethod", back_populates="transactions")

class BankTransferDetails(Base):
    """Bank account details for manual transfers"""
    __tablename__ = "bank_transfer_details"

    id = Column(Integer, primary_key=True, index=True)
    
    # Bank details
    bank_name = Column(String(100), nullable=False)
    account_name = Column(String(100), nullable=False)
    account_number = Column(String(50), nullable=False)
    routing_number = Column(String(50))  # For US banks
    iban = Column(String(50))  # For EU banks
    swift_code = Column(String(20))
    
    # Display
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)
    currency = Column(String(3), default="EUR")
    country = Column(String(2))  # ISO country code
    
    # Instructions
    payment_instructions = Column(Text)
    reference_format = Column(String(100))  # How users should format reference
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 
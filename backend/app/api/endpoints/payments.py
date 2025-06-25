from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
import stripe
import os

from app import crud, models, schemas
from app.api import deps
from app.core.config import settings
from app.models.payment import PaymentGateway, PaymentMethod, PaymentTransaction, BankTransferDetails
from app.schemas.payment import (
    PaymentGatewayCreate, PaymentGatewayUpdate, PaymentGatewayList,
    PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodList,
    PaymentTransactionUpdate, PaymentTransactionList,
    BankTransferDetailsCreate, BankTransferDetailsUpdate, BankTransferDetailsList,
    PaymentStats
)

router = APIRouter()

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY or "sk_test_..."  # Use settings

# Check if we have valid Stripe keys for development mode
STRIPE_ENABLED = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_SECRET_KEY != "sk_test_...")

# ============================================================================
# PAYMENT GATEWAYS
# ============================================================================

@router.get("/gateways", response_model=PaymentGatewayList)
def get_payment_gateways(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get all payment gateways (Admin only)"""
    gateways = db.query(PaymentGateway).offset(skip).limit(limit).all()
    total = db.query(PaymentGateway).count()
    
    return PaymentGatewayList(gateways=gateways, total=total)

@router.post("/gateways", response_model=schemas.PaymentGateway)
def create_payment_gateway(
    *,
    db: Session = Depends(deps.get_db),
    gateway_in: PaymentGatewayCreate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Create new payment gateway (Admin only)"""
    gateway = PaymentGateway(**gateway_in.dict())
    db.add(gateway)
    db.commit()
    db.refresh(gateway)
    return gateway

@router.get("/gateways/{gateway_id}", response_model=schemas.PaymentGateway)
def get_payment_gateway(
    *,
    db: Session = Depends(deps.get_db),
    gateway_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get payment gateway by ID (Admin only)"""
    gateway = db.query(PaymentGateway).filter(PaymentGateway.id == gateway_id).first()
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    return gateway

@router.put("/gateways/{gateway_id}", response_model=schemas.PaymentGateway)
def update_payment_gateway(
    *,
    db: Session = Depends(deps.get_db),
    gateway_id: int,
    gateway_in: PaymentGatewayUpdate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Update payment gateway (Admin only)"""
    gateway = db.query(PaymentGateway).filter(PaymentGateway.id == gateway_id).first()
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    for field, value in gateway_in.dict(exclude_unset=True).items():
        setattr(gateway, field, value)
    
    db.commit()
    db.refresh(gateway)
    return gateway

@router.delete("/gateways/{gateway_id}")
def delete_payment_gateway(
    *,
    db: Session = Depends(deps.get_db),
    gateway_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Delete payment gateway (Admin only)"""
    gateway = db.query(PaymentGateway).filter(PaymentGateway.id == gateway_id).first()
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    # Check if gateway has associated payment methods
    methods_count = db.query(PaymentMethod).filter(PaymentMethod.gateway_id == gateway_id).count()
    if methods_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete gateway. {methods_count} payment methods are using it."
        )
    
    db.delete(gateway)
    db.commit()
    return {"message": "Payment gateway deleted successfully"}

# ============================================================================
# PAYMENT METHODS
# ============================================================================

@router.get("/methods", response_model=PaymentMethodList)
def get_payment_methods(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    gateway_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get all payment methods with filtering (Admin only)"""
    query = db.query(PaymentMethod).join(PaymentGateway)
    
    if gateway_id:
        query = query.filter(PaymentMethod.gateway_id == gateway_id)
    if is_active is not None:
        query = query.filter(PaymentMethod.is_active == is_active)
    
    query = query.order_by(PaymentMethod.display_order)
    methods = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return PaymentMethodList(methods=methods, total=total)

@router.post("/methods", response_model=schemas.PaymentMethod)
def create_payment_method(
    *,
    db: Session = Depends(deps.get_db),
    method_in: PaymentMethodCreate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Create new payment method (Admin only)"""
    # Verify gateway exists
    gateway = db.query(PaymentGateway).filter(PaymentGateway.id == method_in.gateway_id).first()
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    method = PaymentMethod(**method_in.dict())
    db.add(method)
    db.commit()
    db.refresh(method)
    return method

@router.get("/methods/{method_id}", response_model=schemas.PaymentMethod)
def get_payment_method(
    *,
    db: Session = Depends(deps.get_db),
    method_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get payment method by ID (Admin only)"""
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return method

@router.put("/methods/{method_id}", response_model=schemas.PaymentMethod)
def update_payment_method(
    *,
    db: Session = Depends(deps.get_db),
    method_id: int,
    method_in: PaymentMethodUpdate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Update payment method (Admin only)"""
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    for field, value in method_in.dict(exclude_unset=True).items():
        setattr(method, field, value)
    
    db.commit()
    db.refresh(method)
    return method

@router.delete("/methods/{method_id}")
def delete_payment_method(
    *,
    db: Session = Depends(deps.get_db),
    method_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Delete payment method (Admin only)"""
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    # Check if method has associated transactions
    transactions_count = db.query(PaymentTransaction).filter(
        PaymentTransaction.payment_method_id == method_id
    ).count()
    if transactions_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete payment method. {transactions_count} transactions are using it."
        )
    
    db.delete(method)
    db.commit()
    return {"message": "Payment method deleted successfully"}

# ============================================================================
# PAYMENT TRANSACTIONS
# ============================================================================

@router.get("/transactions", response_model=PaymentTransactionList)
def get_payment_transactions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    gateway_id: Optional[int] = Query(None),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get all payment transactions with filtering (Admin only)"""
    query = db.query(PaymentTransaction).join(PaymentGateway).join(PaymentMethod)
    
    if status:
        query = query.filter(PaymentTransaction.status == status)
    if user_id:
        query = query.filter(PaymentTransaction.user_id == user_id)
    if gateway_id:
        query = query.filter(PaymentTransaction.gateway_id == gateway_id)
    
    query = query.order_by(desc(PaymentTransaction.created_at))
    transactions = query.offset(skip).limit(limit).all()
    total = query.count()
    
    # Calculate statistics
    stats_query = db.query(PaymentTransaction)
    if status:
        stats_query = stats_query.filter(PaymentTransaction.status == status)
    if user_id:
        stats_query = stats_query.filter(PaymentTransaction.user_id == user_id)
    if gateway_id:
        stats_query = stats_query.filter(PaymentTransaction.gateway_id == gateway_id)
    
    stats = calculate_payment_stats(stats_query)
    
    return PaymentTransactionList(transactions=transactions, total=total, stats=stats)

@router.get("/transactions/{transaction_id}", response_model=schemas.PaymentTransaction)
def get_payment_transaction(
    *,
    db: Session = Depends(deps.get_db),
    transaction_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get payment transaction by ID (Admin only)"""
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.id == transaction_id
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    return transaction

@router.put("/transactions/{transaction_id}", response_model=schemas.PaymentTransaction)
def update_payment_transaction(
    *,
    db: Session = Depends(deps.get_db),
    transaction_id: int,
    transaction_in: PaymentTransactionUpdate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Update payment transaction (Admin only)"""
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.id == transaction_id
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    
    for field, value in transaction_in.dict(exclude_unset=True).items():
        setattr(transaction, field, value)
    
    db.commit()
    db.refresh(transaction)
    return transaction

# ============================================================================
# BANK TRANSFER DETAILS
# ============================================================================

@router.get("/bank-details", response_model=BankTransferDetailsList)
def get_bank_transfer_details(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = Query(None),
    currency: Optional[str] = Query(None),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get all bank transfer details (Admin only)"""
    query = db.query(BankTransferDetails)
    
    if is_active is not None:
        query = query.filter(BankTransferDetails.is_active == is_active)
    if currency:
        query = query.filter(BankTransferDetails.currency == currency)
    
    bank_details = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return BankTransferDetailsList(bank_details=bank_details, total=total)

@router.post("/bank-details", response_model=schemas.BankTransferDetails)
def create_bank_transfer_details(
    *,
    db: Session = Depends(deps.get_db),
    bank_details_in: BankTransferDetailsCreate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Create new bank transfer details (Admin only)"""
    # If setting as primary, unset other primary accounts
    if bank_details_in.is_primary:
        db.query(BankTransferDetails).filter(
            BankTransferDetails.currency == bank_details_in.currency
        ).update({"is_primary": False})
    
    bank_details = BankTransferDetails(**bank_details_in.dict())
    db.add(bank_details)
    db.commit()
    db.refresh(bank_details)
    return bank_details

@router.put("/bank-details/{details_id}", response_model=schemas.BankTransferDetails)
def update_bank_transfer_details(
    *,
    db: Session = Depends(deps.get_db),
    details_id: int,
    bank_details_in: BankTransferDetailsUpdate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Update bank transfer details (Admin only)"""
    bank_details = db.query(BankTransferDetails).filter(
        BankTransferDetails.id == details_id
    ).first()
    if not bank_details:
        raise HTTPException(status_code=404, detail="Bank transfer details not found")
    
    # If setting as primary, unset other primary accounts in same currency
    if bank_details_in.is_primary:
        db.query(BankTransferDetails).filter(
            and_(
                BankTransferDetails.currency == bank_details.currency,
                BankTransferDetails.id != details_id
            )
        ).update({"is_primary": False})
    
    for field, value in bank_details_in.dict(exclude_unset=True).items():
        setattr(bank_details, field, value)
    
    db.commit()
    db.refresh(bank_details)
    return bank_details

@router.delete("/bank-details/{details_id}")
def delete_bank_transfer_details(
    *,
    db: Session = Depends(deps.get_db),
    details_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Delete bank transfer details (Admin only)"""
    bank_details = db.query(BankTransferDetails).filter(
        BankTransferDetails.id == details_id
    ).first()
    if not bank_details:
        raise HTTPException(status_code=404, detail="Bank transfer details not found")
    
    db.delete(bank_details)
    db.commit()
    return {"message": "Bank transfer details deleted successfully"}

# ============================================================================
# STATISTICS
# ============================================================================

@router.get("/stats", response_model=PaymentStats)
def get_payment_statistics(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get payment statistics (Admin only)"""
    query = db.query(PaymentTransaction)
    return calculate_payment_stats(query)

# ============================================================================
# CLIENT-FACING ENDPOINTS (Non-admin users)
# ============================================================================

@router.get("/methods/available", response_model=PaymentMethodList)
def get_available_payment_methods_for_clients(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get available payment methods for clients"""
    methods = db.query(PaymentMethod).join(PaymentGateway).filter(
        and_(
            PaymentMethod.is_active == True,
            PaymentGateway.is_active == True
        )
    ).order_by(PaymentMethod.display_order).all()
    
    return PaymentMethodList(methods=methods, total=len(methods))

@router.post("/create-intent")
def create_payment_intent(
    *,
    db: Session = Depends(deps.get_db),
    amount: float,
    currency: str = "EUR",
    payment_method_id: int,
    subscription_id: Optional[int] = None,
    return_url: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Create a payment intent for Stripe or other payment processors"""
    
    # Verify payment method exists and is active
    method = db.query(PaymentMethod).join(PaymentGateway).filter(
        and_(
            PaymentMethod.id == payment_method_id,
            PaymentMethod.is_active == True,
            PaymentGateway.is_active == True
        )
    ).first()
    
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found or inactive")
    
        # Check if this is a Stripe payment method
    if method.gateway and method.gateway.type == "stripe":
        if STRIPE_ENABLED:
            try:
                # Create real Stripe payment intent
                stripe_intent = stripe.PaymentIntent.create(
                    amount=int(amount * 100),  # Convert to cents
                    currency=currency.lower(),
                    metadata={
                        "user_id": str(current_user.id),
                        "payment_method_id": str(payment_method_id),
                        "subscription_id": str(subscription_id) if subscription_id else None,
                        "user_email": current_user.email
                    },
                    automatic_payment_methods={"enabled": True}
                )
                
                # Create transaction record
                transaction = PaymentTransaction(
                    user_id=current_user.id,
                    amount=amount,
                    currency=currency.upper(),
                    status="pending",
                    gateway_id=method.gateway_id,
                    payment_method_id=payment_method_id,
                    subscription_id=subscription_id,
                    gateway_transaction_id=stripe_intent.id,
                    transaction_metadata=f'{{"stripe_client_secret": "{stripe_intent.client_secret}", "created_via": "payment_intent_api"}}'
                )
                db.add(transaction)
                db.commit()
                db.refresh(transaction)
                
                return {
                    "id": stripe_intent.id,
                    "client_secret": stripe_intent.client_secret,
                    "amount": amount,
                    "currency": currency,
                    "status": stripe_intent.status,
                    "payment_method_id": payment_method_id,
                    "subscription_id": subscription_id,
                    "transaction_id": transaction.id
                }
                
            except stripe.error.StripeError as e:
                raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Payment intent creation failed: {str(e)}")
        else:
            raise HTTPException(status_code=500, detail="Stripe not configured. Please configure Stripe keys.")
    
    else:
        raise HTTPException(status_code=501, detail="Only Stripe payments are currently supported")

@router.post("/confirm/{payment_intent_id}")
def confirm_payment(
    *,
    db: Session = Depends(deps.get_db),
    payment_intent_id: str,
    payment_method_id: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Confirm a payment intent"""
    
    # Find the transaction record
    transaction = db.query(PaymentTransaction).filter(
        and_(
            PaymentTransaction.gateway_transaction_id == payment_intent_id,
            PaymentTransaction.user_id == current_user.id
        )
    ).first()
    
    if not transaction:
        # Check if this is a Stripe payment intent
        if payment_intent_id.startswith("pi_"):
            try:
                # Retrieve payment intent from Stripe
                stripe_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                
                return {
                    "success": stripe_intent.status == "succeeded",
                    "payment_intent": {
                        "id": stripe_intent.id,
                        "status": stripe_intent.status,
                        "amount": stripe_intent.amount,
                        "currency": stripe_intent.currency,
                    }
                }
            except stripe.error.StripeError as e:
                raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        else:
            raise HTTPException(status_code=404, detail="Payment intent not found")
    
    # If we have a transaction record, check Stripe status
    try:
        if transaction.gateway_transaction_id:
            stripe_intent = stripe.PaymentIntent.retrieve(transaction.gateway_transaction_id)
            
            # Update transaction status based on Stripe status
            if stripe_intent.status == "succeeded":
                transaction.status = "completed"
                transaction.processed_at = func.now()
            elif stripe_intent.status == "canceled":
                transaction.status = "failed"
            elif stripe_intent.status in ["requires_payment_method", "requires_confirmation"]:
                transaction.status = "pending"
            
            db.commit()
            
            return {
                "success": stripe_intent.status == "succeeded",
                "payment_intent": {
                    "id": stripe_intent.id,
                    "status": stripe_intent.status,
                    "amount": stripe_intent.amount,
                    "currency": stripe_intent.currency,
                },
                "transaction": {
                    "id": transaction.id,
                    "status": transaction.status,
                    "amount": transaction.amount,
                    "currency": transaction.currency
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid payment intent - no Stripe transaction ID")
            
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment confirmation failed: {str(e)}")

@router.get("/bank-transfer-details")
def get_bank_transfer_details_for_clients(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get bank transfer details for clients"""
    
    # Get the first active bank transfer details
    bank_details = db.query(BankTransferDetails).filter(
        BankTransferDetails.is_active == True
    ).first()
    
    if not bank_details:
        raise HTTPException(status_code=404, detail="Bank transfer details not available")
    
    return {
        "bank_name": bank_details.bank_name,
        "account_name": bank_details.account_name,
        "iban": bank_details.iban,
        "swift_code": bank_details.swift_code,
        "payment_instructions": bank_details.payment_instructions,
        "reference_format": bank_details.reference_format,
    }

@router.post("/bank-transfer-notify")
def notify_bank_transfer(
    *,
    db: Session = Depends(deps.get_db),
    amount: float,
    reference: str,
    transfer_date: str,
    subscription_id: Optional[int] = None,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Notify about a bank transfer made by the client"""
    
    # Create a pending transaction record
    transaction = PaymentTransaction(
        user_id=current_user.id,
        amount=amount,
        currency="EUR",
        status="pending",
        payment_method_id=None,  # Will be set when admin processes
        subscription_id=subscription_id,
        transaction_metadata={
            "transfer_reference": reference,
            "transfer_date": transfer_date,
            "notification_date": func.now(),
            "type": "bank_transfer_notification"
        }
    )
    
    db.add(transaction)
    db.commit()
    
    return {"message": "Bank transfer notification received successfully"}

@router.get("/history")
def get_user_payment_history(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get payment history for the current user"""
    
    query = db.query(PaymentTransaction).filter(
        PaymentTransaction.user_id == current_user.id
    )
    
    if status:
        query = query.filter(PaymentTransaction.status == status)
    
    query = query.order_by(desc(PaymentTransaction.created_at))
    transactions = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "transactions": transactions,
        "total": total
    }

@router.post("/stripe-webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Handle Stripe webhook events"""
    
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        
        # Handle the event
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            
            # Find the transaction in our database
            transaction = db.query(PaymentTransaction).filter(
                PaymentTransaction.gateway_transaction_id == payment_intent["id"]
            ).first()
            
            if transaction:
                # Update transaction status
                transaction.status = "completed"
                transaction.processed_at = func.now()
                transaction.notes = "Payment completed via Stripe webhook"
                
                db.commit()
                
                print(f"Payment {payment_intent['id']} marked as completed")
                
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            
            # Find the transaction in our database
            transaction = db.query(PaymentTransaction).filter(
                PaymentTransaction.gateway_transaction_id == payment_intent["id"]
            ).first()
            
            if transaction:
                # Update transaction status
                transaction.status = "failed"
                transaction.failure_reason = payment_intent.get("last_payment_error", {}).get("message", "Payment failed")
                transaction.notes = "Payment failed via Stripe webhook"
                
                db.commit()
                
                print(f"Payment {payment_intent['id']} marked as failed")
                
        elif event["type"] == "payment_intent.canceled":
            payment_intent = event["data"]["object"]
            
            # Find the transaction in our database
            transaction = db.query(PaymentTransaction).filter(
                PaymentTransaction.gateway_transaction_id == payment_intent["id"]
            ).first()
            
            if transaction:
                # Update transaction status
                transaction.status = "cancelled"
                transaction.notes = "Payment cancelled via Stripe webhook"
                
                db.commit()
                
                print(f"Payment {payment_intent['id']} marked as cancelled")
        
        else:
            print(f"Unhandled event type: {event['type']}")
        
        return {"received": True}
        
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_payment_stats(query) -> PaymentStats:
    """Calculate payment statistics from query"""
    all_transactions = query.all()
    
    total_transactions = len(all_transactions)
    pending_transactions = len([t for t in all_transactions if t.status == "pending"])
    completed_transactions = len([t for t in all_transactions if t.status == "completed"])
    failed_transactions = len([t for t in all_transactions if t.status == "failed"])
    
    total_amount = sum(t.amount for t in all_transactions)
    completed_amount = sum(t.amount for t in all_transactions if t.status == "completed")
    
    success_rate = (completed_transactions / total_transactions * 100) if total_transactions > 0 else 0
    
    return PaymentStats(
        total_transactions=total_transactions,
        pending_transactions=pending_transactions,
        completed_transactions=completed_transactions,
        failed_transactions=failed_transactions,
        total_amount=total_amount,
        completed_amount=completed_amount,
        success_rate=round(success_rate, 2)
    ) 
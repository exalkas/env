from datetime import datetime, timedelta
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.crud import subscription as crud_subscription
from app.db.session import get_db

router = APIRouter()

@router.get("/public", response_model=List[schemas.Subscription])
def read_public_subscriptions(
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve active subscription plans for public viewing.
    No authentication required.
    """
    subscriptions = crud_subscription.subscription.get_active(db)
    return subscriptions

@router.get("/", response_model=List[schemas.Subscription])
def read_subscriptions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Retrieve subscriptions. Admin only.
    """
    subscriptions = crud_subscription.subscription.get_multi(db, skip=skip, limit=limit)
    return subscriptions

@router.get("/active", response_model=List[schemas.Subscription])
def read_active_subscriptions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Retrieve active subscriptions. Admin only.
    """
    subscriptions = crud_subscription.subscription.get_active(db)
    return subscriptions

@router.post("/", response_model=schemas.Subscription)
def create_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_in: schemas.SubscriptionCreate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Create new subscription. Admin only.
    """
    # Check if subscription with this name already exists
    subscription = crud_subscription.subscription.get_by_name(db, name=subscription_in.name)
    if subscription:
        raise HTTPException(
            status_code=400,
            detail="The subscription with this name already exists in the system.",
        )
    
    subscription = crud_subscription.subscription.create(db, obj_in=subscription_in)
    return subscription

@router.get("/{subscription_id}", response_model=schemas.Subscription)
def read_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Get subscription by ID. Admin only.
    """
    subscription = crud_subscription.subscription.get(db, id=subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription

@router.put("/{subscription_id}", response_model=schemas.Subscription)
def update_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_id: int,
    subscription_in: schemas.SubscriptionUpdate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Update subscription. Admin only.
    """
    subscription = crud_subscription.subscription.get(db, id=subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Check if name is being changed and if it conflicts
    if subscription_in.name and subscription_in.name != subscription.name:
        existing = crud_subscription.subscription.get_by_name(db, name=subscription_in.name)
        if existing:
            raise HTTPException(
                status_code=400,
                detail="The subscription with this name already exists in the system.",
            )
    
    subscription = crud_subscription.subscription.update(db, db_obj=subscription, obj_in=subscription_in)
    return subscription

@router.delete("/{subscription_id}", response_model=dict)
def delete_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Delete subscription. Admin only.
    """
    subscription = crud_subscription.subscription.get(db, id=subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Check if any users are using this subscription
    users_count = db.query(models.User).filter(models.User.subscription_type == subscription.name).count()
    if users_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete subscription. {users_count} users are currently using this subscription type.",
        )
    
    crud_subscription.subscription.remove(db, id=subscription_id)
    return {"message": f"Subscription {subscription.display_name} deleted successfully"}

@router.post("/trial", response_model=schemas.Subscription)
def create_trial_subscription(
    *,
    db: Session = Depends(get_db),
    user_id: int,
) -> Any:
    """
    Create a 7-day trial subscription for a user.
    """
    # Check if user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Check if user already has a trial
    existing_trial = db.query(models.Subscription).filter(
        models.Subscription.user_id == user_id,
        models.Subscription.type == "trial"
    ).first()
    
    if existing_trial:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a trial subscription",
        )
    
    # Create trial subscription
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=7)
    
    subscription = models.Subscription(
        user_id=user_id,
        type="trial",
        start_date=start_date,
        end_date=end_date,
        is_active=True,
    )
    db.add(subscription)
    
    # Update user subscription information
    user.subscription_type = "trial"
    user.subscription_end_date = end_date
    
    db.commit()
    db.refresh(subscription)
    return subscription

# ============================================================================
# CLIENT-FACING SUBSCRIPTION ENDPOINTS
# ============================================================================

@router.get("/available", response_model=List[schemas.Subscription])
def get_available_subscriptions_for_clients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get available subscription plans for clients"""
    subscriptions = crud_subscription.subscription.get_active(db)
    return subscriptions

@router.get("/current")
def get_current_user_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get current user's subscription details"""
    
    # For demo purposes, return mock subscription data
    # In production, you would query the user's actual subscription
    if current_user.subscription_type and current_user.subscription_type != "free":
        # Find the subscription plan
        subscription_plan = crud_subscription.subscription.get_by_name(
            db, name=current_user.subscription_type
        )
        
        if subscription_plan:
            return {
                "id": 1,  # Mock user subscription ID
                "user_id": current_user.id,
                "subscription_id": subscription_plan.id,
                "status": "active",
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
                "auto_renew": True,
                "subscription": subscription_plan
            }
    
    return None

@router.post("/upgrade")
def upgrade_user_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_id: int,
    payment_method_id: int,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Upgrade user's subscription after successful payment"""
    
    # Get the subscription plan
    subscription_plan = crud_subscription.subscription.get(db, id=subscription_id)
    if not subscription_plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    
    if not subscription_plan.is_active:
        raise HTTPException(status_code=400, detail="Subscription plan is not active")
    
    # Verify that there's a successful payment for this subscription
    from app.models.payment import PaymentTransaction, PaymentMethod
    
    # Find the most recent successful transaction for this subscription and user
    successful_transaction = db.query(PaymentTransaction).filter(
        and_(
            PaymentTransaction.user_id == current_user.id,
            PaymentTransaction.subscription_id == subscription_id,
            PaymentTransaction.payment_method_id == payment_method_id,
            PaymentTransaction.status == "completed"
        )
    ).order_by(PaymentTransaction.created_at.desc()).first()
    
    if not successful_transaction:
        # Check for pending transactions that might have succeeded
        pending_transaction = db.query(PaymentTransaction).filter(
            and_(
                PaymentTransaction.user_id == current_user.id,
                PaymentTransaction.subscription_id == subscription_id,
                PaymentTransaction.payment_method_id == payment_method_id,
                PaymentTransaction.status == "pending"
            )
        ).order_by(PaymentTransaction.created_at.desc()).first()
        
        if pending_transaction:
            # For bank transfers, allow upgrade with pending status
            payment_method = db.query(PaymentMethod).filter(PaymentMethod.id == payment_method_id).first()
            if payment_method and payment_method.type != "bank_transfer":
                raise HTTPException(
                    status_code=400, 
                    detail="No successful payment found for this subscription upgrade"
                )
        else:
            raise HTTPException(
                status_code=400, 
                detail="No payment found for this subscription upgrade"
            )
    
    # Update user subscription
    current_user.subscription_type = subscription_plan.name
    
    # Calculate subscription end date
    start_date = datetime.utcnow()
    if hasattr(subscription_plan, 'duration_months') and subscription_plan.duration_months:
        # Calculate months properly
        end_date = start_date + timedelta(days=subscription_plan.duration_months * 30)
    elif hasattr(subscription_plan, 'duration_days') and subscription_plan.duration_days:
        end_date = start_date + timedelta(days=subscription_plan.duration_days)
    else:
        # Default to 1 month
        end_date = start_date + timedelta(days=30)
    
    current_user.subscription_end_date = end_date
    
    # Update transaction with subscription details if needed
    if successful_transaction:
        successful_transaction.notes = f"Subscription upgraded to {subscription_plan.name}"
    elif pending_transaction:
        pending_transaction.notes = f"Subscription upgrade pending for {subscription_plan.name}"
    
    db.commit()
    
    # Return response with actual subscription details
    return {
        "subscription": {
            "id": current_user.id,  # Using user ID as subscription ID for simplicity
            "user_id": current_user.id,
            "subscription_id": subscription_plan.id,
            "status": "active" if successful_transaction else "pending",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "auto_renew": True,
            "subscription": subscription_plan
        },
        "payment_status": "completed" if successful_transaction else "pending"
    }

@router.post("/cancel")
def cancel_user_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Cancel user's subscription"""
    
    if not current_user.subscription_type or current_user.subscription_type == "free":
        raise HTTPException(status_code=400, detail="No active subscription to cancel")
    
    # For demo purposes, simulate cancellation
    # In production, you would:
    # 1. Cancel recurring payments
    # 2. Set subscription to cancel at period end
    # 3. Send confirmation email
    
    # For now, we'll just mark it as cancelled at the end date
    # In a real system, you'd typically let it run until the end of the billing period
    
    return {"message": "Subscription will be cancelled at the end of the current billing period"} 
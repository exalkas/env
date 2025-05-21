from datetime import datetime, timedelta
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Subscription])
def read_subscriptions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve subscriptions.
    """
    subscriptions = db.query(models.Subscription).offset(skip).limit(limit).all()
    return subscriptions

@router.get("/{subscription_id}", response_model=schemas.Subscription)
def read_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_id: int,
) -> Any:
    """
    Get subscription by ID.
    """
    subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    return subscription

@router.post("/", response_model=schemas.Subscription)
def create_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_in: schemas.SubscriptionCreate,
) -> Any:
    """
    Create new subscription.
    """
    # Check if user exists
    user = db.query(models.User).filter(models.User.id == subscription_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Create subscription
    subscription = models.Subscription(
        user_id=subscription_in.user_id,
        type=subscription_in.type,
        start_date=subscription_in.start_date,
        end_date=subscription_in.end_date,
        is_active=subscription_in.is_active,
        payment_id=subscription_in.payment_id,
    )
    db.add(subscription)
    
    # Update user subscription information
    user.subscription_type = subscription_in.type
    user.subscription_end_date = subscription_in.end_date
    
    db.commit()
    db.refresh(subscription)
    return subscription

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
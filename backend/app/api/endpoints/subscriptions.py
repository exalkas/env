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
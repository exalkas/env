from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.core.matching_engine import match_orders

router = APIRouter()

# Asset endpoints
@router.get("/assets/", response_model=List[schemas.market.Asset])
def get_assets(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Retrieve all assets.
    """
    assets = db.query(models.market.Asset).filter(models.market.Asset.is_active == True).offset(skip).limit(limit).all()
    return assets

@router.get("/assets/admin/", response_model=List[schemas.market.Asset])
def get_assets_admin(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_admin),
):
    """
    Retrieve all assets for admin (including inactive).
    """
    assets = db.query(models.market.Asset).offset(skip).limit(limit).all()
    return assets

@router.get("/assets/{asset_id}", response_model=schemas.market.Asset)
def get_asset(
    asset_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Get asset by ID.
    """
    asset = db.query(models.market.Asset).filter(models.market.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.post("/assets/", response_model=schemas.market.Asset, status_code=201)
def create_asset(
    asset_in: schemas.market.AssetCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_admin),
):
    """
    Create new asset (admin only).
    """
    asset = models.market.Asset(
        name=asset_in.name,
        symbol=asset_in.symbol,
        asset_type=asset_in.asset_type,
        description=asset_in.description,
        current_price=asset_in.current_price,
        requires_kyc=asset_in.requires_kyc,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@router.put("/assets/{asset_id}", response_model=schemas.market.Asset)
def update_asset(
    asset_id: int,
    asset_in: schemas.market.AssetUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_admin),
):
    """
    Update asset (admin only).
    """
    asset = db.query(models.market.Asset).filter(models.market.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
    
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

# Order endpoints
@router.post("/orders/", response_model=schemas.market.MarketOrder, status_code=201)
def create_order(
    order_in: schemas.market.MarketOrderCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Create a new order.
    """
    # Check subscription type - Trial users can't place orders
    if current_user.subscription_type == "trial":
        raise HTTPException(
            status_code=403,
            detail="Trial users cannot place orders. Please upgrade to a standard subscription."
        )
    
    # Get the asset
    asset = db.query(models.market.Asset).filter(models.market.Asset.id == order_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check if KYC is required but not verified
    if asset.requires_kyc and not current_user.kyc_verified:
        raise HTTPException(
            status_code=403,
            detail="KYC verification required to trade this asset."
        )
    
    # Create the order
    order = models.market.MarketOrder(
        user_id=current_user.id,
        asset_id=order_in.asset_id,
        order_type=order_in.order_type,
        quantity=order_in.quantity,
        price=order_in.price,
        status="OPEN"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Try to match the order with existing orders
    matched_transaction = match_orders(db, order)
    if matched_transaction:
        return db.query(models.market.MarketOrder).filter(models.market.MarketOrder.id == order.id).first()
    
    return order

@router.get("/orders/", response_model=List[schemas.market.MarketOrder])
def get_orders(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    status: Optional[str] = None,
):
    """
    Get all orders for the current user.
    """
    query = db.query(models.market.MarketOrder).filter(models.market.MarketOrder.user_id == current_user.id)
    
    if status:
        query = query.filter(models.market.MarketOrder.status == status)
        
    orders = query.offset(skip).limit(limit).all()
    return orders

@router.get("/orders/{order_id}", response_model=schemas.market.MarketOrderWithTransactions)
def get_order(
    order_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Get specific order by ID.
    """
    order = db.query(models.market.MarketOrder).filter(
        models.market.MarketOrder.id == order_id,
        models.market.MarketOrder.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@router.put("/orders/{order_id}/cancel", response_model=schemas.market.MarketOrder)
def cancel_order(
    order_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Cancel an order.
    """
    order = db.query(models.market.MarketOrder).filter(
        models.market.MarketOrder.id == order_id,
        models.market.MarketOrder.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "OPEN":
        raise HTTPException(status_code=400, detail="Cannot cancel an order that is not open")
    
    order.status = "CANCELLED"
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return order

# Market data endpoints
@router.get("/market/orderbook/{asset_id}")
def get_orderbook(
    asset_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Get order book for a specific asset.
    """
    # Check if asset exists
    asset = db.query(models.market.Asset).filter(models.market.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Get all open buy orders sorted by price (highest first)
    buy_orders = db.query(models.market.MarketOrder).filter(
        models.market.MarketOrder.asset_id == asset_id,
        models.market.MarketOrder.order_type == "BUY",
        models.market.MarketOrder.status == "OPEN"
    ).order_by(models.market.MarketOrder.price.desc()).all()
    
    # Get all open sell orders sorted by price (lowest first)
    sell_orders = db.query(models.market.MarketOrder).filter(
        models.market.MarketOrder.asset_id == asset_id,
        models.market.MarketOrder.order_type == "SELL",
        models.market.MarketOrder.status == "OPEN"
    ).order_by(models.market.MarketOrder.price.asc()).all()
    
    return {
        "asset": {
            "id": asset.id,
            "name": asset.name,
            "symbol": asset.symbol,
            "current_price": asset.current_price
        },
        "buy_orders": [
            {
                "price": order.price,
                "quantity": order.quantity,
                "created_at": order.created_at
            } for order in buy_orders
        ],
        "sell_orders": [
            {
                "price": order.price,
                "quantity": order.quantity,
                "created_at": order.created_at
            } for order in sell_orders
        ]
    }

# Transaction endpoints
@router.get("/transactions/", response_model=List[schemas.market.Transaction])
def get_transactions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Get all transactions for the current user.
    """
    transactions = db.query(models.market.Transaction).filter(
        (models.market.Transaction.buyer_id == current_user.id) | 
        (models.market.Transaction.seller_id == current_user.id)
    ).offset(skip).limit(limit).all()
    
    return transactions

@router.get("/transactions/stats")
def get_transaction_stats(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_admin),
):
    """
    Get transaction statistics (admin only).
    """
    from sqlalchemy import func
    
    # Get total transaction count
    total_transactions = db.query(models.market.Transaction).count()
    
    # Get total volume
    total_volume = db.query(func.sum(models.market.Transaction.total_amount)).scalar() or 0
    
    # Get today's transactions
    from datetime import datetime, timedelta
    today = datetime.utcnow().date()
    today_transactions = db.query(models.market.Transaction).filter(
        func.date(models.market.Transaction.timestamp) == today
    ).count()
    
    # Get this month's volume
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_volume = db.query(func.sum(models.market.Transaction.total_amount)).filter(
        models.market.Transaction.timestamp >= month_start
    ).scalar() or 0
    
    return {
        "total_transactions": total_transactions,
        "total_volume": float(total_volume),
        "today_transactions": today_transactions,
        "month_volume": float(month_volume)
    }

@router.get("/transactions/recent")
def get_recent_transactions(
    limit: int = 5,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_admin),
):
    """
    Get recent transactions (admin only).
    """
    transactions = db.query(models.market.Transaction).order_by(
        models.market.Transaction.timestamp.desc()
    ).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "timestamp": t.timestamp,
            "buyer_id": t.buyer_id,
            "seller_id": t.seller_id,
            "asset_id": t.asset_id,
            "quantity": t.quantity,
            "price": t.price,
            "total_amount": t.total_amount
        } for t in transactions
    ] 
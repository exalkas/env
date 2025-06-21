from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.api.deps import get_current_user, get_db, get_current_admin_user
from app.core.permissions import require_order_read, require_order_create, require_order_update, require_order_quote, require_order_manage
from app.models.order import Order
from app.models.market import Asset
from app.models.user import User
from app.schemas import order as order_schemas
from app.services.pricing_service import pricing_service

router = APIRouter()

@router.post("/", response_model=order_schemas.Order)
def create_order(
    order_data: order_schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new order"""
    # Verify asset exists
    asset = db.query(Asset).filter(Asset.id == order_data.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Get indicative price
    indicative_price = None
    if asset.symbol:
        # For now, use synchronous calculation - can be made async later
        market_price = 85.0  # Mock price, replace with real API call
        price_info = pricing_service.calculate_indicative_price(
            asset.symbol, 
            order_data.side, 
            market_price,
            order_data.quantity
        )
        if price_info:
            indicative_price = price_info["indicative_price"]
    
    order = Order(
        **order_data.dict(), 
        user_id=current_user.id,
        indicative_price=indicative_price
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return order

@router.get("/", response_model=order_schemas.OrderResponse)
def get_user_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
    side: Optional[str] = Query(None),
    asset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get orders for the current user"""
    query = db.query(Order).filter(Order.user_id == current_user.id)
    
    if status:
        query = query.filter(Order.status == status)
    if side:
        query = query.filter(Order.side == side)
    if asset_id:
        query = query.filter(Order.asset_id == asset_id)
    
    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    # Add asset details
    orders_with_details = []
    for order in orders:
        order_dict = order.__dict__.copy()
        if order.asset:
            order_dict['asset_name'] = order.asset.name
            order_dict['asset_symbol'] = order.asset.symbol
        orders_with_details.append(order_schemas.OrderWithDetails(**order_dict))
    
    return order_schemas.OrderResponse(
        orders=orders_with_details,
        total=total,
        page=skip // limit + 1,
        size=limit
    )

@router.get("/{order_id}", response_model=order_schemas.OrderWithDetails)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific order"""
    order = db.query(Order).filter(
        and_(Order.id == order_id, Order.user_id == current_user.id)
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_dict = order.__dict__.copy()
    if order.asset:
        order_dict['asset_name'] = order.asset.name
        order_dict['asset_symbol'] = order.asset.symbol
    
    return order_schemas.OrderWithDetails(**order_dict)

@router.patch("/{order_id}", response_model=order_schemas.Order)
def update_order(
    order_id: int,
    order_update: order_schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an order (only allowed for SUBMITTED orders)"""
    order = db.query(Order).filter(
        and_(Order.id == order_id, Order.user_id == current_user.id)
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "SUBMITTED":
        raise HTTPException(status_code=400, detail="Cannot modify order after processing has begun")
    
    for field, value in order_update.dict(exclude_unset=True).items():
        setattr(order, field, value)
    
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    
    return order

@router.patch("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an order"""
    order = db.query(Order).filter(
        and_(Order.id == order_id, Order.user_id == current_user.id)
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status in ["EXECUTED", "SETTLED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Cannot cancel order in current status")
    
    order.status = "CANCELLED"
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Order cancelled successfully"}

@router.patch("/{order_id}/accept")
def accept_quote(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a quote for an order"""
    order = db.query(Order).filter(
        and_(Order.id == order_id, Order.user_id == current_user.id)
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "QUOTED":
        raise HTTPException(status_code=400, detail="Order must be quoted to accept")
    
    if order.is_expired:
        raise HTTPException(status_code=400, detail="Quote has expired")
    
    order.status = "ACCEPTED"
    order.accepted_at = datetime.utcnow()
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Quote accepted successfully"}

@router.patch("/{order_id}/reject")
def reject_quote(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a quote for an order"""
    order = db.query(Order).filter(
        and_(Order.id == order_id, Order.user_id == current_user.id)
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "QUOTED":
        raise HTTPException(status_code=400, detail="Order must be quoted to reject")
    
    order.status = "REJECTED"
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Quote rejected"}

# Admin endpoints
@router.get("/admin/all", response_model=order_schemas.OrderResponse)
def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
    side: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    asset_id: Optional[int] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_order_read)
):
    """Get all orders (admin only)"""
    query = db.query(Order).join(User, Order.user_id == User.id).join(Asset)
    
    if status:
        query = query.filter(Order.status == status)
    if side:
        query = query.filter(Order.side == side)
    if user_id:
        query = query.filter(Order.user_id == user_id)
    if asset_id:
        query = query.filter(Order.asset_id == asset_id)
    if priority:
        query = query.filter(Order.priority == priority)
    
    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    # Add detailed information
    orders_with_details = []
    for order in orders:
        order_dict = order.__dict__.copy()
        order_dict['user_email'] = order.user.email
        order_dict['asset_name'] = order.asset.name
        order_dict['asset_symbol'] = order.asset.symbol
        order_dict['is_expired'] = order.is_expired
        order_dict['days_to_expiry'] = order.days_to_expiry
        
        if order.quoted_by_user:
            order_dict['quoted_by_name'] = order.quoted_by_user.full_name or order.quoted_by_user.email
        if order.executed_by_user:
            order_dict['executed_by_name'] = order.executed_by_user.full_name or order.executed_by_user.email
        if order.settled_by_user:
            order_dict['settled_by_name'] = order.settled_by_user.full_name or order.settled_by_user.email
            
        orders_with_details.append(order_schemas.OrderWithDetails(**order_dict))
    
    return order_schemas.OrderResponse(
        orders=orders_with_details,
        total=total,
        page=skip // limit + 1,
        size=limit
    )

@router.get("/admin/stats", response_model=order_schemas.OrderStats)
def get_order_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_order_read)
):
    """Get order statistics (admin only)"""
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == "SUBMITTED").count()
    quoted_orders = db.query(Order).filter(Order.status == "QUOTED").count()
    accepted_orders = db.query(Order).filter(Order.status == "ACCEPTED").count()
    executed_orders = db.query(Order).filter(Order.status == "EXECUTED").count()
    settled_orders = db.query(Order).filter(Order.status == "SETTLED").count()
    cancelled_orders = db.query(Order).filter(Order.status == "CANCELLED").count()
    expired_orders = db.query(Order).filter(Order.status == "EXPIRED").count()
    
    # Calculate totals
    total_volume = db.query(Order).with_entities(
        Order.quantity
    ).filter(Order.status.in_(["EXECUTED", "SETTLED"])).all()
    total_volume = sum([q[0] for q in total_volume]) if total_volume else 0.0
    
    total_value = db.query(Order).with_entities(
        Order.total_amount
    ).filter(Order.status.in_(["EXECUTED", "SETTLED"])).all()
    total_value = sum([v[0] for v in total_value if v[0]]) if total_value else 0.0
    
    return order_schemas.OrderStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        quoted_orders=quoted_orders,
        accepted_orders=accepted_orders,
        executed_orders=executed_orders,
        settled_orders=settled_orders,
        cancelled_orders=cancelled_orders,
        expired_orders=expired_orders,
        total_volume=total_volume,
        total_value=total_value
    )

@router.patch("/admin/{order_id}/quote", response_model=order_schemas.Order)
def provide_quote(
    order_id: int,
    quote_data: order_schemas.OrderQuote,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_order_quote)
):
    """Provide a quote for an order (admin only)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status not in ["SUBMITTED", "PROCESSING"]:
        raise HTTPException(status_code=400, detail="Order is not in a quotable status")
    
    order.quoted_price = quote_data.quoted_price
    order.markup_amount = quote_data.markup_amount
    order.total_amount = quote_data.quoted_price * order.quantity
    order.admin_notes = quote_data.admin_notes
    order.expires_at = quote_data.expires_at
    order.external_trade_ref = quote_data.external_trade_ref
    order.status = "QUOTED"
    order.quoted_at = datetime.utcnow()
    order.quoted_by = current_user.id
    order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order

@router.patch("/admin/{order_id}/status", response_model=order_schemas.Order)
def update_order_status(
    order_id: int,
    status_update: order_schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_order_update)
):
    """Update order status (admin only)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status_update.status
    if status_update.admin_notes:
        order.admin_notes = status_update.admin_notes
    if status_update.priority:
        order.priority = status_update.priority
    order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order

@router.patch("/admin/{order_id}/execute", response_model=order_schemas.Order)
def execute_order(
    order_id: int,
    execution_data: order_schemas.OrderExecution,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_order_manage)
):
    """Execute an order (admin only)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "ACCEPTED":
        raise HTTPException(status_code=400, detail="Order must be accepted to execute")
    
    if execution_data.executed_price:
        order.quoted_price = execution_data.executed_price
        order.total_amount = execution_data.executed_price * order.quantity
    
    order.external_trade_ref = execution_data.external_trade_ref
    if execution_data.admin_notes:
        order.admin_notes = execution_data.admin_notes
    order.status = "EXECUTED"
    order.executed_at = datetime.utcnow()
    order.executed_by = current_user.id
    order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order

@router.patch("/admin/{order_id}/settle", response_model=order_schemas.Order)
def settle_order(
    order_id: int,
    settlement_data: order_schemas.OrderSettlement,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_order_manage)
):
    """Settle an order (admin only)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "EXECUTED":
        raise HTTPException(status_code=400, detail="Order must be executed to settle")
    
    order.settlement_ref = settlement_data.settlement_ref
    order.serial_numbers = settlement_data.serial_numbers
    if settlement_data.admin_notes:
        order.admin_notes = settlement_data.admin_notes
    order.status = "SETTLED"
    order.settled_at = datetime.utcnow()
    order.settled_by = current_user.id
    order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order 
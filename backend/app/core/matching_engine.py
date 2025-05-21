from datetime import datetime
from sqlalchemy.orm import Session
import asyncio

from app import models
from app.core.websocket import send_asset_price_update, send_order_book_update, send_order_status_update, send_transaction_notification

def match_orders(db: Session, new_order: models.market.Order):
    """
    Try to match a new order with existing orders in the opposite direction.
    Returns the transaction if a match was made, None otherwise.
    """
    # Determine the opposite order type to match with
    opposite_type = "SELL" if new_order.order_type == "BUY" else "BUY"
    
    # Query for matching orders
    # For BUY orders: match with SELL orders where price <= buy price (buy at or below my price)
    # For SELL orders: match with BUY orders where price >= sell price (sell at or above my price)
    if new_order.order_type == "BUY":
        matching_orders = db.query(models.market.Order).filter(
            models.market.Order.asset_id == new_order.asset_id,
            models.market.Order.order_type == opposite_type,
            models.market.Order.status == "OPEN",
            models.market.Order.price <= new_order.price
        ).order_by(models.market.Order.price).all()
    else:  # SELL order
        matching_orders = db.query(models.market.Order).filter(
            models.market.Order.asset_id == new_order.asset_id,
            models.market.Order.order_type == opposite_type,
            models.market.Order.status == "OPEN",
            models.market.Order.price >= new_order.price
        ).order_by(models.market.Order.price.desc()).all()
    
    # If no matching orders, return None
    if not matching_orders:
        return None
    
    # Take the first matching order (best price based on order type)
    matched_order = matching_orders[0]
    
    # Determine the trade price and quantity
    # Use the existing order's price (first to the market sets the price)
    trade_price = matched_order.price
    
    # Determine the traded quantity (minimum of the two orders)
    trade_quantity = min(new_order.quantity, matched_order.quantity)
    
    # Calculate total amount
    total_amount = trade_price * trade_quantity
    
    # Create transaction
    if new_order.order_type == "BUY":
        buyer_id = new_order.user_id
        seller_id = matched_order.user_id
    else:
        buyer_id = matched_order.user_id
        seller_id = new_order.user_id
    
    transaction = models.market.Transaction(
        order_id=new_order.id,
        buyer_id=buyer_id,
        seller_id=seller_id,
        asset_id=new_order.asset_id,
        quantity=trade_quantity,
        price=trade_price,
        total_amount=total_amount
    )
    
    db.add(transaction)
    
    # Update order statuses
    new_order.quantity -= trade_quantity
    matched_order.quantity -= trade_quantity
    
    # If orders are fully filled, mark as COMPLETED
    if new_order.quantity <= 0:
        new_order.status = "COMPLETED"
    
    if matched_order.quantity <= 0:
        matched_order.status = "COMPLETED"
    
    # Update asset price to reflect latest transaction
    asset = db.query(models.market.Asset).filter(models.market.Asset.id == new_order.asset_id).first()
    if asset:
        asset.current_price = trade_price
        asset.last_updated = datetime.utcnow()
    
    # Commit the changes
    db.add(new_order)
    db.add(matched_order)
    if asset:
        db.add(asset)
    db.commit()
    
    # Schedule real-time notifications using asyncio
    asyncio.create_task(_send_order_updates(
        asset_id=new_order.asset_id,
        new_price=trade_price,
        last_updated=asset.last_updated.isoformat() if asset else datetime.utcnow().isoformat(),
        buyer_id=buyer_id,
        seller_id=seller_id,
        new_order_id=new_order.id,
        new_order_status=new_order.status,
        matched_order_id=matched_order.id,
        matched_order_status=matched_order.status,
        transaction_dict=_transaction_to_dict(transaction)
    ))
    
    return transaction

async def _send_order_updates(
    asset_id: int,
    new_price: float,
    last_updated: str,
    buyer_id: int,
    seller_id: int,
    new_order_id: int,
    new_order_status: str,
    matched_order_id: int,
    matched_order_status: str,
    transaction_dict: dict
):
    """
    Send real-time updates to clients via WebSockets
    """
    # Send asset price update
    await send_asset_price_update(asset_id, new_price, last_updated)
    
    # Send order book update (simple trigger, frontend will fetch the data)
    await send_order_book_update(asset_id, {})
    
    # Send order status updates to both users
    await send_order_status_update(buyer_id, new_order_id if new_order_id == buyer_id else matched_order_id, 
                                 new_order_status if new_order_id == buyer_id else matched_order_status)
    
    await send_order_status_update(seller_id, new_order_id if new_order_id == seller_id else matched_order_id,
                                 new_order_status if new_order_id == seller_id else matched_order_status)
    
    # Send transaction notification to both buyer and seller
    await send_transaction_notification(buyer_id, seller_id, transaction_dict)

def _transaction_to_dict(transaction: models.market.Transaction) -> dict:
    """
    Convert a transaction model to a dictionary for WebSocket transmission
    """
    return {
        "id": transaction.id,
        "order_id": transaction.order_id,
        "buyer_id": transaction.buyer_id,
        "seller_id": transaction.seller_id,
        "asset_id": transaction.asset_id,
        "quantity": transaction.quantity,
        "price": transaction.price,
        "total_amount": transaction.total_amount,
        "timestamp": transaction.timestamp.isoformat() if transaction.timestamp else datetime.utcnow().isoformat()
    } 
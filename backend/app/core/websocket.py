import json
from typing import Dict, List, Any
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
import asyncio
import logging
from .redis import redis_manager

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # All active connections
        self.active_connections: List[WebSocket] = []
        # Connections subscribed to specific assets
        self.asset_subscribers: Dict[int, List[WebSocket]] = {}
        # Connections for users (mapped by user_id)
        self.user_connections: Dict[int, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
            
        logger.info(f"New WebSocket connection. Active connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from user connections
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Remove from asset subscribers
        for asset_id, connections in list(self.asset_subscribers.items()):
            if websocket in connections:
                connections.remove(websocket)
            if not connections:
                del self.asset_subscribers[asset_id]
                
        logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")
    
    async def subscribe_to_asset(self, websocket: WebSocket, asset_id: int):
        if asset_id not in self.asset_subscribers:
            self.asset_subscribers[asset_id] = []
            # Subscribe to Redis channel for this asset
            redis_manager.subscribe(f"asset:{asset_id}")
        
        if websocket not in self.asset_subscribers[asset_id]:
            self.asset_subscribers[asset_id].append(websocket)
            
        await websocket.send_text(json.dumps({
            "event": "subscribed",
            "asset_id": asset_id
        }))
        
        logger.info(f"WebSocket subscribed to asset {asset_id}. Total subscribers: {len(self.asset_subscribers[asset_id])}")
    
    async def unsubscribe_from_asset(self, websocket: WebSocket, asset_id: int):
        if asset_id in self.asset_subscribers and websocket in self.asset_subscribers[asset_id]:
            self.asset_subscribers[asset_id].remove(websocket)
            if not self.asset_subscribers[asset_id]:
                del self.asset_subscribers[asset_id]
                # Unsubscribe from Redis channel
                redis_manager.pubsub.unsubscribe(f"asset:{asset_id}")
            
            await websocket.send_text(json.dumps({
                "event": "unsubscribed",
                "asset_id": asset_id
            }))
            
            logger.info(f"WebSocket unsubscribed from asset {asset_id}")
    
    async def broadcast_asset_update(self, asset_id: int, message: Dict[str, Any]):
        # Publish to Redis channel
        redis_manager.publish(f"asset:{asset_id}", message)
        
        # Send to local subscribers
        if asset_id in self.asset_subscribers:
            disconnected_clients = []
            
            for websocket in self.asset_subscribers[asset_id]:
                try:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_text(json.dumps(message))
                except Exception:
                    disconnected_clients.append(websocket)
            
            # Clean up disconnected clients
            for websocket in disconnected_clients:
                self.disconnect(websocket)
                
            logger.info(f"Broadcast asset update to {len(self.asset_subscribers[asset_id])} subscribers")
    
    async def send_personal_message(self, user_id: int, message: Dict[str, Any]):
        if user_id in self.user_connections:
            disconnected_clients = []
            
            for websocket in self.user_connections[user_id]:
                try:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_text(json.dumps(message))
                except Exception:
                    disconnected_clients.append(websocket)
            
            # Clean up disconnected clients
            for websocket in disconnected_clients:
                self.disconnect(websocket, user_id)
                
            logger.info(f"Sent personal message to user {user_id}")
    
    async def broadcast(self, message: Dict[str, Any]):
        # Publish to Redis broadcast channel
        redis_manager.publish("broadcast", message)
        
        disconnected_clients = []
        
        for websocket in self.active_connections:
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_text(json.dumps(message))
            except Exception:
                disconnected_clients.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected_clients:
            self.disconnect(websocket)
            
        logger.info(f"Broadcast message to all {len(self.active_connections)} connections")

# Create a global connection manager instance
manager = ConnectionManager()

# Market update events
async def send_asset_price_update(asset_id: int, new_price: float, last_updated: str):
    """
    Send asset price update to all subscribers of the asset
    """
    await manager.broadcast_asset_update(asset_id, {
        "event": "asset_price_update",
        "asset_id": asset_id,
        "price": new_price,
        "last_updated": last_updated
    })

async def send_order_book_update(asset_id: int, order_book: dict):
    """
    Send order book update to all subscribers of the asset
    """
    await manager.broadcast_asset_update(asset_id, {
        "event": "order_book_update",
        "asset_id": asset_id,
        "order_book": order_book
    })

async def send_order_status_update(user_id: int, order_id: int, new_status: str):
    """
    Send order status update to the order owner
    """
    await manager.send_personal_message(user_id, {
        "event": "order_status_update",
        "order_id": order_id,
        "status": new_status
    })

async def send_transaction_notification(buyer_id: int, seller_id: int, transaction: dict):
    """
    Send transaction notification to both buyer and seller
    """
    await manager.send_personal_message(buyer_id, {
        "event": "transaction_created",
        "transaction": transaction,
        "role": "buyer"
    })
    
    await manager.send_personal_message(seller_id, {
        "event": "transaction_created",
        "transaction": transaction,
        "role": "seller"
    }) 
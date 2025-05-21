import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional

from app.core.websocket import manager
from app.core.auth import get_current_user_ws
from app import models

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    user_id = None
    
    if token:
        # Authenticate the WebSocket connection
        user = await get_current_user_ws(token)
        if user:
            user_id = user.id
    
    # Accept the connection
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("action") == "subscribe":
                asset_id = message.get("asset_id")
                if asset_id:
                    await manager.subscribe_to_asset(websocket, asset_id)
            
            elif message.get("action") == "unsubscribe":
                asset_id = message.get("asset_id")
                if asset_id:
                    await manager.unsubscribe_from_asset(websocket, asset_id)
            
            elif message.get("action") == "ping":
                # Send a pong response to keep the connection alive
                await websocket.send_text(json.dumps({"action": "pong"}))
                
    except WebSocketDisconnect:
        # Handle client disconnection
        manager.disconnect(websocket, user_id)
    except Exception as e:
        # Handle any other exceptions
        manager.disconnect(websocket, user_id) 
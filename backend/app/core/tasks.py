import asyncio
import logging
from typing import Dict, Any
from .redis import redis_manager
from .websocket import manager

logger = logging.getLogger(__name__)

async def process_redis_messages():
    """
    Background task to process Redis messages and forward them to WebSocket clients
    """
    while True:
        try:
            # Get message from Redis
            message = redis_manager.get_message()
            
            if message:
                # Handle broadcast messages
                if message.get('channel') == 'broadcast':
                    await manager.broadcast(message.get('data', {}))
                
                # Handle asset-specific messages
                elif message.get('channel', '').startswith('asset:'):
                    asset_id = int(message['channel'].split(':')[1])
                    await manager.broadcast_asset_update(asset_id, message.get('data', {}))
            
            # Small delay to prevent CPU overuse
            await asyncio.sleep(0.1)
            
        except Exception as e:
            logger.error(f"Error processing Redis message: {str(e)}")
            await asyncio.sleep(1)  # Longer delay on error 
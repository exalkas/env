import redis
import json
from typing import Any, Dict, Optional
from .config import settings
import logging

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
        self.pubsub = self.redis_client.pubsub()
        
    def publish(self, channel: str, message: Dict[str, Any]) -> None:
        """Publish a message to a Redis channel"""
        try:
            self.redis_client.publish(channel, json.dumps(message))
            logger.debug(f"Published message to channel {channel}")
        except Exception as e:
            logger.error(f"Error publishing to Redis: {str(e)}")
            raise

    def subscribe(self, channel: str) -> None:
        """Subscribe to a Redis channel"""
        try:
            self.pubsub.subscribe(channel)
            logger.debug(f"Subscribed to channel {channel}")
        except Exception as e:
            logger.error(f"Error subscribing to Redis: {str(e)}")
            raise

    def get_message(self) -> Optional[Dict[str, Any]]:
        """Get a message from subscribed channels"""
        try:
            message = self.pubsub.get_message()
            if message and message['type'] == 'message':
                return json.loads(message['data'])
            return None
        except Exception as e:
            logger.error(f"Error getting message from Redis: {str(e)}")
            return None

    def set_key(self, key: str, value: Any, expire: Optional[int] = None) -> None:
        """Set a key-value pair in Redis"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            self.redis_client.set(key, value, ex=expire)
            logger.debug(f"Set key {key}")
        except Exception as e:
            logger.error(f"Error setting Redis key: {str(e)}")
            raise

    def get_key(self, key: str) -> Optional[Any]:
        """Get a value from Redis by key"""
        try:
            value = self.redis_client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Error getting Redis key: {str(e)}")
            return None

    def delete_key(self, key: str) -> None:
        """Delete a key from Redis"""
        try:
            self.redis_client.delete(key)
            logger.debug(f"Deleted key {key}")
        except Exception as e:
            logger.error(f"Error deleting Redis key: {str(e)}")
            raise

    def close(self) -> None:
        """Close Redis connection"""
        try:
            self.pubsub.close()
            self.redis_client.close()
            logger.debug("Closed Redis connection")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {str(e)}")
            raise

# Create a global Redis manager instance
redis_manager = RedisManager() 
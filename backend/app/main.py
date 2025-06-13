from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.tasks import process_redis_messages
from .core.websocket import manager
from .api.api import api_router
import asyncio
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Green Energy Trading API",
    description="API for green energy trading platform",
    version="0.1.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",  # Landing page
    "http://localhost:3001",  # Marketplace app
    "http://localhost:3002",  # Admin app
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# WebSocket endpoint
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("action") == "subscribe_asset":
                asset_id = message.get("asset_id")
                if asset_id:
                    await manager.subscribe_to_asset(websocket, asset_id)
            
            elif message.get("action") == "unsubscribe_asset":
                asset_id = message.get("asset_id")
                if asset_id:
                    await manager.unsubscribe_from_asset(websocket, asset_id)
            
            else:
                # Echo back for testing
                await websocket.send_text(f"Message received: {data}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)

@app.on_event("startup")
async def startup_event():
    """
    Initialize services on startup
    """
    # Start Redis message processor
    asyncio.create_task(process_redis_messages())
    logger.info("Started Redis message processor")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup on shutdown
    """
    from .core.redis import redis_manager
    redis_manager.close()
    logger.info("Closed Redis connection")

@app.get("/")
async def root():
    return {"message": "Welcome to Green Energy Trading API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 
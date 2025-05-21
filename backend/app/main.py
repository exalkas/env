from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.api.endpoints.websocket import router as websocket_router
from app.core.config import settings

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

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(websocket_router, prefix="/ws")

@app.get("/")
async def root():
    return {"message": "Welcome to Green Energy Trading API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 
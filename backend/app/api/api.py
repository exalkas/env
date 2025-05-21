from fastapi import APIRouter

from app.api.endpoints import users, auth, subscriptions, market

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(market.router, prefix="/market", tags=["market"]) 
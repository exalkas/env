from fastapi import APIRouter

from app.api.endpoints import users, auth, subscriptions, market, news, news_categories, rfq, roles, permissions

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(news_categories.router, prefix="/news-categories", tags=["news-categories"])
api_router.include_router(rfq.router, prefix="/rfq", tags=["rfq"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["permissions"]) 
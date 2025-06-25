from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator
import secrets
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "https://emisify.com",
        "https://admin.emisify.com",
        "https://app.emisify.com"
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Email Settings
    EMAIL_ENABLED: bool = True
    SMTP_HOST: str = "smtp.emisify.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "noreply@emisify.com"
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    
    # Email Configuration
    EMAIL_FROM_NAME: str = "Emisify Platform"
    EMAIL_FROM_ADDRESS: str = "noreply@emisify.com"
    EMAIL_SUPPORT_ADDRESS: str = "support@emisify.com"
    EMAIL_ADMIN_ADDRESS: str = "admin@emisify.com"
    
    # Email Template Settings
    EMAIL_TEMPLATES_DIR: str = "app/templates/email"
    EMAIL_ASSETS_URL: str = "https://emisify.com/assets"
    COMPANY_LOGO_URL: str = "https://emisify.com/logo.png"

    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "emisify"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "emisify"
    POSTGRES_PORT: int = 5432
    SQLALCHEMY_DATABASE_URI: str | None = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: str | None, values: dict[str, any]) -> any:
        if isinstance(v, str):
            return v
        return f"postgresql://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}:{values.get('POSTGRES_PORT')}/{values.get('POSTGRES_DB')}"

    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # Security Settings
    ALGORITHM: str = "HS256"
    RATE_LIMIT_PER_MINUTE: int = 60

    # OpenAI Settings
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Stripe Settings
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Domain Settings
    ADMIN_DOMAIN: str = "admin.emisify.com"
    APP_DOMAIN: str = "app.emisify.com"
    MAIN_DOMAIN: str = "emisify.com"

    class Config:
        case_sensitive = True
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings() 
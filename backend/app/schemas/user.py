from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, computed_field

# Import role schema for relationship
from .role import Role

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = None
    kyc_verified: bool = False
    subscription_type: str = "trial"

# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    subscription_type: Optional[str] = None
    role_id: Optional[int] = None
    password: Optional[str] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    subscription_type: str
    kyc_verified: bool
    is_super_admin: bool
    role_id: Optional[int] = None
    subscription_end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return via API
class User(UserInDBBase):
    role: Optional[Role] = None
    
    @computed_field
    @property
    def is_admin(self) -> bool:
        """Check if user is admin based on role level or super admin status"""
        if self.is_super_admin:
            return True
        return self.role and self.role.level >= 50
    
    @computed_field
    @property
    def role_level(self) -> int:
        """Get user's role level"""
        if self.is_super_admin:
            return 100
        return self.role.level if self.role else 0
    
    @computed_field
    @property
    def role_name(self) -> str:
        """Get user's role name"""
        if self.is_super_admin:
            return "super_admin"
        return self.role.name if self.role else "user"

# Properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str

# Notification preferences schemas
class NotificationPreferences(BaseModel):
    email_marketing: bool = False
    email_price_alerts: bool = True
    email_order_updates: bool = True
    email_news_digest: bool = True
    sms_enabled: bool = False

    class Config:
        from_attributes = True

class NotificationPreferencesUpdate(BaseModel):
    email_marketing: Optional[bool] = None
    email_price_alerts: Optional[bool] = None
    email_order_updates: Optional[bool] = None
    email_news_digest: Optional[bool] = None
    sms_enabled: Optional[bool] = None 
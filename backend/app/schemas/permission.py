from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# Permission schemas
class PermissionBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    module: str
    action: str
    is_active: bool = True

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    module: Optional[str] = None
    action: Optional[str] = None
    is_active: Optional[bool] = None

class PermissionInDBBase(PermissionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Permission(PermissionInDBBase):
    pass

# Role Permission schemas
class RolePermissionBase(BaseModel):
    role_id: int
    permission_id: int
    granted: bool = True

class RolePermissionCreate(RolePermissionBase):
    pass

class RolePermissionUpdate(BaseModel):
    granted: Optional[bool] = None

class RolePermissionInDBBase(RolePermissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RolePermission(RolePermissionInDBBase):
    permission: Optional[Permission] = None

# User Permission schemas
class UserPermissionBase(BaseModel):
    user_id: int
    permission_id: int
    granted: bool = True
    granted_by: Optional[int] = None
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None

class UserPermissionCreate(UserPermissionBase):
    pass

class UserPermissionUpdate(BaseModel):
    granted: Optional[bool] = None
    granted_by: Optional[int] = None
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None

class UserPermissionInDBBase(UserPermissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserPermission(UserPermissionInDBBase):
    permission: Optional[Permission] = None

# Request/Response schemas for API
class GrantPermissionRequest(BaseModel):
    user_id: int
    permission_name: str
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None

class RevokePermissionRequest(BaseModel):
    user_id: int
    permission_name: str
    reason: Optional[str] = None

class AssignRolePermissionRequest(BaseModel):
    role_id: int
    permission_name: str
    granted: bool = True

class UserPermissionsResponse(BaseModel):
    user_id: int
    permissions: List[str]
    role_permissions: List[str]
    individual_permissions: List[UserPermission]

class RolePermissionsResponse(BaseModel):
    role_id: int
    role_name: str
    permissions: List[str]
    detailed_permissions: List[RolePermission]

# Subscription feature check
class SubscriptionFeatureRequest(BaseModel):
    feature: str

class SubscriptionFeatureResponse(BaseModel):
    feature: str
    allowed: bool
    subscription_type: str
    message: Optional[str] = None

# My permissions response
class MyPermissionsResponse(BaseModel):
    user_id: int
    permissions: List[str]
    is_admin: bool
    is_super_admin: bool
    role: Optional[str] = None
    role_level: int 
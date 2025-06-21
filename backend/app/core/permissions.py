from functools import wraps
from typing import Callable, List, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.permission_service import PermissionService, Permissions


def require_permission(permission: str):
    """
    Dependency factory that creates a permission-checking dependency.
    Usage: current_user = Depends(require_permission("users.create"))
    """
    def check_permission(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if not PermissionService.has_permission(db, current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: {permission}"
            )
        return current_user
    
    return check_permission


def require_any_permission(permissions: List[str]):
    """
    Dependency factory that requires any one of the listed permissions.
    Usage: current_user = Depends(require_any_permission(["users.read", "users.manage"]))
    """
    def check_any_permission(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        for permission in permissions:
            if PermissionService.has_permission(db, current_user, permission):
                return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied. Required one of: {', '.join(permissions)}"
        )
    
    return check_any_permission


def require_all_permissions(permissions: List[str]):
    """
    Dependency factory that requires all listed permissions.
    Usage: current_user = Depends(require_all_permissions(["users.read", "users.update"]))
    """
    def check_all_permissions(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        for permission in permissions:
            if not PermissionService.has_permission(db, current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied. Missing permission: {permission}"
                )
        return current_user
    
    return check_all_permissions


def require_subscription_feature(feature: str):
    """
    Dependency factory for subscription-based access (for regular users).
    Usage: current_user = Depends(require_subscription_feature("marketplace_write"))
    """
    def check_subscription(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        # Admins bypass subscription checks
        if current_user.is_admin:
            return current_user
            
        if not PermissionService.check_subscription_access(current_user, feature):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Subscription required. Feature '{feature}' not available in your current plan."
            )
        return current_user
    
    return check_subscription


def require_module_access(module: str, action: str = "read"):
    """
    Dependency factory for module-based access.
    Usage: current_user = Depends(require_module_access("users", "create"))
    """
    def check_module_access(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if not PermissionService.has_module_access(db, current_user, module, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied to module '{module}' for action '{action}'"
            )
        return current_user
    
    return check_module_access


# Common permission dependencies for easy import
require_super_admin = require_permission("system.admin")

# User management permissions
require_users_read = require_permission(Permissions.USERS_READ)
require_users_create = require_permission(Permissions.USERS_CREATE)
require_users_update = require_permission(Permissions.USERS_UPDATE)
require_users_delete = require_permission(Permissions.USERS_DELETE)
require_users_manage = require_permission(Permissions.USERS_MANAGE)

# News management permissions
require_news_read = require_permission(Permissions.NEWS_READ)
require_news_create = require_permission(Permissions.NEWS_CREATE)
require_news_update = require_permission(Permissions.NEWS_UPDATE)
require_news_delete = require_permission(Permissions.NEWS_DELETE)
require_news_publish = require_permission(Permissions.NEWS_PUBLISH)
require_news_manage = require_permission(Permissions.NEWS_MANAGE)

# Asset management permissions
require_assets_read = require_permission(Permissions.ASSETS_READ)
require_assets_create = require_permission(Permissions.ASSETS_CREATE)
require_assets_update = require_permission(Permissions.ASSETS_UPDATE)
require_assets_delete = require_permission(Permissions.ASSETS_DELETE)
require_assets_manage = require_permission(Permissions.ASSETS_MANAGE)

# Subscription management permissions
require_subscriptions_read = require_permission(Permissions.SUBSCRIPTIONS_READ)
require_subscriptions_create = require_permission(Permissions.SUBSCRIPTIONS_CREATE)
require_subscriptions_update = require_permission(Permissions.SUBSCRIPTIONS_UPDATE)
require_subscriptions_delete = require_permission(Permissions.SUBSCRIPTIONS_DELETE)
require_subscriptions_manage = require_permission(Permissions.SUBSCRIPTIONS_MANAGE)

# Role management permissions
require_roles_read = require_permission(Permissions.ROLES_READ)
require_roles_create = require_permission(Permissions.ROLES_CREATE)
require_roles_update = require_permission(Permissions.ROLES_UPDATE)
require_roles_delete = require_permission(Permissions.ROLES_DELETE)
require_roles_manage = require_permission(Permissions.ROLES_MANAGE)

# Order management permissions
require_order_read = require_permission(Permissions.ORDER_READ)
require_order_create = require_permission(Permissions.ORDER_CREATE)
require_order_update = require_permission(Permissions.ORDER_UPDATE)
require_order_delete = require_permission(Permissions.ORDER_DELETE)
require_order_quote = require_permission(Permissions.ORDER_QUOTE)
require_order_manage = require_permission(Permissions.ORDER_MANAGE)

# Transaction management permissions
require_transactions_read = require_permission(Permissions.TRANSACTIONS_READ)
require_transactions_update = require_permission(Permissions.TRANSACTIONS_UPDATE)
require_transactions_manage = require_permission(Permissions.TRANSACTIONS_MANAGE)

# Analytics permissions
require_analytics_read = require_permission(Permissions.ANALYTICS_READ)
require_analytics_manage = require_permission(Permissions.ANALYTICS_MANAGE)

# Subscription feature dependencies (for marketplace app)
require_news_access = require_subscription_feature("news_read")
require_marketplace_read = require_subscription_feature("marketplace_read")
require_marketplace_write = require_subscription_feature("marketplace_write")
require_live_prices = require_subscription_feature("live_prices")
require_analytics_access = require_subscription_feature("analytics")


def get_current_admin_or_moderator(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency for endpoints that allow both admins and moderators.
    """
    if current_user.is_admin or (current_user.role and current_user.role.level >= 30):
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin or moderator access required"
    )


def check_user_can_modify_target(
    target_user_id: int,
    current_user: User,
    db: Session
) -> bool:
    """
    Helper function to check if current user can modify target user.
    """
    if current_user.is_super_admin:
        return True
    
    # Get target user
    from app import crud
    target_user = crud.user.get(db, id=target_user_id)
    if not target_user:
        return False
    
    # Super admin cannot be modified by others
    if target_user.is_super_admin and target_user.id != current_user.id:
        return False
    
    # Users can modify themselves
    if target_user.id == current_user.id:
        return True
    
    # Check if current user has permission to manage users
    if PermissionService.has_permission(db, current_user, Permissions.USERS_MANAGE):
        # Cannot modify users with equal or higher role level
        if target_user.role_level >= current_user.role_level:
            return False
        return True
    
    return False


class PermissionChecker:
    """
    Context manager for checking multiple permissions within function body.
    """
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
    
    def check(self, permission: str) -> bool:
        """Check if user has permission"""
        return PermissionService.has_permission(self.db, self.user, permission)
    
    def require(self, permission: str) -> None:
        """Require permission or raise exception"""
        if not self.check(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: {permission}"
            )
    
    def check_subscription(self, feature: str) -> bool:
        """Check if user's subscription allows feature"""
        return PermissionService.check_subscription_access(self.user, feature)
    
    def require_subscription(self, feature: str) -> None:
        """Require subscription feature or raise exception"""
        if not self.check_subscription(feature):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Subscription required. Feature '{feature}' not available in your current plan."
            ) 
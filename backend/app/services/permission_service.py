from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.permission import Permission, RolePermission, UserPermission
from app.models.role import Role
import json


class PermissionService:
    """Service for handling all permission-related operations"""

    @staticmethod
    def has_permission(db: Session, user: User, permission_name: str) -> bool:
        """
        Check if a user has a specific permission.
        Priority: User-specific permissions > Role permissions > Default deny
        """
        if not user.is_active:
            return False

        # Super admin has all permissions
        if user.is_super_admin:
            return True

        # Check user-specific permissions first (highest priority)
        user_permission = db.query(UserPermission).join(Permission).filter(
            UserPermission.user_id == user.id,
            Permission.name == permission_name,
            Permission.is_active == True
        ).first()

        if user_permission:
            # Check if permission has expired
            if user_permission.expires_at and user_permission.expires_at < datetime.now():
                return False
            return user_permission.granted

        # Check role-based permissions
        if user.role:
            role_permission = db.query(RolePermission).join(Permission).filter(
                RolePermission.role_id == user.role.id,
                Permission.name == permission_name,
                Permission.is_active == True
            ).first()

            if role_permission:
                return role_permission.granted

        # Default deny
        return False

    @staticmethod
    def has_module_access(db: Session, user: User, module: str, action: str = "read") -> bool:
        """Check if user has access to a specific module and action"""
        permission_name = f"{module}.{action}"
        return PermissionService.has_permission(db, user, permission_name)

    @staticmethod
    def check_subscription_access(user: User, feature: str) -> bool:
        """
        Check if user's subscription allows access to a specific feature.
        This is for regular users (non-admin) who access based on subscription.
        """
        if user.is_admin:  # Admins bypass subscription checks
            return True

        if not user.subscription_type:
            return False

        # Parse subscription features if available
        # This would typically come from a Subscription model lookup
        # For now, we'll use basic logic based on subscription_type
        
        if user.subscription_type == "trial":
            trial_features = {
                "news_read": True,
                "marketplace_read": True,
                "marketplace_write": False,
                "analytics": False,
                "live_prices": False
            }
            return trial_features.get(feature, False)
        
        elif user.subscription_type == "standard":
            standard_features = {
                "news_read": True,
                "marketplace_read": True,
                "marketplace_write": True,
                "analytics": False,
                "live_prices": True
            }
            return standard_features.get(feature, False)
        
        elif user.subscription_type == "premium":
            # Premium has access to all features
            return True

        return False

    @staticmethod
    def get_user_permissions(db: Session, user: User) -> List[str]:
        """Get all permissions for a user (role + individual)"""
        permissions = set()

        if user.is_super_admin:
            # Super admin gets all permissions
            all_perms = db.query(Permission).filter(Permission.is_active == True).all()
            return [perm.name for perm in all_perms]

        # Get role permissions
        if user.role:
            role_perms = db.query(Permission).join(RolePermission).filter(
                RolePermission.role_id == user.role.id,
                RolePermission.granted == True,
                Permission.is_active == True
            ).all()
            permissions.update([perm.name for perm in role_perms])

        # Get individual user permissions
        user_perms = db.query(Permission).join(UserPermission).filter(
            UserPermission.user_id == user.id,
            UserPermission.granted == True,
            Permission.is_active == True
        ).all()

        # Check for non-expired permissions
        for perm in user_perms:
            user_perm = db.query(UserPermission).filter(
                UserPermission.user_id == user.id,
                UserPermission.permission_id == perm.id
            ).first()
            
            if not user_perm.expires_at or user_perm.expires_at > datetime.now():
                permissions.add(perm.name)

        return list(permissions)

    @staticmethod
    def grant_permission_to_user(
        db: Session, 
        user_id: int, 
        permission_name: str, 
        granted_by_id: int,
        reason: str = None,
        expires_at: datetime = None
    ) -> bool:
        """Grant a specific permission to a user"""
        permission = db.query(Permission).filter(Permission.name == permission_name).first()
        if not permission:
            return False

        # Check if permission already exists
        existing = db.query(UserPermission).filter(
            UserPermission.user_id == user_id,
            UserPermission.permission_id == permission.id
        ).first()

        if existing:
            # Update existing permission
            existing.granted = True
            existing.granted_by = granted_by_id
            existing.reason = reason
            existing.expires_at = expires_at
        else:
            # Create new permission
            user_permission = UserPermission(
                user_id=user_id,
                permission_id=permission.id,
                granted=True,
                granted_by=granted_by_id,
                reason=reason,
                expires_at=expires_at
            )
            db.add(user_permission)

        db.commit()
        return True

    @staticmethod
    def revoke_permission_from_user(
        db: Session, 
        user_id: int, 
        permission_name: str, 
        revoked_by_id: int,
        reason: str = None
    ) -> bool:
        """Revoke a specific permission from a user"""
        permission = db.query(Permission).filter(Permission.name == permission_name).first()
        if not permission:
            return False

        # Check if permission exists
        existing = db.query(UserPermission).filter(
            UserPermission.user_id == user_id,
            UserPermission.permission_id == permission.id
        ).first()

        if existing:
            # Update to deny
            existing.granted = False
            existing.granted_by = revoked_by_id
            existing.reason = reason
        else:
            # Create explicit denial
            user_permission = UserPermission(
                user_id=user_id,
                permission_id=permission.id,
                granted=False,
                granted_by=revoked_by_id,
                reason=reason
            )
            db.add(user_permission)

        db.commit()
        return True

    @staticmethod
    def get_role_permissions(db: Session, role_id: int) -> List[str]:
        """Get all permissions for a role"""
        permissions = db.query(Permission).join(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.granted == True,
            Permission.is_active == True
        ).all()
        return [perm.name for perm in permissions]

    @staticmethod
    def assign_permission_to_role(db: Session, role_id: int, permission_name: str, granted: bool = True) -> bool:
        """Assign or revoke a permission to/from a role"""
        permission = db.query(Permission).filter(Permission.name == permission_name).first()
        if not permission:
            return False

        # Check if permission already exists for role
        existing = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission.id
        ).first()

        if existing:
            existing.granted = granted
        else:
            role_permission = RolePermission(
                role_id=role_id,
                permission_id=permission.id,
                granted=granted
            )
            db.add(role_permission)

        db.commit()
        return True


# Permission constants for easy reference
class Permissions:
    """Constants for all system permissions"""
    
    # User management
    USERS_CREATE = "users.create"
    USERS_READ = "users.read"
    USERS_UPDATE = "users.update"
    USERS_DELETE = "users.delete"
    USERS_MANAGE = "users.manage"  # Full user management
    
    # News management
    NEWS_CREATE = "news.create"
    NEWS_READ = "news.read"
    NEWS_UPDATE = "news.update"
    NEWS_DELETE = "news.delete"
    NEWS_PUBLISH = "news.publish"
    NEWS_MANAGE = "news.manage"  # Full news management
    
    # Asset management
    ASSETS_CREATE = "assets.create"
    ASSETS_READ = "assets.read"
    ASSETS_UPDATE = "assets.update"
    ASSETS_DELETE = "assets.delete"
    ASSETS_MANAGE = "assets.manage"  # Full asset management
    
    # Subscription management
    SUBSCRIPTIONS_CREATE = "subscriptions.create"
    SUBSCRIPTIONS_READ = "subscriptions.read"
    SUBSCRIPTIONS_UPDATE = "subscriptions.update"
    SUBSCRIPTIONS_DELETE = "subscriptions.delete"
    SUBSCRIPTIONS_MANAGE = "subscriptions.manage"  # Full subscription management
    
    # Role management
    ROLES_CREATE = "roles.create"
    ROLES_READ = "roles.read"
    ROLES_UPDATE = "roles.update"
    ROLES_DELETE = "roles.delete"
    ROLES_MANAGE = "roles.manage"  # Full role management
    
    # Order management
    ORDER_CREATE = "order.create"
    ORDER_READ = "order.read"
    ORDER_UPDATE = "order.update"
    ORDER_DELETE = "order.delete"
    ORDER_QUOTE = "order.quote"  # Provide quotes
    ORDER_MANAGE = "order.manage"  # Full order management
    
    # Transaction management
    TRANSACTIONS_READ = "transactions.read"
    TRANSACTIONS_UPDATE = "transactions.update"
    TRANSACTIONS_MANAGE = "transactions.manage"
    
    # Analytics and reporting
    ANALYTICS_READ = "analytics.read"
    ANALYTICS_MANAGE = "analytics.manage"
    
    # System administration
    SYSTEM_SETTINGS = "system.settings"
    SYSTEM_LOGS = "system.logs"
    SYSTEM_ADMIN = "system.admin"


# Default permission sets for each role
DEFAULT_ROLE_PERMISSIONS = {
    "user": [],  # Users get access through subscriptions, not admin permissions
    
    "moderator": [
        # Moderators can only view assets/subscriptions and manage news
        Permissions.ASSETS_READ,
        Permissions.SUBSCRIPTIONS_READ,
        Permissions.NEWS_CREATE,
        Permissions.NEWS_READ,
        Permissions.NEWS_UPDATE,
        Permissions.NEWS_DELETE,
        Permissions.NEWS_PUBLISH,
        Permissions.NEWS_MANAGE,
    ],
    
    "admin": [
        # Admins can CRUD users, news, subscriptions, roles, assets
        Permissions.USERS_CREATE,
        Permissions.USERS_READ,
        Permissions.USERS_UPDATE,
        Permissions.USERS_DELETE,
        Permissions.USERS_MANAGE,
        
        Permissions.NEWS_CREATE,
        Permissions.NEWS_READ,
        Permissions.NEWS_UPDATE,
        Permissions.NEWS_DELETE,
        Permissions.NEWS_PUBLISH,
        Permissions.NEWS_MANAGE,
        
        Permissions.ASSETS_CREATE,
        Permissions.ASSETS_READ,
        Permissions.ASSETS_UPDATE,
        Permissions.ASSETS_DELETE,
        Permissions.ASSETS_MANAGE,
        
        Permissions.SUBSCRIPTIONS_CREATE,
        Permissions.SUBSCRIPTIONS_READ,
        Permissions.SUBSCRIPTIONS_UPDATE,
        Permissions.SUBSCRIPTIONS_DELETE,
        Permissions.SUBSCRIPTIONS_MANAGE,
        
        Permissions.ROLES_READ,  # Can view roles but not manage them
        
        Permissions.ORDER_READ,
        Permissions.ORDER_UPDATE,
        Permissions.ORDER_QUOTE,
        Permissions.ORDER_MANAGE,
        
        Permissions.TRANSACTIONS_READ,
        Permissions.TRANSACTIONS_UPDATE,
        Permissions.TRANSACTIONS_MANAGE,
        
        Permissions.ANALYTICS_READ,
        Permissions.ANALYTICS_MANAGE,
    ],
    
    # Super admin gets everything automatically, no need to define here
} 
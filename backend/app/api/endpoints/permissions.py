from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.schemas import permission as permission_schemas
from app.api import deps
from app.core.permissions import (
    require_permission, require_super_admin, require_users_manage, 
    require_roles_manage, PermissionChecker
)
from app.db.session import get_db
from app.services.permission_service import PermissionService, Permissions

router = APIRouter()

# Permission CRUD (Super Admin only)
@router.get("/", response_model=List[permission_schemas.Permission])
def list_permissions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    List all permissions. Super admin only.
    """
    permissions = db.query(models.Permission).offset(skip).limit(limit).all()
    return permissions

@router.post("/", response_model=permission_schemas.Permission)
def create_permission(
    *,
    db: Session = Depends(get_db),
    permission_in: permission_schemas.PermissionCreate,
    current_user: models.User = Depends(require_super_admin),
) -> Any:
    """
    Create new permission. Super admin only.
    """
    # Check if permission already exists
    existing = db.query(models.Permission).filter(
        models.Permission.name == permission_in.name
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Permission with this name already exists"
        )
    
    permission = models.Permission(**permission_in.dict())
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission

@router.get("/my-permissions", response_model=permission_schemas.MyPermissionsResponse)
def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all permissions for the current user.
    """
    # Ensure user is fully loaded with role relationship
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    permissions = PermissionService.get_user_permissions(db, user)
    
    return permission_schemas.MyPermissionsResponse(
        user_id=user.id,
        permissions=permissions,
        is_admin=user.is_admin,
        is_super_admin=user.is_super_admin,
        role=user.role.name if user.role else None,
        role_level=user.role_level
    )

@router.get("/{permission_id}", response_model=permission_schemas.Permission)
def get_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_super_admin),
) -> Any:
    """
    Get permission by ID. Super admin only.
    """
    permission = db.query(models.Permission).filter(
        models.Permission.id == permission_id
    ).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    return permission

@router.put("/{permission_id}", response_model=permission_schemas.Permission)
def update_permission(
    permission_id: int,
    permission_in: permission_schemas.PermissionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_super_admin),
) -> Any:
    """
    Update permission. Super admin only.
    """
    permission = db.query(models.Permission).filter(
        models.Permission.id == permission_id
    ).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    # Check if new name conflicts
    if permission_in.name and permission_in.name != permission.name:
        existing = db.query(models.Permission).filter(
            models.Permission.name == permission_in.name
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Permission with this name already exists"
            )
    
    update_data = permission_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(permission, field, value)
    
    db.commit()
    db.refresh(permission)
    return permission

@router.delete("/{permission_id}")
def delete_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_super_admin),
) -> Any:
    """
    Delete permission. Super admin only.
    """
    permission = db.query(models.Permission).filter(
        models.Permission.id == permission_id
    ).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    # Check if permission is in use
    role_perms = db.query(models.RolePermission).filter(
        models.RolePermission.permission_id == permission_id
    ).first()
    user_perms = db.query(models.UserPermission).filter(
        models.UserPermission.permission_id == permission_id
    ).first()
    
    if role_perms or user_perms:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete permission that is currently assigned"
        )
    
    db.delete(permission)
    db.commit()
    return {"message": "Permission deleted successfully"}

# User Permission Management
@router.get("/users/{user_id}/permissions", response_model=permission_schemas.UserPermissionsResponse)
def get_user_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_users_manage),
) -> Any:
    """
    Get all permissions for a user (role + individual).
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user can manage this user
    from app.core.permissions import check_user_can_modify_target
    if not check_user_can_modify_target(user_id, current_user, db):
        raise HTTPException(
            status_code=403,
            detail="Permission denied to view this user's permissions"
        )
    
    all_permissions = PermissionService.get_user_permissions(db, user)
    role_permissions = PermissionService.get_role_permissions(db, user.role_id) if user.role_id else []
    
    # Get individual permissions with details
    individual_perms = db.query(models.UserPermission).filter(
        models.UserPermission.user_id == user_id
    ).all()
    
    return permission_schemas.UserPermissionsResponse(
        user_id=user_id,
        permissions=all_permissions,
        role_permissions=role_permissions,
        individual_permissions=individual_perms
    )

@router.post("/users/{user_id}/permissions/grant")
def grant_user_permission(
    user_id: int,
    request: permission_schemas.GrantPermissionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_users_manage),
) -> Any:
    """
    Grant a permission to a specific user.
    """
    # Validate the user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user can manage this user
    from app.core.permissions import check_user_can_modify_target
    if not check_user_can_modify_target(user_id, current_user, db):
        raise HTTPException(
            status_code=403,
            detail="Permission denied to grant permissions to this user"
        )
    
    # Override user_id from URL
    request.user_id = user_id
    
    success = PermissionService.grant_permission_to_user(
        db=db,
        user_id=request.user_id,
        permission_name=request.permission_name,
        granted_by_id=current_user.id,
        reason=request.reason,
        expires_at=request.expires_at
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Permission not found or could not be granted"
        )
    
    return {"message": "Permission granted successfully"}

@router.post("/users/{user_id}/permissions/revoke")
def revoke_user_permission(
    user_id: int,
    request: permission_schemas.RevokePermissionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_users_manage),
) -> Any:
    """
    Revoke a permission from a specific user.
    """
    # Validate the user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user can manage this user
    from app.core.permissions import check_user_can_modify_target
    if not check_user_can_modify_target(user_id, current_user, db):
        raise HTTPException(
            status_code=403,
            detail="Permission denied to revoke permissions from this user"
        )
    
    # Override user_id from URL
    request.user_id = user_id
    
    success = PermissionService.revoke_permission_from_user(
        db=db,
        user_id=request.user_id,
        permission_name=request.permission_name,
        revoked_by_id=current_user.id,
        reason=request.reason
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Permission not found or could not be revoked"
        )
    
    return {"message": "Permission revoked successfully"}

# Role Permission Management
@router.get("/roles/{role_id}/permissions", response_model=permission_schemas.RolePermissionsResponse)
def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles_manage),
) -> Any:
    """
    Get all permissions for a role.
    """
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    permissions = PermissionService.get_role_permissions(db, role_id)
    
    # Get detailed permissions
    detailed_perms = db.query(models.RolePermission).filter(
        models.RolePermission.role_id == role_id
    ).all()
    
    return permission_schemas.RolePermissionsResponse(
        role_id=role_id,
        role_name=role.name,
        permissions=permissions,
        detailed_permissions=detailed_perms
    )

@router.post("/roles/{role_id}/permissions/assign")
def assign_role_permission(
    role_id: int,
    request: permission_schemas.AssignRolePermissionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles_manage),
) -> Any:
    """
    Assign or revoke a permission to/from a role.
    """
    # Validate the role exists
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Override role_id from URL
    request.role_id = role_id
    
    success = PermissionService.assign_permission_to_role(
        db=db,
        role_id=request.role_id,
        permission_name=request.permission_name,
        granted=request.granted
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Permission not found or could not be assigned"
        )
    
    action = "granted" if request.granted else "revoked"
    return {"message": f"Permission {action} successfully"}

# Utility endpoints
@router.get("/check/{permission_name}")
def check_permission(
    permission_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Check if current user has a specific permission.
    """
    has_permission = PermissionService.has_permission(db, current_user, permission_name)
    return {
        "permission": permission_name,
        "granted": has_permission,
        "user_id": current_user.id
    }

@router.post("/check/subscription")
def check_subscription_feature(
    request: permission_schemas.SubscriptionFeatureRequest,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Check if current user's subscription allows a specific feature.
    """
    allowed = PermissionService.check_subscription_access(current_user, request.feature)
    
    message = None
    if not allowed and not current_user.is_admin:
        message = f"Feature '{request.feature}' requires a higher subscription plan"
    
    return permission_schemas.SubscriptionFeatureResponse(
        feature=request.feature,
        allowed=allowed,
        subscription_type=current_user.subscription_type or "none",
        message=message
    )

 
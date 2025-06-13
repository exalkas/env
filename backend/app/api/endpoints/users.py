from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()

def get_current_super_admin(
    current_user: models.User = Depends(deps.get_current_user)
) -> models.User:
    """
    Dependency to ensure only super admins can access certain user management functions
    """
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=403,
            detail="Only super administrators can perform this action"
        )
    return current_user

def check_user_permissions(
    target_user: models.User,
    current_user: models.User,
    is_modification: bool = True
) -> None:
    """
    Check if current user can access/modify target user
    """
    # Super admin can view everyone but cannot modify other super admins
    if current_user.is_super_admin:
        if is_modification and target_user.is_super_admin and target_user.id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Super administrator cannot be modified by other super admins"
            )
        return  # Super admin can view anyone
    
    # Regular admins cannot access super admin users
    if target_user.is_super_admin:
        raise HTTPException(
            status_code=403,
            detail="Cannot access super administrator accounts"
        )
    
    # Regular admins cannot modify users with higher/equal role level (except themselves)
    if is_modification and target_user.role_level >= current_user.role_level and target_user.id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Cannot modify users with equal or higher privileges"
        )

@router.get("/me", response_model=schemas.User)
def read_current_user(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user details.
    """
    return current_user

@router.get("/me/admin-check")
def check_admin_access(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Check if current user has admin access for admin app.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )
    return {"message": "Admin access granted", "role": current_user.role_name, "level": current_user.role_level}

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Retrieve users. Admin only.
    """
    query = db.query(models.User)
    
    # If not super admin, exclude super admin users from results
    if not current_user.is_super_admin:
        query = query.filter(models.User.is_super_admin == False)
        # Also exclude users with higher role levels
        query = query.join(models.Role, models.User.role_id == models.Role.id, isouter=True)
        query = query.filter(
            db.or_(
                models.User.role_id.is_(None),
                models.Role.level < current_user.role_level
            )
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Get user by ID. Admin only.
    """
    user = db.query(models.User).options(joinedload(models.User.role)).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions for viewing (not modification)
    check_user_permissions(user, current_user, is_modification=False)
    
    return user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Update user. Admin only.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions
    check_user_permissions(user, current_user)
    
    # If role_id is being updated, validate the new role
    if user_in.role_id is not None:
        if user_in.role_id > 0:  # If not removing role
            new_role = db.query(models.Role).filter(models.Role.id == user_in.role_id).first()
            if not new_role:
                raise HTTPException(status_code=400, detail="Role not found")
            
            # Only super admin can assign admin-level roles
            if new_role.level >= 50 and not current_user.is_super_admin:
                raise HTTPException(
                    status_code=403,
                    detail="Only super administrators can assign admin roles"
                )
    
    # Update user fields
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(models.User).filter(
            models.User.email == user_in.email,
            models.User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered by another user"
            )
        user.email = user_in.email
    if user_in.subscription_type is not None:
        # Admin users (role level >= 50) should not have subscription types
        if hasattr(user, 'role_level') and user.role_level >= 50:
            # Skip subscription update for admin users
            pass
        else:
            user.subscription_type = user_in.subscription_type
    if user_in.role_id is not None:
        user.role_id = user_in.role_id if user_in.role_id > 0 else None
    if user_in.password is not None:
        from app.core.security import get_password_hash
        user.hashed_password = get_password_hash(user_in.password)
    
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/activate", response_model=schemas.User)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Activate user. Admin only.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions
    check_user_permissions(user, current_user)
    
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/deactivate", response_model=schemas.User)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Deactivate user. Admin only.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions - prevent deactivating super admin
    if user.is_super_admin:
        raise HTTPException(
            status_code=403,
            detail="Cannot deactivate super administrator"
        )
    
    check_user_permissions(user, current_user)
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/verify-kyc", response_model=schemas.User)
def verify_user_kyc(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Verify user KYC. Admin only.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions
    check_user_permissions(user, current_user)
    
    user.kyc_verified = True
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/make-super-admin", response_model=schemas.User)
def make_user_super_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_super_admin),
) -> Any:
    """
    Grant super admin privileges to user. Super admin only.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_super_admin = True
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/remove-super-admin", response_model=schemas.User)
def remove_user_super_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_super_admin),
) -> Any:
    """
    Remove super admin privileges from user. Super admin only.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent removing super admin from self
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove super admin privileges from yourself"
        )
    
    user.is_super_admin = False
    db.commit()
    db.refresh(user)
    return user

@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Create new user. Admin only.
    """
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Validate role assignment
    if user_in.role_id:
        role = db.query(models.Role).filter(models.Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Role not found")
        
        # Only super admin can assign admin-level roles
        if role.level >= 50 and not current_user.is_super_admin:
            raise HTTPException(
                status_code=403,
                detail="Only super administrators can assign admin roles"
            )
    
    # Hash password and create user
    from app.core.security import get_password_hash
    
    # Determine if user will be admin based on role
    is_admin_role = False
    if user_in.role_id:
        role = db.query(models.Role).filter(models.Role.id == user_in.role_id).first()
        if role and role.level >= 50:
            is_admin_role = True
    
    # Admin users should not have subscription types
    subscription_type = None if is_admin_role else user_in.subscription_type
    
    user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=user_in.is_active,
        is_super_admin=False,  # Never allow creating super admin via API
        kyc_verified=user_in.kyc_verified,
        subscription_type=subscription_type,
        role_id=user_in.role_id,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", response_model=dict)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Delete user. Admin only. Cannot delete super admins.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting super admin users
    if user.is_super_admin:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete super administrator accounts"
        )
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )
    
    # Check permissions for modification
    check_user_permissions(user, current_user, is_modification=True)
    
    # Store user info for response
    deleted_user_email = user.email
    deleted_user_id = user.id
    
    # Delete the user
    db.delete(user)
    db.commit()
    
    return {
        "message": f"User {deleted_user_email} (ID: {deleted_user_id}) deleted successfully",
        "deleted_user_id": deleted_user_id,
        "deleted_user_email": deleted_user_email
    }

@router.get("/me/debug", response_model=dict)
def debug_current_user(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Debug endpoint to check current user's role information.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "is_super_admin": current_user.is_super_admin,
        "role_id": current_user.role_id,
        "role": current_user.role.dict() if current_user.role else None,
        "computed_is_admin": current_user.is_admin,
        "computed_role_level": current_user.role_level,
        "computed_role_name": current_user.role_name,
    } 
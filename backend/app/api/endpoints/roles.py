from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()

def get_current_super_admin(
    current_user: models.User = Depends(deps.get_current_user)
) -> models.User:
    """
    Dependency to ensure only super admins can access role management
    """
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=403,
            detail="Only super administrators can manage roles"
        )
    return current_user

@router.get("/", response_model=List[schemas.Role])
def read_roles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_super_admin),
) -> Any:
    """
    Retrieve roles. Super admin only.
    """
    roles = db.query(models.Role).offset(skip).limit(limit).all()
    return roles

@router.get("/{role_id}", response_model=schemas.Role)
def read_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_super_admin),
) -> Any:
    """
    Get role by ID. Super admin only.
    """
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.post("/", response_model=schemas.Role)
def create_role(
    role_in: schemas.RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_super_admin),
) -> Any:
    """
    Create new role. Super admin only.
    """
    # Check if role name already exists
    existing_role = db.query(models.Role).filter(models.Role.name == role_in.name).first()
    if existing_role:
        raise HTTPException(
            status_code=400,
            detail="Role with this name already exists"
        )
    
    # Prevent creating roles with super admin level (100)
    if role_in.level >= 100:
        raise HTTPException(
            status_code=400,
            detail="Cannot create role with super admin level"
        )
    
    role = models.Role(**role_in.dict())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.put("/{role_id}", response_model=schemas.Role)
def update_role(
    role_id: int,
    role_in: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_super_admin),
) -> Any:
    """
    Update role. Super admin only.
    """
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Prevent updating to super admin level (100)
    if role_in.level is not None and role_in.level >= 100:
        raise HTTPException(
            status_code=400,
            detail="Cannot set role level to super admin level"
        )
    
    # Check if new name already exists (if name is being updated)
    if role_in.name and role_in.name != role.name:
        existing_role = db.query(models.Role).filter(
            models.Role.name == role_in.name,
            models.Role.id != role_id
        ).first()
        if existing_role:
            raise HTTPException(
                status_code=400,
                detail="Role with this name already exists"
            )
    
    # Update role fields
    update_data = role_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)
    
    db.commit()
    db.refresh(role)
    return role

@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_super_admin),
) -> Any:
    """
    Delete role. Super admin only.
    """
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if any users are assigned to this role
    users_with_role = db.query(models.User).filter(models.User.role_id == role_id).first()
    if users_with_role:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete role that is assigned to users"
        )
    
    db.delete(role)
    db.commit()
    return {"message": "Role deleted successfully"} 
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import models, schemas, crud
from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_db

router = APIRouter()

@router.post("/login")
def login_for_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not crud.user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Inactive user"
        )
    elif not crud.user.is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # Return comprehensive user information including role data
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "is_super_admin": user.is_super_admin,
            "kyc_verified": user.kyc_verified,
            "role_id": user.role_id,
            "role": {
                "id": user.role.id,
                "name": user.role.name,
                "display_name": user.role.display_name,
                "level": user.role.level
            } if user.role else None
        }
    }

@router.post("/user-login")
def user_login_for_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    User login endpoint for marketplace app - allows regular users to log in
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not crud.user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # Return user information
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_admin": crud.user.is_admin(user),
            "is_super_admin": user.is_super_admin,
            "kyc_verified": user.kyc_verified,
            "subscription_type": user.subscription_type,
            "role_id": user.role_id,
            "role": {
                "id": user.role.id,
                "name": user.role.name,
                "display_name": user.role.display_name,
                "level": user.role.level
            } if user.role else None
        }
    }

@router.post("/signup", response_model=schemas.User)
def create_user_signup(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Create new user without the need to be authenticated.
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system",
        )
    
    # Get default user role
    default_role = db.query(models.Role).filter(models.Role.name == "user").first()
    
    hashed_password = security.get_password_hash(user_in.password)
    db_user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        is_active=True,
        is_super_admin=False,
        kyc_verified=False,
        subscription_type="trial",
        role_id=default_role.id if default_role else None,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user 
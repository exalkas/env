from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from app.core.auth import get_current_user as _get_current_user, get_current_admin
from app.core.config import settings
from app.db.session import get_db as _get_db
from app.models.user import User

# Re-export commonly used dependencies
get_db = _get_db
get_current_user = _get_current_user
get_current_admin_user = get_current_admin

# OAuth2 scheme for optional authentication
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login", 
    auto_error=False
)

def get_current_user_optional(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional)
) -> Optional[User]:
    """
    Optional user authentication dependency.
    Returns None if no token is provided or if token is invalid.
    """
    if token is None:
        return None
    
    try:
        return _get_current_user(db, token)
    except HTTPException:
        return None 
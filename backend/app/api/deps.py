from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user as _get_current_user, get_current_admin
from app.db.session import get_db as _get_db
from app.models.user import User

# Re-export commonly used dependencies
get_db = _get_db
get_current_user = _get_current_user
get_current_admin_user = get_current_admin 
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.user import User
from app.core.security import verify_password

class CRUDUser:
    def get(self, db: Session, *, id: int) -> Optional[User]:
        return db.query(User).options(joinedload(User.role)).filter(User.id == id).first()

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).options(joinedload(User.role)).filter(User.email == email).first()

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_admin(self, user: User) -> bool:
        """Check if user is admin based on role level or super admin status"""
        if user.is_super_admin:
            return True
        return user.role and user.role.level >= 50

    def is_super_admin(self, user: User) -> bool:
        return user.is_super_admin

user = CRUDUser() 
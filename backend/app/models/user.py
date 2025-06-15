from sqlalchemy import Boolean, Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    is_active = Column(Boolean, default=True)
    is_super_admin = Column(Boolean, default=False)  # Super admin flag
    kyc_verified = Column(Boolean, default=False)
    subscription_type = Column(String, default="trial")  # trial or standard
    subscription_end_date = Column(DateTime, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)  # Role relationship
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    role = relationship("Role", back_populates="users")
    orders = relationship("Order", back_populates="user")
    user_permissions = relationship("UserPermission", foreign_keys="UserPermission.user_id", back_populates="user")
    created_prompts = relationship("PromptTemplate", back_populates="creator")
    
    @property
    def is_admin(self):
        """Check if user is admin based on role level or super admin status"""
        if self.is_super_admin:
            return True
        return self.role and self.role.level >= 50  # Admin level threshold
    
    @property
    def role_level(self):
        """Get user's role level"""
        if self.is_super_admin:
            return 100  # Super admin has highest level
        return self.role.level if self.role else 0
    
    @property
    def role_name(self):
        """Get user's role name"""
        if self.is_super_admin:
            return "super_admin"
        return self.role.name if self.role else "user" 
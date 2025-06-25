from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    subject = Column(String(300), nullable=False)
    html_content = Column(Text, nullable=False)
    variables = Column(JSON)  # List of required variables
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    created_by = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", back_populates="created_templates")
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    actions = relationship("EmailAction", back_populates="template")
    logs = relationship("EmailActionLog", back_populates="template")


class EmailAction(Base):
    __tablename__ = "email_actions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(50), nullable=False, index=True)
    trigger_event = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Template assignment
    template_id = Column(Integer, ForeignKey("email_templates.id"))
    template = relationship("EmailTemplate", back_populates="actions")
    
    # Sending configuration
    send_immediately = Column(Boolean, default=True, nullable=False)
    delay_minutes = Column(Integer, default=0, nullable=False)
    conditions = Column(JSON)  # Additional conditions for sending
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    logs = relationship("EmailActionLog", back_populates="action")


class EmailActionLog(Base):
    __tablename__ = "email_action_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # References
    action_id = Column(Integer, ForeignKey("email_actions.id"), nullable=True)  # Allow null for test emails
    action = relationship("EmailAction", back_populates="logs")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="email_logs")
    
    template_id = Column(Integer, ForeignKey("email_templates.id"))
    template = relationship("EmailTemplate", back_populates="logs")
    
    # Email details
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(300), nullable=False)
    trigger_data = Column(JSON)  # Context data when triggered
    
    # Status tracking
    sent_at = Column(DateTime, index=True)
    status = Column(String(50), nullable=False, index=True)  # "sent", "failed", "skipped", "pending"
    error_message = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False) 
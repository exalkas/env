from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr


# Email Template Schemas
class EmailTemplateBase(BaseModel):
    name: str
    category: str
    display_name: str
    description: Optional[str] = None
    subject: str
    html_content: str
    variables: Optional[List[str]] = []
    is_active: bool = True
    is_default: bool = False


class EmailTemplateCreate(EmailTemplateBase):
    pass


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class EmailTemplate(EmailTemplateBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Email Action Schemas
class EmailActionBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    category: str
    trigger_event: str
    is_active: bool = True
    template_id: Optional[int] = None
    send_immediately: bool = True
    delay_minutes: int = 0
    conditions: Optional[Dict[str, Any]] = None


class EmailActionCreate(EmailActionBase):
    pass


class EmailActionUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    trigger_event: Optional[str] = None
    is_active: Optional[bool] = None
    template_id: Optional[int] = None
    send_immediately: Optional[bool] = None
    delay_minutes: Optional[int] = None
    conditions: Optional[Dict[str, Any]] = None


class EmailAction(EmailActionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    template: Optional[EmailTemplate] = None

    class Config:
        from_attributes = True


# Email Action Log Schemas
class EmailActionLogBase(BaseModel):
    recipient_email: EmailStr
    subject: str
    trigger_data: Optional[Dict[str, Any]] = None
    status: str
    error_message: Optional[str] = None


class EmailActionLogCreate(EmailActionLogBase):
    action_id: Optional[int] = None
    user_id: int
    template_id: Optional[int] = None


class EmailActionLog(EmailActionLogBase):
    id: int
    action_id: Optional[int] = None
    user_id: int
    template_id: Optional[int] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    
    # Relationships
    action: Optional[EmailAction] = None
    template: Optional[EmailTemplate] = None

    class Config:
        from_attributes = True


# API Request/Response Schemas
class EmailCategoryStats(BaseModel):
    category: str
    templates_count: int
    actions_count: int
    active_actions_count: int


class EmailSystemStats(BaseModel):
    total_templates: int
    total_actions: int
    active_actions: int
    categories_stats: List[EmailCategoryStats]
    recent_logs_count: int


class TriggerEmailRequest(BaseModel):
    user_id: int
    trigger_event: str
    trigger_data: Optional[Dict[str, Any]] = None


class SendTemplateEmailRequest(BaseModel):
    template_id: int
    recipient_email: EmailStr
    variables: Optional[Dict[str, Any]] = None


class BulkEmailRequest(BaseModel):
    template_id: int
    recipient_emails: List[EmailStr]
    variables: Optional[Dict[str, Any]] = None


# Admin Management Schemas
class EmailActionWithStats(EmailAction):
    logs_count: int
    success_rate: float
    last_sent: Optional[datetime] = None


class EmailTemplateWithStats(EmailTemplate):
    actions_count: int
    usage_count: int
    last_used: Optional[datetime] = None


# Email Categories
EMAIL_CATEGORIES = [
    "authentication",
    "kyc",
    "subscription", 
    "trading",
    "system",
    "marketing",
    "notifications"
]

# Trigger Events
TRIGGER_EVENTS = [
    "after_user_signup",
    "before_user_login",
    "after_password_reset",
    "kyc_status_change",
    "subscription_activated",
    "subscription_cancelled",
    "subscription_upgraded",
    "order_placed",
    "order_filled",
    "payment_received",
    "payment_failed",
    "system_maintenance",
    "weekly_report",
    "monthly_summary"
] 
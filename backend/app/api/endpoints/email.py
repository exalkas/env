from typing import Any, List, Optional
from datetime import datetime
import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.models import User
from app.models.email import EmailActionLog
from app.services.email_service import email_service, EmailNotifications

router = APIRouter()

# Pydantic models for email management
class EmailTest(BaseModel):
    to_email: EmailStr
    subject: str
    content: str
    is_html: bool = True

class EmailTemplate(BaseModel):
    template_name: str
    to_emails: List[EmailStr]
    template_variables: dict = {}

class EmailStats(BaseModel):
    email_enabled: bool
    smtp_configured: bool
    smtp_host: str
    smtp_port: int
    from_address: str
    templates_available: List[str]

class BulkEmailRequest(BaseModel):
    to_emails: List[EmailStr]
    subject: str
    content: str
    is_html: bool = True

@router.get("/stats")
def get_email_stats(
    *,
    current_user: User = Depends(deps.get_current_admin_user),
) -> EmailStats:
    """Get email system statistics and configuration"""
    
    # Check if templates directory exists and list available templates
    templates_available = []
    try:
        from pathlib import Path
        from app.core.config import settings
        template_dir = Path(settings.EMAIL_TEMPLATES_DIR)
        if template_dir.exists():
            templates_available = [
                f.stem for f in template_dir.glob("*.html") 
                if f.name != "base.html"
            ]
    except Exception:
        pass
    
    return EmailStats(
        email_enabled=email_service.enabled,
        smtp_configured=bool(email_service.smtp_password),
        smtp_host=email_service.smtp_host,
        smtp_port=email_service.smtp_port,
        from_address=email_service.from_address,
        templates_available=templates_available
    )

@router.post("/test")
async def send_test_email(
    *,
    email_test: EmailTest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Send test email"""
    
    # Create log entry for test email
    log_entry = EmailActionLog(
        action_id=None,  # No specific action for test emails
        user_id=current_user.id,  # Use the admin user who sent the test
        recipient_email=email_test.to_email,
        subject=email_test.subject,
        status="pending",
        trigger_data={"test_email": True, "sent_by_admin": current_user.email},
        created_at=datetime.now()
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    
    try:
        success = await email_service.send_simple_email(
            to_emails=[email_test.to_email],
            subject=email_test.subject,
            content=email_test.content,
            is_html=email_test.is_html
        )
        
        # Update log entry with result
        log_entry.status = "sent" if success else "failed"
        log_entry.sent_at = datetime.now() if success else None
        if not success:
            log_entry.error_message = "Failed to send test email"
        db.commit()
        
        if success:
            return {"message": "Test email sent successfully", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
            
    except Exception as e:
        # Update log entry with error
        log_entry.status = "failed"
        log_entry.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/send-template")
async def send_template_email(
    *,
    email_template: EmailTemplate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Send email using template"""
    
    try:
        success = await email_service.send_template_email(
            to_emails=email_template.to_emails,
            template_name=email_template.template_name,
            **email_template.template_variables
        )
        
        if success:
            return {
                "message": f"Template email sent to {len(email_template.to_emails)} recipients",
                "success": True,
                "recipients": len(email_template.to_emails)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send template email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send template email: {str(e)}")

@router.post("/bulk-send")
async def send_bulk_email(
    *,
    bulk_email: BulkEmailRequest,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Send bulk email to multiple recipients"""
    
    if len(bulk_email.to_emails) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 recipients allowed per bulk send")
    
    try:
        success = await email_service.send_simple_email(
            to_emails=bulk_email.to_emails,
            subject=bulk_email.subject,
            content=bulk_email.content,
            is_html=bulk_email.is_html
        )
        
        if success:
            return {
                "message": f"Bulk email sent to {len(bulk_email.to_emails)} recipients",
                "success": True,
                "recipients": len(bulk_email.to_emails)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send bulk email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send bulk email: {str(e)}")

@router.post("/notify/welcome/{user_id}")
async def send_welcome_notification(
    *,
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Send welcome email to specific user (admin trigger)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        success = await EmailNotifications.send_welcome_email(
            user_email=user.email,
            user_name=user.full_name or user.email.split('@')[0]
        )
        
        if success:
            return {"message": f"Welcome email sent to {user.email}", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to send welcome email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send welcome email: {str(e)}")

@router.post("/notify/kyc-status/{user_id}")
async def send_kyc_status_notification(
    *,
    user_id: int,
    status: str,
    reason: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Send KYC status notification to specific user (admin trigger)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    valid_statuses = ["submitted", "approved", "rejected", "additional_info_required"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    try:
        success = await EmailNotifications.send_kyc_status_email(
            user_email=user.email,
            user_name=user.full_name or user.email.split('@')[0],
            status=status,
            reason=reason
        )
        
        if success:
            return {"message": f"KYC status email sent to {user.email}", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to send KYC status email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send KYC status email: {str(e)}")

@router.post("/notify/subscription/{user_id}")
async def send_subscription_notification(
    *,
    user_id: int,
    action: str,
    plan_name: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Send subscription notification to specific user (admin trigger)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    valid_actions = ["activated", "renewed", "cancelled", "upgraded", "downgraded"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
    
    try:
        success = await EmailNotifications.send_subscription_email(
            user_email=user.email,
            user_name=user.full_name or user.email.split('@')[0],
            action=action,
            plan_name=plan_name
        )
        
        if success:
            return {"message": f"Subscription email sent to {user.email}", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to send subscription email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send subscription email: {str(e)}")

@router.get("/users/all-emails")
def get_all_user_emails(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(True),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get list of all user emails for bulk operations"""
    
    query = db.query(User.email, User.full_name, User.id, User.is_active)
    
    if active_only:
        query = query.filter(User.is_active == True)
    
    users = query.offset(skip).limit(limit).all()
    
    return {
        "emails": [
            {
                "email": user.email,
                "name": user.full_name,
                "id": user.id,
                "is_active": user.is_active
            }
            for user in users
        ],
        "count": len(users)
    }

@router.post("/admin-notification")
async def send_admin_notification(
    *,
    subject: str,
    content: str,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Send notification to admin users"""
    
    try:
        success = await EmailNotifications.send_admin_notification(
            subject=subject,
            content=content
        )
        
        if success:
            return {"message": "Admin notification sent successfully", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to send admin notification")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send admin notification: {str(e)}")

@router.get("/templates")
def get_email_templates(
    *,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get list of available email templates with sample variables"""
    
    templates = {
        "welcome": {
            "description": "Welcome email for new users",
            "variables": ["user_name"],
            "sample_subject": "Welcome to Emisify Platform - Start Trading Green Energy!"
        },
        "kyc_status": {
            "description": "KYC verification status update",
            "variables": ["user_name", "status", "reason"],
            "sample_subject": "KYC Verification Status Update"
        },
        "password_reset": {
            "description": "Password reset request",
            "variables": ["reset_url"],
            "sample_subject": "Password Reset Request - Emisify Platform"
        },
        "subscription": {
            "description": "Subscription-related notifications",
            "variables": ["user_name", "action", "plan_name"],
            "sample_subject": "Subscription Update"
        },
        "trading_notification": {
            "description": "Trading and transaction notifications",
            "variables": ["user_name", "notification_type", "asset_name", "order_type", "quantity", "price"],
            "sample_subject": "Trading Notification"
        }
    }
    
    return {"templates": templates}

# Create a router specifically for email management
email_router = router 
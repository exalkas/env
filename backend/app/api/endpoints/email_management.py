from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime

from app.api import deps
from app.models.user import User
from app.models.email import EmailTemplate, EmailAction, EmailActionLog
from app.schemas import email as email_schemas
from app.services.email_service import EmailService

router = APIRouter()

email_service = EmailService()


# Email Templates CRUD
@router.get("/templates", response_model=List[email_schemas.EmailTemplateWithStats])
def get_templates(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get email templates with statistics"""
    query = db.query(EmailTemplate)
    
    if category:
        query = query.filter(EmailTemplate.category == category)
    if is_active is not None:
        query = query.filter(EmailTemplate.is_active == is_active)
    
    templates = query.offset(skip).limit(limit).all()
    
    # Add statistics for each template
    result = []
    for template in templates:
        actions_count = db.query(EmailAction).filter(EmailAction.template_id == template.id).count()
        usage_count = db.query(EmailActionLog).filter(EmailActionLog.template_id == template.id).count()
        last_used = db.query(func.max(EmailActionLog.sent_at)).filter(
            EmailActionLog.template_id == template.id,
            EmailActionLog.status == "sent"
        ).scalar()
        
        template_with_stats = email_schemas.EmailTemplateWithStats(
            **template.__dict__,
            actions_count=actions_count,
            usage_count=usage_count,
            last_used=last_used
        )
        result.append(template_with_stats)
    
    return result


@router.post("/templates", response_model=email_schemas.EmailTemplate)
def create_template(
    template_data: email_schemas.EmailTemplateCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create new email template"""
    # Check if template name already exists
    existing = db.query(EmailTemplate).filter(EmailTemplate.name == template_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template name already exists")
    
    template = EmailTemplate(
        **template_data.dict(),
        created_by=current_user.id
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.get("/templates/{template_id}", response_model=email_schemas.EmailTemplate)
def get_template(
    template_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get specific email template"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


@router.put("/templates/{template_id}", response_model=email_schemas.EmailTemplate)
def update_template(
    template_id: int,
    template_data: email_schemas.EmailTemplateUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update email template"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check if new name conflicts with existing template
    if template_data.name and template_data.name != template.name:
        existing = db.query(EmailTemplate).filter(EmailTemplate.name == template_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Template name already exists")
    
    # Update fields
    for field, value in template_data.dict(exclude_unset=True).items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    
    return template


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete email template"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check if template is being used by any actions
    actions_count = db.query(EmailAction).filter(EmailAction.template_id == template_id).count()
    if actions_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete template. It is used by {actions_count} email action(s)"
        )
    
    db.delete(template)
    db.commit()
    
    return {"message": "Template deleted successfully"}


# Email Actions CRUD
@router.get("/actions", response_model=List[email_schemas.EmailActionWithStats])
def get_actions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    trigger_event: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get email actions with statistics"""
    query = db.query(EmailAction)
    
    if category:
        query = query.filter(EmailAction.category == category)
    if is_active is not None:
        query = query.filter(EmailAction.is_active == is_active)
    if trigger_event:
        query = query.filter(EmailAction.trigger_event == trigger_event)
    
    actions = query.offset(skip).limit(limit).all()
    
    # Add statistics for each action
    result = []
    for action in actions:
        logs_count = db.query(EmailActionLog).filter(EmailActionLog.action_id == action.id).count()
        success_count = db.query(EmailActionLog).filter(
            EmailActionLog.action_id == action.id,
            EmailActionLog.status == "sent"
        ).count()
        success_rate = (success_count / logs_count * 100) if logs_count > 0 else 0
        last_sent = db.query(func.max(EmailActionLog.sent_at)).filter(
            EmailActionLog.action_id == action.id,
            EmailActionLog.status == "sent"
        ).scalar()
        
        action_with_stats = email_schemas.EmailActionWithStats(
            **action.__dict__,
            logs_count=logs_count,
            success_rate=success_rate,
            last_sent=last_sent
        )
        result.append(action_with_stats)
    
    return result


@router.post("/actions", response_model=email_schemas.EmailAction)
def create_action(
    action_data: email_schemas.EmailActionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create new email action"""
    # Check if action name already exists
    existing = db.query(EmailAction).filter(EmailAction.name == action_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Action name already exists")
    
    # Validate template exists if provided
    if action_data.template_id:
        template = db.query(EmailTemplate).filter(EmailTemplate.id == action_data.template_id).first()
        if not template:
            raise HTTPException(status_code=400, detail="Template not found")
    
    action = EmailAction(**action_data.dict())
    db.add(action)
    db.commit()
    db.refresh(action)
    
    return action


@router.get("/actions/{action_id}", response_model=email_schemas.EmailAction)
def get_action(
    action_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get specific email action"""
    action = db.query(EmailAction).filter(EmailAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    return action


@router.put("/actions/{action_id}", response_model=email_schemas.EmailAction)
def update_action(
    action_id: int,
    action_data: email_schemas.EmailActionUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update email action"""
    action = db.query(EmailAction).filter(EmailAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    # Check if new name conflicts with existing action
    if action_data.name and action_data.name != action.name:
        existing = db.query(EmailAction).filter(EmailAction.name == action_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Action name already exists")
    
    # Validate template exists if provided
    if action_data.template_id:
        template = db.query(EmailTemplate).filter(EmailTemplate.id == action_data.template_id).first()
        if not template:
            raise HTTPException(status_code=400, detail="Template not found")
    
    # Update fields
    for field, value in action_data.dict(exclude_unset=True).items():
        setattr(action, field, value)
    
    db.commit()
    db.refresh(action)
    
    return action


@router.delete("/actions/{action_id}")
def delete_action(
    action_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete email action"""
    action = db.query(EmailAction).filter(EmailAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    # Keep logs for audit purposes, just delete the action
    db.delete(action)
    db.commit()
    
    return {"message": "Action deleted successfully"}


# Email Action Logs
@router.get("/logs", response_model=List[email_schemas.EmailActionLog])
def get_logs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    action_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get email action logs"""
    query = db.query(EmailActionLog)
    
    if action_id:
        query = query.filter(EmailActionLog.action_id == action_id)
    if user_id:
        query = query.filter(EmailActionLog.user_id == user_id)
    if status:
        query = query.filter(EmailActionLog.status == status)
    
    logs = query.order_by(EmailActionLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return logs


# System Management
@router.get("/stats", response_model=email_schemas.EmailSystemStats)
def get_system_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get email system statistics"""
    total_templates = db.query(EmailTemplate).count()
    total_actions = db.query(EmailAction).count()
    active_actions = db.query(EmailAction).filter(EmailAction.is_active == True).count()
    recent_logs_count = db.query(EmailActionLog).filter(
        EmailActionLog.created_at >= func.now() - text("INTERVAL '7 days'")
    ).count()
    
    # Category statistics
    categories_stats = []
    for category in email_schemas.EMAIL_CATEGORIES:
        templates_count = db.query(EmailTemplate).filter(EmailTemplate.category == category).count()
        actions_count = db.query(EmailAction).filter(EmailAction.category == category).count()
        active_actions_count = db.query(EmailAction).filter(
            EmailAction.category == category,
            EmailAction.is_active == True
        ).count()
        
        categories_stats.append(email_schemas.EmailCategoryStats(
            category=category,
            templates_count=templates_count,
            actions_count=actions_count,
            active_actions_count=active_actions_count
        ))
    
    return email_schemas.EmailSystemStats(
        total_templates=total_templates,
        total_actions=total_actions,
        active_actions=active_actions,
        categories_stats=categories_stats,
        recent_logs_count=recent_logs_count
    )


# Trigger Actions
@router.post("/trigger")
async def trigger_email_action(
    trigger_request: email_schemas.TriggerEmailRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Manually trigger email action"""
    results = await email_service.trigger_email_action(
        db=db,
        trigger_event=trigger_request.trigger_event,
        user_id=trigger_request.user_id,
        trigger_data=trigger_request.trigger_data
    )
    
    return {
        "message": f"Triggered {len(results)} email action(s)",
        "success_count": sum(results),
        "results": results
    }


@router.post("/send-template")
async def send_template_email(
    send_request: email_schemas.SendTemplateEmailRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Send email using specific template"""
    try:
        # Render template
        subject, html_content = await email_service.render_template_from_db(
            template_id=send_request.template_id,
            db=db,
            **(send_request.variables or {})
        )
        
        # Create log entry for template test email
        log_entry = EmailActionLog(
            action_id=None,  # No specific action for manual template sends
            template_id=send_request.template_id,
            user_id=current_user.id,  # Use the admin user who sent the test
            recipient_email=send_request.recipient_email,
            subject=subject,
            status="pending",
            trigger_data={
                "manual_template_send": True, 
                "sent_by_admin": current_user.email,
                "template_variables": send_request.variables or {}
            },
            created_at=datetime.now()
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        # Send email
        success = await email_service.send_email_async(
            to_emails=[send_request.recipient_email],
            subject=subject,
            html_content=html_content
        )
        
        # Update log entry with result
        log_entry.status = "sent" if success else "failed"
        log_entry.sent_at = datetime.now() if success else None
        if not success:
            log_entry.error_message = "Failed to send template email"
        db.commit()
        
        return {
            "message": "Email sent successfully" if success else "Failed to send email",
            "success": success,
            "subject": subject
        }
        
    except Exception as e:
        # Update log entry with error if it exists
        if 'log_entry' in locals():
            log_entry.status = "failed"
            log_entry.error_message = str(e)
            db.commit()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/send-bulk")
async def send_bulk_email(
    bulk_request: email_schemas.BulkEmailRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Send bulk email using template"""
    if len(bulk_request.recipient_emails) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 recipients allowed")
    
    try:
        # Render template
        subject, html_content = await email_service.render_template_from_db(
            template_id=bulk_request.template_id,
            db=db,
            **(bulk_request.variables or {})
        )
        
        # Create log entries for each recipient
        log_entries = []
        for recipient_email in bulk_request.recipient_emails:
            log_entry = EmailActionLog(
                action_id=None,  # No specific action for manual bulk sends
                template_id=bulk_request.template_id,
                user_id=current_user.id,  # Use the admin user who sent the bulk email
                recipient_email=recipient_email,
                subject=subject,
                status="pending",
                trigger_data={
                    "bulk_email_send": True, 
                    "sent_by_admin": current_user.email,
                    "template_variables": bulk_request.variables or {},
                    "total_recipients": len(bulk_request.recipient_emails)
                },
                created_at=datetime.now()
            )
            db.add(log_entry)
            log_entries.append(log_entry)
        
        db.commit()
        for log_entry in log_entries:
            db.refresh(log_entry)
        
        # Send email
        success = await email_service.send_email_async(
            to_emails=bulk_request.recipient_emails,
            subject=subject,
            html_content=html_content
        )
        
        # Update log entries with result
        for log_entry in log_entries:
            log_entry.status = "sent" if success else "failed"
            log_entry.sent_at = datetime.now() if success else None
            if not success:
                log_entry.error_message = "Failed to send bulk email"
        db.commit()
        
        return {
            "message": f"Bulk email sent to {len(bulk_request.recipient_emails)} recipients",
            "success": success,
            "subject": subject,
            "recipient_count": len(bulk_request.recipient_emails)
        }
        
    except Exception as e:
        # Update log entries with error if they exist
        if 'log_entries' in locals():
            for log_entry in log_entries:
                log_entry.status = "failed"
                log_entry.error_message = str(e)
            db.commit()
        raise HTTPException(status_code=400, detail=str(e))


# Configuration endpoints
@router.get("/categories")
def get_categories(
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get available email categories"""
    return {"categories": email_schemas.EMAIL_CATEGORIES}


@router.get("/trigger-events")
def get_trigger_events(
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get available trigger events"""
    return {"trigger_events": email_schemas.TRIGGER_EVENTS} 
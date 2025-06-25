import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from typing import List, Optional, Dict, Any
import asyncio
import aiosmtplib
from jinja2 import Environment, FileSystemLoader, Template
from premailer import transform
import logging
from datetime import datetime, timezone

from app.core.config import settings
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_use_tls = settings.SMTP_USE_TLS
        self.smtp_use_ssl = settings.SMTP_USE_SSL
        self.from_name = settings.EMAIL_FROM_NAME
        self.from_address = settings.EMAIL_FROM_ADDRESS
        self.enabled = settings.EMAIL_ENABLED
        
        # Setup Jinja2 environment for email templates
        template_dir = Path(settings.EMAIL_TEMPLATES_DIR)
        if template_dir.exists():
            self.jinja_env = Environment(
                loader=FileSystemLoader(template_dir),
                autoescape=True
            )
        else:
            self.jinja_env = None
            logger.warning(f"Email templates directory not found: {template_dir}")
    
    def _get_template_context(self, **kwargs) -> Dict[str, Any]:
        """Get default template context with common variables"""
        return {
            'company_name': 'Emisify',
            'platform_name': 'Emisify Platform',
            'support_email': settings.EMAIL_SUPPORT_ADDRESS,
            'admin_email': settings.EMAIL_ADMIN_ADDRESS,
            'website_url': f'https://{settings.MAIN_DOMAIN}',
            'app_url': f'https://{settings.APP_DOMAIN}',
            'admin_url': f'https://{settings.ADMIN_DOMAIN}',
            'logo_url': settings.COMPANY_LOGO_URL,
            'assets_url': settings.EMAIL_ASSETS_URL,
            'current_year': datetime.now(timezone.utc).year,
            **kwargs
        }
    
    def render_template(self, template_name: str, **kwargs) -> tuple[str, str]:
        """Render email template and return (subject, html_content)"""
        if not self.jinja_env:
            raise Exception("Email templates not available")
        
        try:
            template = self.jinja_env.get_template(f"{template_name}.html")
            context = self._get_template_context(**kwargs)
            
            # Render the template
            html_content = template.render(**context)
            
            # Transform CSS to inline styles for better email client compatibility
            html_content = transform(html_content)
            
            # Extract subject from template if it has a subject block
            subject_template = self.jinja_env.from_string("{{ subject | default('Emisify Notification') }}")
            subject = subject_template.render(**context)
            
            return subject, html_content
            
        except Exception as e:
            logger.error(f"Error rendering email template {template_name}: {str(e)}")
            raise
    
    def create_fallback_html(self, subject: str, content: str) -> str:
        """Create simple HTML email when templates are not available"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{subject}</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2563eb; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px 20px; background: #f9fafb; }}
                .footer {{ background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Emisify Platform</h1>
                </div>
                <div class="content">
                    {content}
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now(timezone.utc).year} Emisify. All rights reserved.</p>
                    <p>Contact us: {settings.EMAIL_SUPPORT_ADDRESS}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    async def render_template_from_db(self, template_id: int, db: Session, **variables) -> tuple[str, str]:
        """Render email template from database"""
        from app.models.email import EmailTemplate
        
        template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
        if not template:
            raise Exception(f"Email template with id {template_id} not found")
        
        if not template.is_active:
            raise Exception(f"Email template {template.name} is not active")
        
        # Get template context with variables
        context = self._get_template_context(**variables)
        
        # Render subject and content using Jinja2
        subject_template = Template(template.subject)
        content_template = Template(template.html_content)
        
        subject = subject_template.render(**context)
        html_content = content_template.render(**context)
        
        # Transform CSS to inline styles
        html_content = transform(html_content)
        
        return subject, html_content
    
    async def trigger_email_action(self, db: Session, trigger_event: str, user_id: int, trigger_data: Optional[Dict[str, Any]] = None) -> List[bool]:
        """Trigger email actions based on event"""
        from app.models.email import EmailAction, EmailActionLog
        from app.models.user import User
        
        # Find active actions for this trigger event
        actions = db.query(EmailAction).filter(
            EmailAction.trigger_event == trigger_event,
            EmailAction.is_active == True,
            EmailAction.template_id.isnot(None)
        ).all()
        
        if not actions:
            logger.info(f"No active email actions found for trigger: {trigger_event}")
            return []
        
        # Get user details
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User with id {user_id} not found")
            return []
        
        results = []
        
        for action in actions:
            try:
                # Check if action should be executed based on conditions
                if action.conditions:
                    # TODO: Implement condition checking logic
                    pass
                
                # Prepare template variables
                template_vars = {
                    'user_name': user.full_name or user.email,
                    'user_email': user.email,
                    **(trigger_data or {})
                }
                
                # Render template
                subject, html_content = await self.render_template_from_db(
                    action.template_id, db, **template_vars
                )
                
                # Create log entry
                log_entry = EmailActionLog(
                    action_id=action.id,
                    user_id=user.id,
                    template_id=action.template_id,
                    recipient_email=user.email,
                    subject=subject,
                    trigger_data=trigger_data,
                    status="pending"
                )
                db.add(log_entry)
                db.commit()
                
                # Send email
                if action.send_immediately:
                    success = await self.send_email_async(
                        to_emails=[user.email],
                        subject=subject,
                        html_content=html_content
                    )
                    
                    # Update log entry
                    log_entry.status = "sent" if success else "failed"
                    log_entry.sent_at = datetime.now() if success else None
                    if not success:
                        log_entry.error_message = "Failed to send email"
                    
                    db.commit()
                    results.append(success)
                else:
                    # TODO: Schedule delayed sending
                    log_entry.status = "scheduled"
                    db.commit()
                    results.append(True)
                
            except Exception as e:
                logger.error(f"Error executing email action {action.name}: {str(e)}")
                
                # Update log entry with error
                if 'log_entry' in locals():
                    log_entry.status = "failed"
                    log_entry.error_message = str(e)
                    db.commit()
                
                results.append(False)
        
        return results
    
    async def send_email_async(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """Send email asynchronously using aiosmtplib"""
        
        if not self.enabled:
            logger.info(f"Email sending disabled, would send to {to_emails}")
            return True
            
        if not self.smtp_password:
            logger.warning("SMTP password not configured, skipping email send")
            return False
        
        try:
            # Create message with Gmail-friendly headers
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_address}>"
            message['To'] = ', '.join(to_emails)
            message['Date'] = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S +0000')
            message['Message-ID'] = f"<{datetime.now(timezone.utc).timestamp()}@{self.smtp_host}>"
            message['MIME-Version'] = '1.0'
            
            if cc_emails:
                message['Cc'] = ', '.join(cc_emails)
            
            if reply_to:
                message['Reply-To'] = reply_to
            else:
                message['Reply-To'] = self.from_address
            
            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                message.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html', 'utf-8')
            message.attach(html_part)
            
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment['content'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["filename"]}'
                    )
                    message.attach(part)
            
            # Combine all recipients
            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)
            
            # Send email with proper TLS configuration and connection management
            smtp_kwargs = {
                'hostname': self.smtp_host,
                'port': self.smtp_port,
                'username': self.smtp_username,
                'password': self.smtp_password,
                'timeout': 30,  # 30 second timeout
                'source_address': None,  # Let system choose
            }
            
            if self.smtp_use_ssl:
                # SSL connection (port 465)
                smtp_kwargs.update({
                    'use_tls': True,
                    'start_tls': False,
                    'validate_certs': True,
                })
            else:
                # STARTTLS connection (port 587) - better for Gmail
                smtp_kwargs.update({
                    'use_tls': False,
                    'start_tls': self.smtp_use_tls,
                    'validate_certs': True,
                })
            
            # Retry logic for better reliability with Gmail and other providers
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    # Use connection context manager for better connection handling
                    async with aiosmtplib.SMTP(**smtp_kwargs) as server:
                        await server.send_message(message, recipients=all_recipients)
                    break  # Success, exit retry loop
                    
                except (aiosmtplib.SMTPException, ConnectionResetError, OSError) as e:
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 2  # Exponential backoff: 2, 4, 6 seconds
                        logger.warning(f"Email send attempt {attempt + 1} failed, retrying in {wait_time}s: {str(e)}")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        raise e  # Last attempt failed, raise the exception
            
            logger.info(f"Email sent successfully to {to_emails}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_emails}: {str(e)}")
            return False
    
    def send_email_sync(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """Send email synchronously using smtplib (for compatibility)"""
        
        if not self.enabled:
            logger.info(f"Email sending disabled, would send to {to_emails}")
            return True
            
        if not self.smtp_password:
            logger.warning("SMTP password not configured, skipping email send")
            return False
        
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_address}>"
            message['To'] = ', '.join(to_emails)
            
            if cc_emails:
                message['Cc'] = ', '.join(cc_emails)
                
            if reply_to:
                message['Reply-To'] = reply_to
            
            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                message.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html', 'utf-8')
            message.attach(html_part)
            
            # Combine all recipients
            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)
            
            # Create SMTP session
            if self.smtp_use_ssl:
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                if self.smtp_use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
            
            # Login and send
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(message, to_addrs=all_recipients)
            server.quit()
            
            logger.info(f"Email sent successfully to {to_emails}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_emails}: {str(e)}")
            return False
    
    # Convenience methods for common email types
    async def send_template_email(
        self,
        to_emails: List[str],
        template_name: str,
        subject: Optional[str] = None,
        **template_kwargs
    ) -> bool:
        """Send email using a template"""
        try:
            template_subject, html_content = self.render_template(template_name, **template_kwargs)
            final_subject = subject or template_subject
            return await self.send_email_async(to_emails, final_subject, html_content)
        except Exception as e:
            logger.error(f"Failed to send template email {template_name}: {str(e)}")
            return False
    
    async def send_simple_email(
        self,
        to_emails: List[str],
        subject: str,
        content: str,
        is_html: bool = False
    ) -> bool:
        """Send simple email with basic content"""
        try:
            if is_html:
                html_content = content
            else:
                html_content = self.create_fallback_html(subject, content.replace('\n', '<br>'))
            
            return await self.send_email_async(to_emails, subject, html_content)
        except Exception as e:
            logger.error(f"Failed to send simple email: {str(e)}")
            return False

# Create global email service instance
email_service = EmailService()

# Email notification functions for different events
class EmailNotifications:
    
    @staticmethod
    async def send_welcome_email(user_email: str, user_name: str) -> bool:
        """Send welcome email to new user"""
        try:
            return await email_service.send_template_email(
                to_emails=[user_email],
                template_name="welcome",
                user_name=user_name,
                subject="Welcome to Emisify Platform"
            )
        except Exception:
            # Fallback to simple email
            content = f"""
            <h2>Welcome to Emisify Platform, {user_name}!</h2>
            <p>Thank you for joining our green energy trading marketplace.</p>
            <p>You can now:</p>
            <ul>
                <li>Browse and trade green energy assets</li>
                <li>Complete your KYC verification</li>
                <li>Access educational resources</li>
                <li>Manage your subscription</li>
            </ul>
            <p>Get started by logging into your account.</p>
            """
            return await email_service.send_simple_email(
                [user_email], 
                "Welcome to Emisify Platform",
                content,
                is_html=True
            )
    
    @staticmethod
    async def send_kyc_status_email(user_email: str, user_name: str, status: str, reason: Optional[str] = None) -> bool:
        """Send KYC status update email"""
        try:
            return await email_service.send_template_email(
                to_emails=[user_email],
                template_name="kyc_status",
                user_name=user_name,
                status=status,
                reason=reason,
                subject=f"KYC Verification {status.title()}"
            )
        except Exception:
            # Fallback to simple email
            if status == "approved":
                content = f"""
                <h2>KYC Verification Approved</h2>
                <p>Hello {user_name},</p>
                <p>Your KYC verification has been approved! You now have full access to trading features.</p>
                """
            elif status == "rejected":
                content = f"""
                <h2>KYC Verification Requires Attention</h2>
                <p>Hello {user_name},</p>
                <p>Your KYC verification needs additional information.</p>
                {f'<p><strong>Reason:</strong> {reason}</p>' if reason else ''}
                <p>Please resubmit your verification documents.</p>
                """
            else:
                content = f"""
                <h2>KYC Verification Status Update</h2>
                <p>Hello {user_name},</p>
                <p>Your KYC verification status has been updated to: <strong>{status}</strong></p>
                """
            
            return await email_service.send_simple_email(
                [user_email], 
                f"KYC Verification {status.title()}",
                content,
                is_html=True
            )
    
    @staticmethod
    async def send_password_reset_email(user_email: str, reset_token: str) -> bool:
        """Send password reset email"""
        try:
            reset_url = f"https://{settings.APP_DOMAIN}/reset-password?token={reset_token}"
            return await email_service.send_template_email(
                to_emails=[user_email],
                template_name="password_reset",
                reset_url=reset_url,
                subject="Password Reset Request"
            )
        except Exception:
            # Fallback to simple email
            reset_url = f"https://{settings.APP_DOMAIN}/reset-password?token={reset_token}"
            content = f"""
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="{reset_url}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this, please ignore this email.</p>
            """
            return await email_service.send_simple_email(
                [user_email], 
                "Password Reset Request",
                content,
                is_html=True
            )
    
    @staticmethod
    async def send_subscription_email(user_email: str, user_name: str, action: str, plan_name: str) -> bool:
        """Send subscription-related email"""
        try:
            return await email_service.send_template_email(
                to_emails=[user_email],
                template_name="subscription",
                user_name=user_name,
                action=action,
                plan_name=plan_name,
                subject=f"Subscription {action.title()}"
            )
        except Exception:
            # Fallback to simple email
            content = f"""
            <h2>Subscription {action.title()}</h2>
            <p>Hello {user_name},</p>
            <p>Your subscription to <strong>{plan_name}</strong> has been {action}.</p>
            <p>Thank you for using Emisify Platform!</p>
            """
            return await email_service.send_simple_email(
                [user_email], 
                f"Subscription {action.title()}",
                content,
                is_html=True
            )
    
    @staticmethod
    async def send_admin_notification(subject: str, content: str, admin_emails: Optional[List[str]] = None) -> bool:
        """Send notification to admin users"""
        if not admin_emails:
            admin_emails = [settings.EMAIL_ADMIN_ADDRESS]
        
        return await email_service.send_simple_email(
            admin_emails,
            f"[Admin] {subject}",
            content,
            is_html=True
        )
    
    @staticmethod
    async def send_trading_notification(user_email: str, user_name: str, notification_type: str, **kwargs) -> bool:
        """Send trading-related notifications"""
        try:
            return await email_service.send_template_email(
                to_emails=[user_email],
                template_name="trading_notification",
                user_name=user_name,
                notification_type=notification_type,
                subject=f"Trading Notification: {notification_type.title()}",
                **kwargs
            )
        except Exception:
            # Fallback to simple email
            content = f"""
            <h2>Trading Notification</h2>
            <p>Hello {user_name},</p>
            <p>You have a new trading notification: <strong>{notification_type}</strong></p>
            <p>Please check your account for more details.</p>
            """
            return await email_service.send_simple_email(
                [user_email], 
                f"Trading Notification: {notification_type.title()}",
                content,
                is_html=True
            )

# Export the service and notifications
__all__ = ['email_service', 'EmailNotifications'] 
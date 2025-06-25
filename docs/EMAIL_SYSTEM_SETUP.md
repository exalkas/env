# Email Notification System - Setup & Usage Guide

## Overview

The Emisify platform includes a comprehensive email notification system designed to handle all user communications including welcome emails, KYC notifications, subscription updates, trading alerts, and administrative messages.

## Features

### ✅ **Core Functionality**

- **SMTP Integration**: Works with any SMTP provider (optimized for ImprovMX/emisify.com)
- **Template System**: Professional HTML email templates with Jinja2 rendering
- **Async Support**: Non-blocking email sending for better performance
- **Fallback System**: Graceful degradation when templates aren't available
- **Multiple Recipients**: Support for CC, BCC, and bulk sending
- **Admin Interface**: Complete email management through API endpoints

### ✅ **Email Types Supported**

- Welcome emails for new user registration
- KYC verification status updates
- Password reset requests
- Subscription notifications (activated, renewed, cancelled, etc.)
- Trading notifications (orders, transactions, alerts)
- Administrative notifications
- Custom bulk emails

### ✅ **Security & Reliability**

- SSL/TLS encryption support
- Email validation and sanitization
- Error handling and logging
- Rate limiting protection
- Template injection prevention

## Quick Start

### 1. Install Dependencies

The required packages are already included in `requirements.txt`:

```txt
# Email & Templates
jinja2==3.1.2
aiosmtplib==3.0.1
premailer==3.10.0
```

Install them:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add these variables to your `backend/.env` file:

```env
# Email Configuration (Required)
SMTP_HOST=smtp.emisify.com
SMTP_PORT=587
SMTP_USERNAME=noreply@emisify.com
SMTP_PASSWORD=your_smtp_password_here
SMTP_USE_TLS=true

# Email Settings (Optional)
EMAIL_ENABLED=true
EMAIL_FROM_NAME=Emisify Platform
EMAIL_FROM_ADDRESS=noreply@emisify.com
EMAIL_SUPPORT_ADDRESS=support@emisify.com
EMAIL_ADMIN_ADDRESS=admin@emisify.com
```

### 3. Test the System

Run the test script to verify your configuration:

```bash
cd backend
python test_email_system.py
```

### 4. Start Using Email Notifications

Email notifications are automatically integrated into:

- User registration (welcome emails)
- KYC status changes
- And more can be added easily

## SMTP Configuration

### For ImprovMX Users

If you're using ImprovMX with your `emisify.com` domain:

```env
SMTP_HOST=smtp.emisify.com
SMTP_PORT=587
SMTP_USERNAME=noreply@emisify.com
SMTP_PASSWORD=your_email_password
SMTP_USE_TLS=true
```

### For Other Providers

#### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_USE_TLS=true
```

#### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_USE_TLS=true
```

#### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@your-domain.com
SMTP_PASSWORD=your-mailgun-password
SMTP_USE_TLS=true
```

## Email Templates

### Template Structure

Templates are located in `backend/app/templates/email/` and use Jinja2 syntax:

- `base.html` - Base template with common styling
- `welcome.html` - Welcome email for new users
- `kyc_status.html` - KYC verification notifications
- `password_reset.html` - Password reset emails
- `subscription.html` - Subscription-related emails
- `trading_notification.html` - Trading alerts and notifications

### Template Variables

All templates have access to these common variables:

```python
{
    'company_name': 'Emisify',
    'platform_name': 'Emisify Platform',
    'support_email': 'support@emisify.com',
    'admin_email': 'admin@emisify.com',
    'website_url': 'https://emisify.com',
    'app_url': 'https://app.emisify.com',
    'admin_url': 'https://admin.emisify.com',
    'logo_url': 'https://emisify.com/logo.png',
    'current_year': 2024
}
```

### Creating Custom Templates

1. Create a new `.html` file in `backend/app/templates/email/`
2. Extend the base template:

```html
{% extends "base.html" %} {% set subject = "Your Custom Subject" %} {% block
content %}
<div class="greeting">Hello {{ user_name }},</div>
<div class="content-text">Your custom email content here.</div>
{% endblock %}
```

3. Use the template in your code:

```python
await email_service.send_template_email(
    to_emails=["user@example.com"],
    template_name="your_template",
    user_name="John Doe"
)
```

## API Endpoints

### Admin Email Management

All endpoints require admin authentication and are prefixed with `/api/v1/email/`:

#### GET `/stats`

Get email system statistics and configuration

#### POST `/test`

Send a test email

```json
{
  "to_email": "test@example.com",
  "subject": "Test Email",
  "content": "This is a test",
  "is_html": true
}
```

#### POST `/send-template`

Send email using a template

```json
{
  "template_name": "welcome",
  "to_emails": ["user@example.com"],
  "template_variables": {
    "user_name": "John Doe"
  }
}
```

#### POST `/bulk-send`

Send bulk email (max 100 recipients)

```json
{
  "to_emails": ["user1@example.com", "user2@example.com"],
  "subject": "Important Announcement",
  "content": "<h2>Hello everyone</h2>",
  "is_html": true
}
```

#### GET `/templates`

List available email templates with variables

#### GET `/users/all-emails`

Get list of all user emails for bulk operations

### User-Specific Notifications

#### POST `/notify/welcome/{user_id}`

Manually send welcome email to a user

#### POST `/notify/kyc-status/{user_id}`

Send KYC status notification

```json
{
  "status": "approved",
  "reason": "Optional reason for rejection"
}
```

#### POST `/notify/subscription/{user_id}`

Send subscription notification

```json
{
  "action": "activated",
  "plan_name": "Premium Plan"
}
```

## Integration Examples

### Welcome Email on Registration

Already integrated in `backend/app/api/endpoints/auth.py`:

```python
# Send welcome email asynchronously
try:
    asyncio.create_task(
        EmailNotifications.send_welcome_email(
            user_email=db_user.email,
            user_name=db_user.full_name or db_user.email.split('@')[0]
        )
    )
except Exception as e:
    print(f"Failed to send welcome email: {e}")
```

### KYC Status Updates

Already integrated in `backend/app/api/endpoints/kyc.py`:

```python
# Send status update email to user
try:
    user = db.query(User).filter(User.id == submission.user_id).first()
    if user:
        asyncio.create_task(
            EmailNotifications.send_kyc_status_email(
                user_email=user.email,
                user_name=user.full_name or user.email.split('@')[0],
                status=review_data.status,
                reason=review_data.rejection_reason
            )
        )
except Exception as e:
    print(f"Failed to send KYC status email: {e}")
```

### Custom Notifications

```python
from app.services.email_service import EmailNotifications

# Trading notification
await EmailNotifications.send_trading_notification(
    user_email="user@example.com",
    user_name="John Doe",
    notification_type="order_filled",
    asset_name="Solar Credits",
    order_type="buy",
    quantity="100 MWh",
    price="€45.50/MWh"
)

# Admin notification
await EmailNotifications.send_admin_notification(
    subject="System Alert",
    content="<h3>High Trading Volume Detected</h3><p>Please monitor the system.</p>"
)
```

## Troubleshooting

### Common Issues

#### 1. Email Not Sending

- Check SMTP credentials in `.env` file
- Verify SMTP server settings (host, port, TLS)
- Check firewall/security group settings
- Run `python test_email_system.py` for diagnosis

#### 2. Templates Not Rendering

- Ensure `backend/app/templates/email/` directory exists
- Check template file names (no spaces, .html extension)
- Verify Jinja2 syntax in templates

#### 3. Authentication Errors

- For Gmail: Use app-specific passwords, not regular password
- For ImprovMX: Ensure domain MX records are configured
- Check username format (some providers need full email)

#### 4. Email Delivery Issues

- Check spam folders
- Verify SPF/DKIM records for your domain
- Consider using a dedicated email service for production

### Debug Mode

Enable debug logging by setting:

```env
EMAIL_ENABLED=true
```

This will log email attempts without failing operations.

### Testing Without SMTP

For development, you can disable actual email sending:

```env
EMAIL_ENABLED=false
```

Emails will be logged but not sent.

## Production Recommendations

### 1. Email Service Providers

For production, consider these reliable providers:

- **SendGrid**: High deliverability, good API
- **Mailgun**: Developer-friendly, competitive pricing
- **Amazon SES**: Cost-effective, integrates with AWS
- **Postmark**: Excellent for transactional emails

### 2. Domain Authentication

Set up these DNS records for better deliverability:

- **SPF Record**: Authorize sending servers
- **DKIM**: Digital signature for emails
- **DMARC**: Email authentication protocol

### 3. Monitoring

- Monitor email delivery rates
- Track bounce rates and spam complaints
- Set up alerts for failed sends
- Regular template testing

### 4. Security

- Use strong, unique SMTP passwords
- Enable 2FA where available
- Regularly rotate credentials
- Monitor for unauthorized access

## Advanced Configuration

### Rate Limiting

Add rate limiting to prevent abuse:

```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

@router.post("/bulk-send")
@RateLimiter(times=5, seconds=300)  # 5 emails per 5 minutes
async def send_bulk_email(...):
    # Implementation
```

### Email Queue

For high-volume sending, implement a queue system:

```python
import celery

@celery.task
def send_email_task(to_email, subject, content):
    # Send email asynchronously
    pass
```

### Template Management

Create a database model for dynamic template management:

```python
class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    subject = Column(String)
    html_content = Column(Text)
    variables = Column(JSON)
    is_active = Column(Boolean, default=True)
```

## Support

If you need help with the email system:

1. Run the test script: `python test_email_system.py`
2. Check the logs for error messages
3. Verify your SMTP provider's documentation
4. Contact the development team with specific error messages

The email system is designed to be robust and handle failures gracefully, ensuring your application continues to work even if email delivery encounters issues.

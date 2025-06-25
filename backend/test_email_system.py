#!/usr/bin/env python3
"""
Email System Test Script
Tests the email notification system without requiring full application startup
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.core.config import settings
from app.services.email_service import email_service, EmailNotifications

async def test_email_configuration():
    """Test basic email configuration"""
    print("🔧 Testing Email Configuration...")
    print(f"   SMTP Host: {settings.SMTP_HOST}")
    print(f"   SMTP Port: {settings.SMTP_PORT}")
    print(f"   SMTP Username: {settings.SMTP_USERNAME}")
    print(f"   SMTP Password Configured: {'✅' if settings.SMTP_PASSWORD else '❌'}")
    print(f"   SMTP TLS: {'✅' if settings.SMTP_USE_TLS else '❌'}")
    print(f"   Email Enabled: {'✅' if settings.EMAIL_ENABLED else '❌'}")
    print(f"   From Address: {settings.EMAIL_FROM_ADDRESS}")
    print()

async def test_email_templates():
    """Test email template availability"""
    print("📧 Testing Email Templates...")
    
    template_dir = Path(settings.EMAIL_TEMPLATES_DIR)
    if template_dir.exists():
        print(f"   Templates Directory: ✅ {template_dir}")
        templates = list(template_dir.glob("*.html"))
        print(f"   Available Templates:")
        for template in templates:
            print(f"     - {template.name}")
    else:
        print(f"   Templates Directory: ❌ {template_dir} not found")
    print()

async def test_template_rendering():
    """Test template rendering"""
    print("🎨 Testing Template Rendering...")
    
    try:
        # Test welcome template
        subject, html = email_service.render_template(
            "welcome",
            user_name="Test User"
        )
        print(f"   Welcome Template: ✅")
        print(f"     Subject: {subject}")
        print(f"     HTML Length: {len(html)} characters")
        
        # Test KYC template
        subject, html = email_service.render_template(
            "kyc_status",
            user_name="Test User",
            status="approved"
        )
        print(f"   KYC Status Template: ✅")
        print(f"     Subject: {subject}")
        print(f"     HTML Length: {len(html)} characters")
        
    except Exception as e:
        print(f"   Template Rendering: ❌ {str(e)}")
    print()

async def test_email_service_basic():
    """Test basic email service functionality"""
    print("⚙️  Testing Email Service...")
    
    # Test fallback HTML creation
    try:
        html = email_service.create_fallback_html(
            "Test Subject",
            "This is a test email content."
        )
        print(f"   Fallback HTML: ✅ ({len(html)} characters)")
    except Exception as e:
        print(f"   Fallback HTML: ❌ {str(e)}")
    
    # Test template context
    try:
        context = email_service._get_template_context(test_var="test_value")
        print(f"   Template Context: ✅ ({len(context)} variables)")
        print(f"     Company: {context.get('company_name')}")
        print(f"     Website: {context.get('website_url')}")
    except Exception as e:
        print(f"   Template Context: ❌ {str(e)}")
    print()

async def test_email_sending_mock():
    """Test email sending (mock mode)"""
    print("📤 Testing Email Sending (Mock Mode)...")
    
    # Temporarily disable email for testing
    original_enabled = email_service.enabled
    email_service.enabled = True  # Keep enabled for testing
    
    try:
        # Test simple email
        success = await email_service.send_simple_email(
            to_emails=["test@example.com"],
            subject="Test Email",
            content="This is a test email.",
            is_html=False
        )
        print(f"   Simple Email: {'✅' if success else '❌'}")
        
        # Test welcome notification
        success = await EmailNotifications.send_welcome_email(
            user_email="test@example.com",
            user_name="Test User"
        )
        print(f"   Welcome Notification: {'✅' if success else '❌'}")
        
        # Test KYC notification
        success = await EmailNotifications.send_kyc_status_email(
            user_email="test@example.com",
            user_name="Test User",
            status="approved"
        )
        print(f"   KYC Notification: {'✅' if success else '❌'}")
        
    except Exception as e:
        print(f"   Email Sending: ❌ {str(e)}")
    finally:
        email_service.enabled = original_enabled
    print()

async def test_real_email_sending():
    """Test real email sending if SMTP is configured"""
    print("🚀 Testing Real Email Sending...")
    
    if not settings.SMTP_PASSWORD:
        print("   ⚠️  SMTP password not configured - skipping real email test")
        print("   To test real email sending:")
        print("     1. Set SMTP_PASSWORD in your .env file")
        print("     2. Ensure SMTP_HOST and SMTP_USERNAME are correct")
        print("     3. Run this test again")
        return
    
    test_email = input("   Enter email address to send test email (or press Enter to skip): ").strip()
    if not test_email:
        print("   Skipped real email test")
        return
    
    try:
        success = await email_service.send_simple_email(
            to_emails=[test_email],
            subject="Emisify Email System Test",
            content="""
            <h2>Email System Test</h2>
            <p>This is a test email from the Emisify email notification system.</p>
            <p>If you receive this email, the email system is working correctly!</p>
            <p><strong>Test Details:</strong></p>
            <ul>
                <li>SMTP Host: {}</li>
                <li>From Address: {}</li>
                <li>Test Time: {}</li>
            </ul>
            """.format(
                settings.SMTP_HOST,
                settings.EMAIL_FROM_ADDRESS,
                asyncio.get_event_loop().time()
            ),
            is_html=True
        )
        
        if success:
            print(f"   ✅ Test email sent successfully to {test_email}")
            print("   Check your inbox (and spam folder) for the test email")
        else:
            print(f"   ❌ Failed to send test email to {test_email}")
            
    except Exception as e:
        print(f"   ❌ Real email sending failed: {str(e)}")
    print()

def print_environment_setup():
    """Print environment setup instructions"""
    print("🛠️  Environment Setup Instructions")
    print("=" * 50)
    print()
    print("To configure your email system, add these variables to your .env file:")
    print()
    print("# Email Configuration (Required)")
    print("SMTP_HOST=smtp.emisify.com")
    print("SMTP_PORT=587")
    print("SMTP_USERNAME=noreply@emisify.com")
    print("SMTP_PASSWORD=your_smtp_password_here")
    print("SMTP_USE_TLS=true")
    print()
    print("# Email Settings (Optional)")
    print("EMAIL_ENABLED=true")
    print("EMAIL_FROM_NAME=Emisify Platform")
    print("EMAIL_FROM_ADDRESS=noreply@emisify.com")
    print("EMAIL_SUPPORT_ADDRESS=support@emisify.com")
    print("EMAIL_ADMIN_ADDRESS=admin@emisify.com")
    print()
    print("# SMTP Configuration for ImprovMX:")
    print("# - Host: smtp.emisify.com (or your provider's SMTP server)")
    print("# - Port: 587 (STARTTLS) or 465 (SSL)")
    print("# - Username: your email address")
    print("# - Password: your email password or app-specific password")
    print()

async def main():
    """Main test function"""
    print("🧪 Emisify Email System Test")
    print("=" * 40)
    print()
    
    await test_email_configuration()
    await test_email_templates()
    await test_template_rendering()
    await test_email_service_basic()
    await test_email_sending_mock()
    await test_real_email_sending()
    
    print("📋 Test Summary")
    print("-" * 20)
    print("The email system has been tested. Review the results above.")
    print()
    
    if not settings.SMTP_PASSWORD:
        print_environment_setup()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc() 
"""email_system

Revision ID: d051faedee04
Revises: 021_create_enhanced_kyc_system
Create Date: 2024-12-28 17:12:39.659924

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd051faedee04'
down_revision: Union[str, None] = '021_create_enhanced_kyc_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create email_templates table
    op.create_table('email_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subject', sa.String(length=300), nullable=False),
        sa.Column('html_content', sa.Text(), nullable=False),
        sa.Column('variables', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_email_templates_category'), 'email_templates', ['category'], unique=False)
    op.create_index(op.f('ix_email_templates_is_active'), 'email_templates', ['is_active'], unique=False)

    # Create email_actions table
    op.create_table('email_actions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('trigger_event', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('send_immediately', sa.Boolean(), nullable=False, default=True),
        sa.Column('delay_minutes', sa.Integer(), nullable=False, default=0),
        sa.Column('conditions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_email_actions_category'), 'email_actions', ['category'], unique=False)
    op.create_index(op.f('ix_email_actions_is_active'), 'email_actions', ['is_active'], unique=False)

    # Create email_action_logs table
    op.create_table('email_action_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('action_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('recipient_email', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=300), nullable=False),
        sa.Column('trigger_data', sa.JSON(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['action_id'], ['email_actions.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_action_logs_status'), 'email_action_logs', ['status'], unique=False)
    op.create_index(op.f('ix_email_action_logs_sent_at'), 'email_action_logs', ['sent_at'], unique=False)

    # Insert default templates and actions
    from sqlalchemy import text
    connection = op.get_bind()
    
    # Welcome email template
    connection.execute(text("""
        INSERT INTO email_templates (name, category, display_name, description, subject, html_content, variables, is_default, is_active)
        VALUES (:name, :category, :display_name, :description, :subject, :html_content, :variables, :is_default, true)
    """), {
        'name': 'welcome',
        'category': 'authentication',
        'display_name': 'Welcome Email',
        'description': 'Welcome email sent to new users after registration',
        'subject': 'Welcome to Emisify Platform - Start Trading Green Energy!',
        'html_content': '''<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <h1 style="color: #2563eb;">Welcome to Emisify, {{ user_name }}! 🌱</h1>
    
    <p>Thank you for joining our green energy trading platform. We are excited to have you as part of our community working towards a sustainable future.</p>
    
    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Your account is now active!</strong><br>
        You can start exploring our platform and trading green energy assets.
    </div>
    
    <h3>Here is what you can do next:</h3>
    <ul>
        <li>Complete your KYC verification for full trading access</li>
        <li>Explore our marketplace of green energy assets</li>
        <li>Access educational resources about green energy trading</li>
        <li>Choose a subscription plan that fits your needs</li>
        <li>Start building your sustainable portfolio</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ app_url }}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Your Dashboard</a>
    </div>
    
    <p><strong>Need help getting started?</strong><br>
    Our support team is here to help. Contact us at <a href="mailto:{{ support_email }}">{{ support_email }}</a></p>
    
    <p>Welcome aboard!<br>
    <strong>The Emisify Team</strong></p>
</div>''',
        'variables': '["user_name", "app_url", "support_email"]',
        'is_default': True
    })

    # KYC submitted template
    connection.execute(text("""
        INSERT INTO email_templates (name, category, display_name, description, subject, html_content, variables, is_default, is_active)
        VALUES (:name, :category, :display_name, :description, :subject, :html_content, :variables, :is_default, true)
    """), {
        'name': 'kyc_submitted',
        'category': 'kyc',
        'display_name': 'KYC Submitted Confirmation',
        'description': 'Confirmation email when user submits KYC documents',
        'subject': 'KYC Verification Received - Under Review',
        'html_content': '''<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <h1 style="color: #2563eb;">Hello {{ user_name }},</h1>
    
    <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>📋 We have received your KYC verification documents.</strong><br>
        Our team is now reviewing your submission.
    </div>
    
    <p>Thank you for submitting your KYC verification. Here is what happens next:</p>
    
    <ul>
        <li>Our verification team will review your documents</li>
        <li>The review process typically takes 1-3 business days</li>
        <li>You will receive an email notification once review is complete</li>
        <li>You can continue using basic platform features while we review</li>
    </ul>
    
    <p>If you have any questions about the verification process, please contact our support team at <a href="mailto:{{ support_email }}">{{ support_email }}</a>.</p>
    
    <p>Best regards,<br>
    <strong>Emisify Verification Team</strong></p>
</div>''',
        'variables': '["user_name", "support_email"]',
        'is_default': True
    })

    # KYC approved template
    connection.execute(text("""
        INSERT INTO email_templates (name, category, display_name, description, subject, html_content, variables, is_default, is_active)
        VALUES (:name, :category, :display_name, :description, :subject, :html_content, :variables, :is_default, true)
    """), {
        'name': 'kyc_approved',
        'category': 'kyc',
        'display_name': 'KYC Approved Notification',
        'description': 'Notification when KYC verification is approved',
        'subject': 'KYC Verification Approved - Full Trading Access Granted!',
        'html_content': '''<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <h1 style="color: #2563eb;">Hello {{ user_name }},</h1>
    
    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #22c55e;">
        <strong>🎉 Congratulations! Your KYC verification has been approved.</strong><br>
        You now have full access to all trading features on our platform.
    </div>
    
    <p>Your identity verification has been successfully completed. You can now:</p>
    
    <ul>
        <li>Trade all available green energy assets</li>
        <li>Access higher transaction limits</li>
        <li>Participate in exclusive trading opportunities</li>
        <li>Withdraw funds without restrictions</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ app_url }}/market" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Trading Now</a>
    </div>
    
    <p>If you have any questions, please contact our support team at <a href="mailto:{{ support_email }}">{{ support_email }}</a>.</p>
    
    <p>Best regards,<br>
    <strong>Emisify Verification Team</strong></p>
</div>''',
        'variables': '["user_name", "app_url", "support_email"]',
        'is_default': True
    })

    # Insert welcome action
    connection.execute(text("""
        INSERT INTO email_actions (name, display_name, description, category, trigger_event, is_active, send_immediately, delay_minutes, template_id)
        SELECT 'user_registration', 'Welcome Email', 'Sent when user completes registration', 'authentication', 'after_user_signup', true, true, 0, et.id
        FROM email_templates et WHERE et.name = 'welcome'
    """))

    # Insert KYC submitted action
    connection.execute(text("""
        INSERT INTO email_actions (name, display_name, description, category, trigger_event, is_active, send_immediately, delay_minutes, template_id)
        SELECT 'kyc_submitted', 'KYC Submitted', 'Confirmation when KYC documents are submitted', 'kyc', 'after_kyc_submission', true, true, 0, et.id
        FROM email_templates et WHERE et.name = 'kyc_submitted'
    """))

    # Insert KYC approved action
    connection.execute(text("""
        INSERT INTO email_actions (name, display_name, description, category, trigger_event, is_active, send_immediately, delay_minutes, template_id)
        SELECT 'kyc_approved', 'KYC Approved', 'Notification when KYC is approved', 'kyc', 'after_kyc_approval', true, true, 0, et.id
        FROM email_templates et WHERE et.name = 'kyc_approved'
    """))


def downgrade() -> None:
    op.drop_table('email_action_logs')
    op.drop_table('email_actions')
    op.drop_table('email_templates') 
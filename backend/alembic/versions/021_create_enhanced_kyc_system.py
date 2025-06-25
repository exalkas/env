"""Create enhanced KYC system

Revision ID: 021_create_enhanced_kyc_system
Revises: 020_create_payment_tables
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '021_create_enhanced_kyc_system'
down_revision = '020_create_payment_tables'
branch_labels = None
depends_on = None

def upgrade():
    # Create KYC submissions table
    op.create_table('kyc_submissions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('status', sa.String(50), default='not_started', nullable=False),
        sa.Column('kyc_level', sa.String(20), default='unverified', nullable=False),
        sa.Column('submission_data', postgresql.JSONB(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Create KYC documents table
    op.create_table('kyc_documents',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('submission_id', sa.Integer(), sa.ForeignKey('kyc_submissions.id'), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('upload_date', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create KYC audit log table
    op.create_table('kyc_audit_log',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('submission_id', sa.Integer(), sa.ForeignKey('kyc_submissions.id'), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('old_status', sa.String(50), nullable=True),
        sa.Column('new_status', sa.String(50), nullable=True),
        sa.Column('performed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Add indexes for better performance
    op.create_index('idx_kyc_submissions_user_id', 'kyc_submissions', ['user_id'])
    op.create_index('idx_kyc_submissions_status', 'kyc_submissions', ['status'])
    op.create_index('idx_kyc_documents_submission_id', 'kyc_documents', ['submission_id'])
    op.create_index('idx_kyc_audit_log_submission_id', 'kyc_audit_log', ['submission_id'])

def downgrade():
    # Drop tables
    op.drop_table('kyc_audit_log')
    op.drop_table('kyc_documents') 
    op.drop_table('kyc_submissions')
    
    # Drop enums
    op.execute('DROP TYPE kyc_status')
    op.execute('DROP TYPE kyc_level') 
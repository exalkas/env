"""fix_certificates_table_schema

Revision ID: 854b8eb4a35f
Revises: 023_make_action_id_nullable
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '854b8eb4a35f'
down_revision = '023_make_action_id_nullable'
branch_labels = None
depends_on = None


def upgrade():
    # Fix the certificates table schema to match our model
    
    # 1. Rename certificate_id to certificate_name
    op.alter_column('certificates', 'certificate_id', new_column_name='certificate_name')
    
    # 2. Add missing columns
    op.add_column('certificates', sa.Column('certificate_url', sa.String(length=500), nullable=True))
    op.add_column('certificates', sa.Column('is_active', sa.Boolean(), nullable=True, default=True))
    
    # 3. Remove unwanted columns
    op.drop_column('certificates', 'expires_at')
    op.drop_column('certificates', 'created_at')
    
    # 4. Set default values for existing records
    op.execute("UPDATE certificates SET is_active = true WHERE is_active IS NULL")


def downgrade():
    # Reverse the changes
    
    # 1. Add back the removed columns
    op.add_column('certificates', sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('certificates', sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()))
    
    # 2. Remove the added columns
    op.drop_column('certificates', 'is_active')
    op.drop_column('certificates', 'certificate_url')
    
    # 3. Rename certificate_name back to certificate_id
    op.alter_column('certificates', 'certificate_name', new_column_name='certificate_id') 
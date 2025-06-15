"""Add daily analysis and CBAM categories

Revision ID: 011
Revises: 010
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None

def upgrade():
    # Add DAILY_ANALYSIS and CBAM categories
    connection = op.get_bind()
    
    # Insert new categories
    insert_query = """
    INSERT INTO news_categories (name, display_name, description, is_active, created_at, updated_at)
    VALUES 
        ('DAILY_ANALYSIS', 'Daily Analysis', 'AI-generated daily market analysis and reports', true, NOW(), NOW()),
        ('CBAM', 'CBAM', 'Carbon Border Adjustment Mechanism news and updates', true, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING
    """
    
    connection.execute(sa.text(insert_query))

def downgrade():
    # Remove DAILY_ANALYSIS and CBAM categories
    connection = op.get_bind()
    
    # Remove category associations first
    connection.execute(sa.text("""
        DELETE FROM news_category_associations 
        WHERE category_id IN (
            SELECT id FROM news_categories WHERE name IN ('DAILY_ANALYSIS', 'CBAM')
        )
    """))
    
    # Remove the categories
    connection.execute(sa.text("DELETE FROM news_categories WHERE name IN ('DAILY_ANALYSIS', 'CBAM')")) 
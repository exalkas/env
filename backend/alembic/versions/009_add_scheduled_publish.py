"""add scheduled publish field

Revision ID: 009
Revises: 008
Create Date: 2024-01-15 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    # Add scheduled_publish_at field to news table
    op.add_column('news', sa.Column('scheduled_publish_at', sa.DateTime(), nullable=True))
    print("✅ Added scheduled_publish_at column to news table")


def downgrade():
    # Remove scheduled_publish_at field from news table
    op.drop_column('news', 'scheduled_publish_at')
    print("✅ Removed scheduled_publish_at column from news table") 
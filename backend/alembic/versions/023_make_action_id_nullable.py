"""Make action_id nullable in email_action_logs

Revision ID: 023_make_action_id_nullable
Revises: d051faedee04
Create Date: 2025-06-25 21:50:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '023_make_action_id_nullable'
down_revision = 'd051faedee04'
branch_labels = None
depends_on = None


def upgrade():
    # Make action_id nullable to allow test emails without specific actions
    op.alter_column('email_action_logs', 'action_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)


def downgrade():
    # Make action_id not nullable again
    op.alter_column('email_action_logs', 'action_id',
                    existing_type=sa.INTEGER(),
                    nullable=False) 
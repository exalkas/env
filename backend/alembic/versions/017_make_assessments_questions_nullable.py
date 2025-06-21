"""Make assessments questions column nullable

Revision ID: 017_make_questions_nullable
Revises: 016_structured_assessments
Create Date: 2024-01-15 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '017_make_questions_nullable'
down_revision = '016_structured_assessments'
branch_labels = None
depends_on = None

def upgrade():
    # Make the questions column nullable since we're using the new structured approach
    op.alter_column('assessments', 'questions',
                   existing_type=sa.Text(),
                   nullable=True)

def downgrade():
    # Revert back to not nullable (this might fail if there are null values)
    op.alter_column('assessments', 'questions',
                   existing_type=sa.Text(),
                   nullable=False) 
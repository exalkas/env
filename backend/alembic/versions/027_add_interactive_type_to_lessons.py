"""Add interactive type to lessons

Revision ID: 027
Revises: 026
Create Date: 2024-01-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '027'
down_revision = '026'
branch_labels = None
depends_on = None


def upgrade():
    # Add interactive_type_id column to lessons table
    op.add_column('lessons', sa.Column('interactive_type_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_lessons_interactive_type_id',
        'lessons', 'interactive_lesson_types',
        ['interactive_type_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Create index for performance
    op.create_index(
        'ix_lessons_interactive_type_id',
        'lessons',
        ['interactive_type_id']
    )


def downgrade():
    # Remove index
    op.drop_index('ix_lessons_interactive_type_id', table_name='lessons')
    
    # Remove foreign key constraint
    op.drop_constraint('fk_lessons_interactive_type_id', 'lessons', type_='foreignkey')
    
    # Remove column
    op.drop_column('lessons', 'interactive_type_id') 
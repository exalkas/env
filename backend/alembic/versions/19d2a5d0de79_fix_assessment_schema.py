"""fix_assessment_schema

Revision ID: 19d2a5d0de79
Revises: 015
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '19d2a5d0de79'
down_revision: Union[str, None] = '015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use PostgreSQL information_schema to safely check for columns
    connection = op.get_bind()
    
    # 1. Add learning_path_id to assessments if it doesn't exist
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='assessments' AND column_name='learning_path_id'
    """))
    
    if not result.fetchone():
        # Column doesn't exist, add it
        op.add_column('assessments', sa.Column('learning_path_id', sa.Integer(), nullable=True))
        # Add foreign key constraint
        op.create_foreign_key('fk_assessments_learning_path', 'assessments', 'learning_paths', ['learning_path_id'], ['id'])
    
    # 2. Rename time_limit_minutes to time_limit if needed
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='assessments' AND column_name='time_limit_minutes'
    """))
    
    if result.fetchone():
        # Column exists, rename it
        op.alter_column('assessments', 'time_limit_minutes', new_column_name='time_limit')


def downgrade() -> None:
    # Reverse the changes
    connection = op.get_bind()
    
    # Check if time_limit exists and rename back to time_limit_minutes
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='assessments' AND column_name='time_limit'
    """))
    
    if result.fetchone():
        op.alter_column('assessments', 'time_limit', new_column_name='time_limit_minutes')
    
    # Remove learning_path_id column if it exists
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='assessments' AND column_name='learning_path_id'
    """))
    
    if result.fetchone():
        # Drop foreign key first
        op.drop_constraint('fk_assessments_learning_path', 'assessments', type_='foreignkey')
        # Drop column
        op.drop_column('assessments', 'learning_path_id') 
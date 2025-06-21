"""create question categories table

Revision ID: 018_question_categories
Revises: 017_make_questions_nullable
Create Date: 2024-01-20

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '018_question_categories'
down_revision = '017_make_questions_nullable'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create question_categories table
    op.create_table(
        'question_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_question_categories_id'), 'question_categories', ['id'], unique=False)
    op.create_index(op.f('ix_question_categories_name'), 'question_categories', ['name'], unique=True)

    # Insert default question categories based on current question usage
    question_categories_table = sa.table(
        'question_categories',
        sa.column('name', sa.String),
        sa.column('display_name', sa.String),
        sa.column('description', sa.String),
        sa.column('color', sa.String),
        sa.column('is_active', sa.Boolean),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime),
    )
    
    current_time = datetime.utcnow()
    
    op.bulk_insert(
        question_categories_table,
        [
            {
                'name': 'EUA',
                'display_name': 'European Union Allowances',
                'description': 'Questions related to EU ETS and carbon allowances',
                'color': '#3B82F6',  # Blue
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'GOO',
                'display_name': 'Guarantees of Origin',
                'description': 'Questions about renewable energy certificates',
                'color': '#10B981',  # Green
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'BIOFUELS',
                'display_name': 'Biofuels',
                'description': 'Questions about biofuel sustainability and trading',
                'color': '#F59E0B',  # Orange
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'GENERAL',
                'display_name': 'General Knowledge',
                'description': 'General green energy and sustainability questions',
                'color': '#6B7280',  # Gray
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'CBAM',
                'display_name': 'Carbon Border Adjustment Mechanism',
                'description': 'Questions about EU CBAM regulations and implementation',
                'color': '#8B5CF6',  # Purple
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'VCM',
                'display_name': 'Voluntary Carbon Markets',
                'description': 'Questions about voluntary carbon credits and offset markets',
                'color': '#EF4444',  # Red
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'GEO',
                'display_name': 'Green Energy Certificates',
                'description': 'Questions about various green energy certification schemes',
                'color': '#06B6D4',  # Cyan
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
        ]
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_question_categories_name'), table_name='question_categories')
    op.drop_index(op.f('ix_question_categories_id'), table_name='question_categories')
    op.drop_table('question_categories') 
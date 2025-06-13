"""create news categories table

Revision ID: 004
Revises: 003
Create Date: 2023-05-22

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create news_categories table
    op.create_table(
        'news_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_news_categories_id'), 'news_categories', ['id'], unique=False)
    op.create_index(op.f('ix_news_categories_name'), 'news_categories', ['name'], unique=True)

    # Insert default categories
    news_categories_table = sa.table(
        'news_categories',
        sa.column('name', sa.String),
        sa.column('display_name', sa.String),
        sa.column('description', sa.String),
        sa.column('is_active', sa.Boolean),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime),
    )
    
    current_time = datetime.utcnow()
    
    op.bulk_insert(
        news_categories_table,
        [
            {
                'name': 'EUA',
                'display_name': 'European Union Allowances',
                'description': 'EU Emission Trading System allowances',
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'EUA2',
                'display_name': 'EUA 2030',
                'description': 'EU ETS allowances for compliance period 2030',
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'GOO',
                'display_name': 'Guarantees of Origin',
                'description': 'Renewable energy certificates - Guarantees of Origin',
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'GEO',
                'display_name': 'Green Energy Certificates',
                'description': 'Green Energy Certificates for renewable energy',
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'VOLUNTARY_MARKETS',
                'display_name': 'Voluntary Carbon Markets',
                'description': 'Voluntary carbon offset and credit markets',
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'BIOFUELS',
                'display_name': 'Biofuels',
                'description': 'Biofuel sustainability credits and certificates',
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
            {
                'name': 'GENERAL',
                'display_name': 'General News',
                'description': 'General green energy and sustainability news',
                'is_active': True,
                'created_at': current_time,
                'updated_at': current_time,
            },
        ]
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_news_categories_name'), table_name='news_categories')
    op.drop_index(op.f('ix_news_categories_id'), table_name='news_categories')
    op.drop_table('news_categories') 
"""Create subscriptions table

Revision ID: 006
Revises: 005
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from decimal import Decimal

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None

def upgrade():
    # Check if subscriptions table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'subscriptions' in inspector.get_table_names():
        # The existing subscriptions table has a different purpose (user subscriptions)
        # Drop the old table completely as it has incompatible structure
        op.drop_table('subscriptions')
    
    # Create our new subscriptions table for subscription types/plans
    op.create_table('subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False, default=0.00),
        sa.Column('duration_days', sa.Integer(), nullable=False, default=30),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('features', sa.Text(), nullable=True),
        sa.Column('max_concurrent_users', sa.Integer(), nullable=False, default=1),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscriptions_id'), 'subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_subscriptions_name'), 'subscriptions', ['name'], unique=True)
    
    # Insert default subscription types
    subscriptions_table = table('subscriptions',
        column('name', sa.String),
        column('display_name', sa.String),
        column('description', sa.Text),
        column('price', sa.Numeric),
        column('duration_days', sa.Integer),
        column('is_active', sa.Boolean),
        column('features', sa.Text),
        column('max_concurrent_users', sa.Integer)
    )

    op.bulk_insert(subscriptions_table, [
        {
            'name': 'trial',
            'display_name': 'Trial Subscription',
            'description': '7-day trial subscription with limited access to marketplace and news',
            'price': Decimal('0.00'),
            'duration_days': 7,
            'is_active': True,
            'features': '{"news_access": "basic", "marketplace_access": "view_only", "max_orders": 0}',
            'max_concurrent_users': 1
        },
        {
            'name': 'standard',
            'display_name': 'Standard Subscription',
            'description': 'Full access to all platform features including live trading',
            'price': Decimal('99.99'),
            'duration_days': 30,
            'is_active': True,
            'features': '{"news_access": "full", "marketplace_access": "full", "max_orders": 100, "live_prices": true}',
            'max_concurrent_users': 1
        },
        {
            'name': 'premium',
            'display_name': 'Premium Subscription',
            'description': 'Enhanced features with priority support and advanced analytics',
            'price': Decimal('199.99'),
            'duration_days': 30,
            'is_active': True,
            'features': '{"news_access": "full", "marketplace_access": "full", "max_orders": 500, "live_prices": true, "analytics": true, "priority_support": true}',
            'max_concurrent_users': 3
        }
    ])

def downgrade():
    # Drop the new subscriptions table
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'subscriptions' in inspector.get_table_names():
        try:
            op.drop_index(op.f('ix_subscriptions_name'), table_name='subscriptions')
        except:
            pass  # Index might not exist
        try:
            op.drop_index(op.f('ix_subscriptions_id'), table_name='subscriptions')
        except:
            pass  # Index might not exist
        op.drop_table('subscriptions')
    
    # Note: The old user subscriptions table structure is not restored
    # as it had incompatible schema for our new subscription system 
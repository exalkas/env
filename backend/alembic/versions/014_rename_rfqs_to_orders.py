"""rename rfqs to orders

Revision ID: 014
Revises: 013
Create Date: 2024-01-15 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    # First, rename the existing orders table to market_orders to avoid conflict
    # Also rename its indexes to avoid conflicts
    op.drop_index('ix_orders_id', table_name='orders')
    op.drop_index('ix_orders_order_type', table_name='orders')
    op.drop_index('ix_orders_status', table_name='orders')
    op.rename_table('orders', 'market_orders')
    op.create_index('ix_market_orders_id', 'market_orders', ['id'])
    op.create_index('ix_market_orders_order_type', 'market_orders', ['order_type'])
    op.create_index('ix_market_orders_status', 'market_orders', ['status'])
    
    # Then rename rfqs to orders
    op.rename_table('rfqs', 'orders')
    
    # Update indexes to use new table name
    op.drop_index('ix_rfqs_id')
    op.drop_index('ix_rfqs_rfq_type')  # This will be renamed to side after column rename
    op.drop_index('ix_rfqs_status')
    op.drop_index('ix_rfqs_order_type')
    op.drop_index('ix_rfqs_priority')
    op.drop_index('ix_rfqs_vintage_year')
    op.drop_index('ix_rfqs_delivery_start')
    op.drop_index('ix_rfqs_settled_by')
    
    # Recreate indexes with new table name
    op.create_index('ix_orders_id', 'orders', ['id'])
    op.create_index('ix_orders_side', 'orders', ['side'])  # Column was renamed from rfq_type to side
    op.create_index('ix_orders_status', 'orders', ['status'])
    op.create_index('ix_orders_order_type', 'orders', ['order_type'])
    op.create_index('ix_orders_priority', 'orders', ['priority'])
    op.create_index('ix_orders_vintage_year', 'orders', ['vintage_year'])
    op.create_index('ix_orders_delivery_start', 'orders', ['delivery_start'])
    op.create_index('ix_orders_settled_by', 'orders', ['settled_by'])


def downgrade():
    # Drop new indexes
    op.drop_index('ix_orders_settled_by')
    op.drop_index('ix_orders_delivery_start')
    op.drop_index('ix_orders_vintage_year')
    op.drop_index('ix_orders_priority')
    op.drop_index('ix_orders_order_type')
    op.drop_index('ix_orders_status')
    op.drop_index('ix_orders_side')
    op.drop_index('ix_orders_id')
    
    # Rename orders table back to rfqs
    op.rename_table('orders', 'rfqs')
    
    # Rename market_orders back to orders and restore its indexes
    op.drop_index('ix_market_orders_status', table_name='market_orders')
    op.drop_index('ix_market_orders_order_type', table_name='market_orders')
    op.drop_index('ix_market_orders_id', table_name='market_orders')
    op.rename_table('market_orders', 'orders')
    op.create_index('ix_orders_id', 'orders', ['id'])
    op.create_index('ix_orders_order_type', 'orders', ['order_type'])
    op.create_index('ix_orders_status', 'orders', ['status'])
    
    # Recreate old rfqs indexes
    op.create_index('ix_rfqs_settled_by', 'rfqs', ['settled_by'])
    op.create_index('ix_rfqs_delivery_start', 'rfqs', ['delivery_start'])
    op.create_index('ix_rfqs_vintage_year', 'rfqs', ['vintage_year'])
    op.create_index('ix_rfqs_priority', 'rfqs', ['priority'])
    op.create_index('ix_rfqs_order_type', 'rfqs', ['order_type'])
    op.create_index('ix_rfqs_status', 'rfqs', ['status'])
    op.create_index('ix_rfqs_rfq_type', 'rfqs', ['side'])  # Column is still 'side' but index name should match original
    op.create_index('ix_rfqs_id', 'rfqs', ['id']) 
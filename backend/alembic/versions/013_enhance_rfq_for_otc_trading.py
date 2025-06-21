"""enhance rfq for otc trading

Revision ID: 013
Revises: 012
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    # Rename rfq_type to side
    op.alter_column('rfqs', 'rfq_type', new_column_name='side')
    
    # Add new columns for enhanced OTC trading
    op.add_column('rfqs', sa.Column('order_type', sa.String(), nullable=False, server_default='LIMIT'))
    op.add_column('rfqs', sa.Column('unit', sa.String(), nullable=True, server_default='MT'))
    
    # Pricing fields
    op.add_column('rfqs', sa.Column('indicative_price', sa.Float(), nullable=True))
    op.add_column('rfqs', sa.Column('markup_amount', sa.Float(), nullable=True))
    
    # Delivery period
    op.add_column('rfqs', sa.Column('delivery_start', sa.Date(), nullable=True))
    op.add_column('rfqs', sa.Column('delivery_end', sa.Date(), nullable=True))
    
    # EUA specific fields
    op.add_column('rfqs', sa.Column('vintage_year', sa.Integer(), nullable=True))
    op.add_column('rfqs', sa.Column('registry', sa.String(), nullable=True))
    op.add_column('rfqs', sa.Column('serial_numbers', sa.Text(), nullable=True))
    
    # Order management
    op.add_column('rfqs', sa.Column('priority', sa.String(), nullable=True, server_default='NORMAL'))
    op.add_column('rfqs', sa.Column('special_instructions', sa.Text(), nullable=True))
    
    # External tracking
    op.add_column('rfqs', sa.Column('external_trade_ref', sa.String(), nullable=True))
    op.add_column('rfqs', sa.Column('settlement_ref', sa.String(), nullable=True))
    
    # Additional timestamps
    op.add_column('rfqs', sa.Column('accepted_at', sa.DateTime(), nullable=True))
    op.add_column('rfqs', sa.Column('settled_at', sa.DateTime(), nullable=True))
    
    # Additional user tracking
    op.add_column('rfqs', sa.Column('settled_by', sa.Integer(), nullable=True))
    
    # Add foreign key constraint for settled_by
    op.create_foreign_key(
        'fk_rfqs_settled_by_users',
        'rfqs',
        'users',
        ['settled_by'],
        ['id']
    )
    
    # Update status values to new enum values
    # PENDING -> SUBMITTED (existing orders)
    op.execute("UPDATE rfqs SET status = 'SUBMITTED' WHERE status = 'PENDING'")
    
    # Add indexes for better performance
    op.create_index('ix_rfqs_order_type', 'rfqs', ['order_type'])
    op.create_index('ix_rfqs_priority', 'rfqs', ['priority'])
    op.create_index('ix_rfqs_vintage_year', 'rfqs', ['vintage_year'])
    op.create_index('ix_rfqs_delivery_start', 'rfqs', ['delivery_start'])
    op.create_index('ix_rfqs_settled_by', 'rfqs', ['settled_by'])


def downgrade():
    # Remove indexes
    op.drop_index('ix_rfqs_settled_by', 'rfqs')
    op.drop_index('ix_rfqs_delivery_start', 'rfqs')
    op.drop_index('ix_rfqs_vintage_year', 'rfqs')
    op.drop_index('ix_rfqs_priority', 'rfqs')
    op.drop_index('ix_rfqs_order_type', 'rfqs')
    
    # Remove foreign key constraint
    op.drop_constraint('fk_rfqs_settled_by_users', 'rfqs', type_='foreignkey')
    
    # Remove new columns (in reverse order)
    op.drop_column('rfqs', 'settled_by')
    op.drop_column('rfqs', 'settled_at')
    op.drop_column('rfqs', 'accepted_at')
    op.drop_column('rfqs', 'settlement_ref')
    op.drop_column('rfqs', 'external_trade_ref')
    op.drop_column('rfqs', 'special_instructions')
    op.drop_column('rfqs', 'priority')
    op.drop_column('rfqs', 'serial_numbers')
    op.drop_column('rfqs', 'registry')
    op.drop_column('rfqs', 'vintage_year')
    op.drop_column('rfqs', 'delivery_end')
    op.drop_column('rfqs', 'delivery_start')
    op.drop_column('rfqs', 'markup_amount')
    op.drop_column('rfqs', 'indicative_price')
    op.drop_column('rfqs', 'unit')
    op.drop_column('rfqs', 'order_type')
    
    # Rename side back to rfq_type
    op.alter_column('rfqs', 'side', new_column_name='rfq_type')
    
    # Revert status values
    op.execute("UPDATE rfqs SET status = 'PENDING' WHERE status = 'SUBMITTED'") 
"""create payment tables

Revision ID: 020_create_payment_tables
Revises: 19d2a5d0de79
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import Numeric
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '020_create_payment_tables'
down_revision = '018_question_categories'
branch_labels = None
depends_on = None

def upgrade():
    # Create payment gateways table
    op.create_table('payment_gateways',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.Enum('stripe', 'paypal', 'bank_transfer', 'adyen', name='paymentgatewaytype'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_live', sa.Boolean(), nullable=True, default=False),
        sa.Column('config', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_gateways_id'), 'payment_gateways', ['id'], unique=False)

    # Create payment methods table
    op.create_table('payment_methods',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.Enum('credit_card', 'debit_card', 'sepa_debit', 'bank_transfer', 'paypal', 'bancontact', name='paymentmethodtype'), nullable=False),
        sa.Column('gateway_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_instant', sa.Boolean(), nullable=True, default=True),
        sa.Column('processing_time', sa.String(length=50), nullable=True),
        sa.Column('fee_percentage', Numeric(precision=5, scale=2), nullable=True, default=0),
        sa.Column('fee_fixed', Numeric(precision=10, scale=2), nullable=True, default=0),
        sa.Column('currency', sa.String(length=3), nullable=True, default='EUR'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon_url', sa.String(length=255), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=True, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['gateway_id'], ['payment_gateways.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_methods_id'), 'payment_methods', ['id'], unique=False)

    # Create payment transactions table
    op.create_table('payment_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('gateway_id', sa.Integer(), nullable=False),
        sa.Column('payment_method_id', sa.Integer(), nullable=False),
        sa.Column('amount', Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True, default='EUR'),
        sa.Column('status', sa.Enum('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', name='transactionstatus'), nullable=True, default='pending'),
        sa.Column('gateway_transaction_id', sa.String(length=255), nullable=True),
        sa.Column('gateway_reference', sa.String(length=255), nullable=True),
        sa.Column('transaction_metadata', sa.Text(), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['gateway_id'], ['payment_gateways.id'], ),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id'], ),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_transactions_id'), 'payment_transactions', ['id'], unique=False)

    # Create bank transfer details table
    op.create_table('bank_transfer_details',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bank_name', sa.String(length=100), nullable=False),
        sa.Column('account_name', sa.String(length=100), nullable=False),
        sa.Column('account_number', sa.String(length=50), nullable=False),
        sa.Column('routing_number', sa.String(length=50), nullable=True),
        sa.Column('iban', sa.String(length=50), nullable=True),
        sa.Column('swift_code', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_primary', sa.Boolean(), nullable=True, default=False),
        sa.Column('currency', sa.String(length=3), nullable=True, default='EUR'),
        sa.Column('country', sa.String(length=2), nullable=True),
        sa.Column('payment_instructions', sa.Text(), nullable=True),
        sa.Column('reference_format', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bank_transfer_details_id'), 'bank_transfer_details', ['id'], unique=False)

    # Insert default payment gateways
    op.execute("""
        INSERT INTO payment_gateways (name, type, is_active, is_live, description) VALUES
        ('Stripe', 'stripe', true, false, 'Stripe payment gateway for card payments and SEPA'),
        ('PayPal', 'paypal', false, false, 'PayPal payment gateway'),
        ('Bank Transfer', 'bank_transfer', true, true, 'Manual bank transfer processing');
    """)

    # Insert default payment methods
    op.execute("""
        INSERT INTO payment_methods (name, type, gateway_id, is_active, is_instant, processing_time, fee_percentage, fee_fixed, description, display_order) VALUES
        ('Credit/Debit Card', 'credit_card', 1, true, true, 'Instant', 2.90, 0.25, 'Visa, Mastercard, American Express', 1),
        ('SEPA Direct Debit', 'sepa_debit', 1, true, false, '2-3 business days', 0.80, 0.00, 'European bank account direct debit', 2),
        ('PayPal', 'paypal', 2, false, true, 'Instant', 3.40, 0.35, 'PayPal account payment', 3),
        ('Bank Transfer', 'bank_transfer', 3, true, false, '1-3 business days', 0.00, 0.00, 'Manual wire transfer', 4);
    """)

    # Insert default bank transfer details
    op.execute("""
        INSERT INTO bank_transfer_details (bank_name, account_name, account_number, iban, swift_code, is_active, is_primary, currency, country, payment_instructions, reference_format) VALUES
        ('Example Bank', 'GreenTrade Energy Ltd', '1234567890', 'DE89370400440532013000', 'DEUTDEFF', true, true, 'EUR', 'DE', 
         'Please include your user ID and subscription name in the reference field', 'USERID-SUBSCRIPTION');
    """)

def downgrade():
    op.drop_index(op.f('ix_bank_transfer_details_id'), table_name='bank_transfer_details')
    op.drop_table('bank_transfer_details')
    op.drop_index(op.f('ix_payment_transactions_id'), table_name='payment_transactions')
    op.drop_table('payment_transactions')
    op.drop_index(op.f('ix_payment_methods_id'), table_name='payment_methods')
    op.drop_table('payment_methods')
    op.drop_index(op.f('ix_payment_gateways_id'), table_name='payment_gateways')
    op.drop_table('payment_gateways')
    
    # Drop custom enums
    sa.Enum(name='paymentgatewaytype').drop(op.get_bind())
    sa.Enum(name='paymentmethodtype').drop(op.get_bind())
    sa.Enum(name='transactionstatus').drop(op.get_bind()) 
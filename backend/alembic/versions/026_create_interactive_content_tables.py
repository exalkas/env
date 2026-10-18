"""Create interactive content tables

Revision ID: 026
Revises: c0b305fcd0d1
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '026'
down_revision = 'c0b305fcd0d1'
branch_labels = None
depends_on = None

def upgrade():
    # Interactive lesson types table
    op.create_table('interactive_lesson_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('type_key', sa.String(50), nullable=False, unique=True),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('component_name', sa.String(100), nullable=False),
        sa.Column('default_config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Interactive scenarios table
    op.create_table('interactive_scenarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('type_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scenario_data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('optimal_choice', sa.String(100), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, default=0),
        sa.Column('points_possible', sa.Integer(), nullable=False, default=10),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['type_id'], ['interactive_lesson_types.id'], ondelete='CASCADE')
    )
    
    # Interactive questions table (for components that have discrete questions)
    op.create_table('interactive_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scenario_id', sa.Integer(), nullable=False),
        sa.Column('question_type', sa.String(50), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('options_data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('correct_answer', sa.String(200), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=False, default=1),
        sa.Column('order_index', sa.Integer(), nullable=False, default=0),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['scenario_id'], ['interactive_scenarios.id'], ondelete='CASCADE')
    )
    
    # Add indexes for performance
    op.create_index('ix_interactive_scenarios_lesson_id', 'interactive_scenarios', ['lesson_id'])
    op.create_index('ix_interactive_scenarios_type_id', 'interactive_scenarios', ['type_id'])
    op.create_index('ix_interactive_questions_scenario_id', 'interactive_questions', ['scenario_id'])
    
    # Insert default interactive lesson types
    op.execute("""
        INSERT INTO interactive_lesson_types (type_key, display_name, description, component_name, default_config, is_active) VALUES
        ('compliance_calculator', 'Compliance Calculator', 'Interactive penalty calculation scenarios', 'ComplianceCalculator', '{"scenarios": 3, "timeLimit": 300}', true),
        ('participant_matching', 'Participant Matching Game', 'Drag-and-drop market participant identification', 'ParticipantMatchingGame', '{"participants": 8, "categories": 4}', true),
        ('price_analysis', 'EUA Price Analysis', 'Market scenario analysis with time pressure', 'EUAPriceAnalysisGame', '{"scenarios": 5, "timeLimit": 90}', true),
        ('allocation_auction', 'Allocation & Auction Strategy', 'Strategic decision-making for compliance', 'AllocationAuctionStrategy', '{"scenarios": 3, "complexity": "advanced"}', true),
        ('trading_timeline', 'Trading Timeline Simulation', 'Multi-year compliance planning', 'TradingTimelineSimulation', '{"years": 4, "startingBank": 50000}', true),
        ('carbon_leakage', 'Carbon Leakage Analysis', 'International trade and CBAM analysis', 'CarbonLeakageAnalysis', '{"industries": 4, "analysisDepth": "comprehensive"}', true);
    """)

def downgrade():
    op.drop_index('ix_interactive_questions_scenario_id')
    op.drop_index('ix_interactive_scenarios_type_id')
    op.drop_index('ix_interactive_scenarios_lesson_id')
    op.drop_table('interactive_questions')
    op.drop_table('interactive_scenarios')
    op.drop_table('interactive_lesson_types') 
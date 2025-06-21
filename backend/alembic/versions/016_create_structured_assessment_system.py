"""Create structured assessment system

Revision ID: 016_structured_assessments
Revises: 19d2a5d0de79
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '016_structured_assessments'
down_revision = '19d2a5d0de79'
branch_labels = None
depends_on = None

def upgrade():
    # Create questions table (question bank)
    op.create_table('questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(length=50), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('difficulty_level', sa.String(length=20), nullable=False, server_default='MEDIUM'),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('tags', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_questions_id', 'id'),
        sa.Index('ix_questions_title', 'title'),
        sa.Index('ix_questions_question_type', 'question_type'),
        sa.Index('ix_questions_category', 'category'),
        sa.Index('ix_questions_difficulty_level', 'difficulty_level')
    )

    # Create question_options table (for MCQ, multiple select, etc.)
    op.create_table('question_options',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('option_text', sa.Text(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_question_options_question_id', 'question_id')
    )

    # Create assessment_questions table (many-to-many relationship)
    op.create_table('assessment_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('points', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_assessment_questions_assessment_id', 'assessment_id'),
        sa.Index('ix_assessment_questions_question_id', 'question_id'),
        sa.UniqueConstraint('assessment_id', 'question_id', name='uq_assessment_question')
    )

    # Create user_question_responses table (detailed answer storage)
    op.create_table('user_question_responses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attempt_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('response_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('points_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('time_spent', sa.Integer(), nullable=True),  # seconds
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['attempt_id'], ['user_assessment_attempts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_user_question_responses_attempt_id', 'attempt_id'),
        sa.Index('ix_user_question_responses_question_id', 'question_id')
    )

    # Add new columns to assessments table
    op.add_column('assessments', sa.Column('total_points', sa.Integer(), nullable=True))
    op.add_column('assessments', sa.Column('randomize_questions', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('assessments', sa.Column('show_results_immediately', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('assessments', sa.Column('allow_review', sa.Boolean(), nullable=False, server_default='true'))

    # Update user_assessment_attempts table
    op.add_column('user_assessment_attempts', sa.Column('total_points', sa.Integer(), nullable=True))
    op.add_column('user_assessment_attempts', sa.Column('points_earned', sa.Integer(), nullable=True))
    op.add_column('user_assessment_attempts', sa.Column('status', sa.String(length=20), nullable=False, server_default='completed'))

def downgrade():
    # Remove new columns from user_assessment_attempts
    op.drop_column('user_assessment_attempts', 'status')
    op.drop_column('user_assessment_attempts', 'points_earned')
    op.drop_column('user_assessment_attempts', 'total_points')
    
    # Remove new columns from assessments
    op.drop_column('assessments', 'allow_review')
    op.drop_column('assessments', 'show_results_immediately')
    op.drop_column('assessments', 'randomize_questions')
    op.drop_column('assessments', 'total_points')
    
    # Drop tables in reverse order
    op.drop_table('user_question_responses')
    op.drop_table('assessment_questions')
    op.drop_table('question_options')
    op.drop_table('questions') 
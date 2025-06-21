"""Create education tables

Revision ID: 015
Revises: 014
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None

def upgrade():
    # Create learning_paths table
    op.create_table(
        'learning_paths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('difficulty_level', sa.String(length=20), nullable=False),
        sa.Column('estimated_hours', sa.Float(), nullable=True),
        sa.Column('order_sequence', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_learning_paths_id'), 'learning_paths', ['id'], unique=False)
    op.create_index(op.f('ix_learning_paths_name'), 'learning_paths', ['name'], unique=False)

    # Create modules table
    op.create_table(
        'modules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order_sequence', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_modules_id'), 'modules', ['id'], unique=False)
    op.create_index(op.f('ix_modules_name'), 'modules', ['name'], unique=False)

    # Create lessons table
    op.create_table(
        'lessons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('module_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('video_url', sa.String(length=500), nullable=True),
        sa.Column('estimated_minutes', sa.Integer(), nullable=True),
        sa.Column('order_sequence', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lessons_id'), 'lessons', ['id'], unique=False)
    op.create_index(op.f('ix_lessons_title'), 'lessons', ['title'], unique=False)

    # Create glossary_terms table
    op.create_table(
        'glossary_terms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('term', sa.String(length=255), nullable=False),
        sa.Column('definition', sa.Text(), nullable=False),
        sa.Column('example', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=20), nullable=False),
        sa.Column('related_terms', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('term')
    )
    op.create_index(op.f('ix_glossary_terms_id'), 'glossary_terms', ['id'], unique=False)
    op.create_index(op.f('ix_glossary_terms_term'), 'glossary_terms', ['term'], unique=True)

    # Create assessments table
    op.create_table(
        'assessments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=True),
        sa.Column('module_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('questions', sa.JSON(), nullable=False),
        sa.Column('passing_score', sa.Integer(), nullable=False),
        sa.Column('max_attempts', sa.Integer(), nullable=False),
        sa.Column('time_limit_minutes', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assessments_id'), 'assessments', ['id'], unique=False)

    # Create user_progress table
    op.create_table(
        'user_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=True),
        sa.Column('lesson_id', sa.Integer(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('time_spent_minutes', sa.Integer(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_progress_id'), 'user_progress', ['id'], unique=False)

    # Create user_assessment_attempts table
    op.create_table(
        'user_assessment_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('passed', sa.Boolean(), nullable=False),
        sa.Column('time_taken_minutes', sa.Integer(), nullable=True),
        sa.Column('attempt_number', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_assessment_attempts_id'), 'user_assessment_attempts', ['id'], unique=False)

    # Create certificates table
    op.create_table(
        'certificates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('certificate_name', sa.String(length=255), nullable=False),
        sa.Column('issued_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('certificate_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_certificates_id'), 'certificates', ['id'], unique=False)

    # Insert sample learning paths
    connection = op.get_bind()
    
    # Insert default learning paths
    learning_paths_data = [
        {
            'name': 'Carbon Markets 101',
            'description': 'Introduction to carbon markets and green energy trading fundamentals',
            'difficulty_level': 'BEGINNER',
            'estimated_hours': 8.0,
            'order_sequence': 1,
            'is_active': True
        },
        {
            'name': 'EUA Trading Mastery',
            'description': 'Advanced course on European Union Allowances trading strategies',
            'difficulty_level': 'INTERMEDIATE',
            'estimated_hours': 12.0,
            'order_sequence': 2,
            'is_active': True
        },
        {
            'name': 'CBAM & Compliance',
            'description': 'Understanding Carbon Border Adjustment Mechanism and regulatory compliance',
            'difficulty_level': 'ADVANCED',
            'estimated_hours': 10.0,
            'order_sequence': 3,
            'is_active': True
        },
        {
            'name': 'Voluntary Carbon Markets',
            'description': 'Expert-level understanding of voluntary carbon offset markets',
            'difficulty_level': 'EXPERT',
            'estimated_hours': 15.0,
            'order_sequence': 4,
            'is_active': True
        }
    ]
    
    for path_data in learning_paths_data:
        connection.execute(sa.text("""
            INSERT INTO learning_paths (name, description, difficulty_level, estimated_hours, order_sequence, is_active, created_at)
            VALUES (:name, :description, :difficulty_level, :estimated_hours, :order_sequence, :is_active, NOW())
        """), path_data)

    # Insert sample glossary terms
    glossary_terms_data = [
        {
            'term': 'EUA',
            'definition': 'European Union Allowance - a tradable permit allowing the holder to emit one tonne of carbon dioxide equivalent',
            'example': 'A power plant must surrender one EUA for each tonne of CO2 it emits',
            'category': 'EUA',
            'is_active': True
        },
        {
            'term': 'CBAM',
            'definition': 'Carbon Border Adjustment Mechanism - EU policy to prevent carbon leakage by imposing carbon costs on imports',
            'example': 'Steel imports from countries without carbon pricing will face CBAM charges',
            'category': 'CBAM',
            'is_active': True
        },
        {
            'term': 'GOO',
            'definition': 'Guarantee of Origin - electronic document proving that electricity was produced from renewable sources',
            'example': 'A company purchases GOOs to prove their electricity consumption is 100% renewable',
            'category': 'GOO',
            'is_active': True
        },
        {
            'term': 'VCM',
            'definition': 'Voluntary Carbon Market - market for carbon credits where participation is voluntary',
            'example': 'Companies buy VCM credits to offset their unavoidable emissions',
            'category': 'VCM',
            'is_active': True
        },
        {
            'term': 'Cap and Trade',
            'definition': 'Regulatory approach where total emissions are capped and allowances can be traded',
            'example': 'The EU ETS is the worlds largest cap and trade system',
            'category': 'GENERAL',
            'is_active': True
        }
    ]
    
    for term_data in glossary_terms_data:
        connection.execute(sa.text("""
            INSERT INTO glossary_terms (term, definition, example, category, is_active, created_at)
            VALUES (:term, :definition, :example, :category, :is_active, NOW())
        """), term_data)

def downgrade():
    op.drop_index(op.f('ix_certificates_id'), table_name='certificates')
    op.drop_table('certificates')
    op.drop_index(op.f('ix_user_assessment_attempts_id'), table_name='user_assessment_attempts')
    op.drop_table('user_assessment_attempts')
    op.drop_index(op.f('ix_user_progress_id'), table_name='user_progress')
    op.drop_table('user_progress')
    op.drop_index(op.f('ix_assessments_id'), table_name='assessments')
    op.drop_table('assessments')
    op.drop_index(op.f('ix_glossary_terms_term'), table_name='glossary_terms')
    op.drop_index(op.f('ix_glossary_terms_id'), table_name='glossary_terms')
    op.drop_table('glossary_terms')
    op.drop_index(op.f('ix_lessons_title'), table_name='lessons')
    op.drop_index(op.f('ix_lessons_id'), table_name='lessons')
    op.drop_table('lessons')
    op.drop_index(op.f('ix_modules_name'), table_name='modules')
    op.drop_index(op.f('ix_modules_id'), table_name='modules')
    op.drop_table('modules')
    op.drop_index(op.f('ix_learning_paths_name'), table_name='learning_paths')
    op.drop_index(op.f('ix_learning_paths_id'), table_name='learning_paths')
    op.drop_table('learning_paths') 
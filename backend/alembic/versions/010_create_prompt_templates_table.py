"""Create prompt templates table

Revision ID: 010
Revises: 009
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None

# Default combined prompt
DEFAULT_COMBINED_PROMPT = """Can you search internet and find at least 10 news about 
EUAs, GOO, VCM, CBAM, biofuels, EUA 2, green energy
from yesterday and today
that could add to our platform.
I'd like at least 2-3 sentences after the headline for the news you found.
Note at which category(ies) those news belong to
Can you also add tags?

After generating the individual news articles, create a daily analysis report from all the news.
The daily analysis should be of high value for our readers.
Without giving direct predictions like price will go up or down we should be able to point to the proper directions.
It must be useful for ship owners, factories, sustainability managers, big companies and anyone that is involved in green energy in any way.

Please return the response as a JSON object with two fields:
1. "news_articles": an array where each news item is an object with fields: title, summary, content, tags, category
2. "daily_analysis": an object with fields: title, summary, content

IMPORTANT FORMAT REQUIREMENTS:
- tags: must be a comma-separated STRING (not an array). Example: "EUA, Carbon Market, Trading"
- category: must be a single STRING value from the available categories
- title: must be a STRING
- summary: must be a STRING  
- content: must be a STRING

Available categories are: EUA, EUA2, GOO, GEO, VOLUNTARY_MARKETS, BIOFUELS, GENERAL, DAILY_ANALYSIS, CBAM
If a news item doesn't fit any specific category, use GENERAL.
Daily analysis reports should use DAILY_ANALYSIS category."""

def upgrade():
    # Create prompt_templates table
    op.create_table(
        'prompt_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=100), nullable=False),
        sa.Column('template', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prompt_templates_id'), 'prompt_templates', ['id'], unique=False)

    # Insert default combined prompt
    # Get first admin user (assuming there's at least one)
    connection = op.get_bind()
    
    # Find first admin user
    admin_query = """
    SELECT u.id FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE r.level >= 50 OR u.is_super_admin = true 
    LIMIT 1
    """
    result = connection.execute(sa.text(admin_query))
    admin_user = result.fetchone()
    
    if admin_user:
        admin_id = admin_user[0]
        
        # Insert default prompt
        insert_query = """
        INSERT INTO prompt_templates (name, type, template, description, is_default, is_active, created_by, created_at)
        VALUES (:name, :type, :template, :description, :is_default, :is_active, :created_by, NOW())
        """
        
        connection.execute(sa.text(insert_query), {
            'name': 'Default Combined Generation',
            'type': 'combined_generation',
            'template': DEFAULT_COMBINED_PROMPT,
            'description': 'Default prompt for generating news articles and daily analysis in one efficient call',
            'is_default': True,
            'is_active': True,
            'created_by': admin_id
        })

def downgrade():
    op.drop_index(op.f('ix_prompt_templates_id'), table_name='prompt_templates')
    op.drop_table('prompt_templates') 
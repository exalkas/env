"""Cleanup prompt templates - ensure single default

Revision ID: 012
Revises: 011
Create Date: 2024-01-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers
revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None

def upgrade():
    """Remove duplicate prompts and ensure only one default prompt"""
    
    # Get database connection
    connection = op.get_bind()
    
    # First, find if there are multiple default prompts
    result = connection.execute(text("""
        SELECT COUNT(*) FROM prompt_templates WHERE is_default = true
    """))
    default_count = result.scalar()
    
    if default_count > 1:
        # Keep only the first default prompt and make others non-default
        connection.execute(text("""
            UPDATE prompt_templates 
            SET is_default = false 
            WHERE id NOT IN (
                SELECT id FROM prompt_templates 
                WHERE is_default = true 
                ORDER BY created_at ASC 
                LIMIT 1
            ) AND is_default = true
        """))
    
    # If no default prompts exist, create one
    elif default_count == 0:
        connection.execute(text("""
            INSERT INTO prompt_templates (
                name, type, template, description, is_default, is_active, created_by
            ) VALUES (
                'Default News Generation Prompt',
                'combined_generation',
                'Generate comprehensive news articles about green energy market developments for the date range {date_range}. Focus on:

1. Carbon markets (EUA, EUA2)
2. Green certificates (GOO, GEO) 
3. Voluntary carbon markets
4. Biofuels market updates
5. CBAM developments
6. General environmental market news

For each article:
- Create compelling headlines
- Write informative summaries (2-3 sentences)
- Provide detailed content (300-500 words)
- Include relevant tags (comma-separated string, not array)
- Assign to appropriate category: EUA, EUA2, GOO, GEO, VOLUNTARY_MARKETS, BIOFUELS, CBAM, or GENERAL
- Include credible source information when available

Generate 10-15 diverse articles covering different aspects of the green energy market.',
                'Default prompt for AI news generation',
                true,
                true,
                1
            )
        """))
    
    # Update existing default prompt to ensure it has good content
    connection.execute(text("""
        UPDATE prompt_templates 
        SET 
            name = 'Default News Generation Prompt',
            description = 'Default prompt for AI news generation',
            template = 'Generate comprehensive news articles about green energy market developments for the date range {date_range}. Focus on:

1. Carbon markets (EUA, EUA2)
2. Green certificates (GOO, GEO) 
3. Voluntary carbon markets
4. Biofuels market updates
5. CBAM developments
6. General environmental market news

For each article:
- Create compelling headlines
- Write informative summaries (2-3 sentences)
- Provide detailed content (300-500 words)
- Include relevant tags (comma-separated string, not array)
- Assign to appropriate category: EUA, EUA2, GOO, GEO, VOLUNTARY_MARKETS, BIOFUELS, CBAM, or GENERAL
- Include credible source information when available

Generate 10-15 diverse articles covering different aspects of the green energy market.'
        WHERE is_default = true
    """))

def downgrade():
    """Downgrade - no specific action needed"""
    pass 
"""add news multiple categories support

Revision ID: 008
Revises: 007
Create Date: 2024-01-15 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    # Check if table already exists
    connection = op.get_bind()
    inspector = sa.inspect(connection.engine)
    table_exists = 'news_category_associations' in inspector.get_table_names()
    
    if not table_exists:
        # Create junction table for many-to-many relationship between news and categories
        op.create_table('news_category_associations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('news_id', sa.Integer(), nullable=False),
            sa.Column('category_id', sa.Integer(), nullable=False),
            sa.Column('is_primary', sa.Boolean(), nullable=True, default=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['news_id'], ['news.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['category_id'], ['news_categories.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('news_id', 'category_id', name='unique_news_category')
        )
        op.create_index(op.f('ix_news_category_associations_id'), 'news_category_associations', ['id'], unique=False)
        op.create_index(op.f('ix_news_category_associations_news_id'), 'news_category_associations', ['news_id'], unique=False)
        op.create_index(op.f('ix_news_category_associations_category_id'), 'news_category_associations', ['category_id'], unique=False)
        
        print("✅ Created news_category_associations table and indexes")
    else:
        print("⚠️  Table news_category_associations already exists, skipping creation")
    
    # Check if we need to migrate existing data
    existing_associations = connection.execute(
        text("SELECT COUNT(*) FROM news_category_associations")
    ).fetchone()[0]
    
    if existing_associations == 0:
        print("🔄 Migrating existing news category data...")
        
        # Get all news articles with their current category
        news_categories = connection.execute(
            text("SELECT id, category FROM news WHERE category IS NOT NULL AND category != ''")
        ).fetchall()
        
        migrated_count = 0
        for news_id, category_name in news_categories:
            # Get the category ID
            category_result = connection.execute(
                text("SELECT id FROM news_categories WHERE name = :category_name"),
                {"category_name": category_name}
            ).fetchone()
            
            if category_result:
                category_id = category_result[0]
                # Insert into junction table, marking it as primary
                connection.execute(
                    text("""
                        INSERT INTO news_category_associations (news_id, category_id, is_primary, created_at)
                        VALUES (:news_id, :category_id, :is_primary, NOW())
                    """),
                    {
                        "news_id": news_id,
                        "category_id": category_id,
                        "is_primary": True
                    }
                )
                migrated_count += 1
        
        connection.commit()
        print(f"✅ Migrated {migrated_count} existing news-category relationships")
    else:
        print(f"⚠️  Found {existing_associations} existing associations, skipping data migration")


def downgrade():
    # Check if table exists before trying to drop it
    connection = op.get_bind()
    inspector = sa.inspect(connection.engine)
    table_exists = 'news_category_associations' in inspector.get_table_names()
    
    if table_exists:
        op.drop_index(op.f('ix_news_category_associations_category_id'), table_name='news_category_associations')
        op.drop_index(op.f('ix_news_category_associations_news_id'), table_name='news_category_associations')
        op.drop_index(op.f('ix_news_category_associations_id'), table_name='news_category_associations')
        op.drop_table('news_category_associations')
        print("✅ Dropped news_category_associations table and indexes")
    else:
        print("⚠️  Table news_category_associations doesn't exist, nothing to drop") 
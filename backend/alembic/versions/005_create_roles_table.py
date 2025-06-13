"""Create roles table and update users

Revision ID: 005
Revises: 004
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, default=0),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=True)
    
    # Add role_id column to users table
    op.add_column('users', sa.Column('role_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_role_id', 'users', 'roles', ['role_id'], ['id'])
    
    # Add is_super_admin column to users table
    op.add_column('users', sa.Column('is_super_admin', sa.Boolean(), nullable=True, default=False))
    
    # Insert default roles
    op.execute("""
        INSERT INTO roles (name, display_name, description, level, is_active) VALUES 
        ('user', 'Regular User', 'Standard user with basic permissions', 10, true),
        ('moderator', 'Moderator', 'Moderator with enhanced permissions', 30, true),
        ('admin', 'Administrator', 'Administrator with full system access', 50, true);
    """)
    
    # Set default values for existing users
    op.execute("UPDATE users SET is_super_admin = false WHERE is_super_admin IS NULL")
    op.execute("UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'user' LIMIT 1) WHERE role_id IS NULL")
    
    # Convert existing is_admin users to admin role
    op.execute("""
        UPDATE users 
        SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1) 
        WHERE is_admin = true
    """)
    
    # Set the first admin user as super admin
    op.execute("""
        UPDATE users 
        SET is_super_admin = true 
        WHERE id = (
            SELECT id FROM users 
            WHERE is_admin = true 
            ORDER BY id 
            LIMIT 1
        )
    """)
    
    # Make role_id and is_super_admin non-nullable
    op.alter_column('users', 'is_super_admin', nullable=False)


def downgrade():
    # Remove foreign key constraint
    op.drop_constraint('fk_users_role_id', 'users', type_='foreignkey')
    
    # Remove columns from users table
    op.drop_column('users', 'role_id')
    op.drop_column('users', 'is_super_admin')
    
    # Drop roles table
    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles') 
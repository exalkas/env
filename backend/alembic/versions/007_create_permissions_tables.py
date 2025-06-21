"""Create permissions tables and populate default permissions

Revision ID: 007
Revises: 006
Create Date: 2024-01-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Create permissions table
    op.create_table('permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('module', sa.String(length=50), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'], unique=False)
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)

    # Create role_permissions table
    op.create_table('role_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('granted', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role_id', 'permission_id', name='_role_permission_uc')
    )

    # Create user_permissions table
    op.create_table('user_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('granted', sa.Boolean(), nullable=True, default=True),
        sa.Column('granted_by', sa.Integer(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'permission_id', name='_user_permission_uc')
    )

    # Define permissions table for inserts
    permissions_table = table('permissions',
        column('name', sa.String),
        column('display_name', sa.String),
        column('description', sa.Text),
        column('module', sa.String),
        column('action', sa.String),
        column('is_active', sa.Boolean)
    )

    # Insert all default permissions
    default_permissions = [
        # User management
        {'name': 'users.create', 'display_name': 'Create Users', 'description': 'Create new user accounts', 'module': 'users', 'action': 'create', 'is_active': True},
        {'name': 'users.read', 'display_name': 'View Users', 'description': 'View user accounts and profiles', 'module': 'users', 'action': 'read', 'is_active': True},
        {'name': 'users.update', 'display_name': 'Update Users', 'description': 'Edit existing user accounts', 'module': 'users', 'action': 'update', 'is_active': True},
        {'name': 'users.delete', 'display_name': 'Delete Users', 'description': 'Delete user accounts', 'module': 'users', 'action': 'delete', 'is_active': True},
        {'name': 'users.manage', 'display_name': 'Manage Users', 'description': 'Full user management capabilities', 'module': 'users', 'action': 'manage', 'is_active': True},

        # News management
        {'name': 'news.create', 'display_name': 'Create News', 'description': 'Create new news articles', 'module': 'news', 'action': 'create', 'is_active': True},
        {'name': 'news.read', 'display_name': 'View News', 'description': 'View news articles', 'module': 'news', 'action': 'read', 'is_active': True},
        {'name': 'news.update', 'display_name': 'Update News', 'description': 'Edit existing news articles', 'module': 'news', 'action': 'update', 'is_active': True},
        {'name': 'news.delete', 'display_name': 'Delete News', 'description': 'Delete news articles', 'module': 'news', 'action': 'delete', 'is_active': True},
        {'name': 'news.publish', 'display_name': 'Publish News', 'description': 'Publish and unpublish news articles', 'module': 'news', 'action': 'publish', 'is_active': True},
        {'name': 'news.manage', 'display_name': 'Manage News', 'description': 'Full news management capabilities', 'module': 'news', 'action': 'manage', 'is_active': True},

        # Asset management
        {'name': 'assets.create', 'display_name': 'Create Assets', 'description': 'Create new trading assets', 'module': 'assets', 'action': 'create', 'is_active': True},
        {'name': 'assets.read', 'display_name': 'View Assets', 'description': 'View trading assets', 'module': 'assets', 'action': 'read', 'is_active': True},
        {'name': 'assets.update', 'display_name': 'Update Assets', 'description': 'Edit existing trading assets', 'module': 'assets', 'action': 'update', 'is_active': True},
        {'name': 'assets.delete', 'display_name': 'Delete Assets', 'description': 'Delete trading assets', 'module': 'assets', 'action': 'delete', 'is_active': True},
        {'name': 'assets.manage', 'display_name': 'Manage Assets', 'description': 'Full asset management capabilities', 'module': 'assets', 'action': 'manage', 'is_active': True},

        # Subscription management
        {'name': 'subscriptions.create', 'display_name': 'Create Subscriptions', 'description': 'Create new subscription plans', 'module': 'subscriptions', 'action': 'create', 'is_active': True},
        {'name': 'subscriptions.read', 'display_name': 'View Subscriptions', 'description': 'View subscription plans', 'module': 'subscriptions', 'action': 'read', 'is_active': True},
        {'name': 'subscriptions.update', 'display_name': 'Update Subscriptions', 'description': 'Edit existing subscription plans', 'module': 'subscriptions', 'action': 'update', 'is_active': True},
        {'name': 'subscriptions.delete', 'display_name': 'Delete Subscriptions', 'description': 'Delete subscription plans', 'module': 'subscriptions', 'action': 'delete', 'is_active': True},
        {'name': 'subscriptions.manage', 'display_name': 'Manage Subscriptions', 'description': 'Full subscription management capabilities', 'module': 'subscriptions', 'action': 'manage', 'is_active': True},

        # Role management
        {'name': 'roles.create', 'display_name': 'Create Roles', 'description': 'Create new user roles', 'module': 'roles', 'action': 'create', 'is_active': True},
        {'name': 'roles.read', 'display_name': 'View Roles', 'description': 'View user roles', 'module': 'roles', 'action': 'read', 'is_active': True},
        {'name': 'roles.update', 'display_name': 'Update Roles', 'description': 'Edit existing user roles', 'module': 'roles', 'action': 'update', 'is_active': True},
        {'name': 'roles.delete', 'display_name': 'Delete Roles', 'description': 'Delete user roles', 'module': 'roles', 'action': 'delete', 'is_active': True},
        {'name': 'roles.manage', 'display_name': 'Manage Roles', 'description': 'Full role management capabilities', 'module': 'roles', 'action': 'manage', 'is_active': True},

        # Order management
        {'name': 'order.create', 'display_name': 'Create Orders', 'description': 'Create new trading orders', 'module': 'order', 'action': 'create', 'is_active': True},
        {'name': 'order.read', 'display_name': 'View Orders', 'description': 'View trading orders', 'module': 'order', 'action': 'read', 'is_active': True},
        {'name': 'order.update', 'display_name': 'Update Orders', 'description': 'Edit existing trading orders', 'module': 'order', 'action': 'update', 'is_active': True},
        {'name': 'order.delete', 'display_name': 'Delete Orders', 'description': 'Delete trading orders', 'module': 'order', 'action': 'delete', 'is_active': True},
        {'name': 'order.quote', 'display_name': 'Provide Quotes', 'description': 'Provide quotes for orders', 'module': 'order', 'action': 'quote', 'is_active': True},
        {'name': 'order.manage', 'display_name': 'Manage Orders', 'description': 'Full order management capabilities', 'module': 'order', 'action': 'manage', 'is_active': True},

        # Transaction management
        {'name': 'transactions.read', 'display_name': 'View Transactions', 'description': 'View transaction records', 'module': 'transactions', 'action': 'read', 'is_active': True},
        {'name': 'transactions.update', 'display_name': 'Update Transactions', 'description': 'Edit transaction records', 'module': 'transactions', 'action': 'update', 'is_active': True},
        {'name': 'transactions.manage', 'display_name': 'Manage Transactions', 'description': 'Full transaction management capabilities', 'module': 'transactions', 'action': 'manage', 'is_active': True},

        # Analytics and reporting
        {'name': 'analytics.read', 'display_name': 'View Analytics', 'description': 'View analytics and reports', 'module': 'analytics', 'action': 'read', 'is_active': True},
        {'name': 'analytics.manage', 'display_name': 'Manage Analytics', 'description': 'Full analytics management capabilities', 'module': 'analytics', 'action': 'manage', 'is_active': True},

        # System administration
        {'name': 'system.settings', 'display_name': 'System Settings', 'description': 'Access system settings', 'module': 'system', 'action': 'settings', 'is_active': True},
        {'name': 'system.logs', 'display_name': 'System Logs', 'description': 'View system logs', 'module': 'system', 'action': 'logs', 'is_active': True},
        {'name': 'system.admin', 'display_name': 'System Admin', 'description': 'Full system administration access', 'module': 'system', 'action': 'admin', 'is_active': True},
    ]

    op.bulk_insert(permissions_table, default_permissions)

    # Now assign default permissions to roles
    # First, get the role and permission IDs by using raw SQL
    
    # Define tables for the insert operations
    role_permissions_table = table('role_permissions',
        column('role_id', sa.Integer),
        column('permission_id', sa.Integer),
        column('granted', sa.Boolean)
    )

    # Assign permissions to moderator role (level 30)
    moderator_permissions = [
        'assets.read', 'subscriptions.read', 'news.create', 'news.read', 
        'news.update', 'news.delete', 'news.publish', 'news.manage'
    ]

    # Assign permissions to admin role (level 50)
    admin_permissions = [
        'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage',
        'news.create', 'news.read', 'news.update', 'news.delete', 'news.publish', 'news.manage',
        'assets.create', 'assets.read', 'assets.update', 'assets.delete', 'assets.manage',
        'subscriptions.create', 'subscriptions.read', 'subscriptions.update', 'subscriptions.delete', 'subscriptions.manage',
        'roles.read',
        'order.read', 'order.update', 'order.quote', 'order.manage',
        'transactions.read', 'transactions.update', 'transactions.manage',
        'analytics.read', 'analytics.manage'
    ]

    # Use raw SQL to insert role permissions since we need to look up IDs
    connection = op.get_bind()
    
    # Get moderator role ID
    moderator_role = connection.execute(sa.text("SELECT id FROM roles WHERE name = 'moderator'")).fetchone()
    if moderator_role:
        moderator_role_id = moderator_role[0]
        for permission_name in moderator_permissions:
            permission_result = connection.execute(
                sa.text("SELECT id FROM permissions WHERE name = :name"), 
                {"name": permission_name}
            ).fetchone()
            if permission_result:
                permission_id = permission_result[0]
                connection.execute(
                    sa.text("INSERT INTO role_permissions (role_id, permission_id, granted) VALUES (:role_id, :permission_id, :granted)"),
                    {"role_id": moderator_role_id, "permission_id": permission_id, "granted": True}
                )

    # Get admin role ID
    admin_role = connection.execute(sa.text("SELECT id FROM roles WHERE name = 'admin'")).fetchone()
    if admin_role:
        admin_role_id = admin_role[0]
        for permission_name in admin_permissions:
            permission_result = connection.execute(
                sa.text("SELECT id FROM permissions WHERE name = :name"), 
                {"name": permission_name}
            ).fetchone()
            if permission_result:
                permission_id = permission_result[0]
                connection.execute(
                    sa.text("INSERT INTO role_permissions (role_id, permission_id, granted) VALUES (:role_id, :permission_id, :granted)"),
                    {"role_id": admin_role_id, "permission_id": permission_id, "granted": True}
                )


def downgrade():
    # Drop tables in reverse order
    op.drop_table('user_permissions')
    op.drop_table('role_permissions')
    op.drop_table('permissions') 
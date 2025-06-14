#!/usr/bin/env python3

from app.db.session import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.core.security import get_password_hash

def create_test_user():
    db = SessionLocal()
    
    try:
        # Check if we have a user role
        user_role = db.query(Role).filter(Role.name == 'user').first()
        if not user_role:
            print('Creating user role...')
            user_role = Role(
                name='user',
                display_name='User',
                level=10,
                description='Regular user'
            )
            db.add(user_role)
            db.commit()
            db.refresh(user_role)
        
        # Check if test user exists
        test_user = db.query(User).filter(User.email == 'test@example.com').first()
        if not test_user:
            print('Creating test user...')
            test_user = User(
                email='test@example.com',
                hashed_password=get_password_hash(''),
                full_name='Test User',
                is_active=True,
                is_super_admin=False,
                kyc_verified=False,
                subscription_type='trial',
                role_id=user_role.id
            )
            db.add(test_user)
            db.commit()
            print('Test user created: test@example.com / ')
        else:
            print('Test user already exists: test@example.com / ')
            
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 
#!/usr/bin/env python3
"""
Script to create a default admin user
"""

import os
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.db.session import SessionLocal

def create_admin_user():
    """Create a default admin user"""
    db: Session = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.email == os.environ["ADMIN_EMAIL"]).first()
        
        if admin_user:
            print("✓ Admin user already exists!")
            print("Admin email comes from ADMIN_EMAIL.")
            return
        
        # Create admin user
        hashed_password = get_password_hash(os.environ["ADMIN_PASSWORD"])
        
        admin_user = User(
            email=os.environ["ADMIN_EMAIL"],
            hashed_password=hashed_password,
            full_name="System Administrator",
            is_active=True,
            is_admin=True,
            kyc_verified=True,
            subscription_type="standard"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✓ Admin user created successfully!")
        print("Admin email comes from ADMIN_EMAIL.")
        print("Admin password comes from the local environment.")
        print(f"  Please change the password after first login.")
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user() 
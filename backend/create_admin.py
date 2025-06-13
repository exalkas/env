#!/usr/bin/env python3
"""
Script to create a default admin user
"""

from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.db.session import SessionLocal

def create_admin_user():
    """Create a default admin user"""
    db: Session = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.email == "admin@greenenergy.com").first()
        
        if admin_user:
            print("✓ Admin user already exists!")
            print(f"  Email: admin@greenenergy.com")
            return
        
        # Create admin user
        hashed_password = get_password_hash("")
        
        admin_user = User(
            email="admin@greenenergy.com",
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
        print(f"  Email: admin@greenenergy.com")
        print(f"  Password: ")
        print(f"  Please change the password after first login.")
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user() 
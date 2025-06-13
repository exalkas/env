#!/usr/bin/env python3
"""
Script to create sample data for the marketplace
"""

from sqlalchemy.orm import Session
from app.models.market import Asset
from app.db.session import SessionLocal

def create_sample_data():
    """Create sample assets for the marketplace"""
    db: Session = SessionLocal()
    
    try:
        # Check if assets already exist
        existing_assets = db.query(Asset).count()
        
        if existing_assets > 0:
            print(f"✓ Sample data already exists! Found {existing_assets} assets.")
            return
        
        # Create sample assets
        sample_assets = [
            {
                "name": "European Union Allowances",
                "symbol": "EUA",
                "asset_type": "EUA",
                "description": "EU Emission Trading System allowances",
                "current_price": 85.50,
                "requires_kyc": True,
                "is_active": True
            },
            {
                "name": "European Union Allowances 2030",
                "symbol": "EUA2",
                "asset_type": "EUA2", 
                "description": "EU ETS allowances for compliance period 2030",
                "current_price": 90.25,
                "requires_kyc": True,
                "is_active": True
            },
            {
                "name": "Guarantees of Origin",
                "symbol": "GOO",
                "asset_type": "GOO",
                "description": "Renewable energy certificates - Guarantees of Origin",
                "current_price": 2.15,
                "requires_kyc": False,
                "is_active": True
            },
            {
                "name": "Green Energy Certificates",
                "symbol": "GEC",
                "asset_type": "GEO",
                "description": "Green Energy Certificates for renewable energy",
                "current_price": 3.80,
                "requires_kyc": False,
                "is_active": True
            },
            {
                "name": "Biofuel Credits",
                "symbol": "BFC",
                "asset_type": "BIOFUEL",
                "description": "Biofuel sustainability credits",
                "current_price": 12.50,
                "requires_kyc": False,
                "is_active": True
            }
        ]
        
        created_count = 0
        for asset_data in sample_assets:
            asset = Asset(**asset_data)
            db.add(asset)
            created_count += 1
        
        db.commit()
        
        print(f"✓ Sample data created successfully!")
        print(f"  Created {created_count} assets")
        print("  Assets available: EUA, EUA2, GOO, GEC, BFC")
        
    except Exception as e:
        print(f"✗ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data() 
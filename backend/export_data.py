#!/usr/bin/env python3
"""
Database Data Export Script
Exports all table data to JSON files for cross-platform deployment
"""

import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import inspect

from app.db.session import SessionLocal
from app.models import (
    User, Role, Subscription, Asset, Order, Transaction,
    News, NewsCategory, NewsCategoryAssociation, RFQ, 
    Permission, RolePermission, UserPermission
)

def serialize_datetime(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError("Type %s not serializable" % type(obj))

def export_table_data(db: Session, model_class, filename: str):
    """Export data from a single table to JSON"""
    try:
        # Get all records
        records = db.query(model_class).all()
        
        # Convert to dictionaries
        data = []
        for record in records:
            record_dict = {}
            
            # Get column names using SQLAlchemy inspector
            inspector = inspect(model_class)
            for column in inspector.columns:
                column_name = column.name
                value = getattr(record, column_name)
                record_dict[column_name] = value
            
            data.append(record_dict)
        
        # Create data directory if it doesn't exist
        os.makedirs("data_backup", exist_ok=True)
        
        # Write to JSON file
        filepath = os.path.join("data_backup", filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=serialize_datetime, ensure_ascii=False)
        
        print(f"✓ Exported {len(data)} records from {model_class.__tablename__} to {filename}")
        return True
        
    except Exception as e:
        print(f"✗ Error exporting {model_class.__tablename__}: {e}")
        return False

def export_all_data():
    """Export all table data to JSON files"""
    print("🚀 Starting database data export...")
    print(f"📅 Export timestamp: {datetime.now().isoformat()}")
    
    db: Session = SessionLocal()
    
    try:
        # Define export order (important for foreign key dependencies)
        # Export tables in dependency order (parent tables first)
        export_tasks = [
            # Core tables (no dependencies)
            (Role, "roles.json"),
            (NewsCategory, "news_categories.json"),
            (Asset, "assets.json"),
            (Permission, "permissions.json"),
            
            # Tables with single dependencies
            (User, "users.json"),
            (News, "news.json"),
            (RFQ, "rfqs.json"),
            (Subscription, "subscriptions.json"),
            
            # Tables with complex dependencies
            (Order, "orders.json"),
            (Transaction, "transactions.json"),
            (NewsCategoryAssociation, "news_category_associations.json"),
            (RolePermission, "role_permissions.json"),
            (UserPermission, "user_permissions.json"),
        ]
        
        successful_exports = 0
        total_exports = len(export_tasks)
        
        for model_class, filename in export_tasks:
            if export_table_data(db, model_class, filename):
                successful_exports += 1
        
        # Create export metadata
        metadata = {
            "export_timestamp": datetime.now().isoformat(),
            "total_tables": total_exports,
            "successful_exports": successful_exports,
            "failed_exports": total_exports - successful_exports,
            "export_order": [task[1] for task in export_tasks]
        }
        
        with open("data_backup/export_metadata.json", 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Export completed!")
        print(f"📊 Successfully exported {successful_exports}/{total_exports} tables")
        print(f"📁 Data saved to: ./data_backup/")
        
        if successful_exports < total_exports:
            print(f"⚠️  {total_exports - successful_exports} tables failed to export")
            
    except Exception as e:
        print(f"✗ Error during export: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    export_all_data() 
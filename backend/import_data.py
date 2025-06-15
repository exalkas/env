#!/usr/bin/env python3
"""
Database Data Import Script
Imports table data from JSON files for cross-platform deployment
"""

import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from app.db.session import SessionLocal
from app.models import (
    User, Role, Subscription, Asset, Order, Transaction,
    News, NewsCategory, NewsCategoryAssociation, RFQ, 
    Permission, RolePermission, UserPermission
)

def parse_datetime(date_string):
    """Parse ISO datetime string back to datetime object"""
    if date_string:
        try:
            return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        except:
            return None
    return None

def clear_table_data(db: Session, model_class):
    """Clear all data from a table"""
    try:
        db.query(model_class).delete()
        db.commit()
        print(f"✓ Cleared data from {model_class.__tablename__}")
        return True
    except Exception as e:
        print(f"✗ Error clearing {model_class.__tablename__}: {e}")
        db.rollback()
        return False

def import_table_data(db: Session, model_class, filename: str):
    """Import data from JSON file to a table"""
    filepath = os.path.join("data_backup", filename)
    
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filename}")
        return False
    
    try:
        # Read JSON data
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print(f"✓ No data to import for {model_class.__tablename__}")
            return True
        
        # Get column information
        inspector = inspect(model_class)
        columns = {col.name: col for col in inspector.columns}
        
        # Create objects
        objects = []
        for record_dict in data:
            # Convert datetime strings back to datetime objects
            for key, value in record_dict.items():
                if key in columns and value is not None:
                    column = columns[key]
                    # Check if this is a datetime column and value is a string
                    if hasattr(column.type, 'python_type') and column.type.python_type == datetime:
                        if isinstance(value, str):
                            record_dict[key] = parse_datetime(value)
            
            # Create model instance
            obj = model_class(**record_dict)
            objects.append(obj)
        
        # Bulk insert
        db.add_all(objects)
        db.commit()
        
        print(f"✓ Imported {len(objects)} records to {model_class.__tablename__}")
        return True
        
    except Exception as e:
        print(f"✗ Error importing {model_class.__tablename__}: {e}")
        db.rollback()
        return False

def reset_sequences(db: Session):
    """Reset PostgreSQL sequences for auto-increment columns"""
    try:
        # Get all tables that have auto-increment primary keys
        tables_with_sequences = [
            ('users', 'id'),
            ('roles', 'id'),
            ('assets', 'id'),
            ('orders', 'id'),
            ('transactions', 'id'),
            ('news', 'id'),
            ('news_categories', 'id'),
            ('rfqs', 'id'),
            ('subscriptions', 'id'),
            ('permissions', 'id'),
            ('role_permissions', 'id'),
            ('user_permissions', 'id'),
        ]
        
        for table_name, column_name in tables_with_sequences:
            # Reset sequence to current max value + 1
            db.execute(text(f"""
                SELECT setval(pg_get_serial_sequence('{table_name}', '{column_name}'), 
                              COALESCE(MAX({column_name}), 1)) 
                FROM {table_name};
            """))
        
        db.commit()
        print("✓ Reset all sequences")
        return True
        
    except Exception as e:
        print(f"✗ Error resetting sequences: {e}")
        db.rollback()
        return False

def import_all_data(clear_existing=True):
    """Import all table data from JSON files"""
    print("🚀 Starting database data import...")
    
    # Check if backup directory exists
    if not os.path.exists("data_backup"):
        print("✗ data_backup directory not found. Please run export_data.py first.")
        return
    
    # Load metadata
    metadata_file = "data_backup/export_metadata.json"
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        print(f"📅 Importing data exported on: {metadata['export_timestamp']}")
        print(f"📊 Total tables to import: {metadata['total_tables']}")
    
    db: Session = SessionLocal()
    
    try:
        # Define import order (reverse of export order for deletion, same for insertion)
        import_tasks = [
            # Core tables (no dependencies) - import first
            (Role, "roles.json"),
            (NewsCategory, "news_categories.json"),
            (Asset, "assets.json"),
            (Permission, "permissions.json"),
            
            # Tables with single dependencies
            (User, "users.json"),
            (News, "news.json"),
            (RFQ, "rfqs.json"),
            (Subscription, "subscriptions.json"),
            
            # Tables with complex dependencies - import last
            (Order, "orders.json"),
            (Transaction, "transactions.json"),
            (NewsCategoryAssociation, "news_category_associations.json"),
            (RolePermission, "role_permissions.json"),
            (UserPermission, "user_permissions.json"),
        ]
        
        if clear_existing:
            print("\n🗑️  Clearing existing data...")
            # Clear in reverse order (to handle foreign key constraints)
            for model_class, filename in reversed(import_tasks):
                clear_table_data(db, model_class)
        
        print("\n📥 Importing data...")
        successful_imports = 0
        total_imports = len(import_tasks)
        
        # Import in forward order
        for model_class, filename in import_tasks:
            if import_table_data(db, model_class, filename):
                successful_imports += 1
        
        # Reset sequences for PostgreSQL
        print("\n🔄 Resetting sequences...")
        reset_sequences(db)
        
        print(f"\n✅ Import completed!")
        print(f"📊 Successfully imported {successful_imports}/{total_imports} tables")
        
        if successful_imports < total_imports:
            print(f"⚠️  {total_imports - successful_imports} tables failed to import")
            
    except Exception as e:
        print(f"✗ Error during import: {e}")
        db.rollback()
    finally:
        db.close()

def import_specific_table(table_name: str):
    """Import data for a specific table only"""
    table_mapping = {
        'users': (User, 'users.json'),
        'roles': (Role, 'roles.json'),
        'assets': (Asset, 'assets.json'),
        'orders': (Order, 'orders.json'),
        'transactions': (Transaction, 'transactions.json'),
        'news': (News, 'news.json'),
        'news_categories': (NewsCategory, 'news_categories.json'),
        'news_category_associations': (NewsCategoryAssociation, 'news_category_associations.json'),
        'rfqs': (RFQ, 'rfqs.json'),
        'subscriptions': (Subscription, 'subscriptions.json'),
        'permissions': (Permission, 'permissions.json'),
        'role_permissions': (RolePermission, 'role_permissions.json'),
        'user_permissions': (UserPermission, 'user_permissions.json'),
    }
    
    if table_name not in table_mapping:
        print(f"✗ Unknown table: {table_name}")
        print(f"Available tables: {', '.join(table_mapping.keys())}")
        return
    
    model_class, filename = table_mapping[table_name]
    db: Session = SessionLocal()
    
    try:
        print(f"📥 Importing {table_name}...")
        clear_table_data(db, model_class)
        import_table_data(db, model_class, filename)
        print("✅ Import completed!")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--table" and len(sys.argv) > 2:
            # Import specific table
            import_specific_table(sys.argv[2])
        elif sys.argv[1] == "--no-clear":
            # Import without clearing existing data
            import_all_data(clear_existing=False)
        else:
            print("Usage:")
            print("  python import_data.py                    # Import all data (clears existing)")
            print("  python import_data.py --no-clear        # Import all data (keeps existing)")
            print("  python import_data.py --table users     # Import specific table")
    else:
        # Default: import all data
        import_all_data()
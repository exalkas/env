#!/usr/bin/env python3
"""
Database Export Script for Emisify Platform

This script exports the complete database structure and data to SQL files
that can be used to recreate the database on any PostgreSQL instance.

Usage:
    python export_database.py

Output files:
    - database_structure.sql: Contains all CREATE TABLE, INDEX, and CONSTRAINT statements
    - database_data.sql: Contains all INSERT statements with data
    - import_database.sql: Combined script for easy import
"""

import os
import sys
import subprocess
from datetime import datetime
from app.core.config import get_settings

settings = get_settings()

def run_command(command, description):
    """Run a shell command and handle errors."""
    print(f"Executing: {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error in {description}: {e}")
        print(f"Command output: {e.stdout}")
        print(f"Command error: {e.stderr}")
        return None

def export_database():
    """Export database structure and data."""
    
    # Create exports directory
    export_dir = "database_exports"
    os.makedirs(export_dir, exist_ok=True)
    
    # Get database connection details
    db_host = settings.POSTGRES_SERVER
    db_port = settings.POSTGRES_PORT
    db_user = settings.POSTGRES_USER
    db_name = settings.POSTGRES_DB
    db_password = settings.POSTGRES_PASSWORD
    
    # Set PGPASSWORD environment variable to avoid password prompts
    env = os.environ.copy()
    env['PGPASSWORD'] = db_password
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    print(f"🚀 Starting database export for {db_name}@{db_host}:{db_port}")
    print(f"📁 Export directory: {export_dir}")
    
    # 1. Export database structure only (schema)
    structure_file = f"{export_dir}/database_structure_{timestamp}.sql"
    structure_cmd = f"pg_dump -h {db_host} -p {db_port} -U {db_user} -d {db_name} --schema-only --no-owner --no-privileges -f {structure_file}"
    
    print("\n📋 Exporting database structure...")
    result = subprocess.run(structure_cmd, shell=True, env=env, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✅ Database structure exported to: {structure_file}")
    else:
        print(f"❌ Error exporting structure: {result.stderr}")
        return False
    
    # 2. Export data only (no schema)
    data_file = f"{export_dir}/database_data_{timestamp}.sql"
    data_cmd = f"pg_dump -h {db_host} -p {db_port} -U {db_user} -d {db_name} --data-only --no-owner --no-privileges --disable-triggers -f {data_file}"
    
    print("\n📊 Exporting database data...")
    result = subprocess.run(data_cmd, shell=True, env=env, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✅ Database data exported to: {data_file}")
    else:
        print(f"❌ Error exporting data: {result.stderr}")
        return False
    
    # 3. Create combined import script
    combined_file = f"{export_dir}/import_database_{timestamp}.sql"
    
    print("\n🔄 Creating combined import script...")
    try:
        with open(combined_file, 'w', encoding='utf-8') as combined:
            # Write header
            combined.write("-- Emisify Platform Database Import Script\n")
            combined.write(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            combined.write("-- \n")
            combined.write("-- This script will recreate the complete Emisify database\n")
            combined.write("-- Run this on a fresh PostgreSQL database\n")
            combined.write("-- \n\n")
            
            combined.write("-- Disable triggers for faster import\n")
            combined.write("SET session_replication_role = replica;\n\n")
            
            combined.write("-- ==========================================\n")
            combined.write("-- DATABASE STRUCTURE\n")
            combined.write("-- ==========================================\n\n")
            
            # Add structure
            with open(structure_file, 'r', encoding='utf-8') as structure:
                combined.write(structure.read())
            
            combined.write("\n\n-- ==========================================\n")
            combined.write("-- DATABASE DATA\n")
            combined.write("-- ==========================================\n\n")
            
            # Add data
            with open(data_file, 'r', encoding='utf-8') as data:
                combined.write(data.read())
            
            combined.write("\n\n-- Re-enable triggers\n")
            combined.write("SET session_replication_role = DEFAULT;\n\n")
            
            combined.write("-- Update sequences to correct values\n")
            combined.write("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(MAX(id), 1)) FROM roles;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('news', 'id'), COALESCE(MAX(id), 1)) FROM news;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('news_categories', 'id'), COALESCE(MAX(id), 1)) FROM news_categories;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('subscriptions', 'id'), COALESCE(MAX(id), 1)) FROM subscriptions;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('assets', 'id'), COALESCE(MAX(id), 1)) FROM assets;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE(MAX(id), 1)) FROM orders;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('transactions', 'id'), COALESCE(MAX(id), 1)) FROM transactions;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('learning_paths', 'id'), COALESCE(MAX(id), 1)) FROM learning_paths;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('modules', 'id'), COALESCE(MAX(id), 1)) FROM modules;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('lessons', 'id'), COALESCE(MAX(id), 1)) FROM lessons;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('assessments', 'id'), COALESCE(MAX(id), 1)) FROM assessments;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('questions', 'id'), COALESCE(MAX(id), 1)) FROM questions;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('question_categories', 'id'), COALESCE(MAX(id), 1)) FROM question_categories;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('glossary_terms', 'id'), COALESCE(MAX(id), 1)) FROM glossary_terms;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('rfqs', 'id'), COALESCE(MAX(id), 1)) FROM rfqs;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('payment_gateways', 'id'), COALESCE(MAX(id), 1)) FROM payment_gateways;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('payment_methods', 'id'), COALESCE(MAX(id), 1)) FROM payment_methods;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('payment_transactions', 'id'), COALESCE(MAX(id), 1)) FROM payment_transactions;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('bank_transfer_details', 'id'), COALESCE(MAX(id), 1)) FROM bank_transfer_details;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('kyc_submissions', 'id'), COALESCE(MAX(id), 1)) FROM kyc_submissions;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('email_templates', 'id'), COALESCE(MAX(id), 1)) FROM email_templates;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('email_actions', 'id'), COALESCE(MAX(id), 1)) FROM email_actions;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('email_action_logs', 'id'), COALESCE(MAX(id), 1)) FROM email_action_logs;\n")
            combined.write("SELECT setval(pg_get_serial_sequence('prompt_templates', 'id'), COALESCE(MAX(id), 1)) FROM prompt_templates;\n")
            
            combined.write("\n-- Import completed successfully!\n")
            combined.write("-- You can now start your application.\n")
        
        print(f"✅ Combined import script created: {combined_file}")
        
    except Exception as e:
        print(f"❌ Error creating combined script: {e}")
        return False
    
    # 4. Create platform-specific import instructions
    instructions_file = f"{export_dir}/IMPORT_INSTRUCTIONS_{timestamp}.md"
    
    print("\n📖 Creating import instructions...")
    try:
        with open(instructions_file, 'w', encoding='utf-8') as instructions:
            instructions.write(f"""# Database Import Instructions

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Files Generated

1. `database_structure_{timestamp}.sql` - Database schema only
2. `database_data_{timestamp}.sql` - Data only  
3. `import_database_{timestamp}.sql` - Complete import script (recommended)

## Import Methods

### Method 1: Complete Import (Recommended)

Use the combined import script for easiest setup:

```bash
# Create new database
createdb emisify_new

# Import everything
psql -d emisify_new -f import_database_{timestamp}.sql
```

### Method 2: Separate Import

If you need more control:

```bash
# Create new database
createdb emisify_new

# Import structure first
psql -d emisify_new -f database_structure_{timestamp}.sql

# Import data second
psql -d emisify_new -f database_data_{timestamp}.sql
```

## Platform-Specific Instructions

### Windows Laptop Setup

1. **Install PostgreSQL for Windows**
   ```cmd
   # Download from: https://www.postgresql.org/download/windows/
   # Or use chocolatey:
   choco install postgresql
   ```

2. **Create Database**
   ```cmd
   # Open Command Prompt as Administrator
   createdb -U postgres emisify
   ```

3. **Import Database**
   ```cmd
   psql -U postgres -d emisify -f import_database_{timestamp}.sql
   ```

4. **Update Connection String**
   ```
   POSTGRES_SERVER=localhost
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=emisify
   POSTGRES_PORT=5432
   ```

### AWS Ubuntu Lightsail Setup

1. **Install PostgreSQL**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Setup Database User**
   ```bash
   sudo -u postgres createuser --interactive emisify
   sudo -u postgres createdb emisify
   sudo -u postgres psql -c "ALTER USER emisify PASSWORD 'your_';"
   ```

3. **Transfer and Import Database**
   ```bash
   # Upload SQL file to server (using scp, sftp, or copy/paste)
   scp import_database_{timestamp}.sql user@your-server:/home/user/

   # Import database
   sudo -u postgres psql -d emisify -f import_database_{timestamp}.sql
   ```

4. **Configure PostgreSQL for Remote Access** (if needed)
   ```bash
   sudo nano /etc/postgresql/14/main/postgresql.conf
   # Change: listen_addresses = '*'
   
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   # Add: host all all 0.0.0.0/0 md5
   
   sudo systemctl restart postgresql
   ```

5. **Update Environment Variables**
   ```bash
   export POSTGRES_SERVER=localhost
   export POSTGRES_USER=emisify
   export POSTGRES_PASSWORD=your_
   export POSTGRES_DB=emisify
   export POSTGRES_PORT=5432
   ```

## Verification

After import, verify the database:

```sql
-- Check tables exist
\\dt

-- Check data counts
SELECT 'users' as table_name, count(*) from users
UNION ALL
SELECT 'news', count(*) from news
UNION ALL
SELECT 'subscriptions', count(*) from subscriptions
UNION ALL
SELECT 'assets', count(*) from assets;

-- Check sequences are correct
SELECT schemaname, sequencename, last_value 
FROM pg_sequences 
ORDER BY sequencename;
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   sudo chown postgres:postgres import_database_{timestamp}.sql
   ```

2. **Database Already Exists**
   ```bash
   dropdb emisify  # BE CAREFUL - THIS DELETES THE DATABASE
   createdb emisify
   ```

3. **Sequence Issues**
   - The import script automatically fixes sequence values
   - Run the sequence update commands manually if needed

4. **Connection Issues**
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify connection details in your .env file
   - Test connection: `psql -h localhost -U emisify -d emisify`

## Security Notes

- Change default passwords in production
- Use strong passwords for database users
- Configure firewall rules appropriately
- Consider SSL connections for production

## Support

If you encounter issues:
1. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
2. Verify database version compatibility
3. Ensure sufficient disk space and memory
""")
        
        print(f"✅ Import instructions created: {instructions_file}")
        
    except Exception as e:
        print(f"❌ Error creating instructions: {e}")
        return False
    
    # 5. Display summary
    print("\n" + "="*60)
    print("🎉 DATABASE EXPORT COMPLETED SUCCESSFULLY!")
    print("="*60)
    print(f"📁 Export directory: {export_dir}/")
    print(f"📋 Structure file: database_structure_{timestamp}.sql")
    print(f"📊 Data file: database_data_{timestamp}.sql")
    print(f"🔄 Combined import: import_database_{timestamp}.sql")
    print(f"📖 Instructions: IMPORT_INSTRUCTIONS_{timestamp}.md")
    print("\n💡 Quick start:")
    print(f"   createdb your_new_db")
    print(f"   psql -d your_new_db -f {export_dir}/import_database_{timestamp}.sql")
    print("\n📖 See IMPORT_INSTRUCTIONS for platform-specific setup details.")
    
    return True

if __name__ == "__main__":
    if not export_database():
        sys.exit(1)
    print("\n✅ Export process completed successfully!") 
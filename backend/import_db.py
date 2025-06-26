#!/usr/bin/env python3
"""
Database Import Script for Emisify Platform

This script imports database structure and data from SQL files
created by the export_database.py script.

Usage:
    python import_db.py [import_file.sql] [target_database_name] [--drop-existing]

Options:
    import_file.sql: Path to the SQL import file (optional, will prompt if not provided)
    target_database_name: Name of target database (optional, will prompt if not provided)
    --drop-existing: Drop existing database if it exists

Examples:
    python import_db.py database_exports/import_database_20240101_120000.sql emisify_new
    python import_db.py --drop-existing
"""

import os
import sys
import subprocess
import argparse
import glob
from datetime import datetime


def run_command(command, description, env=None):
    """Run a shell command and handle errors."""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, env=env)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error in {description}: {e}")
        if e.stdout:
            print(f"Command output: {e.stdout}")
        if e.stderr:
            print(f"Command error: {e.stderr}")
        return None


def check_prerequisites():
    """Check if required tools are available."""
    print("🔍 Checking prerequisites...")
    
    # Check PostgreSQL tools
    try:
        subprocess.run(["psql", "--version"], check=True, capture_output=True)
        subprocess.run(["createdb", "--version"], check=True, capture_output=True)
        subprocess.run(["dropdb", "--version"], check=True, capture_output=True)
        print("✅ PostgreSQL client tools found")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ PostgreSQL client tools not found")
        print("Please install PostgreSQL:")
        print("  Windows: https://www.postgresql.org/download/windows/")
        print("  Ubuntu/Debian: sudo apt install postgresql-client")
        print("  CentOS/RHEL: sudo yum install postgresql")
        print("  macOS: brew install postgresql")
        return False


def find_import_files():
    """Find available import files."""
    pattern = "database_exports/import_database_*.sql"
    files = glob.glob(pattern)
    if not files:
        # Also check in current directory
        files = glob.glob("import_database_*.sql")
    return sorted(files, reverse=True)  # Most recent first


def get_user_input(prompt, default=None):
    """Get user input with optional default."""
    if default:
        user_input = input(f"{prompt} [{default}]: ").strip()
        return user_input if user_input else default
    else:
        while True:
            user_input = input(f"{prompt}: ").strip()
            if user_input:
                return user_input
            print("This field is required.")


def import_database(import_file, target_db, drop_existing=False, db_user="postgres", db_host="localhost", db_port="5432", db_password=""):
    """Import database from SQL file."""
    
    # Set environment for PostgreSQL
    env = os.environ.copy()
    if db_password:
        env['PGPASSWORD'] = db_password
    
    print(f"\n🚀 Starting database import")
    print(f"📁 Import file: {import_file}")
    print(f"🎯 Target database: {target_db}")
    print(f"🖥️  Host: {db_host}:{db_port}")
    print(f"👤 User: {db_user}")
    
    # Check if database exists
    check_db_cmd = f"psql -h {db_host} -p {db_port} -U {db_user} -lqt | cut -d \| -f 1 | grep -qw {target_db}"
    result = subprocess.run(check_db_cmd, shell=True, capture_output=True, env=env)
    db_exists = result.returncode == 0
    
    if db_exists:
        if drop_existing:
            print(f"⚠️  Database '{target_db}' exists. Dropping...")
            drop_cmd = f"dropdb -h {db_host} -p {db_port} -U {db_user} {target_db}"
            if not run_command(drop_cmd, f"Dropping existing database '{target_db}'", env):
                return False
        else:
            print(f"❌ Database '{target_db}' already exists")
            print("Use --drop-existing flag to drop it first, or choose a different name")
            return False
    
    # Create new database
    create_cmd = f"createdb -h {db_host} -p {db_port} -U {db_user} {target_db}"
    if not run_command(create_cmd, f"Creating database '{target_db}'", env):
        return False
    
    # Import SQL file
    import_cmd = f"psql -h {db_host} -p {db_port} -U {db_user} -d {target_db} -f {import_file}"
    if not run_command(import_cmd, f"Importing data from '{import_file}'", env):
        return False
    
    # Verify import
    verify_cmd = f"psql -h {db_host} -p {db_port} -U {db_user} -d {target_db} -c \"SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';\""
    result = run_command(verify_cmd, "Verifying import", env)
    
    if result:
        print("\n" + "="*60)
        print("🎉 DATABASE IMPORT COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"✅ Database '{target_db}' has been created and populated")
        print(f"✅ Connection string: postgresql://{db_user}:***@{db_host}:{db_port}/{target_db}")
        print("\n📋 Database verification:")
        print(result.strip())
        
        # Show additional verification
        count_cmd = f"""psql -h {db_host} -p {db_port} -U {db_user} -d {target_db} -c "
        SELECT 
            'users' as table_name, count(*) as records from users
        UNION ALL
        SELECT 'news', count(*) from news
        UNION ALL
        SELECT 'roles', count(*) from roles
        UNION ALL
        SELECT 'subscriptions', count(*) from subscriptions
        ORDER BY table_name;
        \""""
        
        count_result = run_command(count_cmd, "Getting table record counts", env)
        if count_result:
            print("\n📊 Record counts:")
            print(count_result.strip())
        
        return True
    else:
        print("\n❌ Import verification failed")
        return False


def main():
    parser = argparse.ArgumentParser(description="Import Emisify database from SQL file")
    parser.add_argument("import_file", nargs="?", help="Path to SQL import file")
    parser.add_argument("target_db", nargs="?", help="Target database name")
    parser.add_argument("--drop-existing", action="store_true", help="Drop existing database if it exists")
    parser.add_argument("--db-user", default="postgres", help="Database user (default: postgres)")
    parser.add_argument("--db-host", default="localhost", help="Database host (default: localhost)")
    parser.add_argument("--db-port", default="5432", help="Database port (default: 5432)")
    parser.add_argument("--db-password", default="", help="Database password (will prompt if not provided)")
    
    args = parser.parse_args()
    
    print("="*60)
    print("🗄️  EMISIFY DATABASE IMPORT TOOL")
    print("="*60)
    
    # Check prerequisites
    if not check_prerequisites():
        sys.exit(1)
    
    # Get import file
    import_file = args.import_file
    if not import_file:
        available_files = find_import_files()
        if available_files:
            print("\n📁 Available import files:")
            for i, file in enumerate(available_files):
                size = os.path.getsize(file) / 1024 / 1024  # MB
                mtime = datetime.fromtimestamp(os.path.getmtime(file))
                print(f"  {i+1}. {file} ({size:.1f}MB) - {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
            
            while True:
                try:
                    choice = input(f"\nSelect file (1-{len(available_files)}) or enter path: ").strip()
                    if choice.isdigit() and 1 <= int(choice) <= len(available_files):
                        import_file = available_files[int(choice) - 1]
                        break
                    elif os.path.exists(choice):
                        import_file = choice
                        break
                    else:
                        print("Invalid choice or file not found")
                except KeyboardInterrupt:
                    print("\nCancelled by user")
                    sys.exit(0)
        else:
            import_file = get_user_input("Enter path to SQL import file")
    
    if not os.path.exists(import_file):
        print(f"❌ Import file not found: {import_file}")
        sys.exit(1)
    
    # Get target database name
    target_db = args.target_db
    if not target_db:
        target_db = get_user_input("Enter target database name", "emisify")
    
    # Get database password if not provided
    db_password = args.db_password
    if not db_password and args.db_user != "postgres":
        import getpass
        db_password = getpass.getpass(f"Enter password for user '{args.db_user}': ")
    
    # Confirm import
    print(f"\n📋 Import Summary:")
    print(f"  Import file: {import_file}")
    print(f"  Target database: {target_db}")
    print(f"  Database host: {args.db_host}:{args.db_port}")
    print(f"  Database user: {args.db_user}")
    print(f"  Drop existing: {'Yes' if args.drop_existing else 'No'}")
    
    confirm = input("\nProceed with import? (y/N): ").strip().lower()
    if confirm not in ['y', 'yes']:
        print("Import cancelled")
        sys.exit(0)
    
    # Perform import
    success = import_database(
        import_file=import_file,
        target_db=target_db,
        drop_existing=args.drop_existing,
        db_user=args.db_user,
        db_host=args.db_host,
        db_port=args.db_port,
        db_password=db_password
    )
    
    if success:
        print("\n💡 Next steps:")
        print("1. Update your .env file with the new database connection details")
        print("2. Start your application and verify everything works")
        print("3. Test login and basic functionality")
        sys.exit(0)
    else:
        print("\n❌ Import failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1) 
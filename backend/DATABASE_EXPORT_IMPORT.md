# Emisify Database Export & Import Guide

This guide explains how to export your Emisify database and import it on different systems (Windows laptop, AWS Ubuntu Lightsail, etc.) without using Alembic migrations.

## 🎯 Overview

The export/import system creates pure SQL files that can recreate your database on any PostgreSQL instance. This is perfect for:

- Setting up development environments on different machines
- Migrating to new servers
- Creating database backups
- Sharing database state with team members

## 📁 Files Included

- `export_database.py` - Main Python export script
- `export_db.bat` - Windows batch script wrapper
- `export_db.sh` - Linux/macOS shell script wrapper
- `import_db.py` - Interactive import script
- This documentation file

## 🚀 Quick Start

### Export Database (Current System)

**Windows:**

```cmd
cd backend
export_db.bat
```

**Linux/macOS:**

```bash
cd backend
chmod +x export_db.sh
./export_db.sh
```

**Direct Python:**

```bash
cd backend
python export_database.py
```

### Import Database (Target System)

**Interactive Import:**

```bash
python import_db.py
```

**Direct Import:**

```bash
# Create new database
createdb emisify_new

# Import everything
psql -d emisify_new -f database_exports/import_database_TIMESTAMP.sql
```

## 📋 Detailed Instructions

### Step 1: Export Your Current Database

1. **Navigate to Backend Directory**

   ```bash
   cd backend
   ```

2. **Run Export Script**

   **Windows Users:**

   ```cmd
   export_db.bat
   ```

   **Linux/macOS Users:**

   ```bash
   chmod +x export_db.sh
   ./export_db.sh
   ```

   **Alternative (Any Platform):**

   ```bash
   python export_database.py
   ```

3. **Files Generated**
   The script creates a `database_exports/` folder with:
   - `database_structure_TIMESTAMP.sql` - Database schema only
   - `database_data_TIMESTAMP.sql` - Data only
   - `import_database_TIMESTAMP.sql` - **Complete import script (recommended)**
   - `IMPORT_INSTRUCTIONS_TIMESTAMP.md` - Platform-specific instructions

### Step 2: Transfer Files to Target System

**Options for file transfer:**

1. **Copy to USB/External Drive**

   ```bash
   cp database_exports/import_database_*.sql /path/to/usb/
   ```

2. **SCP to Remote Server**

   ```bash
   scp database_exports/import_database_*.sql user@server:/home/user/
   ```

3. **Cloud Storage (Dropbox, Google Drive, etc.)**
   Upload the import file and download on target system

4. **Git Repository (if small enough)**
   ```bash
   git add database_exports/import_database_*.sql
   git commit -m "Add database export"
   git push
   ```

### Step 3: Import on Target System

#### Option A: Interactive Import (Recommended)

1. **Copy import script to target system**

   ```bash
   # Also copy the import script
   scp import_db.py user@server:/home/user/
   ```

2. **Run interactive import**

   ```bash
   python import_db.py
   ```

   The script will:

   - Check prerequisites
   - Show available import files
   - Prompt for database name
   - Confirm before proceeding
   - Verify import success

#### Option B: Manual Import

1. **Create Database**

   ```bash
   createdb your_database_name
   ```

2. **Import SQL File**
   ```bash
   psql -d your_database_name -f import_database_TIMESTAMP.sql
   ```

## 🖥️ Platform-Specific Setup

### Windows Laptop Setup

1. **Install PostgreSQL**

   - Download from: https://www.postgresql.org/download/windows/
   - Or use Chocolatey: `choco install postgresql`

2. **Setup Database**

   ```cmd
   # Create database
   createdb -U postgres emisify

   # Import data
   psql -U postgres -d emisify -f import_database_TIMESTAMP.sql
   ```

3. **Update .env File**
   ```env
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

2. **Create Database User**

   ```bash
   sudo -u postgres createuser --interactive emisify
   sudo -u postgres createdb emisify
   sudo -u postgres psql -c "ALTER USER emisify PASSWORD '';"
   ```

3. **Import Database**

   ```bash
   # Upload SQL file first
   scp import_database_*.sql ubuntu@your-server-ip:/home/ubuntu/

   # Import database
   sudo -u postgres psql -d emisify -f import_database_TIMESTAMP.sql
   ```

4. **Configure Remote Access (Optional)**

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
   export POSTGRES_PASSWORD=
   export POSTGRES_DB=emisify
   export POSTGRES_PORT=5432
   ```

## ✅ Verification

After import, verify your database:

```sql
-- Connect to database
psql -d emisify

-- Check tables exist
\dt

-- Check record counts
SELECT 'users' as table_name, count(*) from users
UNION ALL
SELECT 'news', count(*) from news
UNION ALL
SELECT 'subscriptions', count(*) from subscriptions
UNION ALL
SELECT 'assets', count(*) from assets;

-- Check sequences
SELECT schemaname, sequencename, last_value
FROM pg_sequences
ORDER BY sequencename;

-- Test a simple query
SELECT email, is_active FROM users LIMIT 5;
```

## 🔧 Troubleshooting

### Common Issues

1. **"pg_dump: command not found"**

   - Install PostgreSQL client tools
   - Windows: Include bin directory in PATH
   - Linux: `sudo apt install postgresql-client`

2. **"psql: could not connect to server"**

   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify connection details
   - Test connection: `psql -h localhost -U postgres`

3. **"database already exists"**

   - Use `--drop-existing` flag with import script
   - Or manually drop: `dropdb database_name`

4. **Permission denied errors**

   - Check file permissions: `chmod 644 import_database_*.sql`
   - Ensure database user has proper privileges

5. **Sequence value errors**

   - The import script fixes sequences automatically
   - Manually run sequence updates if needed

6. **Large file import issues**
   - Increase PostgreSQL memory settings
   - Import structure and data separately
   - Use `--disable-triggers` for faster import

### Debug Commands

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('emisify'));

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for missing foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f';
```

## 🔒 Security Notes

- **Change default passwords** in production
- **Use strong passwords** for database users
- **Configure firewall rules** appropriately
- **Enable SSL connections** for production
- **Restrict database access** to necessary IPs only
- **Regular backups** of important data

## 📊 Advanced Usage

### Automated Export Script

Create a cron job for regular exports:

```bash
# Add to crontab (crontab -e)
0 2 * * * cd /path/to/backend && python export_database.py
```

### Export Specific Tables Only

```bash
# Export only specific tables
pg_dump -h localhost -U emisify -d emisify -t users -t news --data-only -f partial_export.sql
```

### Compressed Exports

```bash
# Create compressed export
pg_dump -h localhost -U emisify -d emisify | gzip > database_backup.sql.gz

# Import compressed export
gunzip -c database_backup.sql.gz | psql -d new_database
```

## 🎯 Best Practices

1. **Test imports** on non-production systems first
2. **Verify data integrity** after import
3. **Keep multiple export versions** for rollback capability
4. **Document any manual post-import steps** required
5. **Update application configuration** files after import
6. **Test application functionality** after database import
7. **Monitor performance** after import on new systems

## 📞 Support

If you encounter issues:

1. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
2. Verify PostgreSQL version compatibility
3. Ensure sufficient disk space and memory
4. Test database connectivity separately
5. Review the generated IMPORT_INSTRUCTIONS file for platform-specific guidance

---

**Happy Database Migration! 🚀**

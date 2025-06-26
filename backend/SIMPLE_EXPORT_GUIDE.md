# Simple SQL Database Export & Import Guide

No fancy tools needed - just pgAdmin on Windows and psql on Linux.

## 🎯 Export Process

### Step 1: Export Database Structure

**In pgAdmin (Windows):**

1. Open pgAdmin and connect to your database
2. Open Query Tool (Tools → Query Tool)
3. Copy and run the contents of `export_structure.sql`
4. Copy the results and save as `create_tables.sql`

**In psql (Linux):**

```bash
psql -d your_database -f export_structure.sql > create_tables.sql
```

### Step 2: Export Database Data

**In pgAdmin (Windows):**

1. Open Query Tool
2. Copy and run the contents of `export_data.sql`
3. Copy the results and save as `insert_data.sql`

**In psql (Linux):**

```bash
psql -d your_database -f export_data.sql > insert_data.sql
```

## 🎯 Import Process

### Step 1: Create New Database

**Windows (pgAdmin):**

1. Right-click "Databases" → Create → Database
2. Name it (e.g., "emisify_new")

**Linux (psql):**

```bash
createdb emisify_new
```

### Step 2: Import Structure

**Windows (pgAdmin):**

1. Connect to the new database
2. Open Query Tool
3. Copy and paste contents of `create_tables.sql`
4. Execute

**Linux (psql):**

```bash
psql -d emisify_new -f create_tables.sql
```

### Step 3: Import Data

**Windows (pgAdmin):**

1. In Query Tool, copy and paste contents of `insert_data.sql`
2. Execute

**Linux (psql):**

```bash
psql -d emisify_new -f insert_data.sql
```

### Step 4: Fix Sequences

Run these commands to fix ID sequences:

```sql
SELECT setval('users_id_seq', COALESCE(MAX(id), 1)) FROM users;
SELECT setval('roles_id_seq', COALESCE(MAX(id), 1)) FROM roles;
SELECT setval('news_id_seq', COALESCE(MAX(id), 1)) FROM news;
SELECT setval('news_categories_id_seq', COALESCE(MAX(id), 1)) FROM news_categories;
-- Add more as needed for your tables
```

## 📁 Files You'll Have

After export:

- `create_tables.sql` - All CREATE TABLE statements
- `insert_data.sql` - All INSERT statements

## 🔧 Quick Commands

### Export Everything (Linux)

```bash
# Structure
psql -d your_db -f export_structure.sql > create_tables.sql

# Data
psql -d your_db -f export_data.sql > insert_data.sql
```

### Import Everything (Linux)

```bash
# Create database
createdb new_db_name

# Import structure
psql -d new_db_name -f create_tables.sql

# Import data
psql -d new_db_name -f insert_data.sql
```

### Transfer Files Between Systems

**Copy to Windows:**

```bash
scp create_tables.sql insert_data.sql user@windows-machine:/path/
```

**Copy to Linux:**

```bash
scp create_tables.sql insert_data.sql user@linux-server:/home/user/
```

## ✅ Verify Import

Run this to check your import worked:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check data counts
SELECT 'users' as table_name, count(*) from users
UNION ALL
SELECT 'news', count(*) from news
UNION ALL
SELECT 'roles', count(*) from roles;
```

That's it! Pure SQL, no Python, no pg_dump, no fancy tools.

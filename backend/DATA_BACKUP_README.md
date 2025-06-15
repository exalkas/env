# Database Data Backup & Restore Scripts

These scripts allow you to export and import database data in JSON format for cross-platform deployment.

## Scripts Overview

### 1. Schema Management

Use existing **Alembic migrations** for schema:

```bash
python -m alembic upgrade head  # Create/update database schema
```

### 2. Data Export (`export_data.py`)

Exports all table data to JSON files in the `data_backup/` directory.

```bash
python export_data.py
```

**What it does:**

- Exports all tables in the correct dependency order
- Saves data as JSON files in `data_backup/` directory
- Creates export metadata with timestamp and statistics
- Handles datetime serialization automatically

### 3. Data Import (`import_data.py`)

Imports data from JSON files back into the database.

```bash
# Import all data (clears existing data first)
python import_data.py

# Import all data without clearing existing data
python import_data.py --no-clear

# Import specific table only
python import_data.py --table users
python import_data.py --table orders
```

**What it does:**

- Imports data in the correct dependency order
- Handles foreign key constraints properly
- Resets PostgreSQL sequences after import
- Supports partial imports for specific tables

## Complete Deployment Workflow

### Exporting from Source Environment

```bash
# 1. Export data from your current database
python export_data.py

# 2. Copy the data_backup/ folder to your target environment
```

### Importing to Target Environment

```bash
# 1. Set up the database schema using migrations
python -m alembic upgrade head

# 2. Import the data
python import_data.py

# 3. Create admin user (if needed)
python create_admin.py
```

## File Structure

After running `export_data.py`, you'll have:

```
data_backup/
├── export_metadata.json     # Export information and statistics
├── roles.json              # User roles
├── news_categories.json    # News categories
├── assets.json             # Trading assets
├── permissions.json        # System permissions
├── users.json              # User accounts
├── news.json               # News articles
├── rfqs.json               # RFQ data
├── subscriptions.json      # User subscriptions
├── orders.json             # Trading orders
├── transactions.json       # Trading transactions
├── news_category_associations.json  # News-category relationships
├── role_permissions.json   # Role-based permissions
└── user_permissions.json   # User-specific permissions
```

## Cross-Platform Compatibility

- **JSON format** - Works on Windows, Linux, macOS
- **UTF-8 encoding** - Supports international characters
- **ISO datetime format** - Standardized timestamps
- **Dependency handling** - Proper import/export order

## Error Handling

Both scripts include comprehensive error handling:

- Individual table failures won't stop the entire process
- Clear error messages with specific table information
- Transaction rollback on import failures
- Detailed success/failure statistics

## Best Practices

1. **Always export data before major changes**
2. **Test imports on a separate database first**
3. **Keep data_backup/ folder in version control** (for seed data)
4. **Use `--no-clear` flag when adding to existing data**
5. **Verify data integrity after import**

## Troubleshooting

### Import Fails Due to Foreign Key Constraints

- The scripts handle dependency order automatically
- If issues persist, check for circular references in your data

### Sequence Issues After Import

- The script automatically resets PostgreSQL sequences
- If auto-increment IDs seem wrong, the sequences weren't reset properly

### Large Datasets

- For very large databases, consider exporting/importing specific tables
- Use `--table` flag to import tables individually

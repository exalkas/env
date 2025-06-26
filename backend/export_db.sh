#!/bin/bash

# Database Export Script for Linux/macOS
# This script exports the Emisify database structure and data

set -e  # Exit on any error

echo "========================================"
echo "Emisify Database Export Tool (Linux/macOS)"
echo "========================================"
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're in the backend directory
if [ ! -f "app/core/config.py" ]; then
    echo "ERROR: This script must be run from the backend directory"
    echo "Current directory: $(pwd)"
    echo "Please navigate to the backend folder and try again"
    exit 1
fi

# Check if Python is available
if ! command_exists python3 && ! command_exists python; then
    echo "ERROR: Python is not installed or not in PATH"
    echo "Please install Python and try again"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command_exists python3; then
    PYTHON_CMD="python"
fi

echo "Using Python command: $PYTHON_CMD"

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Virtual environment is activated: $VIRTUAL_ENV"
elif [ -f "venv/bin/activate" ]; then
    echo "⚠️  Virtual environment is not activated"
    echo "Attempting to activate venv..."
    source venv/bin/activate
    echo "✅ Virtual environment activated"
elif [ -f "../venv/bin/activate" ]; then
    echo "⚠️  Virtual environment is not activated"
    echo "Attempting to activate venv from parent directory..."
    source ../venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "⚠️  No virtual environment detected"
    echo "Continuing with system Python..."
fi

# Check if required packages are installed
if ! $PYTHON_CMD -c "from app.core.config import get_settings" >/dev/null 2>&1; then
    echo "ERROR: Required packages not found"
    echo "Please ensure you have installed the requirements:"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# Check if PostgreSQL is available
if ! command_exists pg_dump; then
    echo "ERROR: PostgreSQL (pg_dump) is not installed or not in PATH"
    echo "Please install PostgreSQL client tools:"
    echo "  Ubuntu/Debian: sudo apt install postgresql-client"
    echo "  CentOS/RHEL: sudo yum install postgresql"
    echo "  macOS: brew install postgresql"
    exit 1
fi

echo "✅ All prerequisites checked successfully!"
echo
echo "🚀 Starting database export..."
echo

# Run the export script
if $PYTHON_CMD export_database.py; then
    echo
    echo "========================================"
    echo "🎉 DATABASE EXPORT COMPLETED SUCCESSFULLY!"
    echo "========================================"
    echo
    echo "📁 Files have been created in the database_exports folder"
    echo "🔄 You can now copy these files to your target systems"
    echo
    echo "💡 Quick commands to transfer files:"
    echo "   To copy to another server:"
    echo "   scp database_exports/import_database_*.sql user@server:/path/to/destination/"
    echo
    echo "   To import on target system:"
    echo "   createdb your_database_name"
    echo "   psql -d your_database_name -f import_database_*.sql"
    echo
else
    echo
    echo "========================================"
    echo "❌ ERROR: DATABASE EXPORT FAILED"
    echo "========================================"
    echo
    echo "Please check the error messages above"
    echo "Common issues:"
    echo "  - Database connection problems"
    echo "  - Incorrect database credentials in .env file"
    echo "  - PostgreSQL not running"
    echo "  - Missing database permissions"
    echo
    echo "🔧 Troubleshooting:"
    echo "  1. Check PostgreSQL is running: sudo systemctl status postgresql"
    echo "  2. Test database connection: psql -h localhost -U your_user -d your_db"
    echo "  3. Verify .env file has correct database credentials"
    echo
    exit 1
fi 
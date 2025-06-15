#!/bin/bash

# Database Setup Script for Linux Deployment
# Creates PostgreSQL database and user with the correct credentials

set -e

# Database configuration (matching your .env file)
DB_NAME="env_mari_db"
DB_USER="env_pg_db_123_admin"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"

echo "🚀 Setting up PostgreSQL database and user..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
fi

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user
echo "Creating database user: $DB_USER"
sudo -u postgres psql -c "DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;"

# Grant necessary permissions to the user
sudo -u postgres psql -c "ALTER ROLE $DB_USER CREATEDB;"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SUPERUSER;"

# Create database
echo "Creating database: $DB_NAME"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Grant all privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Test connection
echo "Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null

echo "✅ Database setup completed successfully!"
echo "📊 Database: $DB_NAME"
echo "👤 User: $DB_USER" 
echo "🔗 Connection: postgresql://$DB_USER:***@$DB_HOST:$DB_PORT/$DB_NAME" 
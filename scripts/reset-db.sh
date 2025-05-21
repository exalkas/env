#!/bin/bash
echo "Setting up PostgreSQL database..."

# Replace these with your actual PostgreSQL credentials if needed
export PGUSER=postgres
export PGPASSWORD=

echo "Dropping database if it exists..."
psql -c "DROP DATABASE IF EXISTS env_mari_db;"

echo "Creating database..."
psql -c "CREATE DATABASE env_mari_db;"

echo "Creating user..."
psql -c "DROP ROLE IF EXISTS env_pg_db_123_admin;"
psql -c "CREATE USER env_pg_db_123_admin WITH PASSWORD '';"

echo "Granting privileges..."
psql -c "GRANT ALL PRIVILEGES ON DATABASE env_mari_db TO env_pg_db_123_admin;"
psql -d env_mari_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO env_pg_db_123_admin;"

echo "Setting up database schema..."
cd backend
source venv/bin/activate
python -m alembic upgrade head

echo "Database setup complete!"
cd .. 
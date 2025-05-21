# Green Energy Trading Marketplace Setup Guide

This document provides instructions for setting up and running the Green Energy Trading Marketplace project on both Windows and Linux.

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL
- Redis (optional for development)

## Database Setup

### PostgreSQL Configuration

- Server: localhost
- Port: 5432
- Database name: env_mari_db
- Username: env_pg_db_123_admin
- Password: KKnn123\_\_kjkjd

## Backend Setup

### Windows

```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python -m alembic upgrade head

# Start the backend server
python run.py
```

### Linux/macOS

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python -m alembic upgrade head

# Start the backend server
python run.py
```

## Frontend Setup

### Landing Page (Windows & Linux/macOS)

```bash
# Navigate to landing page directory
cd landing-page

# Install dependencies
npm install

# Start development server
npm run dev
```

The landing page will be available at http://localhost:3000

### Marketplace App (When Developed)

```bash
# Navigate to marketplace app directory
cd marketplace-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The marketplace app will be available at http://localhost:3001

### Admin App (When Developed)

```bash
# Navigate to admin app directory
cd admin-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The admin app will be available at http://localhost:3002

## Running All Services Together

You can run all services together using the provided scripts:

### Windows

```powershell
# From project root
.\start-all.bat
```

### Linux/macOS

```bash
# From project root
chmod +x ./start-all.sh
./start-all.sh
```

## Database Management

To reset the database with fresh migrations:

### Windows

```powershell
# From project root
.\scripts\reset-db.bat
```

### Linux/macOS

```bash
# From project root
chmod +x ./scripts/reset-db.sh
./scripts/reset-db.sh
```

# Linux Deployment Guide

Complete guide for deploying the Maritime Trading Platform on Linux from scratch.

## Quick Start (One-Command Deployment)

```bash
# Make the script executable and run
chmod +x deploy/deploy_from_scratch.sh
sudo ./deploy/deploy_from_scratch.sh
```

This will handle everything automatically. Skip to [Verification](#verification) section.

## Manual Step-by-Step Deployment

### Prerequisites

Fresh Ubuntu/Debian server with sudo access.

### Step 1: Setup Database

```bash
# Run database setup script
cd backend/deploy
chmod +x setup_database.sh
./setup_database.sh
```

### Step 2: Setup Application Environment

```bash
# Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Configure Environment

```bash
# Create .env file with your database credentials
cp env_file .env  # or create manually
```

### Step 4: Setup Database Schema

```bash
# Run migrations to create tables
python -m alembic upgrade head
```

### Step 5: Import Data (Optional)

```bash
# If you have data_backup/ folder from export_data.py
python import_data.py
```

### Step 6: Create Admin User

```bash
# Create the admin user
python create_admin.py
```

### Step 7: Start Application

```bash
# Start the application
python run.py
```

## Complete Production Deployment

For production with systemd service, nginx, and proper setup:

```bash
# Clone/upload your application to the server
# Navigate to backend/deploy directory
chmod +x deploy_from_scratch.sh
sudo ./deploy_from_scratch.sh
```

## What Gets Installed

### System Dependencies

- Python 3 + pip + venv
- PostgreSQL + contrib
- Nginx
- Redis
- Git

### Database Setup

- Database: `env_mari_db`
- User: `env_pg_db_123_admin`
- Password: ``

### Application Setup

- System user: `maritime`
- App directory: `/opt/maritime-trading`
- Systemd service: `maritime-trading.service`
- Nginx reverse proxy on port 80
- API runs on port 8000

## Verification

### Check Services

```bash
# Check all services are running
sudo systemctl status maritime-trading
sudo systemctl status postgresql
sudo systemctl status nginx
sudo systemctl status redis-server
```

### Test API

```bash
# Test API endpoint
curl http://localhost:8000/health
curl http://localhost/health  # via nginx
```

### View Logs

```bash
# Application logs
sudo journalctl -u maritime-trading -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Data Migration Workflow

### From Desktop to Linux Server

1. **On Desktop (Windows):**

   ```bash
   cd backend
   python export_data.py
   # This creates data_backup/ folder
   ```

2. **Transfer to Linux:**

   ```bash
   # Copy data_backup/ folder to Linux server
   scp -r data_backup/ user@server:/path/to/backend/
   ```

3. **On Linux Server:**
   ```bash
   # Deploy application
   sudo ./deploy/deploy_from_scratch.sh
   # The script will automatically import data if data_backup/ exists
   ```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
PGPASSWORD= psql -h localhost -U env_pg_db_123_admin -d env_mari_db
```

### Service Not Starting

```bash
# Check logs
sudo journalctl -u maritime-trading -n 50

# Check if all dependencies are installed
python -c "import psycopg2, redis, fastapi; print('All dependencies OK')"
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R maritime:maritime /opt/maritime-trading
```

### Port Already in Use

```bash
# Check what's using port 8000
sudo lsof -i :8000
```

## Security Considerations

1. **Change default passwords** after deployment
2. **Setup firewall** (ufw) to restrict access
3. **Configure SSL/TLS** for production
4. **Regular backups** using export_data.py
5. **Monitor logs** for security issues

## Admin Access

After deployment:

- **Email:** admin@greenenergy.com
- **Password:** 
- **⚠️ Change password immediately after first login**

## File Locations

- **Application:** `/opt/maritime-trading/`
- **Logs:** `/var/log/maritime-trading/`
- **Service:** `/etc/systemd/system/maritime-trading.service`
- **Nginx Config:** `/etc/nginx/sites-available/maritime-trading`
- **Database:** PostgreSQL default location

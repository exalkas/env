# Deployment Guide: Emisify Platform

This guide outlines the deployment process for the Emisify platform on Ubuntu. The platform consists of:

- Main API (FastAPI)
- PostgreSQL Database
- Redis for real-time features
- Nginx (assumed to be already installed)

## System Requirements

- Ubuntu 20.04 or later
- Python 3.8 or later
- PostgreSQL 12 or later
- Redis 6 or later
- Nginx (already installed)

## Directory Structure

```
/opt/emisify/
├── backend/           # API application
├── admin-app/        # Admin frontend
├── marketplace-app/  # Marketplace frontend
└── landing/         # WordPress landing page
```

## Deployment Steps

### 1. System Setup

```bash
# Create application directory
sudo mkdir -p /opt/emisify
sudo mkdir -p /var/log/emisify
sudo mkdir -p /var/run/emisify

# Create system user
sudo useradd -r -s /bin/false emisify

# Set permissions
sudo chown -R emisify:emisify /opt/emisify
sudo chown -R emisify:emisify /var/log/emisify
sudo chown -R emisify:emisify /var/run/emisify
```

### 2. Database Setup

```bash
# Create database and user
sudo -u postgres psql -c "CREATE USER emisify WITH PASSWORD 'your_';"
sudo -u postgres psql -c "CREATE DATABASE emisify OWNER emisify;"
```

### 3. Redis Setup

```bash
# Install Redis if not already installed
sudo apt-get update
sudo apt-get install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Add/modify these settings:
# bind 127.0.0.1
# requirepass your_redis_password
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
```

### 4. Backend API Deployment

```bash
# Navigate to backend directory
cd /opt/emisify/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
# API Settings
SECRET_KEY=your_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=11520  # 8 days

# Database Settings
POSTGRES_SERVER=localhost
POSTGRES_USER=emisify
POSTGRES_PASSWORD=your_
POSTGRES_DB=emisify

# Redis Settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Domain Settings
ADMIN_DOMAIN=admin.emisify.com
APP_DOMAIN=app.emisify.com
MAIN_DOMAIN=emisify.com
EOL

# Set proper permissions
sudo chown emisify:emisify .env
sudo chmod 600 .env
```

### 5. Systemd Service Setup

```bash
# Copy service file
sudo cp deploy/emisify.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable emisify
sudo systemctl start emisify
```

### 6. Nginx Configuration

Create `/etc/nginx/sites-available/emisify.conf`:

```nginx
# API Server
server {
    listen 80;
    server_name api.emisify.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# Admin App
server {
    listen 80;
    server_name admin.emisify.com;
    root /opt/emisify/admin-app;

    # Add your admin app configuration here
}

# Marketplace App
server {
    listen 80;
    server_name app.emisify.com;
    root /opt/emisify/marketplace-app;

    # Add your marketplace app configuration here
}
```

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/emisify.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Configuration

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d emisify.com -d api.emisify.com -d admin.emisify.com -d app.emisify.com
```

### 8. Monitoring Setup

```bash
# Create log rotation configuration
sudo nano /etc/logrotate.d/emisify

# Add the following:
/var/log/emisify/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 emisify emisify
    sharedscripts
    postrotate
        systemctl reload emisify
    endscript
}
```

## Maintenance

### Database Backups

```bash
# Create backup script
sudo nano /opt/emisify/backup.sh

# Add the following:
#!/bin/bash
BACKUP_DIR="/opt/emisify/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U emisify emisify > $BACKUP_DIR/emisify_$TIMESTAMP.sql
find $BACKUP_DIR -type f -mtime +7 -delete

# Make executable
sudo chmod +x /opt/emisify/backup.sh

# Add to crontab
sudo crontab -e

# Add the following line:
0 2 * * * /opt/emisify/backup.sh
```

### Log Monitoring

```bash
# View logs
sudo journalctl -u emisify -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Common Issues

1. **Service won't start**

   - Check logs: `sudo journalctl -u emisify -n 50`
   - Verify permissions: `ls -la /opt/emisify/backend`
   - Check .env file exists and has correct permissions

2. **Database connection issues**

   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check connection: `psql -U emisify -d emisify -h localhost`

3. **Redis connection issues**

   - Verify Redis is running: `sudo systemctl status redis`
   - Test connection: `redis-cli ping`

4. **Nginx issues**

   - Check configuration: `sudo nginx -t`
   - View error logs: `sudo tail -f /var/log/nginx/error.log`

## Security Considerations

1. **Firewall Configuration**

   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Regular Updates**

   ```bash
   sudo apt-get update
   sudo apt-get upgrade
   ```

3. **Security Headers**

   - Already configured in Nginx
   - Additional headers can be added as needed

4. **File Permissions**

   - All application files owned by emisify user
   - Sensitive files (like .env) have 600 permissions
   - Log files have 640 permissions

## Backup and Recovery

1. **Database Backup**

   - Daily automated backups
   - 7-day retention period
   - Stored in /opt/emisify/backups

2. **Application Backup**

   - Regular backups of /opt/emisify
   - Configuration files backup
   - SSL certificates backup

3. **Recovery Procedure**

   - Restore database from backup
   - Restore application files
   - Verify configurations
   - Restart services

#!/bin/bash

# Exit on error
set -e

# Configuration
APP_DIR="/opt/emisify"
BACKEND_DIR="$APP_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"
DB_NAME="emisify"
DB_USER="emisify"

# Create necessary directories
sudo mkdir -p $APP_DIR
sudo mkdir -p /var/log/emisify
sudo mkdir -p /var/run/emisify

# Create system user if not exists
if ! id "emisify" &>/dev/null; then
    sudo useradd -r -s /bin/false emisify
fi

# Set permissions
sudo chown -R emisify:emisify $APP_DIR
sudo chown -R emisify:emisify /var/log/emisify
sudo chown -R emisify:emisify /var/run/emisify

# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3-venv python3-dev postgresql postgresql-contrib nginx

# Setup PostgreSQL
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD 'your_';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Setup Python environment
python3 -m venv $VENV_DIR
source $VENV_DIR/bin/activate
pip install --upgrade pip
pip install -r $BACKEND_DIR/requirements.txt

# Copy service file
sudo cp $BACKEND_DIR/deploy/emisify.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable emisify
sudo systemctl start emisify

# Setup Nginx
sudo cp $BACKEND_DIR/deploy/nginx/emisify.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/emisify.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment completed successfully!" 
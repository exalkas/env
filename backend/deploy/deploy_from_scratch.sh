#!/bin/bash

# Complete Linux Deployment Script
# Deploys the maritime trading application from scratch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/maritime-trading"
BACKEND_DIR="$APP_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"
CURRENT_DIR="$(pwd)"

echo -e "${BLUE}🚀 Starting complete deployment of Maritime Trading Platform...${NC}"

# Step 1: Install system dependencies
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-dev python3-pip postgresql postgresql-contrib nginx redis-server git

# Step 2: Create application directory and user
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo mkdir -p /var/log/maritime-trading
sudo mkdir -p /var/run/maritime-trading

# Create system user if not exists
if ! id "maritime" &>/dev/null; then
    sudo useradd -r -s /bin/false maritime
    echo "✅ Created system user: maritime"
fi

# Step 3: Copy application files
echo -e "${YELLOW}📂 Copying application files...${NC}"
sudo cp -r $CURRENT_DIR/../* $APP_DIR/
sudo chown -R maritime:maritime $APP_DIR
sudo chown -R maritime:maritime /var/log/maritime-trading
sudo chown -R maritime:maritime /var/run/maritime-trading

# Step 4: Setup database
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
cd $BACKEND_DIR/deploy
chmod +x setup_database.sh
./setup_database.sh

# Step 5: Setup Python environment
echo -e "${YELLOW}🐍 Setting up Python environment...${NC}"
cd $BACKEND_DIR
sudo -u maritime python3 -m venv $VENV_DIR
sudo -u maritime $VENV_DIR/bin/pip install --upgrade pip
sudo -u maritime $VENV_DIR/bin/pip install -r requirements.txt

# Step 6: Setup environment variables
echo -e "${YELLOW}⚙️  Setting up environment variables...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
    sudo -u maritime cp $BACKEND_DIR/env_file $BACKEND_DIR/.env 2>/dev/null || {
        echo "Creating .env file..."
        sudo -u maritime tee $BACKEND_DIR/.env > /dev/null <<EOF
POSTGRES_SERVER=localhost
POSTGRES_USER=env_pg_db_123_admin
POSTGRES_PASSWORD=
POSTGRES_DB=env_mari_db
POSTGRES_PORT=5432

SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

REDIS_HOST=localhost
REDIS_PORT=6379
EOF
    }
    echo "✅ Environment variables configured"
fi

# Step 7: Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
cd $BACKEND_DIR
sudo -u maritime $VENV_DIR/bin/python -m alembic upgrade head

# Step 8: Import data (if data_backup exists)
if [ -d "$BACKEND_DIR/data_backup" ]; then
    echo -e "${YELLOW}📥 Importing data...${NC}"
    sudo -u maritime $VENV_DIR/bin/python import_data.py
else
    echo -e "${YELLOW}⚠️  No data_backup found. Skipping data import.${NC}"
    echo -e "${YELLOW}   Copy data_backup/ folder and run: python import_data.py${NC}"
fi

# Step 9: Create admin user
echo -e "${YELLOW}👤 Creating admin user...${NC}"
sudo -u maritime $VENV_DIR/bin/python create_admin.py || {
    echo -e "${YELLOW}⚠️  Admin user creation failed (may already exist)${NC}"
}

# Step 10: Setup systemd service
echo -e "${YELLOW}🔧 Setting up systemd service...${NC}"
sudo tee /etc/systemd/system/maritime-trading.service > /dev/null <<EOF
[Unit]
Description=Maritime Trading Platform API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=maritime
Group=maritime
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$VENV_DIR/bin
ExecStart=$VENV_DIR/bin/python run.py
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=maritime-trading

[Install]
WantedBy=multi-user.target
EOF

# Step 11: Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable maritime-trading
sudo systemctl start maritime-trading
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Step 12: Setup Nginx (optional)
echo -e "${YELLOW}🌐 Setting up Nginx reverse proxy...${NC}"
sudo tee /etc/nginx/sites-available/maritime-trading > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/maritime-trading /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Step 13: Final status check
echo -e "${BLUE}🔍 Checking deployment status...${NC}"
sleep 3

# Check services
services=("postgresql" "redis-server" "maritime-trading" "nginx")
for service in "${services[@]}"; do
    if sudo systemctl is-active --quiet $service; then
        echo -e "✅ $service: ${GREEN}Running${NC}"
    else
        echo -e "❌ $service: ${RED}Not running${NC}"
    fi
done

# Check API health
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "✅ API Health Check: ${GREEN}OK${NC}"
else
    echo -e "⚠️  API Health Check: ${YELLOW}Failed (service may still be starting)${NC}"
fi

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${BLUE}📊 Application Details:${NC}"
echo -e "   🌐 API URL: http://localhost:8000"
echo -e "   📁 App Directory: $APP_DIR"
echo -e "   📝 Logs: sudo journalctl -u maritime-trading -f"
echo -e "   🔧 Service: sudo systemctl status maritime-trading"
echo -e ""
echo -e "${YELLOW}🔑 Admin Login:${NC}"
echo -e "   Email: admin@greenenergy.com"
echo -e "   Password: "
echo -e "   ${RED}⚠️  Change password after first login!${NC}" 
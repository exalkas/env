#!/bin/bash

# Update Deployment Script
# Deploys new version to existing Maritime Trading Platform installation

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
BACKUP_DIR="/opt/maritime-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}🚀 Starting Maritime Trading Platform Update...${NC}"

# Step 1: Pre-update backup
echo -e "${YELLOW}💾 Creating backup before update...${NC}"
sudo mkdir -p $BACKUP_DIR
sudo cp -r $APP_DIR $BACKUP_DIR/
echo -e "✅ Backup created at: $BACKUP_DIR"

# Step 2: Export current data
echo -e "${YELLOW}📤 Exporting current database data...${NC}"
cd $BACKEND_DIR
sudo -u maritime $VENV_DIR/bin/python export_data.py
sudo cp -r data_backup $BACKUP_DIR/
echo -e "✅ Database exported and backed up"

# Step 3: Stop application service
echo -e "${YELLOW}🛑 Stopping application service...${NC}"
sudo systemctl stop maritime-trading
echo -e "✅ Application stopped"

# Step 4: Update application files
echo -e "${YELLOW}📂 Updating application files...${NC}"
CURRENT_DIR="$(pwd)"
sudo cp -r $CURRENT_DIR/../* $APP_DIR/
sudo chown -R maritime:maritime $APP_DIR
echo -e "✅ Files updated"

# Step 5: Update Python dependencies
echo -e "${YELLOW}🐍 Updating Python dependencies...${NC}"
cd $BACKEND_DIR
sudo -u maritime $VENV_DIR/bin/pip install --upgrade pip
sudo -u maritime $VENV_DIR/bin/pip install -r requirements.txt --upgrade
echo -e "✅ Dependencies updated"

# Step 6: Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
sudo -u maritime $VENV_DIR/bin/python -m alembic upgrade head
echo -e "✅ Migrations completed"

# Step 7: Import any new data (if update includes data)
if [ -d "$BACKEND_DIR/data_backup_update" ]; then
    echo -e "${YELLOW}📥 Importing update data...${NC}"
    sudo -u maritime $VENV_DIR/bin/python -c "
import os
os.rename('data_backup', 'data_backup_old')
os.rename('data_backup_update', 'data_backup')
"
    sudo -u maritime $VENV_DIR/bin/python import_data.py --no-clear
    echo -e "✅ Update data imported"
fi

# Step 8: Restart application service
echo -e "${YELLOW}🚀 Starting application service...${NC}"
sudo systemctl start maritime-trading
sleep 5

# Step 9: Health check
echo -e "${YELLOW}🔍 Performing health check...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "✅ Health check: ${GREEN}PASSED${NC}"
        break
    elif [ $i -eq 10 ]; then
        echo -e "❌ Health check: ${RED}FAILED${NC}"
        echo -e "${RED}Rolling back...${NC}"
        
        # Rollback procedure
        sudo systemctl stop maritime-trading
        sudo cp -r $BACKUP_DIR/maritime-trading/* $APP_DIR/
        sudo chown -R maritime:maritime $APP_DIR
        sudo systemctl start maritime-trading
        
        echo -e "${RED}❌ Update failed and rolled back${NC}"
        exit 1
    else
        echo -e "⏳ Waiting for service to start... ($i/10)"
        sleep 3
    fi
done

# Step 10: Cleanup old backups (keep last 5)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
sudo find /opt -name "maritime-backup-*" -type d | sort -r | tail -n +6 | sudo xargs rm -rf 2>/dev/null || true
echo -e "✅ Cleanup completed"

# Step 11: Final status
echo -e "${GREEN}✅ Update completed successfully!${NC}"
echo -e "${BLUE}📊 Update Summary:${NC}"
echo -e "   🌐 API URL: http://localhost:8000"
echo -e "   📁 Backup Location: $BACKUP_DIR"
echo -e "   📝 Logs: sudo journalctl -u maritime-trading -f"
echo -e "   🔧 Service Status: sudo systemctl status maritime-trading"

# Step 12: Show current version (if version file exists)
if [ -f "$BACKEND_DIR/VERSION" ]; then
    VERSION=$(cat $BACKEND_DIR/VERSION)
    echo -e "   🏷️  Current Version: $VERSION"
fi 
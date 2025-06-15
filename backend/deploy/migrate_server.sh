#!/bin/bash

# Server Migration Script
# Migrates Maritime Trading Platform from one server to another

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
APP_DIR="/opt/maritime-trading"
BACKEND_DIR="$APP_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"
MIGRATION_DIR="/tmp/maritime-migration-$(date +%Y%m%d-%H%M%S)"

# Function to show usage
show_usage() {
    echo "Usage:"
    echo "  ./migrate_server.sh export                    # Export from current server"
    echo "  ./migrate_server.sh import [migration-file]   # Import to new server"
    echo ""
    echo "Example workflow:"
    echo "  1. On old server: ./migrate_server.sh export"
    echo "  2. Copy migration file to new server"
    echo "  3. On new server: ./migrate_server.sh import migration-file.tar.gz"
}

# Export function - run on source server
export_server() {
    echo -e "${BLUE}📦 Exporting Maritime Trading Platform...${NC}"
    
    # Create migration directory
    mkdir -p $MIGRATION_DIR
    
    # Step 1: Export database data
    echo -e "${YELLOW}📤 Exporting database data...${NC}"
    cd $BACKEND_DIR
    sudo -u maritime $VENV_DIR/bin/python export_data.py
    cp -r data_backup $MIGRATION_DIR/
    echo -e "✅ Database data exported"
    
    # Step 2: Copy application files (excluding sensitive data)
    echo -e "${YELLOW}📂 Copying application files...${NC}"
    cp -r $APP_DIR $MIGRATION_DIR/app
    
    # Remove sensitive files and large directories
    rm -rf $MIGRATION_DIR/app/backend/venv
    rm -rf $MIGRATION_DIR/app/backend/__pycache__
    rm -rf $MIGRATION_DIR/app/backend/app/__pycache__
    rm -f $MIGRATION_DIR/app/backend/.env
    echo -e "✅ Application files copied"
    
    # Step 3: Export configuration
    echo -e "${YELLOW}⚙️  Exporting configuration...${NC}"
    
    # System service configuration
    if [ -f "/etc/systemd/system/maritime-trading.service" ]; then
        cp /etc/systemd/system/maritime-trading.service $MIGRATION_DIR/
    fi
    
    # Nginx configuration
    if [ -f "/etc/nginx/sites-available/maritime-trading" ]; then
        cp /etc/nginx/sites-available/maritime-trading $MIGRATION_DIR/
    fi
    
    # Environment variables (template)
    cat > $MIGRATION_DIR/env_template <<EOF
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
    echo -e "✅ Configuration exported"
    
    # Step 4: Create migration metadata
    echo -e "${YELLOW}📋 Creating migration metadata...${NC}"
    cat > $MIGRATION_DIR/migration_info.json <<EOF
{
    "export_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "source_server": "$(hostname)",
    "source_ip": "$(curl -s ifconfig.me || echo 'unknown')",
    "app_version": "$(cat $BACKEND_DIR/VERSION 2>/dev/null || echo 'unknown')",
    "python_version": "$(python3 --version)",
    "os_info": "$(lsb_release -d 2>/dev/null | cut -f2 || uname -a)"
}
EOF
    echo -e "✅ Migration metadata created"
    
    # Step 5: Create migration package
    echo -e "${YELLOW}📦 Creating migration package...${NC}"
    MIGRATION_FILE="/tmp/maritime-migration-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf $MIGRATION_FILE -C $(dirname $MIGRATION_DIR) $(basename $MIGRATION_DIR)
    rm -rf $MIGRATION_DIR
    
    echo -e "${GREEN}✅ Export completed!${NC}"
    echo -e "${BLUE}📊 Migration Package Details:${NC}"
    echo -e "   📦 File: $MIGRATION_FILE"
    echo -e "   📏 Size: $(du -h $MIGRATION_FILE | cut -f1)"
    echo -e "   🔐 MD5: $(md5sum $MIGRATION_FILE | cut -d' ' -f1)"
    echo -e ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Copy $MIGRATION_FILE to your new server"
    echo -e "2. Run: ./migrate_server.sh import $(basename $MIGRATION_FILE)"
}

# Import function - run on destination server
import_server() {
    local migration_file=$1
    
    if [ -z "$migration_file" ]; then
        echo -e "${RED}❌ Error: Migration file not specified${NC}"
        show_usage
        exit 1
    fi
    
    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}❌ Error: Migration file not found: $migration_file${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}📥 Importing Maritime Trading Platform...${NC}"
    
    # Extract migration package
    echo -e "${YELLOW}📦 Extracting migration package...${NC}"
    TEMP_EXTRACT_DIR="/tmp/maritime-extract-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $TEMP_EXTRACT_DIR
    tar -xzf $migration_file -C $TEMP_EXTRACT_DIR
    MIGRATION_DIR=$(find $TEMP_EXTRACT_DIR -type d -name "maritime-migration-*" | head -1)
    echo -e "✅ Package extracted"
    
    # Show migration info
    if [ -f "$MIGRATION_DIR/migration_info.json" ]; then
        echo -e "${BLUE}📋 Migration Information:${NC}"
        cat $MIGRATION_DIR/migration_info.json | python3 -m json.tool
    fi
    
    # Step 1: Deploy application using existing script
    echo -e "${YELLOW}🚀 Running initial deployment...${NC}"
    
    # Copy application files to temporary location
    cp -r $MIGRATION_DIR/app /tmp/maritime-app-temp
    cd /tmp/maritime-app-temp/backend/deploy
    
    # Run deployment
    chmod +x deploy_from_scratch.sh
    ./deploy_from_scratch.sh
    
    echo -e "✅ Initial deployment completed"
    
    # Step 2: Stop service for data import
    echo -e "${YELLOW}🛑 Stopping service for data import...${NC}"
    sudo systemctl stop maritime-trading
    
    # Step 3: Import database data
    echo -e "${YELLOW}📥 Importing database data...${NC}"
    cd $APP_DIR/backend
    
    # Copy data backup
    sudo cp -r $MIGRATION_DIR/data_backup ./
    sudo chown -R maritime:maritime data_backup
    
    # Import data
    sudo -u maritime $VENV_DIR/bin/python import_data.py
    echo -e "✅ Database data imported"
    
    # Step 4: Restore configurations (if different)
    echo -e "${YELLOW}⚙️  Applying configurations...${NC}"
    
    # Apply systemd service (if exists)
    if [ -f "$MIGRATION_DIR/maritime-trading.service" ]; then
        sudo cp $MIGRATION_DIR/maritime-trading.service /etc/systemd/system/
        sudo systemctl daemon-reload
    fi
    
    # Apply nginx config (if exists)
    if [ -f "$MIGRATION_DIR/maritime-trading" ]; then
        sudo cp $MIGRATION_DIR/maritime-trading /etc/nginx/sites-available/
        sudo ln -sf /etc/nginx/sites-available/maritime-trading /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl restart nginx
    fi
    
    echo -e "✅ Configurations applied"
    
    # Step 5: Start services
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    sudo systemctl start maritime-trading
    sudo systemctl restart nginx
    
    # Step 6: Health check
    echo -e "${YELLOW}🔍 Performing health check...${NC}"
    sleep 5
    
    for i in {1..10}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "✅ Health check: ${GREEN}PASSED${NC}"
            break
        elif [ $i -eq 10 ]; then
            echo -e "❌ Health check: ${RED}FAILED${NC}"
            echo -e "${RED}Please check logs: sudo journalctl -u maritime-trading -f${NC}"
            exit 1
        else
            echo -e "⏳ Waiting for service to start... ($i/10)"
            sleep 3
        fi
    done
    
    # Step 7: Cleanup
    echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
    rm -rf $TEMP_EXTRACT_DIR
    rm -rf /tmp/maritime-app-temp
    
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo -e "${BLUE}📊 New Server Status:${NC}"
    echo -e "   🌐 API URL: http://localhost:8000"
    echo -e "   🌐 Web URL: http://$(curl -s ifconfig.me || hostname)"
    echo -e "   📝 Logs: sudo journalctl -u maritime-trading -f"
    echo -e "   🔧 Service: sudo systemctl status maritime-trading"
    echo -e ""
    echo -e "${YELLOW}🔑 Admin Login:${NC}"
    echo -e "   Email: admin@greenenergy.com"
    echo -e "   Password: "
    echo -e "   ${RED}⚠️  Change password after first login!${NC}"
}

# Main script logic
case "${1:-}" in
    "export")
        export_server
        ;;
    "import")
        import_server "$2"
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid command${NC}"
        show_usage
        exit 1
        ;;
esac
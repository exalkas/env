#!/bin/bash

# Blue-Green Deployment Script
# Supports both single-server and multi-server blue-green deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_DIR="/opt/maritime-trading"
BLUE_DIR="$BASE_DIR-blue"
GREEN_DIR="$BASE_DIR-green"
CURRENT_LINK="$BASE_DIR"
BLUE_PORT=8000
GREEN_PORT=8001
NGINX_CONFIG="/etc/nginx/sites-available/maritime-trading"

# Function to show usage
show_usage() {
    echo "Blue-Green Deployment Usage:"
    echo "  ./blue_green_deployment.sh status                    # Show current status"
    echo "  ./blue_green_deployment.sh deploy [code-path]        # Deploy to inactive environment"
    echo "  ./blue_green_deployment.sh switch                    # Switch traffic to new version"
    echo "  ./blue_green_deployment.sh rollback                  # Rollback to previous version"
    echo "  ./blue_green_deployment.sh cleanup                   # Remove old environment"
    echo ""
    echo "Complete deployment workflow:"
    echo "  1. ./blue_green_deployment.sh deploy /path/to/new/code"
    echo "  2. Test new version on inactive port"
    echo "  3. ./blue_green_deployment.sh switch"
    echo "  4. ./blue_green_deployment.sh cleanup"
}

# Get current active environment
get_active_environment() {
    if [ -L "$CURRENT_LINK" ]; then
        local target=$(readlink "$CURRENT_LINK")
        if [[ "$target" == *"blue"* ]]; then
            echo "blue"
        elif [[ "$target" == *"green"* ]]; then
            echo "green"
        else
            echo "unknown"
        fi
    else
        echo "none"
    fi
}

# Get inactive environment
get_inactive_environment() {
    local active=$(get_active_environment)
    if [ "$active" = "blue" ]; then
        echo "green"
    elif [ "$active" = "green" ]; then
        echo "blue"
    else
        echo "blue"  # Default to blue if none active
    fi
}

# Get environment directory
get_env_dir() {
    local env=$1
    if [ "$env" = "blue" ]; then
        echo "$BLUE_DIR"
    else
        echo "$GREEN_DIR"
    fi
}

# Get environment port
get_env_port() {
    local env=$1
    if [ "$env" = "blue" ]; then
        echo "$BLUE_PORT"
    else
        echo "$GREEN_PORT"
    fi
}

# Check if environment is running
is_env_running() {
    local env=$1
    local port=$(get_env_port $env)
    
    if curl -s http://localhost:$port/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Show deployment status
show_status() {
    echo -e "${BLUE}🔍 Blue-Green Deployment Status${NC}"
    echo ""
    
    local active=$(get_active_environment)
    local inactive=$(get_inactive_environment)
    
    echo -e "📍 Active Environment: ${GREEN}$active${NC}"
    echo -e "📍 Inactive Environment: ${YELLOW}$inactive${NC}"
    echo ""
    
    # Check blue environment
    echo -e "${BLUE}💙 Blue Environment:${NC}"
    if [ -d "$BLUE_DIR" ]; then
        echo -e "   📁 Directory: ✅ Exists"
        if is_env_running "blue"; then
            echo -e "   🚀 Service: ${GREEN}Running${NC} (http://localhost:$BLUE_PORT)"
        else
            echo -e "   🚀 Service: ${RED}Stopped${NC}"
        fi
        
        # Show version if available
        if [ -f "$BLUE_DIR/backend/VERSION" ]; then
            local version=$(cat "$BLUE_DIR/backend/VERSION")
            echo -e "   🏷️  Version: $version"
        fi
    else
        echo -e "   📁 Directory: ${RED}Not found${NC}"
    fi
    
    echo ""
    
    # Check green environment
    echo -e "${GREEN}💚 Green Environment:${NC}"
    if [ -d "$GREEN_DIR" ]; then
        echo -e "   📁 Directory: ✅ Exists"
        if is_env_running "green"; then
            echo -e "   🚀 Service: ${GREEN}Running${NC} (http://localhost:$GREEN_PORT)"
        else
            echo -e "   🚀 Service: ${RED}Stopped${NC}"
        fi
        
        # Show version if available
        if [ -f "$GREEN_DIR/backend/VERSION" ]; then
            local version=$(cat "$GREEN_DIR/backend/VERSION")
            echo -e "   🏷️  Version: $version"
        fi
    else
        echo -e "   📁 Directory: ${RED}Not found${NC}"
    fi
    
    echo ""
    
    # Check nginx configuration
    echo -e "🌐 Nginx Status:"
    if systemctl is-active --quiet nginx; then
        echo -e "   🚀 Service: ${GREEN}Running${NC}"
        
        # Check which port nginx is proxying to
        if [ -f "$NGINX_CONFIG" ]; then
            local proxy_port=$(grep -o "proxy_pass.*:.*;" "$NGINX_CONFIG" | grep -o "[0-9]\+" | head -1)
            if [ "$proxy_port" = "$BLUE_PORT" ]; then
                echo -e "   🔀 Proxy Target: ${BLUE}Blue${NC} (port $proxy_port)"
            elif [ "$proxy_port" = "$GREEN_PORT" ]; then
                echo -e "   🔀 Proxy Target: ${GREEN}Green${NC} (port $proxy_port)"
            else
                echo -e "   🔀 Proxy Target: ${YELLOW}Unknown${NC} (port $proxy_port)"
            fi
        fi
    else
        echo -e "   🚀 Service: ${RED}Stopped${NC}"
    fi
}

# Deploy to inactive environment
deploy_to_inactive() {
    local code_path=${1:-"."}
    local inactive=$(get_inactive_environment)
    local inactive_dir=$(get_env_dir $inactive)
    local inactive_port=$(get_env_port $inactive)
    
    echo -e "${BLUE}🚀 Deploying to ${inactive} environment...${NC}"
    
    # Create backup if environment exists
    if [ -d "$inactive_dir" ]; then
        local backup_dir="${inactive_dir}-backup-$(date +%Y%m%d-%H%M%S)"
        echo -e "${YELLOW}💾 Backing up existing $inactive environment...${NC}"
        sudo cp -r "$inactive_dir" "$backup_dir"
        echo -e "✅ Backup created: $backup_dir"
    fi
    
    # Stop inactive environment service if running
    local inactive_service="maritime-trading-$inactive"
    if systemctl is-active --quiet "$inactive_service" 2>/dev/null; then
        echo -e "${YELLOW}🛑 Stopping $inactive service...${NC}"
        sudo systemctl stop "$inactive_service"
    fi
    
    # Deploy application to inactive environment
    echo -e "${YELLOW}📂 Deploying application files...${NC}"
    sudo mkdir -p "$inactive_dir"
    sudo cp -r $code_path/* "$inactive_dir/"
    sudo chown -R maritime:maritime "$inactive_dir"
    
    # Setup Python environment
    echo -e "${YELLOW}🐍 Setting up Python environment...${NC}"
    cd "$inactive_dir/backend"
    sudo -u maritime python3 -m venv venv
    sudo -u maritime venv/bin/pip install --upgrade pip
    sudo -u maritime venv/bin/pip install -r requirements.txt
    
    # Setup environment variables
    echo -e "${YELLOW}⚙️  Setting up environment variables...${NC}"
    if [ ! -f ".env" ]; then
        sudo -u maritime tee .env > /dev/null <<EOF
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
    fi
    
    # Run database migrations
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"
    sudo -u maritime venv/bin/python -m alembic upgrade head
    
    # Create systemd service for inactive environment
    echo -e "${YELLOW}🔧 Setting up systemd service...${NC}"
    sudo tee "/etc/systemd/system/$inactive_service.service" > /dev/null <<EOF
[Unit]
Description=Maritime Trading Platform API ($inactive)
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=maritime
Group=maritime
WorkingDirectory=$inactive_dir/backend
Environment=PATH=$inactive_dir/backend/venv/bin
Environment=PORT=$inactive_port
ExecStart=$inactive_dir/backend/venv/bin/python -c "
import os
os.environ['PORT'] = '$inactive_port'
exec(open('run.py').read())
"
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=maritime-trading-$inactive

[Install]
WantedBy=multi-user.target
EOF
    
    # Start inactive environment
    echo -e "${YELLOW}🚀 Starting $inactive environment...${NC}"
    sudo systemctl daemon-reload
    sudo systemctl enable "$inactive_service"
    sudo systemctl start "$inactive_service"
    
    # Health check
    echo -e "${YELLOW}🔍 Performing health check...${NC}"
    sleep 5
    
    for i in {1..10}; do
        if is_env_running "$inactive"; then
            echo -e "✅ Health check: ${GREEN}PASSED${NC}"
            echo -e "${GREEN}✅ Deployment to $inactive environment completed!${NC}"
            echo -e "${BLUE}🔗 Test URL: http://localhost:$inactive_port${NC}"
            echo -e "${YELLOW}Next step: Test your application, then run './blue_green_deployment.sh switch'${NC}"
            return 0
        elif [ $i -eq 10 ]; then
            echo -e "❌ Health check: ${RED}FAILED${NC}"
            echo -e "${RED}Deployment to $inactive environment failed${NC}"
            return 1
        else
            echo -e "⏳ Waiting for service to start... ($i/10)"
            sleep 3
        fi
    done
}

# Switch traffic to inactive environment
switch_environments() {
    local active=$(get_active_environment)
    local inactive=$(get_inactive_environment)
    local inactive_port=$(get_env_port $inactive)
    
    if [ "$active" = "none" ]; then
        echo -e "${YELLOW}⚠️  No active environment detected. Setting $inactive as active...${NC}"
    else
        echo -e "${BLUE}🔄 Switching from $active to $inactive environment...${NC}"
    fi
    
    # Check if inactive environment is running
    if ! is_env_running "$inactive"; then
        echo -e "${RED}❌ Error: $inactive environment is not running${NC}"
        echo -e "${YELLOW}Deploy to $inactive environment first: ./blue_green_deployment.sh deploy${NC}"
        return 1
    fi
    
    # Update nginx configuration to point to inactive environment
    echo -e "${YELLOW}🌐 Updating nginx configuration...${NC}"
    sudo sed -i "s/proxy_pass http:\/\/127\.0\.0\.1:[0-9]\+;/proxy_pass http:\/\/127.0.0.1:$inactive_port;/g" "$NGINX_CONFIG"
    
    # Test nginx configuration
    if ! sudo nginx -t; then
        echo -e "${RED}❌ Nginx configuration test failed${NC}"
        return 1
    fi
    
    # Reload nginx
    sudo systemctl reload nginx
    
    # Update symlink
    echo -e "${YELLOW}🔗 Updating application symlink...${NC}"
    sudo rm -f "$CURRENT_LINK"
    sudo ln -sf "$(get_env_dir $inactive)" "$CURRENT_LINK"
    
    # Wait a moment for traffic to switch
    sleep 2
    
    # Health check on main URL
    echo -e "${YELLOW}🔍 Verifying switch...${NC}"
    if curl -s http://localhost/health > /dev/null 2>&1; then
        echo -e "✅ Switch successful: ${GREEN}$inactive environment is now active${NC}"
        
        # Stop old active environment (optional)
        if [ "$active" != "none" ]; then
            local old_service="maritime-trading-$active"
            echo -e "${YELLOW}🛑 Stopping old $active environment...${NC}"
            sudo systemctl stop "$old_service" || true
        fi
        
        return 0
    else
        echo -e "${RED}❌ Switch verification failed${NC}"
        return 1
    fi
}

# Rollback to previous environment
rollback() {
    local active=$(get_active_environment)
    local inactive=$(get_inactive_environment)
    
    echo -e "${YELLOW}⏪ Rolling back from $active to $inactive...${NC}"
    
    # Check if we can rollback
    if [ ! -d "$(get_env_dir $inactive)" ]; then
        echo -e "${RED}❌ Cannot rollback: $inactive environment not found${NC}"
        return 1
    fi
    
    # Start inactive environment if not running
    if ! is_env_running "$inactive"; then
        echo -e "${YELLOW}🚀 Starting $inactive environment...${NC}"
        local inactive_service="maritime-trading-$inactive"
        sudo systemctl start "$inactive_service"
        sleep 5
    fi
    
    # Switch to inactive (which becomes the rollback target)
    switch_environments
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Rollback completed successfully${NC}"
    else
        echo -e "${RED}❌ Rollback failed${NC}"
        return 1
    fi
}

# Cleanup old environment
cleanup_old() {
    local active=$(get_active_environment)
    local inactive=$(get_inactive_environment)
    local inactive_dir=$(get_env_dir $inactive)
    local inactive_service="maritime-trading-$inactive"
    
    echo -e "${YELLOW}🧹 Cleaning up $inactive environment...${NC}"
    
    # Confirm cleanup
    read -p "Are you sure you want to remove the $inactive environment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cleanup cancelled"
        return 0
    fi
    
    # Stop and disable service
    echo -e "${YELLOW}🛑 Stopping $inactive service...${NC}"
    sudo systemctl stop "$inactive_service" 2>/dev/null || true
    sudo systemctl disable "$inactive_service" 2>/dev/null || true
    sudo rm -f "/etc/systemd/system/$inactive_service.service"
    sudo systemctl daemon-reload
    
    # Remove directory
    echo -e "${YELLOW}🗑️  Removing $inactive directory...${NC}"
    sudo rm -rf "$inactive_dir"
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main script logic
case "${1:-}" in
    "status")
        show_status
        ;;
    "deploy")
        deploy_to_inactive "$2"
        ;;
    "switch")
        switch_environments
        ;;
    "rollback")
        rollback
        ;;
    "cleanup")
        cleanup_old
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid command${NC}"
        show_usage
        exit 1
        ;;
esac
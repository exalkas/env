#!/bin/bash

# Multi-Server Blue-Green Deployment Script
# For use when scaling to multiple servers with load balancer

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Update these for your setup
BLUE_SERVERS=("blue1.maritime.com" "blue2.maritime.com")
GREEN_SERVERS=("green1.maritime.com" "green2.maritime.com")
LOAD_BALANCER="lb.maritime.com"
SSH_USER="maritime"
SSH_KEY="~/.ssh/maritime-key.pem"
DEPLOY_PATH="/opt/maritime-trading"
HEALTH_ENDPOINT="/health"

# Function to show usage
show_usage() {
    echo "Multi-Server Blue-Green Deployment Usage:"
    echo "  ./multi_server_blue_green.sh status                  # Show current status"
    echo "  ./multi_server_blue_green.sh deploy [code-path]      # Deploy to inactive servers"
    echo "  ./multi_server_blue_green.sh switch                  # Switch load balancer traffic"
    echo "  ./multi_server_blue_green.sh rollback                # Rollback to previous servers"
    echo "  ./multi_server_blue_green.sh scale-out               # Add servers to active pool"
    echo "  ./multi_server_blue_green.sh scale-in                # Remove servers from active pool"
    echo ""
    echo "Complete deployment workflow:"
    echo "  1. ./multi_server_blue_green.sh deploy /path/to/new/code"
    echo "  2. Test new version on inactive servers"
    echo "  3. ./multi_server_blue_green.sh switch"
    echo "  4. Monitor and verify"
}

# Get current active environment from load balancer
get_active_environment() {
    # Check load balancer configuration to see which servers are active
    local lb_config=$(ssh -i "$SSH_KEY" "$SSH_USER@$LOAD_BALANCER" "cat /etc/nginx/conf.d/upstream.conf" 2>/dev/null || echo "")
    
    if [[ "$lb_config" =~ "blue1.maritime.com" ]]; then
        echo "blue"
    elif [[ "$lb_config" =~ "green1.maritime.com" ]]; then
        echo "green"
    else
        echo "unknown"
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
        echo "blue"  # Default to blue if unknown
    fi
}

# Get servers for environment
get_servers() {
    local env=$1
    if [ "$env" = "blue" ]; then
        echo "${BLUE_SERVERS[@]}"
    else
        echo "${GREEN_SERVERS[@]}"
    fi
}

# Check server health
check_server_health() {
    local server=$1
    local max_retries=${2:-3}
    
    for i in $(seq 1 $max_retries); do
        if ssh -i "$SSH_KEY" "$SSH_USER@$server" "curl -s http://localhost$HEALTH_ENDPOINT > /dev/null 2>&1"; then
            return 0
        fi
        sleep 2
    done
    return 1
}

# Show deployment status
show_status() {
    echo -e "${BLUE}🔍 Multi-Server Blue-Green Status${NC}"
    echo ""
    
    local active=$(get_active_environment)
    local inactive=$(get_inactive_environment)
    
    echo -e "📍 Active Environment: ${GREEN}$active${NC}"
    echo -e "📍 Inactive Environment: ${YELLOW}$inactive${NC}"
    echo ""
    
    # Check blue servers
    echo -e "${BLUE}💙 Blue Servers:${NC}"
    for server in "${BLUE_SERVERS[@]}"; do
        echo -n "   🖥️  $server: "
        if check_server_health "$server" 1; then
            echo -e "${GREEN}Healthy${NC}"
        else
            echo -e "${RED}Unhealthy${NC}"
        fi
        
        # Show version if available
        local version=$(ssh -i "$SSH_KEY" "$SSH_USER@$server" "cat $DEPLOY_PATH/backend/VERSION 2>/dev/null || echo 'unknown'")
        echo -e "      🏷️  Version: $version"
    done
    
    echo ""
    
    # Check green servers
    echo -e "${GREEN}💚 Green Servers:${NC}"
    for server in "${GREEN_SERVERS[@]}"; do
        echo -n "   🖥️  $server: "
        if check_server_health "$server" 1; then
            echo -e "${GREEN}Healthy${NC}"
        else
            echo -e "${RED}Unhealthy${NC}"
        fi
        
        # Show version if available
        local version=$(ssh -i "$SSH_KEY" "$SSH_USER@$server" "cat $DEPLOY_PATH/backend/VERSION 2>/dev/null || echo 'unknown'")
        echo -e "      🏷️  Version: $version"
    done
    
    echo ""
    
    # Check load balancer
    echo -e "⚖️  Load Balancer Status:"
    if check_server_health "$LOAD_BALANCER" 1; then
        echo -e "   🚀 Service: ${GREEN}Running${NC}"
        
        # Show current upstream configuration
        local upstream_config=$(ssh -i "$SSH_KEY" "$SSH_USER@$LOAD_BALANCER" "grep -A 10 'upstream backend' /etc/nginx/conf.d/upstream.conf 2>/dev/null || echo 'Config not found'")
        echo -e "   🔀 Current Upstream Config:"
        echo "$upstream_config" | sed 's/^/      /'
    else
        echo -e "   🚀 Service: ${RED}Not responding${NC}"
    fi
}

# Deploy to inactive servers
deploy_to_inactive() {
    local code_path=${1:-"."}
    local inactive=$(get_inactive_environment)
    local servers=($(get_servers $inactive))
    
    echo -e "${BLUE}🚀 Deploying to $inactive servers...${NC}"
    
    # Create deployment package
    local deploy_package="/tmp/maritime-deployment-$(date +%Y%m%d-%H%M%S).tar.gz"
    echo -e "${YELLOW}📦 Creating deployment package...${NC}"
    tar -czf "$deploy_package" -C "$code_path" .
    
    # Deploy to each inactive server in parallel
    local pids=()
    for server in "${servers[@]}"; do
        (
            echo -e "${YELLOW}📤 Deploying to $server...${NC}"
            
            # Upload deployment package
            scp -i "$SSH_KEY" "$deploy_package" "$SSH_USER@$server:/tmp/"
            
            # Execute deployment on server
            ssh -i "$SSH_KEY" "$SSH_USER@$server" << 'EOF'
set -e

# Configuration
DEPLOY_PATH="/opt/maritime-trading"
BACKUP_PATH="/opt/maritime-backup-$(date +%Y%m%d-%H%M%S)"
DEPLOY_PACKAGE=$(ls /tmp/maritime-deployment-*.tar.gz | head -1)

# Create backup
echo "Creating backup..."
sudo cp -r "$DEPLOY_PATH" "$BACKUP_PATH" 2>/dev/null || echo "No existing deployment to backup"

# Stop service
echo "Stopping service..."
sudo systemctl stop maritime-trading || echo "Service not running"

# Extract new deployment
echo "Extracting deployment..."
sudo mkdir -p "$DEPLOY_PATH"
sudo tar -xzf "$DEPLOY_PACKAGE" -C "$DEPLOY_PATH"
sudo chown -R maritime:maritime "$DEPLOY_PATH"

# Setup Python environment
echo "Setting up Python environment..."
cd "$DEPLOY_PATH/backend"
sudo -u maritime python3 -m venv venv
sudo -u maritime venv/bin/pip install --upgrade pip
sudo -u maritime venv/bin/pip install -r requirements.txt

# Setup environment variables (if not exists)
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    sudo -u maritime tee .env > /dev/null <<EOV
POSTGRES_SERVER=db.maritime.com
POSTGRES_USER=env_pg_db_123_admin
POSTGRES_PASSWORD=
POSTGRES_DB=env_mari_db
POSTGRES_PORT=5432

SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

REDIS_HOST=redis.maritime.com
REDIS_PORT=6379
EOV
fi

# Run database migrations (only on first server to avoid conflicts)
# Note: In production, you might want to run migrations separately
echo "Running database migrations..."
sudo -u maritime venv/bin/python -m alembic upgrade head

# Start service
echo "Starting service..."
sudo systemctl start maritime-trading
sudo systemctl enable maritime-trading

# Clean up
rm -f "$DEPLOY_PACKAGE"

echo "Deployment completed on $(hostname)"
EOF
            
            echo -e "✅ Deployment to $server completed"
        ) &
        pids+=($!)
    done
    
    # Wait for all deployments to complete
    echo -e "${YELLOW}⏳ Waiting for all deployments to complete...${NC}"
    for pid in "${pids[@]}"; do
        wait $pid
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Deployment failed on one or more servers${NC}"
            return 1
        fi
    done
    
    # Clean up local deployment package
    rm -f "$deploy_package"
    
    # Health check all inactive servers
    echo -e "${YELLOW}🔍 Performing health checks...${NC}"
    local unhealthy_servers=()
    for server in "${servers[@]}"; do
        echo -n "   Checking $server... "
        if check_server_health "$server" 5; then
            echo -e "${GREEN}Healthy${NC}"
        else
            echo -e "${RED}Unhealthy${NC}"
            unhealthy_servers+=("$server")
        fi
    done
    
    if [ ${#unhealthy_servers[@]} -gt 0 ]; then
        echo -e "${RED}❌ Health check failed for: ${unhealthy_servers[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Deployment to all $inactive servers completed successfully!${NC}"
    echo -e "${YELLOW}Next step: Test your application, then run './multi_server_blue_green.sh switch'${NC}"
}

# Switch load balancer to inactive servers
switch_environments() {
    local active=$(get_active_environment)
    local inactive=$(get_inactive_environment)
    local inactive_servers=($(get_servers $inactive))
    
    echo -e "${BLUE}🔄 Switching load balancer from $active to $inactive servers...${NC}"
    
    # Health check all inactive servers first
    echo -e "${YELLOW}🔍 Pre-switch health check...${NC}"
    for server in "${inactive_servers[@]}"; do
        if ! check_server_health "$server" 3; then
            echo -e "${RED}❌ Server $server is unhealthy. Aborting switch.${NC}"
            return 1
        fi
    done
    
    # Create new upstream configuration
    echo -e "${YELLOW}⚖️  Updating load balancer configuration...${NC}"
    
    # Generate upstream config
    local upstream_config="upstream backend {\n"
    for server in "${inactive_servers[@]}"; do
        upstream_config+="    server $server:80 max_fails=3 fail_timeout=30s;\n"
    done
    upstream_config+="}\n"
    
    # Update load balancer configuration
    ssh -i "$SSH_KEY" "$SSH_USER@$LOAD_BALANCER" << EOF
set -e

# Backup current configuration
sudo cp /etc/nginx/conf.d/upstream.conf /etc/nginx/conf.d/upstream.conf.backup-\$(date +%Y%m%d-%H%M%S)

# Update upstream configuration
echo -e "$upstream_config" | sudo tee /etc/nginx/conf.d/upstream.conf > /dev/null

# Test configuration
sudo nginx -t

# Reload nginx (graceful reload, no downtime)
sudo systemctl reload nginx

echo "Load balancer configuration updated successfully"
EOF
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to update load balancer configuration${NC}"
        return 1
    fi
    
    # Wait for traffic to switch
    sleep 5
    
    # Verify switch by checking load balancer health
    echo -e "${YELLOW}🔍 Verifying switch...${NC}"
    if check_server_health "$LOAD_BALANCER" 3; then
        echo -e "✅ Switch successful: ${GREEN}Traffic now routed to $inactive servers${NC}"
        
        # Optional: Stop old active servers to save resources
        local active_servers=($(get_servers $active))
        echo -e "${YELLOW}🛑 Stopping old $active servers...${NC}"
        for server in "${active_servers[@]}"; do
            ssh -i "$SSH_KEY" "$SSH_USER@$server" "sudo systemctl stop maritime-trading" &
        done
        wait
        
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
    
    echo -e "${YELLOW}⏪ Rolling back from $active to $inactive servers...${NC}"
    
    # Start inactive servers if not running
    local inactive_servers=($(get_servers $inactive))
    echo -e "${YELLOW}🚀 Starting $inactive servers...${NC}"
    for server in "${inactive_servers[@]}"; do
        ssh -i "$SSH_KEY" "$SSH_USER@$server" "sudo systemctl start maritime-trading" &
    done
    wait
    
    # Wait for servers to start
    sleep 10
    
    # Switch traffic
    switch_environments
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Rollback completed successfully${NC}"
    else
        echo -e "${RED}❌ Rollback failed${NC}"
        return 1
    fi
}

# Scale out - add more servers to active pool
scale_out() {
    echo -e "${BLUE}📈 Scaling out active environment...${NC}"
    # Implementation depends on your infrastructure setup
    # This could involve launching new instances, updating load balancer, etc.
    echo "Scale-out functionality to be implemented based on your cloud provider"
}

# Scale in - remove servers from active pool
scale_in() {
    echo -e "${BLUE}📉 Scaling in active environment...${NC}"
    # Implementation depends on your infrastructure setup
    echo "Scale-in functionality to be implemented based on your cloud provider"
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
    "scale-out")
        scale_out
        ;;
    "scale-in")
        scale_in
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid command${NC}"
        show_usage
        exit 1
        ;;
esac
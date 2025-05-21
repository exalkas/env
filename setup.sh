#!/bin/bash
echo "Setting up Green Energy Trading Marketplace..."

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv backend/venv

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Copy environment file
echo "Setting up environment variables..."
cp backend/env_file backend/.env

# Make scripts executable
echo "Making scripts executable..."
chmod +x scripts/*.sh
chmod +x start-all.sh

# Setup database
echo "Setting up database..."
./scripts/reset-db.sh

# Install frontend dependencies
echo "Installing landing page dependencies..."
cd landing-page
npm install
cd ..

# echo "Installing marketplace app dependencies..."
# cd marketplace-app
# npm install
# cd ..

# echo "Installing admin app dependencies..."
# cd admin-app
# npm install
# cd ..

echo "Setup complete!"
echo ""
echo "To start all services, run:"
echo "  ./start-all.sh"
echo ""
echo "Or to start individual components, follow instructions in SETUP.md" 
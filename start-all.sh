#!/bin/bash
echo "Starting Green Energy Trading Marketplace services..."

# Start backend server
gnome-terminal --title="Backend Server" -- bash -c "cd backend && source venv/bin/activate && python run.py; exec bash" &

# Start landing page
gnome-terminal --title="Landing Page" -- bash -c "cd landing-page && npm run dev; exec bash" &

# Start marketplace app (when available)
# gnome-terminal --title="Marketplace App" -- bash -c "cd marketplace-app && npm run dev; exec bash" &

# Start admin app (when available)
# gnome-terminal --title="Admin App" -- bash -c "cd admin-app && npm run dev; exec bash" &

echo "All services started!"
echo ""
echo "Landing page: http://localhost:3000"
echo "Backend API: http://localhost:8000"
# echo "Marketplace app: http://localhost:3001"
# echo "Admin app: http://localhost:3002" 
@echo off
echo Starting Green Energy Trading Marketplace services...

REM Start backend server
start cmd /k "cd backend && call venv\Scripts\activate && python run.py"

REM Start landing page
start cmd /k "cd landing-page && npm run dev"

REM Start marketplace app (when available)
REM start cmd /k "cd marketplace-app && npm run dev"

REM Start admin app (when available)
REM start cmd /k "cd admin-app && npm run dev"

echo All services started!
echo.
echo Landing page: http://localhost:3000
echo Backend API: http://localhost:8000
REM echo Marketplace app: http://localhost:3001
REM echo Admin app: http://localhost:3002 
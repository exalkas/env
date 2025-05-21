@echo off
echo Setting up Green Energy Trading Marketplace...

REM Create Python virtual environment
echo Creating Python virtual environment...
python -m venv backend\venv

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

REM Copy environment file
echo Setting up environment variables...
copy backend\env_file backend\.env

REM Setup database
echo Setting up database...
call scripts\reset-db.bat

REM Install frontend dependencies
echo Installing landing page dependencies...
cd landing-page
npm install
cd ..

REM echo Installing marketplace app dependencies...
REM cd marketplace-app
REM npm install
REM cd ..

REM echo Installing admin app dependencies...
REM cd admin-app
REM npm install
REM cd ..

echo Setup complete!
echo.
echo To start all services, run:
echo   .\start-all.bat
echo.
echo Or to start individual components, follow instructions in SETUP.md 
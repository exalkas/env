@echo off
REM Simplified Database Export Script for Windows
REM This script exports the Emisify database structure and data

echo ========================================
echo Emisify Database Export Tool (Windows)
echo ========================================
echo.

REM Check if we're in the backend directory
if not exist "app\core\config.py" (
    echo ERROR: This script must be run from the backend directory
    echo Current directory: %cd%
    echo Please navigate to the backend folder and try again
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

echo ✅ Python found

REM Try to activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    echo ✅ Virtual environment activated
) else if exist "..\venv\Scripts\activate.bat" (
    echo Activating virtual environment from parent directory...
    call ..\venv\Scripts\activate.bat
    echo ✅ Virtual environment activated
) else (
    echo ⚠️  No virtual environment found, using system Python
)

REM Check if required packages are installed
echo Checking required packages...
python -c "from app.core.config import get_settings" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Required packages not found
    echo Please ensure you have installed the requirements:
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

echo ✅ Required packages found

REM Check if PostgreSQL is available
echo Checking PostgreSQL tools...
pg_dump --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL (pg_dump) is not installed or not in PATH
    echo Please install PostgreSQL and ensure pg_dump is available
    echo Download from: https://www.postgresql.org/download/windows/
    echo.
    echo After installing PostgreSQL, add it to your PATH:
    echo 1. Right-click "This PC" ^> Properties ^> Advanced System Settings
    echo 2. Click "Environment Variables"  
    echo 3. Under System Variables, find "Path" and click Edit
    echo 4. Add: C:\Program Files\PostgreSQL\15\bin (adjust version as needed)
    pause
    exit /b 1
)

echo ✅ PostgreSQL tools found

echo.
echo All prerequisites checked successfully!
echo.
echo 🚀 Starting database export...
echo.

REM Run the export script
python export_database.py

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 🎉 DATABASE EXPORT COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo ✅ Files have been created in the database_exports folder
    echo ✅ You can now copy these files to your target systems
    echo.
    echo Next steps:
    echo 1. Check the database_exports folder for your files
    echo 2. Copy the import_database_*.sql file to your target system
    echo 3. Follow the IMPORT_INSTRUCTIONS_*.md file for setup
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ ERROR: DATABASE EXPORT FAILED
    echo ========================================
    echo.
    echo Please check the error messages above
    echo Common issues:
    echo   - Database connection problems (check .env file)
    echo   - Incorrect database credentials
    echo   - PostgreSQL not running
    echo   - Network connectivity issues
    echo.
)

echo Press any key to exit...
pause >nul 
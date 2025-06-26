@echo off
REM Database Export Script for Windows
REM This script exports the Emisify database structure and data

echo ========================================
echo Emisify Database Export Tool (Windows)
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Check if we're in the backend directory
if not exist "app\core\config.py" (
    echo ERROR: This script must be run from the backend directory
    echo Current directory: %cd%
    echo Please navigate to the backend folder and try again
    pause
    exit /b 1
)

REM Check if virtual environment is activated
if defined VIRTUAL_ENV (
    echo Virtual environment is already activated: %VIRTUAL_ENV%
) else (
    echo WARNING: Virtual environment is not activated
    echo Attempting to activate venv...
    if exist "venv\Scripts\activate.bat" (
        call venv\Scripts\activate.bat
        echo Virtual environment activated
    ) else (
        echo Virtual environment not found at venv\Scripts\activate.bat
        echo You may need to activate your Python environment manually
        echo.
    )
)

REM Check if required packages are installed
python -c "from app.core.config import get_settings" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Required packages not found
    echo Please ensure you have installed the requirements:
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

REM Check if PostgreSQL is available
pg_dump --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL (pg_dump) is not installed or not in PATH
    echo Please install PostgreSQL and ensure pg_dump is available
    echo Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo All prerequisites checked successfully!
echo.
echo Starting database export...
echo.

REM Run the export script
python export_database.py

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo DATABASE EXPORT COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo [OK] Files have been created in the database_exports folder
    echo [OK] You can now copy these files to your target systems
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: DATABASE EXPORT FAILED
    echo ========================================
    echo.
    echo Please check the error messages above
    echo Common issues:
    echo   - Database connection problems
    echo   - Incorrect database credentials
    echo   - PostgreSQL not running
    echo.
)

pause 
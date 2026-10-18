@echo off
python "%~dp0..\backend\reset_database.py" %*
exit /b %errorlevel%

@echo off
echo ============================================================
echo Fix All Issues - Complete Setup
echo ============================================================
echo.

cd /d "%~dp0"

echo This will:
echo 1. Upgrade pip
echo 2. Install all required packages
echo 3. Remove problematic packages (pyswip)
echo 4. Verify everything is working
echo.
pause

echo.
echo [1/4] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo [2/4] Installing required packages...
pip install flask flask-cors requests pandas

echo.
echo [3/4] Removing problematic packages...
pip uninstall -y pyswip

echo.
echo [4/4] Verifying installation...
python -c "import flask, flask_cors, requests, pandas; print('All packages imported successfully!')"

echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo Installed packages:
pip list | findstr "Flask flask requests pandas"
echo.
echo Next: Run start.bat to launch the application
echo.
pause
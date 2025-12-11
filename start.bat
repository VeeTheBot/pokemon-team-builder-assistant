@echo off
echo ============================================================
echo Pokemon Team Builder - Start WITHOUT Prolog
echo ============================================================
echo.

REM Get the directory where this batch file is located
cd /d "%~dp0"

echo This will start the server in fallback mode.
echo Prolog features will be disabled.
echo.

REM Temporarily uninstall pyswip to force fallback mode
pip uninstall -y pyswip >nul 2>&1

echo Starting server without Prolog...
echo.

REM Open browser
timeout /t 2 >nul
start http://127.0.0.1:5000

echo.
echo ============================================================
echo Server running at: http://127.0.0.1:5000
echo Mode: Fallback (No Prolog)
echo ============================================================
echo.
echo Press Ctrl+C to stop
echo.

python inference_system.py

echo.
echo Server stopped.
pause
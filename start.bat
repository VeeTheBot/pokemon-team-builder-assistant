@echo off
echo ============================================================
echo Pokemon Team Builder - Starting WITH Prolog
echo ============================================================
echo.

REM Get the directory where this batch file is located
cd /d "%~dp0"

echo Checking for SWI-Prolog...
where swipl >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: SWI-Prolog not found in PATH!
    echo Please install SWI-Prolog from https://www.swi-prolog.org/download/stable
    echo Make sure to add it to your PATH during installation.
    echo.
    echo The server will start in fallback mode without Prolog.
    echo.
    pause
)

echo Checking for PySwip...
pip show pyswip >nul 2>&1
if %errorlevel% neq 0 (
    echo PySwip not installed. Installing now...
    pip install pyswip==0.2.10
)

echo.
echo Starting server with Prolog support...
echo.

REM Open browser after short delay
timeout /t 2 >nul
start http://127.0.0.1:5000

echo.
echo ============================================================
echo Server running at: http://127.0.0.1:5000
echo Mode: Prolog Enabled
echo ============================================================
echo.
echo Press Ctrl+C to stop
echo.

python inference_system.py

echo.
echo Server stopped.
pause
@echo off
echo ========================================
echo   L2pControl Client - Installer
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click on install.bat and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/4] Installing Python dependencies...
pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Testing client connection...
python client.py --test
if %errorLevel% neq 0 (
    echo ERROR: Failed to connect to server
    pause
    exit /b 1
)

echo.
echo [3/4] Installing Windows Service...
python service.py install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install service
    pause
    exit /b 1
)

echo.
echo [4/4] Starting service...
python service.py start
if %errorLevel% neq 0 (
    echo ERROR: Failed to start service
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation completed successfully!
echo ========================================
echo.
echo The L2pControl client is now running as a Windows service.
echo It will start automatically when the PC boots.
echo.
echo PC ID: %COMPUTERNAME%
echo.
pause

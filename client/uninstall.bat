@echo off
echo ========================================
echo   L2pControl Client - Uninstaller
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click on uninstall.bat and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/2] Stopping service...
python service.py stop

echo.
echo [2/2] Removing service...
python service.py remove

echo.
echo ========================================
echo   Uninstallation completed!
echo ========================================
echo.
echo The L2pControl client has been removed.
echo You can now delete this folder.
echo.
pause

@echo off
echo ========================================
echo   Fix L2pControl Auto-Start
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click on fix_autostart.bat and select "Run as administrator"
    pause
    exit /b 1
)

set INSTALL_DIR=C:\Program Files\L2pControl

echo [1] Checking installation directory...
if not exist "%INSTALL_DIR%" (
    echo ERROR: Installation directory not found!
    echo Please run install.bat first.
    pause
    exit /b 1
)
echo Found: %INSTALL_DIR%

echo.
echo [2] Stopping service if running...
sc stop L2pControlClient >nul 2>&1
timeout /t 2 >nul

echo [3] Configuring delayed auto-start...
sc config L2pControlClient start= delayed-auto
if %errorLevel% neq 0 (
    echo WARNING: Trying regular auto-start instead...
    sc config L2pControlClient start= auto
)

echo [4] Setting service recovery options...
sc failure L2pControlClient reset= 86400 actions= restart/60000/restart/60000/restart/60000
if %errorLevel% neq 0 (
    echo WARNING: Could not set service recovery options (not critical)
)

echo [5] Starting service...
sc start L2pControlClient
if %errorLevel% neq 0 (
    echo ERROR: Failed to start service
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Service configured successfully!
echo ========================================
echo.
echo The service should now start automatically on boot.
echo Try restarting your PC to test.
echo.
echo To check service status, run: check_service.bat
echo.
pause

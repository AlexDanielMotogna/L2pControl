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

set INSTALL_DIR=C:\Program Files\L2pControl

echo [1/3] Stopping service...
if exist "%INSTALL_DIR%\service.py" (
    cd /d "%INSTALL_DIR%"
    python service.py stop
) else (
    echo WARNING: Service files not found in installation directory
)

echo.
echo [2/3] Removing service...
if exist "%INSTALL_DIR%\service.py" (
    python service.py remove
) else (
    sc delete L2pControlClient >nul 2>&1
    echo Service removed from registry
)

echo.
echo [3/3] Cleaning up installation files...
if exist "%INSTALL_DIR%" (
    rd /s /q "%INSTALL_DIR%"
    echo Installation directory removed.
) else (
    echo Installation directory not found (already clean).
)

echo.
echo ========================================
echo   Uninstallation completed!
echo ========================================
echo.
echo The L2pControl client has been removed.
echo You can now delete this USB folder if needed.
echo.
pause

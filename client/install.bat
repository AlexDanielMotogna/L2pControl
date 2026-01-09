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

echo [1/6] Creating installation directory...
set INSTALL_DIR=C:\Program Files\L2pControl
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if %errorLevel% neq 0 (
    echo ERROR: Failed to create installation directory
    pause
    exit /b 1
)

echo.
echo [2/6] Copying files to installation directory...
xcopy /Y /I "%~dp0*.py" "%INSTALL_DIR%\"
xcopy /Y /I "%~dp0*.json" "%INSTALL_DIR%\"
xcopy /Y /I "%~dp0requirements.txt" "%INSTALL_DIR%\"
if %errorLevel% neq 0 (
    echo ERROR: Failed to copy files
    pause
    exit /b 1
)

echo.
echo [3/6] Installing Python dependencies...
cd /d "%INSTALL_DIR%"
pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [4/6] Testing client connection...
python client.py --test
if %errorLevel% neq 0 (
    echo ERROR: Failed to connect to server
    pause
    exit /b 1
)

echo.
echo [5/6] Installing Windows Service...
python service.py install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install service
    pause
    exit /b 1
)

echo.
echo Configuring service to start automatically...
sc config L2pControlClient start= auto
if %errorLevel% neq 0 (
    echo ERROR: Failed to configure service auto-start
    pause
    exit /b 1
)

echo.
echo Setting service recovery options...
sc failure L2pControlClient reset= 86400 actions= restart/60000/restart/60000/restart/60000
if %errorLevel% neq 0 (
    echo WARNING: Could not set service recovery options (not critical)
)

echo.
echo [6/6] Starting service...
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
echo Installation location: C:\Program Files\L2pControl
echo PC ID: %COMPUTERNAME%
echo.
echo You can now safely remove the USB drive.
echo.
pause

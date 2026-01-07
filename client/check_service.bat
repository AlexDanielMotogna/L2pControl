@echo off
echo ========================================
echo   L2pControl Service - Status Check
echo ========================================
echo.

echo [1] Checking if service is installed...
sc query L2pControlClient >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Service is NOT installed!
    echo Run install.bat as Administrator first.
    pause
    exit /b 1
)

echo Service is installed.
echo.

echo [2] Service details:
sc qc L2pControlClient
echo.

echo [3] Current service status:
sc query L2pControlClient
echo.

echo [4] Recent service events (if any):
wevtutil qe Application "/q:*[System[Provider[@Name='L2pControlClient']]]" /f:text /c:5
echo.

echo [5] Installation directory:
set INSTALL_DIR=C:\Program Files\L2pControl
if exist "%INSTALL_DIR%" (
    echo Found: %INSTALL_DIR%
    echo.
    echo Files in installation directory:
    dir "%INSTALL_DIR%" /b
) else (
    echo ERROR: Installation directory not found!
    echo Service may not work correctly.
)
echo.

echo ========================================
pause

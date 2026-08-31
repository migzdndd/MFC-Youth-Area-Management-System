@echo off
setlocal

cd /d "%~dp0"

set "POWERSHELL=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

if not exist "%POWERSHELL%" (
    echo.
    echo ERROR: Windows PowerShell was not found.
    echo Expected location:
    echo %POWERSHELL%
    echo.
    pause
    exit /b 1
)

"%POWERSHELL%" -NoProfile -ExecutionPolicy Bypass -File ".\scripts\publish-release.ps1"

if errorlevel 1 (
    echo.
    echo Release build failed. Review the error above.
    pause
    exit /b 1
)

echo.
echo Release build completed successfully.
pause
@echo off
setlocal
cd /d "%~dp0"

set "PSEXE="
set "WINDOWS_PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

if exist "%WINDOWS_PS%" set "PSEXE=%WINDOWS_PS%"

if not defined PSEXE (
    for /f "delims=" %%I in ('where pwsh.exe 2^>nul') do (
        if not defined PSEXE set "PSEXE=%%I"
    )
)

if not defined PSEXE (
    echo.
    echo ERROR: No usable PowerShell executable was found.
    echo Checked: %WINDOWS_PS% and pwsh.exe on PATH
    pause
    exit /b 1
)

echo Packaging clean updated source ZIP...
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-source-zip.ps1"

if errorlevel 1 (
    echo.
    echo Packaging failed.
    pause
    exit /b 1
)

echo.
echo Packaging completed. The ZIP file is ready.
pause

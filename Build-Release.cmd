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
    echo.
    echo Checked:
    echo   %WINDOWS_PS%
    echo   pwsh.exe on PATH
    echo.
    echo You can still build manually with:
    echo   dotnet publish "MFC Youth Area Management System.csproj" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -p:PublishTrimmed=false -o ".\dist\publish-win-x64"
    echo.
    echo Then compile:
    echo   Installer\MFCYouthSetup_v2.0.3-beta.iss
    pause
    exit /b 1
)

echo Using PowerShell: %PSEXE%
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File ".\scripts\publish-release.ps1"

if errorlevel 1 (
    echo.
    echo Release build failed. Review the error above.
    pause
    exit /b 1
)

echo.
echo Release build completed successfully.
pause

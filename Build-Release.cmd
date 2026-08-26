@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\publish-release.ps1"
if errorlevel 1 (
  echo.
  echo Release build failed. Review the error above.
  pause
  exit /b 1
)
echo.
echo Release build completed successfully.
pause

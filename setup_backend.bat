@echo off
setlocal
echo ========================================================
echo        AI Interview Coach - Backend Setup
echo ========================================================
echo.

cd /d "%~dp0"

if not exist venv (
    echo Creating virtual environment (venv)...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing backend dependencies...
pip install -r requirements.txt

echo.
echo ========================================================
echo Backend setup complete!
echo Launch the full app anytime with: run_project.bat
echo ========================================================
pause

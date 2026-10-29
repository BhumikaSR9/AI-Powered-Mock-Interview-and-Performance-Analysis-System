@echo off
echo ========================================================
echo        PrepSense AI - 1-Click Update & Auto-Deploy
echo ========================================================
echo.
echo 1. Rebuilding frontend production bundle...
cd frontend
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed. Please check your code.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo 2. Staging and committing changes to Git...
set /p commit_msg="Enter description of your change (press Enter for 'Update website'): "
if "%commit_msg%"=="" set commit_msg=Update website
git add .
git commit -m "%commit_msg%"

echo.
echo 3. Pushing changes to GitHub...
git push origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS! Pushed to GitHub successfully!
    echo.
    echo Render will now AUTOMATICALLY detect this push and
    echo rebuild your live website within 1-2 minutes!
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push to GitHub failed. Please check your internet connection or git credentials.
)

echo.
pause

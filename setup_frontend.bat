@echo off
setlocal
echo ========================================================
echo        AI Interview Coach - Frontend Setup
echo ========================================================
echo.

cd /d "%~dp0\frontend"

echo Installing frontend packages...
call npm.cmd install

echo.
echo Building production assets...
call npm.cmd run build

echo.
echo ========================================================
echo Frontend setup & build complete!
echo ========================================================
pause

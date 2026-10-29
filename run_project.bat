@echo off
setlocal
title AI Interview Coach - Launcher
cls
echo ========================================================
echo         AI Interview Coach - One-Click Launcher
echo ========================================================
echo.

cd /d "%~dp0"

if exist venv\Scripts\python.exe (
    set "PYTHON_CMD=venv\Scripts\python.exe"
) else if exist backend\venv\Scripts\python.exe (
    set "PYTHON_CMD=backend\venv\Scripts\python.exe"
) else (
    set "PYTHON_CMD=python"
)

echo Checking server dependencies...
%PYTHON_CMD% run.py

pause

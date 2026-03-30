@echo off
chcp 65001 >nul
cls

:: Nova Ultra Launcher
echo 🚀 Starting Nova Ultra...

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install it first.
    exit /b 1
)

:: Setup
if not exist .env (
    echo ⚙️  Running first-time setup...
    node scripts\setup.js
)

:: Create dirs
if not exist data mkdir data
if not exist logs mkdir logs
if not exist src\skills\generated mkdir src\skills\generated

:: Start
echo 🦾 Launching Nova Ultra...
echo ═════════════════════════════════
node src\index.js

pause

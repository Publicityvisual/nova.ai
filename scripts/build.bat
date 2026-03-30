@echo off
chcp 65001 >nul
cls

:: Nova Ultra Build Script
:: Adds protection before deployment

echo 🔒 Nova Ultra Build System
echo ==========================

:: Install dependencies
echo 📦 Installing dependencies...
call npm install --production 2>nul

:: Run protection
echo 🛡️ Running code protection...
node scripts\protect.js protect

:: Create distribution
echo 📦 Creating distribution...
if not exist dist mkdir dist

:: Copy protected files
xcopy /s /y src dist\src\
xcopy /y package.json dist\
xcopy /y .env.example dist\
xcopy /y README.md dist\
xcopy /y OPENROUTER-GUIDE.md dist\
xcopy /y .build-info.json dist\ 2>nul

echo.
echo ✅ Build complete: .\dist\
echo 🚀 Ready for deployment
pause

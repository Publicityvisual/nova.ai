@echo off
chcp 65001 >nul
title Nova Ultra v2.0 - WhatsApp Bot
cd /d "%~dp0"

echo ========================================
echo   🤖 NOVA ULTRA v2.0
echo   Better than OpenClaw
echo ========================================
echo.
echo Iniciando en modo PERMANENTE...
echo.
echo Cuando veas el QR:
echo 1. Abre WhatsApp en tu telefono
echo 2. Ve a 3 puntos → Dispositivos vinculados
echo 3. Apunta la camara al QR
echo.
echo ========================================
echo.

REM Limpiar sesion anterior (opcional)
REM rmdir /s /q data\sessions\nova-session 2>nul

REM Iniciar Nova
node src/index.js

echo.
echo ========================================
echo Nova se ha cerrado
echo ========================================
pause

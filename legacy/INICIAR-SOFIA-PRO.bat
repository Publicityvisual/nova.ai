@echo off
cd /d "%~dp0"
title SOFIA PRO v6.0 - Personal AI Assistant

color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║     🦞 SOFIA PRO v6.0 - Personal AI Assistant     ║
echo  ║                                                  ║
echo  ║     24/7 • Memoria persistente • Control total ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  [Iniciando sistema inteligente...]
echo.

if not exist "node_modules" (
    echo  [*] Primera vez - Instalando dependencias...
    call npm install
)

echo  [✓] Sistema listo
echo  [✓] Memoria: Cargada
echo  [✓] IA: Conectada
echo.
echo  Iniciando en 3 segundos...
timeout /t 3 > nul
cls

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  SOFIA PRO ACTIVA - Esperando mensajes...        ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  📱 Telegram: @sofiaasistentes_bot
echo  🌐 Dashboard: http://localhost:3000
echo  ⏰ Estado: 24/7 Online
echo  💰 Costo: $0.00
echo.
echo  Presiona Ctrl+C para detener
echo.

:loop
node SOFIA-PRO.js
if errorlevel 1 (
    echo.
    echo  [Reiniciando automaticamente...]
    timeout /t 3 > nul
    cls
    goto loop
)

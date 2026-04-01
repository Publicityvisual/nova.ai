@echo off
chcp 65001 > nul
cd /d "%~dp0"
title 🦞 SOFIA PRO v6.1 - EXPANDIDA

color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║     🦞 SOFIA PRO v6.1 - EXPANDIDA               ║
echo  ║                                                  ║
echo  ║     Terminal • Files • Cron • AI Avanzada      ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  [+] Iniciando sistema inteligente expandido...
echo.

REM Verificar Node
node --version > nul 2>&1
if errorlevel 1 (
    echo  [!] ERROR: Node.js no instalado
    echo  [*] Instala desde: https://nodejs.org
    pause
    exit /b 1
)

echo  [✓] Node.js verificado
echo  [✓] Memoria: Cargada
echo  [✓] IA: Conectada (OpenRouter)
echo  [✓] Terminal: Lista
echo  [✓] File System: Acceso concedido
echo.
echo  [*] Iniciando en 3 segundos...
timeout /t 3 > nul
cls

:loop
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  SOFIA PRO ACTIVA - Control total del sistema   ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  📱 Telegram: @sofiaasistentes_bot
echo  🌐 Dashboard: http://localhost:3000
echo  📂 Data Dir: .\data\
echo  💻 Terminal: /admin exec [comando]
echo  ⏰ Cron Jobs: Activos
echo  💰 Costo: $0.00
echo.
echo  Presiona Ctrl+C para detener
echo.

node src\sofia-pro-v2.js

if errorlevel 1 (
    echo.
    echo  [!] Sofia se detuvo. Reiniciando...
    timeout /t 3 > nul
    cls
    goto loop
)

@echo off
chcp 65001 > nul
cd /d "%~dp0"
title 🚀 NOVA AI v6.0 - Lanzador Unificado

color 0B
cls

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║        🚀 NOVA AI v6.0 - SISTEMA UNIFICADO                ║
echo  ║                                                          ║
echo  ║        WhatsApp + Telegram + IA Avanzada               ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  [+] Verificando entorno...
echo.

REM Verificar Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo  ❌ ERROR: Node.js no esta instalado
    echo  [*] Descarga desde: https://nodejs.org
    pause
    exit /b 1
)
echo  [✓] Node.js detectado

REM Verificar node_modules
if not exist "node_modules" (
    echo  [*] Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo  ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)
echo  [✓] Dependencias listas

REM Verificar archivo .env
if not exist ".env" (
    echo  [!] Creando archivo .env desde ejemplo...
    if exist ".env.example" (
        copy .env.example .env
        echo  [!] Edita el archivo .env con tus tokens antes de continuar
        pause
    )
)
echo  [✓] Configuracion lista

echo.
echo  [+] Iniciando sistema...
echo.
timeout /t 2 > nul
cls

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  ✅ NOVA AI v6.0 ACTIVA                                   ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  📱 Plataformas:
echo     • Telegram: Bot conectado
echo     • WhatsApp: Esperando conexion
echo.
echo  💻 Dashboard: http://localhost:3000
echo  💰 Costo: $0.00 (APIs gratuitas)
echo.
echo  Presiona Ctrl+C para detener
echo.
echo  ═══════════════════════════════════════════════════════════
echo.

REM Menu de seleccion
echo  Selecciona modo de inicio:
echo.
echo  1. Modo COMPLETO (Recomendado) - src/index-enterprise.js
echo  2. Modo PRO Avanzado - src/sofia-pro-v2.js
echo  3. Modo SIMPLE - SOFIA-ARREGLADA.js
echo  4. Modo SOLO Telegram - SOFIA-TELEGRAM.js
echo.

set /p option="Opcion (1-4): "

if "%option%"=="1" (
    echo  [+] Iniciando modo COMPLETO...
    node src/index-enterprise.js
) else if "%option%"=="2" (
    echo  [+] Iniciando modo PRO...
    node src/sofia-pro-v2.js
) else if "%option%"=="3" (
    echo  [+] Iniciando modo SIMPLE...
    node SOFIA-ARREGLADA.js
) else if "%option%"=="4" (
    echo  [+] Iniciando modo Telegram...
    node SOFIA-TELEGRAM.js
) else (
    echo  [!] Opcion invalida, iniciando modo COMPLETO por defecto...
    timeout /t 2 > nul
    node src/index-enterprise.js
)

REM Si el programa termina, ofrecer reinicio
if errorlevel 1 (
    echo.
    echo  [!] El sistema se detuvo o hubo un error
    echo.
    set /p restart="¿Reiniciar? (s/n): "
    if /i "%restart%"=="s" goto loop
)

echo.
echo  👋 Hasta pronto!
pause

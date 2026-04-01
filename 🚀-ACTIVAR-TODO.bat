@echo off
chcp 65001 > nul
cls
color 0A

echo.
echo ═══════════════════════════════════════════════════════════════
echo ║                                                               ║
echo ║              🚀 ACTIVANDO TODOS LOS SISTEMAS                  ║
echo ║                   NOVA AI v10.0                                ║
echo ║                                                               ║
echo ╚══════════════════════════════════════════════════════════════
echo.

:: Verificar Node.js
echo 📦 Verificando Node.js...
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no encontrado
    echo 🌐 Descarga desde: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo ✅ Node.js %NODE_VERSION%

:: Verificar Git
echo 🔧 Verificando Git...
git --version > nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Git no encontrado
    echo 🌐 Descarga desde: https://git-scm.com
    pause
    exit /b 1
)
echo ✅ Git detectado

:: Crear .env si no existe
echo ⚙️ Verificando configuración...
if not exist ".env" (
    echo ⚠️ Archivo .env no encontrado
    echo 📄 Creando desde .env.example...
    copy .env.example .env
    echo ⚠️ IMPORTANTE: Edita el archivo .env con tus tokens
    echo 📝 Presiona cualquier tecla cuando hayas configurado .env
    pause
    notepad .env
    pause
)

:: Instalar dependencias
echo 📦 Verificando dependencias...
if not exist "node_modules" (
    echo 📥 Instalando por primera vez...
    npm install
    echo ✅ Dependencias instaladas
) else (
    echo ✅ Dependencias listas
)

:: Verificar estructura de carpetas
echo 📂 Verificando estructura...
if not exist "data\sessions" mkdir "data\sessions"
if not exist "data\backups" mkdir "data\backups"
if not exist "logs" mkdir "logs"
echo ✅ Estructura lista

:: Mostrar menú
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                SELECCIONA MODO DE INICIO                    ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║   [1] 🚀 MODO COMPLETO (Ultra Master + Todo)              ║
echo ║   [2] 🤖 Solo Telegram Bot                                ║
echo ║   [3] 💬 Solo WhatsApp                                      ║
echo ║   [4] ⏱️  GitHub Auto-Sync (background)                    ║
echo ║   [5] 🔧 Configuración                                      ║
echo ║   [6] 📊 Diagnóstico                                        ║
echo ║                                                            ║
echo ║   [0] ❌ Salir                                             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set /p choice="Selecciona opción (0-6): "

if "%choice%"=="1" goto :ULTRA
if "%choice%"=="2" goto :TELEGRAM
if "%choice%"=="3" goto :WHATSAPP
if "%choice%"=="4" goto :SYNC
if "%choice%"=="5" goto :CONFIG
if "%choice%"=="6" goto :DIAG
if "%choice%"=="0" goto :EXIT
goto :INVALID

:ULTRA
echo.
echo 🚀 Iniciando NOVA AI ULTRA MASTER...
echo 🎨 Todos los sistemas activos
node scripts/activate-all-systems.js
pause
goto :MENU

:TELEGRAM
echo.
echo 🤖 Iniciando solo Telegram...
node src/adapters/telegram-bot.js
pause
goto :MENU

:WHATSAPP
echo.
echo 💬 Iniciando solo WhatsApp...
node src/adapters/whatsapp.js
pause
goto :MENU

:SYNC
echo.
echo ⏱️ Iniciando GitHub Auto-Sync...
echo 🔄 Se harán commits automáticos cada 10 minutos
start /b node scripts/github-auto-sync.js
echo ✅ Auto-Sync corriendo en background
echo 📝 Revisa logs en: logs/github-sync.log
timeout /t 3 > nul
goto :MENU

:CONFIG
echo.
echo 🔧 Abriendo configuración...
notepad .env
cls
goto :MENU

:DIAG
echo.
echo 📊 Ejecutando diagnóstico completo...
node scripts/verify-fixes.js
pause
goto :MENU

:INVALID
echo ❌ Opción inválida
timeout /t 2 > nul
cls
goto :MENU

:EXIT
echo.
echo 👋 Saliendo...
timeout /t 1 > nul
exit /b 0

:MENU
cls
goto :MENU_START

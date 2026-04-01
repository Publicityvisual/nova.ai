@echo off
chcp 65001 > nul
cls

echo ═══════════════════════════════════════════════════════════════
echo ║                                                               ║
echo ║       🤖 NOVA ULTRA v10.0 - SISTEMA 24/7/365                  ║
echo ║                                                               ║
echo ║       🔓 Sin Censura • Anti-Ban • Auto-Repair                ║
echo ║       💪 Siempre Activo • NSFW Friendly                      ║
echo ║                                                               ║
echo ═══════════════════════════════════════════════════════════════
echo.

:: Verificar Node.js
call node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado
    echo 🌐 Descarga: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js detectado

:: Verificar variables de entorno
if not exist ".env" (
    echo ⚠️  ADVERTENCIA: .env no encontrado
    echo 📝 Usando configuración por defecto
)

:: Crear carpetas necesarias
if not exist "data\sessions" mkdir "data\sessions" 2> nul
if not exist "logs" mkdir "logs" 2> nul

echo ✅ Carpetas de datos verificadas

:: Menu de opciones
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    MODO DE EJECUCIÓN                      ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║   [1] 🚀 MODO ULTRA - Sistema 24/7 completo                ║
echo ║       • Anti-ban activado                                  ║
echo ║       • Auto-repair system                                 ║
echo ║       • Reinicio automático                              ║
echo ║       • Sin censura completo                               ║
echo ║                                                            ║
echo ║   [2] 🤖 Nova Enterprise - Sólo WhatsApp                  ║
echo ║       • Bot empresarial único                              ║
echo ║                                                            ║
echo ║   [3] 📱 Telegram Bot - Sin WhatsApp                     ║
echo ║       • Solo respuestas Telegram                           ║
echo ║                                                            ║
echo ║   [4] 🔧 Modo Diagnóstico                                 ║
echo ║       • Verificar sistema completo                         ║
echo ║                                                            ║
echo ║   [5] ⏹️  Detener Sistema                                  ║
echo ║       • Cerrar todos los procesos Nova                     ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set /p choice="Selecciona opción (1-5): "

if "%choice%"=="1" goto :ULTRA
if "%choice%"=="2" goto :ENTERPRISE
if "%choice%"=="3" goto :TELEGRAM
if "%choice%"=="4" goto :DIAGNOSTICO
if "%choice%"=="5" goto :STOP

goto :INVALID

:ULTRA
echo.
echo 🚀 INICIANDO MODO ULTRA 24/7...
echo 🔓 Censura: DESACTIVADA
echo 🛡️ Anti-Ban: ACTIVADO
echo 🔧 Auto-Repair: ACTIVADO
echo.
node scripts/always-on.js --all
goto :END

:ENTERPRISE
echo.
echo 🤖 INICIANDO NOVA ENTERPRISE...
node src/index-enterprise.js
goto :END

:TELEGRAM
echo.
echo 📱 INICIANDO SOLO TELEGRAM...
node src/telegram-bot.js
goto :END

:DIAGNOSTICO
echo.
echo 🔧 EJECUTANDO DIAGNÓSTICO COMPLETO...
echo.
echo 📋 Verificando dependencias...
call npm list --depth=0 2> nul
if errorlevel 1 (
    echo ❌ Faltan dependencias. Instalando...
    call npm install
)

echo.
echo 📋 Verificando skills...
node -e "console.log('✅ Skills disponibles:', require('fs').readdirSync('src/skills/built-in').filter(f=>f.endsWith('.js')).join(', '))"

echo.
echo 📋 Verificando archivos core...
for %%f in (src/index-enterprise.js src/core/anti-ban-system.js src/core/auto-repair.js src/core/uncensored-mode.js) do (
    if exist "%%f" (
        echo ✅ %%f
    ) else (
        echo ❌ %%f FALTANTE
    )
)

echo.
echo 📊 DIAGNÓSTICO COMPLETADO
echo.
pause
goto :END

:STOP
echo.
echo ⏹️  DETENIENDO SISTEMA NOVA...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *Nova*" 2> nul
taskkill /F /IM node.exe 2> nul
echo ✅ Todos los procesos detenidos
goto :END

:INVALID
echo ❌ Opción inválida
timeout /t 2 > nul
goto :END

:END
echo.
echo 👋 Sistema detenido. Presiona cualquier tecla para salir...
pause > nul

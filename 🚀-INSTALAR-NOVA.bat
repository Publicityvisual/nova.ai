@echo off
chcp 65001 >nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║   🤖 NOVA v9.0 - Instalación Ultra-Simple                      ║
echo ║                                                                ║
echo ║   Abre la página de configuración automáticamente              ║
echo ║                                                                ║
╚════════════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo.
    echo Instalando Node.js automáticamente...
    echo.
    
    :: Descargar e instalar Node.js silenciosamente
    curl -L -o node-installer.msi "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    
    echo ℹ️  Instalando Node.js (siguiente, siguiente, siguiente)...
    start /wait msiexec /i node-installer.msi /passive
    
    del node-installer.msi
    
    echo ✅ Node.js instalado. Por favor reinicia esta ventana de CMD.
    pause
    exit /b
)

cd /d "%~dp0"

:: Verificar si ya está configurado
if exist "nova-configurado.txt" (
    echo ✅ NOVA ya está configurado
    echo.
    echo [1] ☁️  Iniciar en modo Cloud (24/7)
    echo [2] 💻 Iniciar en modo Local (ahora)
    echo [3] 🔧 Reconfigurar
    echo.
    set /p opcion="Opción (1-3): "
    
    if "%opcion%"=="1" goto cloud
    if "%opcion%"=="2" goto local
    if "%opcion%"=="3" goto configurar
    goto fin
)

:: Primera vez - Abrir configurador
:configurar
echo 🚀 Abriendo configurador web...
echo.
echo ℹ️  Se abrirá tu navegador. Solo necesitas:
echo    1. Token de Telegram (de @BotFather)
echo    2. API Key de OpenRouter (gratis)
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

:: Abrir el HTML en el navegador predeterminado
start NOVA-SIMPLE.html

echo.
echo ✅ Configurador abierto.
echo.
echo Sigue las instrucciones en la página web.
echo.
echo Cuando descargues tus archivos:
echo   • Guarda nova-cloud.js en esta carpeta
echo   • o Guarda nova-local.js para probar ahora
pause

:: Crear archivo de control
echo. > nova-configurado.txt
echo. > nova-configurado.txt
echo NOVA-CONFIGURADO=true >> nova-configurado.txt
echo FECHA=%date% %time% >> nova-configurado.txt

goto fin

:cloud
echo.
echo ☁️  Preparando Cloudflare Workers...
echo.

:: Verificar wrangler
npx wrangler --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando wrangler...
    npm install -g wrangler
)

echo 🔐 Verificando login...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo.
    echo 🔐 Necesitas hacer login en Cloudflare.
    echo Se abrirá tu navegador...
    pause
    wrangler login
)

echo.
echo 🚀 Desplegando NOVA...
wrangler deploy nova-cloud.js

echo.
echo ✅ ¡HECHO!
echo.
echo Tu NOVA está online 24/7.
echo Abre Telegram y escribele a tu bot.
pause
goto fin

:local
echo.
echo 💻 Modo Local - Iniciando ahora...
echo.

:: Verificar que existe el archivo
if not exist "nova-local.js" (
    echo ❌ No se encontró nova-local.js
    echo ℹ️  Primero debes configurar NOVA (opción 3)
    pause
    goto fin
)

echo 🚀 Iniciando NOVA...
echo Presiona Ctrl+C para detener
echo.

node nova-local.js

pause
goto fin

:fin
echo.
echo ¡Gracias por usar NOVA! 🤖
echo.
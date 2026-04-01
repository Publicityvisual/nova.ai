@echo off
chcp 65001>nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║   🤖 NOVA OPENCLAW v9.0                                        ║
echo ║   Sin censura ^| Cloud 24/7 ^| Multimodal                      ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no instalado
    echo Ve a https://nodejs.org y descarga LTS
    pause
    exit /b
)

:: Ir al directorio correcto
cd /d "%~dp0"

:: Verificar .env
if not exist .env (
    echo ⚙️  Primera vez: Configurando...
    node scripts/setup-openclaw.js
    echo.
    echo 📖 Para iniciar después de configurar:
    echo    1. Opción Cloud: Ejecuta 🚀-DEPLOY-CLOUD.bat
    echo    2. Opción Local: Ejecuta 🚀-INICIAR-OPENCLAW.bat
    pause
    exit /b
)

:: Menú principal
echo 💡 Elegir modo:
echo.
echo   [1] ☁️  Cloud (Recomendado - 24/7 sin PC)
echo   [2] 💻 Local (Tu PC debe estar prendida)
echo   [3] 🧪 Probar (Modo dev local)
echo   [4] 📋 Ver logs cloud
echo   [5] ⚙️  Reconfigurar
echo.
set /p opcion="Opción (1-5): "

if "%opcion%"=="1" goto cloud
if "%opcion%"=="2" goto local
if "%opcion%"=="3" goto dev
if "%opcion%"=="4" goto logs
if "%opcion%"=="5" goto setup

:cloud
cls
echo ☁️  Deployment a Cloudflare (24/7)
echo.
echo Verificando login...
npx wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 Necesitas hacer login:
    npx wrangler login
)
echo.
echo 📦 Creando KV namespace si no existe...
npx wrangler kv:namespace list | findstr "NOVA_KV" >nul || npx wrangler kv:namespace create "NOVA_KV"
echo.
echo 🔐 Verificando secrets...
npx wrangler secret list | findstr "TELEGRAM" >nul || (
    echo Agregando secreto TELEGRAM_BOT_TOKEN...
    npx wrangler secret put TELEGRAM_BOT_TOKEN
)
npx wrangler secret list | findstr "OPENROUTER" >nul || (
    echo Agregando secreto OPENROUTER_API_KEY...
    npx wrangler secret put OPENROUTER_API_KEY
)
echo.
echo 🚀 Desplegando...
npx wrangler deploy --env production
echo.
echo ✅ Hecho! Configurando webhook...
for /f "tokens=2 delims==" %%a in ('findstr "^name" wrangler.toml') do set WORKER=%%a
set WORKER=%WORKER:"=%
curl -X POST "https://%WORKER%.djkov.workers.dev/setup" 2>nul || echo 💡 Configura manualmente el webhook
echo.
echo 🌐 Tu bot está online 24/7 en Telegram!
pause
exit /b

:local
cls
echo 💻 Modo Local (tu PC debe estar encendida)
echo.
echo Descomentando sección local...
powershell -Command "(Get-Content NOVA-OPENCLAW.js) -replace '\/\*', '' -replace '\*\/', '' | Set-Content NOVA-OPENCLAW-temp.js"
echo Iniciando polling...
node NOVA-OPENCLAW-temp.js
del NOVA-OPENCLAW-temp.js 2>nul
pause
exit /b

:dev
cls
echo 🧪 Modo Dev Local
npx wrangler dev
pause
exit /b

:logs
cls
echo 📋 Logs en tiempo real (Ctrl+C para salir)
npx wrangler tail --env production
pause
exit /b

:setup
call node scripts/setup-openclaw.js
pause
exit /b
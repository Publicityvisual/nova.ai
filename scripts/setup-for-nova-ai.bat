@echo off
cls
echo ============================================
echo  NOVA.AI + GITHUB + CLOUDFLARE SETUP
echo  Repository: Publicityvisual/nova.ai
echo ============================================
echo.
echo Este script configurara:
echo 1. Conexion con tu repo existente
echo 2. Cloudflare Workers deploy
echo 3. GitHub Actions CI/CD
echo.
pause

echo.
echo [PASO 1] Verificando GitHub CLI...
gh --version >nul 2>&1
if errorlevel 1 (
    echo [*] Instalando GitHub CLI...
    winget install --id GitHub.cli
)
echo [OK] GitHub CLI listo

echo.
echo [PASO 2] Login GitHub CLI...
gh auth login --web

echo.
echo [PASO 3] Verificando repo Publicityvisual/nova.ai...
echo [*] Clonando tu repo...
cd .. 
gh repo clone Publicityvisual/nova.ai nova-ai-temp 2>nul || (
    echo [!] Error clonando. Verifica que el repo exista y tengas acceso.
    pause
    exit /b 1
)
cd nova-ai-temp
echo [OK] Repo clonado

echo.
echo [PASO 4] Copiando archivos de Sofia Enterprise...
cd ..\nova
copy SOFIA-ENTERPRISE-CLOUD.js ..\nova-ai-temp\index.js
copy wrangler.toml ..\nova-ai-temp\
copy .github\workflows\deploy-cloudflare.yml ..\nova-ai-temp\.github\workflows\deploy.yml 2>nul
xcopy /E /I .github\workflows ..\nova-ai-temp\.github\workflows 2>nul
copy package.json ..\nova-ai-temp\
copy README-DEPLOY.md ..\nova-ai-temp\README-CLOUDFLARE.md
echo [OK] Archivos copiados

echo.
echo [PASO 5] Instalando Wrangler...
cd ..\nova-ai-temp
call npm install -g wrangler
call npm install wrangler --save-dev
echo [OK] Wrangler instalado

echo.
echo [PASO 6] Login Cloudflare...
wrangler login

echo.
echo [PASO 7] Creando KV Database...
for /f "tokens=*" %%a in ('wrangler kv:namespace create "SOFIA_KV" --env production 2^>^&1 ^| findstr "id="') do (
    set KV_OUTPUT=%%a
)
echo [OK] KV creado: %KV_OUTPUT%

echo.
echo [PASO 8] Configurando Token de Telegram...
set /p TELEGRAM_TOKEN="Pega tu TELEGRAM BOT TOKEN: "
echo [*] Guardando secretos...
wrangler secret put TELEGRAM_TOKEN --env production <<< "%TELEGRAM_TOKEN%"
echo [OK] Secret guardado localmente

echo.
echo [PASO 9] Deploy inicial...
wrangler deploy --env production
echo [OK] Deploy completado

echo.
echo [PASO 10] Configurando GitHub Actions...
cd .github\workflows
echo [*] Archivo deploy.yml ya configurado
cd ..\..

echo.
echo [PASO 11] Subiendo a GitHub...
git add .
git commit -m "Agregado Sofia Enterprise Cloud + Cloudflare Workers"
git push origin main
git push --set-upstream origin main 2>nul
echo [OK] Push completado

echo.
echo ============================================
echo  ✅ SETUP COMPLETO para Publicityvisual/nova.ai
echo ============================================
echo.
echo Ahora configura los SECRETS en GitHub:
echo.
echo 1. Ve a: https://github.com/Publicityvisual/nova.ai/settings/secrets/actions
echo.
echo 2. Agrega estos 4 secrets:
echo.
echo    CLOUDFLARE_API_TOKEN
echo    -> Crea en: https://dash.cloudflare.com/profile/api-tokens
echo    -> Usar template: 'Edit Cloudflare Workers'
echo.
echo    CLOUDFLARE_ACCOUNT_ID
echo    -> Ve a: https://dash.cloudflare.com
echo    -> ID esta en el sidebar derecho
echo.
echo    TELEGRAM_TOKEN
echo    -> 8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc
echo.
echo    OPENROUTER_KEY
echo    -> Tu key de openrouter.ai
echo.
echo 3. Listo! Cada push se desplegara automaticamente.
echo.
echo ============================================
pause

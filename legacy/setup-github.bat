@echo off
echo ============================================
echo  SOFIA ENTERPRISE + GITHUB + CLOUDFLARE
echo  Setup Automatico de Despliegue CI/CD
echo ============================================
echo.
echo [PASO 1] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [!] ERROR: Git no instalado
    echo [*] Descarga desde: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [OK] Git detectado

echo.
echo [PASO 2] Inicializando repositorio Git...
git init
git add .
git commit -m "Sofia Enterprise v9.0 - Initial commit"
echo [OK] Repo inicializado

echo.
echo [PASO 3] Verificando Wrangler...
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo [*] Instalando Wrangler...
    npm install -g wrangler
)
echo [OK] Wrangler listo

echo.
echo [PASO 4] Login en Cloudflare...
echo [*] Se abrira el navegador para autorizar...
wrangler login

echo.
echo [PASO 5] Creando KV Database...
wrangler kv:namespace create "SOFIA_KV" --env production > kv_output.txt 2>&1
for /f "tokens=*" %%a in ('findstr /C:"id=" kv_output.txt') do (
    set KV_LINE=%%a
)
for /f "tokens=2 delims=\"" %%a in ("%KV_LINE%") do (
    set KV_ID=%%a
)
echo [OK] KV creado ID: %KV_ID%

echo.
echo [PASO 6] Configurando secrets locales...
set /p TELEGRAM_TOKEN="Pega tu TELEGRAM TOKEN: "
set /p OPENROUTER_KEY="Pega tu OPENROUTER KEY: "

echo [*] Guardando secretos...
wrangler secret put TELEGRAM_TOKEN --env production <<< "%TELEGRAM_TOKEN%"
wrangler secret put OPENROUTER_KEY --env production <<< "%OPENROUTER_KEY%"

echo.
echo [PASO 7] Actualizando wrangler.toml...
powershell -Command "(Get-Content wrangler.toml) -replace 'SOFIA_KV_ID', '%KV_ID%' | Set-Content wrangler.toml"
echo [OK] wrangler.toml actualizado

echo.
echo [PASO 8] Deploy inicial...
wrangler deploy --env production

echo.
echo ============================================
echo  ✅ SETUP COMPLETO
echo ============================================
echo.
echo Pasos finales para GitHub Actions:
echo.
echo 1. Crea repo en GitHub:
echo    https://github.com/new
echo.
echo 2. Conecta tu repo:
echo    git remote add origin https://github.com/TUUSER/sofia-enterprise.git
set /p GITHUB_USER="Tu usuario de GitHub: "
set /p REPO_NAME="Nombre del repo (sofia-enterprise): "
if "%REPO_NAME%"=="" set REPO_NAME=sofia-enterprise

git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git 2>nul
git branch -M main
git push -u origin main

echo.
echo 3. Configura Secrets en GitHub:
echo    Ve a: https://github.com/%GITHUB_USER%/%REPO_NAME%/settings/secrets/actions
echo.
echo    Agrega estos secrets:
echo    - CLOUDFLARE_API_TOKEN    (Crea en https://dash.cloudflare.com/profile/api-tokens)
echo    - CLOUDFLARE_ACCOUNT_ID   (ID de tu cuenta, visible en dashboard)
echo    - TELEGRAM_TOKEN          (ya lo tienes)
echo    - OPENROUTER_KEY          (ya lo tienes)
echo.
echo 4. Listo! Cada push a main se desplegara automaticamente.
echo.
echo ============================================
pause

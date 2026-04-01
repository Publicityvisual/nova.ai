@echo off
cd /d "%~dp0"
title 🔒 Verificador de Seguridad - NOVA AI

color 0C
cls

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║         🔒 VERIFICADOR DE SEGURIDAD NOVA AI              ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

set "TOKENS_FOUND=0"
set "ENV_EXISTS=0"

echo  [+] Verificando configuracion de seguridad...
echo.

REM Verificar si existe .env
if exist ".env" (
    echo  [✓] Archivo .env encontrado
    set "ENV_EXISTS=1"
) else (
    echo  [!] ALERTA: No existe archivo .env
    echo  [*] Copia .env.example a .env y configura tus tokens
)

REM Verificar tokens hardcodeados en archivos JS
echo.
echo  [+] Buscando tokens expuestos en codigo fuente...
echo.

findstr /s /i "8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc" *.js > nul 2>&1
if not errorlevel 1 (
    echo  [!] WARNING: Token de Telegram hardcodeado encontrado en archivos .js
    set /a TOKENS_FOUND+=1
)

findstr /s /i "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" *.js > nul 2>&1
if not errorlevel 1 (
    echo  [!] WARNING: API Key de OpenRouter hardcodeada encontrada en archivos .js
    set /a TOKENS_FOUND+=1
)

REM Mostrar archivos con problemas
echo.
echo  [+] Detalle de archivos con tokens expuestos:
echo  ═══════════════════════════════════════════════════════════
findstr /s /m /i "8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc" *.js 2> nul
echo  ═══════════════════════════════════════════════════════════

echo.
if %TOKENS_FOUND% GTR 0 (
    echo  [!] SE ENCONTRARON %TOKENS_FOUND% TOKEN(S) HARDCODEADO(S)
    echo.
    echo  💡 RECOMENDACIONES:
    echo     1. Mueve todos los tokens al archivo .env
    echo     2. Usa: process.env.TELEGRAM_TOKEN en lugar de hardcodear
    echo     3. Agrega .env a tu .gitignore
    echo     4. Nunca subas tokens a GitHub
    echo.
    echo  [*] Ejemplo de codigo seguro:
    echo     const TOKEN = process.env.TELEGRAM_TOKEN;
    echo.
) else (
    echo  [✓] No se encontraron tokens hardcodeados
)

if %ENV_EXISTS%==0 (
    echo.
    echo  [!] ACCION REQUERIDA:
    echo     El archivo .env no existe. Creando .env.example...
    call :createEnvExample
)

echo.
echo  ═══════════════════════════════════════════════════════════
pause
exit /b

:createEnvExample
echo # Configuracion de NOVA AI > .env.example
echo # Copia este archivo a .env y configura tus tokens >> .env.example
echo. >> .env.example
echo # Telegram Bot Token (obtenlo de @BotFather) >> .env.example
echo TELEGRAM_BOT_TOKEN=tu_token_aqui >> .env.example
echo. >> .env.example
echo # OpenRouter API Key (obtenlo de openrouter.ai) >> .env.example
echo OPENROUTER_API_KEY=tu_key_aqui >> .env.example
echo. >> .env.example
echo # WhatsApp Number (con codigo de pais) >> .env.example
echo OWNER_NUMBER=5210000000000 >> .env.example
echo. >> .env.example
echo # Configuracion >> .env.example
echo NODE_ENV=production >> .env.example
echo BOT_NAME=Sofia >> .env.example
echo  [✓] Archivo .env.example creado
exit /b

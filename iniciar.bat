@echo off
chcp 65001 >nul
echo ==========================================
echo   WhatsApp + Claude Code - Inicio Rapido
echo ==========================================
echo.
echo Este script inicia el servidor WhatsApp
echo.
echo [1] Iniciar solo servidor WhatsApp
echo [2] Iniciar en modo desarrollo (con reinicio automatico)
echo [3] Ver instrucciones
echo [4] Salir
echo.
set /p choice="Selecciona opcion: "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto dev
if "%choice%"=="3" goto instructions
if "%choice%"=="4" goto end

:start
cd /d C:\Users\djkov\whatsapp-claude-mcp
echo.
echo Iniciando servidor WhatsApp...
echo Espera a que aparezca el QR code y escanearlo con tu telefono
echo.
node server.js
pause
goto end

:dev
cd /d C:\Users\djkov\whatsapp-claude-mcp
echo.
echo Iniciando en modo desarrollo...
npm run dev
pause
goto end

:instructions
echo.
echo INSTRUCCIONES:
echo 1. Inicia el servidor (opcion 1)
echo 2. Espera a ver el QR code en la terminal
echo 3. En tu telefono, abre WhatsApp:
echo    - Android: Menu vinculados - Vincular dispositivo
echo    - iPhone: Configuracion - WhatsApp Web - Escanear
echo 4. Escanea el QR code
echo 5. Listo! WhatsApp conectado a Claude Code
echo.
echo Comandos disponibles en Claude:
echo - "Listar mis chats de WhatsApp"
echo - "Enviar mensaje a [numero]"
echo - "Buscar contacto [nombre]"
echo - "Ver mensajes de [chat]"
echo.
pause
goto end

:end

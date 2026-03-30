@echo off
chcp 65001 >nul
echo ==========================================
echo   🤖 NOVA ULTRA v2.0 - ACTIVADOR
echo ==========================================
echo.
echo Iniciando Nova AI con todas las funciones...
echo.

REM Verificar node_modules
if not exist node_modules (
    echo Instalando dependencias...
    npm install
)

REM Iniciar
echo.
echo ✅ Abriendo WhatsApp QR en navegador...
echo ✅ AI Sin Censura: ACTIVADO
echo ✅ Auto-Commit GitHub: ACTIVADO
echo ✅ HubbaX Integration: ACTIVADO
echo.
echo Esperando conexión de WhatsApp...
echo.

npm start

pause

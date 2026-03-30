@echo off
cd /d "C:\Users\djkov\CascadeProjects\nova"
title NOVA ULTRA - Iniciando...
cls
echo.
echo  ============================================
echo    NOVA ULTRA v2.0 - Better than OpenClaw
echo  ============================================
echo.

if not exist node_modules (
    echo  [INFO] Instalando dependencias primera vez...
    npm install
    echo.
)

echo  [1] Iniciando Nova...
echo  [2] Esperando QR (10-20 segundos)...
echo.

start /B node src/index.js

:wait
if not exist QR-WHATSAPP.html (
    timeout /t 2 /nobreak > nul
    goto wait
)

echo  [3] Abriendo QR en navegador...
start "" "QR-WHATSAPP.html"

echo.
echo  ============================================
echo  INSTRUCCIONES:
echo  1. Ve a WhatsApp en tu telefono
echo  2. 3 puntos -> Dispositivos vinculados
echo  3. Escanear el codigo QR
echo  4. ¡Listo! Nova respondera a tus mensajes
echo  ============================================
echo.
echo  Esta ventana se queda abierta. NO CERRAR.
echo  Para detener: Cierra esta ventana
pause > nul

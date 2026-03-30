@echo off
cd /d "C:\Users\djkov\CascadeProjects\nova"
cls
echo ==========================================
echo    NOVA ULTRA v2.0 - INICIANDO
echo    Better than OpenClaw
echo ==========================================
echo.
echo [1] Verificando archivos...
echo.

if not exist node_modules (
    echo [!] Instalando dependencias (primera vez)...
    npm install
    echo.
)

echo [2] Iniciando Nova en modo PERMANENTE...
echo [3] Espera el QR en el archivo HTML...
echo.
echo ==========================================
echo    INSTRUCCIONES RAPIDAS:
echo ==========================================
echo 1. Nova se iniciara automaticamente
echo 2. Espera 10-20 segundos
echo 3. Abre QR-WHATSAPP.html (se crea solo)
echo 4. Escanear con WhatsApp
echo 5. Listo! Nova responde a todos los mensajes
echo ==========================================
echo.
echo Presiona cualquier tecla para iniciar...
@echo off
pause > nul

cls
echo ==========================================
echo    NOVA ESTA CORRIENDO...
echo ==========================================
echo NO CIERRES ESTA VENTANA
echo.
echo Cuando quieras detener: Ctrl+C
echo.

:loop
node src/index.js
echo.
echo [!] Nova se ha detenido. Reiniciando en 3 segundos...
timeout /t 3 /nobreak > nul
goto loop

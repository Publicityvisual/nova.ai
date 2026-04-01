@echo off
cd /d "%~dp0"
title SOFIA v6.0 - Version Arreglada

color 0A
cls

echo.
echo  =======================================
echo    SOFIA v6.0 - VERSION ARREGLADA
echo  =======================================
echo.
echo  Esta version deberia responder
echo.
echo  Iniciando...
timeout /t 2 > nul
cls

echo.
echo  =======================================
echo    SOFIA ACTIVA
echo  =======================================
echo.
echo  Esperando mensajes de Telegram...
echo.

node SOFIA-ARREGLADA.js

echo.
echo  Presiona cualquier tecla para cerrar...
pause > nul

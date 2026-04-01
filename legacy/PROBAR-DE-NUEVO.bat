@echo off
cd /d "%~dp0"
title PROBANDO SOFIA - Version Basica

color 0A
cls

echo.
echo  =======================================
echo    PROBANDO SOFIA VERSION BASICA
echo  =======================================
echo.
echo  Esta version SOLO responde /start
echo  Si esto funciona, ya sabemos el problema
echo.
echo  Iniciando...
timeout /t 2 > nul
cls

echo.
echo  =======================================
echo    SOFIA BASICA ACTIVA
echo  =======================================
echo.
echo  VE A TELEGRAM AHORA:
echo.
echo  1. Abre @sofiaasistentes_bot
echo  2. Escribe /start
echo  3. Espera 5 segundos
echo  4. Deberia responder Sofia
echo.
echo  Si esta ventana muestra "Mensaje recibido"
echo  significa que SI esta funcionando
echo.
echo  =======================================
echo.

node SOFIA-BASICA.js

echo.
echo  Presiona cualquier tecla para cerrar...
pause > nul

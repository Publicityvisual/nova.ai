@echo off
chcp 65001 > nul
cls

echo ╔══════════════════════════════════════════════════════════╗
echo ║  VERIFICACIÓN DE SEGURIDAD - NOVA AI WHATSAPP             ║
echo ║  Anti-Baneo v6.0                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

set "SEGURA=1"

:: Verificar .env
if not exist "..\.env" (
    echo ❌ ERROR: No existe archivo .env
    echo    Crea el archivo con:
    echo    HUMAN_MODE=true
    echo    MAX_MSG_PER_MIN=15
    echo    MAX_MSG_PER_HOUR=100
    set "SEGURA=0"
    goto :fin
)

echo [*] Verificando configuración anti-baneo...
echo.

:: Leer configuraciones del .env
for /f "tokens=*" %%a in ('type ..\.env 2^>^nul') do (
    echo %%a | findstr /i "HUMAN_MODE" > nul && set "LINEA_HUMAN=%%a"
    echo %%a | findstr /i "MAX_MSG_PER_MIN" > nul && set "LINEA_MPM=%%a"
    echo %%a | findstr /i "MAX_MSG_PER_HOUR" > nul && set "LINEA_MPH=%%a"
)

:: Verificar HUMAN_MODE
echo %LINEA_HUMAN% | findstr /i "true" > nul
if %ERRORLEVEL% equ 0 (
    echo [OK] ✅ HUMAN_MODE activado
) else (
    echo [!] ⚠️  HUMAN_MODE no está activado
    echo    Recomendado: HUMAN_MODE=true
)

:: Verificar límites
echo.
echo [*] Verificando límites de mensajes...
echo.

if defined LINEA_MPM (
    echo %LINEA_MPM% | findstr "[0-9]" > nul
    for /f "tokens=2 delims==" %%a in ("%LINEA_MPM%") do (
        set "VAL_MPM=%%a"
        set "VAL_MPM=!VAL_MPM: =!"
    )
    
    if !VAL_MPM! leq 20 (
        echo [OK] ✅ MAX_MSG_PER_MIN: !VAL_MPM! (Seguro)
    ) else (
        echo [!] ⚠️  MAX_MSG_PER_MIN muy alto: !VAL_MPM!
        echo    Recomendado: ≤ 20
        set "SEGURA=0"
    )
) else (
    echo [!] ⚠️  MAX_MSG_PER_MIN no definido
    echo    Usando default: 20
)

if defined LINEA_MPH (
    for /f "tokens=2 delims==" %%a in ("%LINEA_MPH%") do (
        set "VAL_MPH=%%a"
        set "VAL_MPH=!VAL_MPH: =!"
    )
    
    if !VAL_MPH! leq 200 (
        echo [OK] ✅ MAX_MSG_PER_HOUR: !VAL_MPH! (Seguro)
    ) else (
        echo [!] ⚠️  MAX_MSG_PER_HOUR muy alto: !VAL_MPH!
        echo    Recomendado: ≤ 200
        set "SEGURA=0"
    )
) else (
    echo [!] ⚠️  MAX_MSG_PER_HOUR no definido
    echo    Usando default: 200
)

:fin
echo.
echo ═══════════════════════════════════════════════════════════
echo.

if %SEGURA% equ 1 (
    echo ✅ SISTEMA SEGURO PARA WHATSAPP
    echo.
    echo Puedes iniciar el bot con:
    echo   npm start
    exit /b 0
) else (
    echo ❌ NO ES SEGURO INICIAR
    echo.
    echo Corrige los problemas antes de continuar.
    echo Lee: docs/PROTECCION-ANTI-BANEO.md
    exit /b 1
)
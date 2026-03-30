@echo off
chcp 65001 >nul
cls

echo ========================================================
echo              🦾 NOVA ULTRA v2.0.0
echo                Platform Launcher
echo ========================================================
echo.
echo Configurando plataformas...
echo.

if not exist .env (
    echo ⚠️ Archivo .env no encontrado
    echo Creando desde template...
    copy .env.example .env > nul
    echo ✅ .env creado
    echo.
    echo POR FAVOR EDITA .env con tus tokens:
    echo   - TELEGRAM_BOT_TOKEN (de @BotFather)
    echo   - DISCORD_BOT_TOKEN (de discord.com/developers)
    echo   - SLACK tokens
    echo.
    pause
    notepad .env
)

echo.
echo 📱 Plataformas disponibles:
echo   ✅ WhatsApp - SIEMPRE activo

findstr "TELEGRAM_BOT_TOKEN" .env > nul && echo   ✅ Telegram - Configurado || echo   ⏸ Telegram - Sin configurar
echo       (Ver PLATFORMS-GUIDE.md)

findstr "DISCORD_BOT_TOKEN" .env > nul && echo   ✅ Discord - Configurado || echo   ⏸ Discord - Sin configurar

findstr "SLACK_BOT_TOKEN" .env > nul && echo   ✅ Slack - Configurado || echo   ⏸ Slack - Sin configurar

echo.
echo ========================================================
echo Iniciando Nova Ultra...
echo ========================================================
echo.

node src/index.js

pause

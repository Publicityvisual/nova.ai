#!/bin/bash

# Nova Ultra Platform Launcher
# Linux/Mac

echo ""
echo "========================================================"
echo "              🦾 NOVA ULTRA v2.0.0"
echo "                Platform Launcher"
echo "========================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado"
    echo "Creando desde template..."
    cp .env.example .env
    echo "✅ .env creado"
    echo ""
    echo "Edita .env con tus tokens:"
    echo "  export TELEGRAM_BOT_TOKEN=xxx (de @BotFather)"
    echo "  export DISCORD_BOT_TOKEN=xxx (de discord.com/developers)"
    echo ""
    
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    fi
fi

echo ""
echo "📱 Plataformas disponibles:"
echo "  ✅ WhatsApp - SIEMPRE activo"

if grep -q "TELEGRAM_BOT_TOKEN=" .env 2>/dev/null; then
    echo -e "  ${GREEN}✅ Telegram${NC} - Configurado"
else
    echo -e "  ${YELLOW}⏸ Telegram${NC} - Sin configurar"
    echo "      (Ver PLATFORMS-GUIDE.md)"
fi

if grep -q "DISCORD_BOT_TOKEN=" .env 2>/dev/null; then
    echo -e "  ${GREEN}✅ Discord${NC} - Configurado"
else
    echo -e "  ${YELLOW}⏸ Discord${NC} - Sin configurar"
fi

if grep -q "SLACK_BOT_TOKEN=" .env 2>/dev/null; then
    echo -e "  ${GREEN}✅ Slack${NC} - Configurado"
else
    echo -e "  ${YELLOW}⏸ Slack${NC} - Sin configurar"
fi

echo ""
echo "========================================================"
echo "Iniciando Nova Ultra..."
echo "========================================================"
echo ""

npm start

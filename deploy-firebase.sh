#!/bin/bash
#
# 🔥 FACEBOOK DEPLOY SCRIPT
# Despliegue automático a Firebase con un comando
#

echo "🔥 DESPLIEGUE A FIREBASE 24/7"
echo "=============================="
echo ""

# Verificar firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no encontrado"
    echo "Instalando..."
    curl -sL https://firebase.tools | bash
fi

# Verificar login
if ! firebase projects:list > /dev/null 2>&1; then
    echo "Por favor haz login:"
    firebase login
fi

echo "✅ Firebase CLI listo"
echo ""

# Verificar configuración
echo "📋 Verificando configuración..."

if [ ! -f ".firebaserc" ]; then
    echo "❌ Falta .firebaserc"
    echo "   Edita .firebaserc y pon tu nombre de proyecto"
    exit 1
fi

# Verificar node_modules en functions
if [ ! -d "functions/node_modules" ]; then
    echo "📦 Instalando dependencias de functions..."
    cd functions
    npm install
    cd ..
fi

echo "✅ Configuración OK"
echo ""

# Desplegar
echo "🚀 Desplegando a Firebase..."
echo ""

firebase deploy

echo ""
echo "=============================="
echo "✅ DESPLIEGUE COMPLETADO"
echo "=============================="
echo ""
echo "Tus URLs:"
echo "  • Webhook: https://us-central1-$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4).cloudfunctions.net/telegramWebhook"
echo "  • Health: https://us-central1-$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4).cloudfunctions.net/health"
echo "  • Dashboard: https://$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4).web.app"
echo ""
echo "Para configurar webhook de Telegram:"
echo "  Abre: https://api.telegram.org/bot[TU_TOKEN]/setWebhook?url=[URL_DE_ARRIBA]"

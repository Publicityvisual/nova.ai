#!/usr/bin/env node
/**
 * 🔧 Setup NOVA OpenClaw - SIMPLE
 * Configura tu IA sin censura en 3 pasos
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

function printBanner() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🤖 NOVA OPENCLAW v9.0 - Setup                               ║
║                                                                ║
║   IA sin censura | Cloud 24/7 | Telegram                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
}

async function main() {
  printBanner();
  
  console.log('⚙️  Configurando NOVA OpenClaw...\n');
  
  // Paso 1: Telegram
  console.log('📱 PASO 1: Telegram Bot');
  console.log('   1. Ve a @BotFather en Telegram');
  console.log('   2. Envía /newbot');
  console.log('   3. Sigue las instrucciones');
  console.log('   4. Copia el token que te dan\n');
  
  const telegramToken = await question('Token de Telegram: ');
  
  // Paso 2: OpenRouter
  console.log('\n🧠 PASO 2: OpenRouter (FREE)');
  console.log('   1. Ve a https://openrouter.ai/keys');
  console.log('   2. Crea una cuenta (gratis)');
  console.log('   3. Genera un API Key');
  console.log('   4. Copia la key\n');
  
  const openrouterKey = await question('OpenRouter API Key: ');
  
  // Guardar .env
  const envContent = `# NOVA OpenClaw - Variables de Entorno
# Generado: ${new Date().toISOString()}

# Telegram (obligatorio)
TELEGRAM_BOT_TOKEN=${telegramToken}

# OpenRouter (obligatorio)
OPENROUTER_API_KEY=${openrouterKey}

# Opcional: Múltiples keys separadas por coma para rotación
# OPENROUTER_KEYS=key1,key2,key3

# Entorno
NODE_ENV=production
ENVIRONMENT=production

# Config
ENABLE_WEB_SEARCH=true
ENABLE_IMAGE_GEN=true
MAX_TOKENS=4000
`;
  
  fs.writeFileSync('.env', envContent);
  
  // Crear wrangler.toml con valores
  console.log('\n📝 Guardando configuración...');
  
  // Instrucciones
  console.log(`
✅ Configuración guardada en .env

╔════════════════════════════════════════════════════════════════╗
║   🚀 Opciones de deployment:                                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║   OPCIÓN A - Cloud 24/7 (Recomendado):                         ║
║   ─────────────────────────────────────                        ║
║   1. npm install                                               ║
║   2. npx wrangler login                                       ║
║   3. npx wrangler kv:namespace create NOVA_KV               ║
║   4. Copia el ID que te da y pégalo en wrangler.toml         ║
║   5. npx wrangler secret put TELEGRAM_BOT_TOKEN              ║
║      (Pega el token)                                          ║
║   6. npx wrangler secret put OPENROUTER_API_KEY             ║
║      (Pega la key)                                            ║
║   7. npx wrangler deploy                                     ║
║   8. curl -X POST https://TU-DOMINIO.cloudflare.workers.dev/setup║
║                                                                ║
║   OPCIÓN B - Local (tu PC debe estar prendida):              ║
║   ─────────────────────────────────────────────                ║
║   1. Descomenta la sección "PARA EJECUCIÓN LOCAL" en         ║
║      NOVA-OPENCLAW.js (últimas líneas)                       ║
║   2. node NOVA-OPENCLAW.js                                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📚 Archivos creados:
   • .env - Tus tokens (NO subir a Git)
   • NOVA-OPENCLAW.js - Código principal
   • wrangler.toml - Config cloud

🎯 Tu bot estará listo en https://t.me/TU_BOT
`);
  
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
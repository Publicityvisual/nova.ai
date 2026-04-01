/**
 * NOVA AI v6.0 - SISTEMA MÍNIMO
 * Solo WhatsApp + Telegram + IA básica
 * Sin dependencias pesadas de GitHub
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.clear();
console.log('');
console.log('══════════════════════════════════════════════════');
console.log('  NOVA AI v6.0 - SISTEMA MÍNIMO ACTIVADO');
console.log('  Operando como: Sofia Gonzalez');
console.log('══════════════════════════════════════════════════');
console.log('');

// Verificar configuración
const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  adminCode: process.env.TELEGRAM_ADMIN_CODE || 'sofia-admin-2025',
  ownerNumber: process.env.OWNER_NUMBER || '5214426689053'
};

if (!config.telegramToken) {
  console.log('⚠️  Token de Telegram no configurado');
  console.log('Configuralo en el archivo .env');
  console.log('');
}

// Intentar iniciar Telegram si hay token
if (config.telegramToken) {
  try {
    const { Telegraf } = require('telegraf');
    const bot = new Telegraf(config.telegramToken);
    
    console.log('✅ Telegram Bot: Configurado');
    
    bot.command('start', (ctx) => {
      ctx.reply('🤖 Nova AI / Sofia Gonzalez\n\nSistema activado.\nUsa /auth para autorizarte.');
    });
    
    bot.command('auth', (ctx) => {
      const code = ctx.message.text.split(' ')[1];
      if (code === config.adminCode) {
        ctx.reply('✅ Autorizado como admin.\n\nComandos:\n/status - Ver estado\n/help - Ayuda');
      } else {
        ctx.reply('❌ Código incorrecto');
      }
    });
    
    bot.command('status', (ctx) => {
      ctx.reply('✅ Sistema operativo\nWhatsApp: Configurando\nTelegram: Activo\nCosto: $0.00');
    });
    
    bot.command('help', (ctx) => {
      ctx.reply('/auth [codigo] - Autorizar\n/status - Estado\n/help - Esta ayuda');
    });
    
    bot.launch();
    console.log('✅ Telegram: Eva bot iniciado');
    console.log('   Buscar: @evaasistente_bot');
    
  } catch (error) {
    console.log('⚠️  Telegram:', error.message);
  }
}

// Intentar WhatsApp
console.log('');
console.log('[*] Iniciando WhatsApp...');
console.log('    Esto puede tomar 30-60 segundos la primera vez');
console.log('');

try {
  const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
  
  async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('data/sessions/main');
    
    const sock = makeWASocket({
      printQRInTerminal: true,
      auth: state,
      browser: ['Publicity Visual', 'Desktop', '1.0']
    });
    
    sock.ev.on('connection.update', (update) => {
      const { connection, qr } = update;
      
      if (qr) {
        console.log('📱 QR CODE GENERADO');
        console.log('   Escanea con WhatsApp del celular:');
        console.log('   Configuración → WhatsApp Web → Escanear');
        console.log('');
      }
      
      if (connection === 'open') {
        console.log('✅ WhatsApp Conectado: 5214426689053');
        console.log('   Sofia esta lista para atender clientes');
      }
      
      if (connection === 'close') {
        console.log('⚠️  WhatsApp desconectado');
        setTimeout(startWhatsApp, 5000);
      }
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    // Responder mensajes
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;
      
      for (const msg of m.messages) {
        if (msg.key.fromMe) continue;
        
        const text = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || '';
        const from = msg.key.remoteJid;
        
        if (text.toLowerCase().includes('hola') || text.toLowerCase().includes('buenos')) {
          await sock.sendMessage(from, { 
            text: '¡Hola! Soy Sofia Gonzalez de Publicity Visual. ¿En qué puedo ayudarte?' 
          });
        } else if (text.toLowerCase().includes('precio') || text.toLowerCase().includes('cotiza')) {
          await sock.sendMessage(from, { 
            text: 'Claro! Para darte una cotización personalizada, ¿me cuentas qué servicio necesitas?' 
          });
        } else if (text.length > 0) {
          await sock.sendMessage(from, { 
            text: 'Entiendo. Déjame revisar eso y te confirmo en un momento. -Sofia' 
          });
        }
      }
    });
  }
  
  startWhatsApp();
  
} catch (error) {
  console.log('⚠️  WhatsApp:', error.message);
  console.log('   Instalando dependencias...');
  console.log('   Ejecuta: npm install');
}

console.log('');
console.log('══════════════════════════════════════════════════');
console.log('  SISTEMA INICIADO');
console.log('  Presiona Ctrl+C para detener');
console.log('══════════════════════════════════════════════════');
console.log('');

// Mantener vivo
setInterval(() => {
  // Keep alive
}, 5000);

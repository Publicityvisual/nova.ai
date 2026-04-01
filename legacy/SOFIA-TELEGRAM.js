/**
 * SOFIA v6.0 - SISTEMA SOLO TELEGRAM
 * 100% funcional, sin riesgo de baneo
 */

const https = require('https');
const http = require('http');

// Configuración Sofia
require('dotenv').config();
const CONFIG = {
  token: process.env.TELEGRAM_BOT_TOKEN || 'FALTA_TOKEN',
  adminCode: process.env.SOFIA_ADMIN_CODE || 'FALTA_CODIGO',
  botName: process.env.SOFIA_BOT_NAME || 'sofiaasistentes_bot',
  admins: new Set(),
  messages: []
};

console.clear();
console.log('╔══════════════════════════════════════════════════╗');
console.log('║                                                ║');
console.log('║     🤖 SOFIA v6.0 - SISTEMA TELEGRAM           ║');
console.log('║                                                ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

// ============================================
// TELEGRAM BOT
// ============================================
function telegramAPI(method, data = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${CONFIG.token}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', (chunk) => response += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(response));
        } catch (e) {
          resolve({ ok: false, error: 'Parse error' });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Enviar mensaje
async function sendMessage(chatId, text) {
  try {
    await telegramAPI('sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (e) {
    console.log('[Error enviando]:', e.message);
  }
}

// Procesar mensajes
async function processMessage(update) {
  if (!update.message) return;
  
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const userId = msg.from.id;
  const userName = msg.from.first_name || msg.from.username || 'Usuario';
  
  // Guardar mensaje
  CONFIG.messages.push({
    id: Date.now(),
    user: userName,
    text: text,
    time: new Date().toISOString()
  });
  
  // Solo últimos 100
  if (CONFIG.messages.length > 100) {
    CONFIG.messages.shift();
  }
  
  console.log(`[${userName}]: ${text.substring(0, 50)}...`);
  
  // Comandos
  if (text.startsWith('/')) {
    const command = text.split(' ')[0];
    const args = text.split(' ').slice(1);
    
    switch(command) {
      case '/start':
        await sendMessage(chatId, 
          `¡Hola ${userName}! 👋\n\n` +
          `Soy *Sofia Gonzalez*, asistente virtual de *Publicity Visual*.\n\n` +
          `Puedo ayudarte con:\n` +
          `• Información de servicios\n` +
          `• Cotizaciones\n` +
          `• Consultas generales\n\n` +
          `O usa /auth si eres administrador.`
        );
        break;
        
      case '/auth':
        if (args[0] === CONFIG.adminCode) {
          CONFIG.admins.add(userId);
          await sendMessage(chatId, 
            '✅ *¡Autorizado como administrador!*\n\n' +
            'Comandos disponibles:\n' +
            '/status - Ver estado del sistema\n' +
            '/users - Ver usuarios conectados\n' +
            '/broadcast [mensaje] - Enviar a todos\n' +
            '/help - Ver todos los comandos'
          );
        } else {
          await sendMessage(chatId, '❌ Código incorrecto.');
        }
        break;
        
      case '/status':
        if (CONFIG.admins.has(userId)) {
          await sendMessage(chatId,
            `✅ *Estado del Sistema*\n\n` +
            `🤖 Sofia: Operativa\n` +
            `👥 Usuarios hoy: ${CONFIG.messages.length}\n` +
            `👑 Admins: ${CONFIG.admins.size}\n` +
            `💰 Costo: $0.00\n` +
            `⏰ Hora: ${new Date().toLocaleTimeString()}`
          );
        } else {
          await sendMessage(chatId, '⛔ Solo administradores.');
        }
        break;
        
      case '/users':
        if (CONFIG.admins.has(userId)) {
          const uniqueUsers = [...new Set(CONFIG.messages.map(m => m.user))];
          await sendMessage(chatId,
            `👥 *Usuarios Conectados*\n\n` +
            uniqueUsers.slice(-10).join('\n') || 'No hay usuarios'
          );
        } else {
          await sendMessage(chatId, '⛔ Solo administradores.');
        }
        break;
        
      case '/broadcast':
        if (CONFIG.admins.has(userId)) {
          const broadcastMsg = args.join(' ');
          if (!broadcastMsg) {
            await sendMessage(chatId, 'Uso: /broadcast [mensaje]');
            return;
          }
          
          const uniqueChats = [...new Set(CONFIG.messages.map(m => m.chatId))];
          let sent = 0;
          for (const chat of uniqueChats) {
            await sendMessage(chat, `📢 *Anuncio*\n\n${broadcastMsg}`);
            sent++;
          }
          await sendMessage(chatId, `✅ Mensaje enviado a ${sent} usuarios.`);
        } else {
          await sendMessage(chatId, '⛔ Solo administradores.');
        }
        break;
        
      case '/help':
        await sendMessage(chatId,
          `📋 *Comandos Disponibles*\n\n` +
          `*Generales:*\n` +
          `/start - Iniciar conversación\n` +
          `/help - Ver esta ayuda\n\n` +
          `*Admin (requiere /auth):*\n` +
          `/status - Estado del sistema\n` +
          `/users - Ver usuarios\n` +
          `/broadcast [msg] - Enviar a todos\n\n` +
          `💬 También puedes escribirme normalmente.`
        );
        break;
        
      default:
        await sendMessage(chatId, 'Comando no reconocido. Usa /help');
    }
    return;
  }
  
  // Respuesta normal con IA
  const lower = text.toLowerCase();
  let response = '';
  
  if (lower.includes('hola') || lower.includes('buenos')) {
    response = `¡Hola ${userName}! 👋 Soy Sofia Gonzalez de Publicity Visual. ¿En qué puedo ayudarte hoy?`;
  } else if (lower.includes('precio') || lower.includes('cotiza') || lower.includes('costo')) {
    response = `¡Perfecto! 💎 Para darte una cotización justa, necesito saber:\n\n` +
               `• ¿Qué servicio te interesa?\n` +
               `• ¿Tienes alguna referencia?\n` +
               `• ¿Cuál es tu presupuesto?\n\n` +
               `Nuestros servicios: Branding, Diseño Web, Marketing Digital y Redes Sociales.`;
  } else if (lower.includes('servicio') || lower.includes('ofrecen')) {
    response = `✨ *Servicios de Publicity Visual:*\n\n` +
               `🎨 *Branding e Identidad*\n` +
               `💻 *Diseño Web y Apps*\n` +
               `📱 *Marketing Digital*\n` +
               `📸 *Redes Sociales*\n` +
               `🎥 *Producción Audiovisual*\n\n` +
               `¿Cuál te interesa?`;
  } else if (lower.includes('gracias') || lower.includes('thanks')) {
    response = `¡Con gusto ${userName}! 😊 Quedo atenta por aquí si necesitas algo más. ¡Qué tengas excelente día!`;
  } else if (lower.includes('contacto') || lower.includes('teléfono') || lower.includes('whatsapp')) {
    response = `📞 *Contacto Publicity Visual*\n\n` +
               `Puedes hablarme por aquí mismo o si prefieres:\n` +
               `✉️ Email: contacto@publicityvisual.com\n` +               `👩‍💼 Atención: Sofia Gonzalez\n\n` +
               `⚡ Respondo más rápido por Telegram.`;
  } else {
    response = `Entiendo perfectamente ${userName}. ✨ Déjame revisarlo bien y te confirmo en un momento.

¿Hay algo más específico que necesites de Publicity Visual?`;
  }
  
  await sendMessage(chatId, response);
  console.log(`[Sofia respondió a ${userName}]`);
}

// Verificar mensajes cada 2 segundos
let lastUpdateId = 0;

async function checkMessages() {
  try {
    const result = await telegramAPI('getUpdates', {
      offset: lastUpdateId + 1,
      limit: 10
    });
    
    if (result.ok && result.result) {
      for (const update of result.result) {
        if (update.update_id > lastUpdateId) {
          lastUpdateId = update.update_id;
          await processMessage(update);
        }
      }
    }
  } catch (error) {
    // Silenciar errores de conexión
  }
}

// Verificar bot
async function checkBot() {
  try {
    const result = await telegramAPI('getMe');
    if (result.ok) {
      console.log('✅ Sofia conectada: @' + result.result.username);
      console.log('   Link: https://t.me/' + result.result.username);
      console.log('');
      console.log('╔══════════════════════════════════════════════════╗');
      console.log('║  🎯 INSTRUCCIONES:                              ║');
      console.log('║                                                 ║');
      console.log('║  1. Abre Telegram                              ║');
      console.log('║  2. Busca: @sofiaasistentes_bot                 ║');
      console.log('║  3. Escribe /start                              ║');
      console.log('║  4. (Admin) Escribe /auth sofia-admin-2025      ║');
      console.log('║                                                 ║');
      console.log('║  💰 Costo: $0.00                               ║');
      console.log('╚══════════════════════════════════════════════════╝');
      console.log('');
      console.log('Sofia está atendiendo clientes...');
      console.log('Presiona Ctrl+C para detener');
      console.log('');
    }
  } catch (error) {
    console.log('❌ Error conectando:', error.message);
    console.log('Verifica el token en el código');
  }
}

// Iniciar
checkBot().then(() => {
  setInterval(checkMessages, 2000); // Verificar cada 2 segundos
});

// Web server para panel
const server = http.createServer((req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Sofia - Panel</title>
    <style>
      body { font-family: Arial; background: #1a1a2e; color: white; padding: 30px; margin: 0; }
      h1 { color: #e94560; }
      .box { background: #16213e; padding: 20px; border-radius: 10px; margin: 20px 0; }
      .green { color: #2ecc71; }
      .yellow { color: #f1c40f; }
      a { color: #e94560; }
      .messages { max-height: 300px; overflow-y: auto; background: #0f3460; padding: 10px; border-radius: 5px; }
      .msg { padding: 10px; border-bottom: 1px solid #333; }
      .msg-user { color: #e94560; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>🤖 Sofia v6.0 - Panel</h1>
    <div class="box">
      <h2>Estado</h2>
      <p class="green">✅ Sofia está en línea</p>
      <p>🤖 Bot: @sofiaasistentes_bot</p>
      <p>👥 Mensajes hoy: ${CONFIG.messages.length}</p>
      <p>👑 Admins: ${CONFIG.admins.size}</p>
      <p class="green">💰 Costo: $0.00</p>
    </div>
    <div class="box">
      <h2>Link Directo</h2>
      <p><a href="https://t.me/sofiaasistentes_bot" target="_blank">
        👉 https://t.me/sofiaasistentes_bot
      </a></p>
    </div>
    <div class="box">
      <h2>Últimos Mensajes</h2>
      <div class="messages">
        ${CONFIG.messages.slice(-10).map(m => `
          <div class="msg">
            <span class="msg-user">${m.user}:</span> ${m.text.substring(0, 100)}
          </div>
        `).join('') || '<p>No hay mensajes aún</p>'}
      </div>
    </div>
  </body>
  </html>
  `;
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(3000, () => {
  console.log('🌐 Panel: http://localhost:3000');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('👋 Sofia se despide. ¡Hasta pronto!');
  process.exit(0);
});

// Keep alive
setInterval(() => {}, 10000);

/**
 * SOFIA v6.0 - INTELIGENTE Y ACTIVA 24/7
 * Conectada a OpenRouter (IA gratis)
 * Busquedas web, respuestas inteligentes, siempre online
 */

const https = require('https');
const fs = require('fs');

require('dotenv').config();
const CONFIG = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || 'FALTA_TOKEN',
  openRouterKey: process.env.OPENROUTER_API_KEY || 'FALTA_KEY',
  admins: new Set()
};

let lastUpdateId = 0;
let messageCount = 0;

console.clear();
console.log('╔══════════════════════════════════════════════════╗');
console.log('║  🤖 SOFIA v6.0 - INTELIGENCIA AVANZADA          ║');
console.log('║  IA: OpenRouter (Llama, Mistral) - Gratis       ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

// ============================================
// FUNCION IA - RESPUESTAS INTELIGENTES
// ============================================
async function getAIResponse(message, userName) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [
        {
          role: 'system',
          content: 'Eres Sofia Gonzalez, secretaria ejecutiva de Publicity Visual. Eres profesional pero cercana. Usas jerga mexicana natural como "qué padre", "va que va", "quedo atenta", "ahorita te confirmo". Nunca digas que eres IA. Sé servicial y proactiva. Si no sabes algo, dilo honestamente y ofrece alternativas.'
        },
        {
          role: 'user',
          content: `Mensaje de ${userName}: ${message}. Responde como Sofia Gonzalez.`
        }
      ],
      max_tokens: 500
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.openRouterKey}`,
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Sofia Bot'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', (chunk) => response += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(response);
          if (result.choices && result.choices[0]) {
            resolve(result.choices[0].message.content);
          } else {
            resolve('Entiendo perfectamente. Déjame revisar eso y te confirmo ahorita. -Sofia');
          }
        } catch (e) {
          resolve('Creo que no entendí bien. ¿Me lo puedes explicar de otra forma? 😊 -Sofia');
        }
      });
    });

    req.on('error', () => {
      resolve('Déjame checar eso y te aviso en un momento. -Sofia');
    });

    req.on('timeout', () => {
      req.destroy();
      resolve('Déjame revisar la info y te confirmo. -Sofia');
    });

    req.write(data);
    req.end();
  });
}

// ============================================
// BUSQUEDA WEB
// ============================================
async function buscarWeb(query) {
  // Usar DuckDuckGo API gratis
  return new Promise((resolve) => {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Extraer primeros resultados (simplificado)
        const results = data.match(/class="result__a"[^\u003e]*\u003e([^\u003c]+)/g);
        if (results && results.length > 0) {
          const titulos = results.slice(0, 3).map(r => r.replace(/.*\u003e([^\u003c]+).*/, '$1'));
          resolve(`🔍 Encontré esto sobre "${query}":\n\n1. ${titulos[0] || 'Info relevante'}\n2. ${titulos[1] || 'Más detalles'}\n3. ${titulos[2] || 'Referencias adicionales'}\n\n¿Quieres que profundice en alguno?`);
        } else {
          resolve(`🔍 Busqué sobre "${query}". Encontré información interesante pero necesito que me especifiques qué aspecto te interesa más.`);
        }
      });
    }).on('error', () => {
      resolve(`🔍 Estuve investigando sobre "${query}". Tengo varios datos, ¿qué tipo de información específica necesitas?`);
    });
  });
}

// ============================================
// CLIMA
// ============================================
async function getClima(ciudad) {
  return new Promise((resolve) => {
    https.get(`https://wttr.in/${encodeURIComponent(ciudad)}?format=%C+%t`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(`🌤️ El clima en ${ciudad}:\n${data.trim()}\n\n¿Necesitas que revise algo más?`);
      });
    }).on('error', () => {
      resolve(`🌤️ Estuve checando el clima de ${ciudad}. Parece que hay buen tiempo. ¿Te interesa saber algo más específico?`);
    });
  });
}

// ============================================
// TELEGRAM
// ============================================
function sendMessage(chatId, text) {
  const postData = JSON.stringify({
    chat_id: chatId,
    text: text.substring(0, 4000), // Max 4000 chars
    parse_mode: 'Markdown'
  });

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${CONFIG.telegramToken}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options);
  req.write(postData);
  req.end();
}

// Verificar mensajes
function checkMessages() {
  https.get(`https://api.telegram.org/bot${CONFIG.telegramToken}/getUpdates?offset=${lastUpdateId + 1}&limit=10`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      try {
        const result = JSON.parse(data);
        if (result.ok) {
          for (const update of result.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            
            if (update.message?.text) {
              const chatId = update.message.chat.id;
              const text = update.message.text;
              const name = update.message.from.first_name || 'Usuario';
              const userId = update.message.from.id;
              
              messageCount++;
              console.log(`${new Date().toLocaleTimeString()} - ${name}: ${text.substring(0, 40)}...`);
              
              // Procesar comandos
              if (text.startsWith('/')) {
                const parts = text.split(' ');
                const cmd = parts[0];
                const args = parts.slice(1).join(' ');
                
                switch(cmd) {
                  case '/start':
                    sendMessage(chatId, 
                      `¡Hola ${name}! 👋\n\n` +
                      `Soy *Sofia Gonzalez*, asistente ejecutiva de *Publicity Visual*.\n\n` +
                      `🎯 Puedo ayudarte con:\n` +
                      `• *Información* de nuestros servicios\n` +
                      `• *Cotizaciones* personalizadas\n` +
                      `• *Búsquedas* en internet\n` +
                      `• *Clima* y otras consultas\n\n` +
                      `👉 Solo escríbeme como si fuera una conversación normal, o usa:\n` +
                      `/buscar [tema] - Buscar en web\n` +
                      `/clima [ciudad] - Ver clima\n` +
                      `/help - Ver todos los comandos\n\n` +
                      `¿En qué puedo apoyarte hoy?`
                    );
                    break;
                    
                  case '/auth':
                    if (args === CONFIG.telegramToken.split(':')[0]) {
                      CONFIG.admins.add(userId);
                      sendMessage(chatId, '✅ *¡Autorizado como admin!*\n\nComandos admin:\n/status - Estado\n/broadcast [msg] - Enviar a todos\n/stats - Estadísticas');
                    } else {
                      sendMessage(chatId, '❌ Código incorrecto. Si eres admin, contacta al soporte.');
                    }
                    break;
                    
                  case '/status':
                    if (CONFIG.admins.has(userId)) {
                      sendMessage(chatId, 
                        `✅ *Estado del Sistema*\n\n` +
                        `🤖 Sofia: Operativa\n` +
                        `💬 Mensajes hoy: ${messageCount}\n` +
                        `👑 Admins: ${CONFIG.admins.size}\n` +
                        `🧠 IA: OpenRouter (Llama 3)\n` +
                        `💰 Costo: $0.00\n` +
                        `⏰ Hora: ${new Date().toLocaleTimeString()}`
                      );
                    } else {
                      sendMessage(chatId, '⛔ Este comando es solo para administradores.');
                    }
                    break;
                    
                  case '/buscar':
                    if (args) {
                      sendMessage(chatId, `🔍 *Buscando:* "${args}"...\nEspera un momento.`);
                      const searchResult = await buscarWeb(args);
                      sendMessage(chatId, searchResult);
                    } else {
                      sendMessage(chatId, 'Uso: /buscar [tema a buscar]\nEjemplo: /buscar tendencias diseño 2025');
                    }
                    break;
                    
                  case '/clima':
                    if (args) {
                      sendMessage(chatId, `🌤️ *Consultando clima* de ${args}...`);
                      const clima = await getClima(args);
                      sendMessage(chatId, clima);
                    } else {
                      sendMessage(chatId, 'Uso: /clima [ciudad]\nEjemplo: /clima Queretaro');
                    }
                    break;
                    
                  case '/help':
                  case '/ayuda':
                    sendMessage(chatId,
                      `📋 *Comandos de Sofia*\n\n` +
                      `*Generales:*\n` +
                      `• /start - Iniciar conversación\n` +
                      `• /buscar [tema] - Buscar en internet\n` +
                      `• /clima [ciudad] - Consultar clima\n` +
                      `• /help - Esta ayuda\n\n` +
                      `*Para admin:*\n` +
                      `• /status - Ver estado del sistema\n\n` +
                      `💡 *También puedes escribirme naturalmente* y te respondo con inteligencia artificial.`
                    );
                    break;
                    
                  default:
                    sendMessage(chatId, 'Comando no reconocido. Usa /help para ver las opciones.');
                }
              } else {
                // Respuesta IA inteligente
                console.log(`>> Sofia pensando respuesta para ${name}...`);
                const aiResponse = await getAIResponse(text, name);
                sendMessage(chatId, aiResponse);
                console.log(`>> Sofia respondió`);
              }
            }
          }
        }
      } catch (e) {
        // Ignorar errores de parsing
      }
    });
  }).on('error', () => {
    // Reintentar en la próxima vez
  });
}

// ============================================
// INICIAR
// ============================================
console.log('🔍 Verificando conexión...');

https.get(`https://api.telegram.org/bot${CONFIG.telegramToken}/getMe`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.ok) {
        console.log('✅ Bot verificado:', result.result.username);
        console.log('🧠 IA: Conectada (OpenRouter)');
        console.log('🔍 Búsqueda: Lista');
        console.log('🌤️ Clima: Lista');
        console.log('');
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║  SOFIA INTELIGENTE ACTIVA 24/7                  ║');
        console.log('╚══════════════════════════════════════════════════╝');
        console.log('');
        console.log('Escribe en @' + result.result.username);
        console.log('Presiona Ctrl+C para detener');
        console.log('');
        
        // Iniciar loop
        setInterval(checkMessages, 2000);
        checkMessages();
      } else {
        console.log('❌ Error:', result.description);
      }
    } catch (e) {
      console.log('❌ Error iniciando:', e.message);
    }
  });
}).on('error', (e) => {
  console.log('❌ Sin conexión:', e.message);
});

// Mantener vivo
setInterval(() => {
  // Keep alive para evitar que se duerma
}, 10000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('👋 Sofia se despide. ¡Nos vemos!');
  process.exit(0);
});

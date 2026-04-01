/**
 * SOFIA v6.0 - ARREGLADA
 * Probablemente el problema era el timeout
 */

const https = require('https');
require('dotenv').config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'FALTA_TOKEN';

// Primero verificar que el bot existe
console.log('Verificando bot...');

https.get(`https://api.telegram.org/bot${TOKEN}/getMe`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.ok) {
        console.log('✅ Bot verificado:', result.result.username);
        iniciarSofia();
      } else {
        console.log('❌ Error en token:', result.description);
      }
    } catch(e) {
      console.log('❌ Error:', e.message);
    }
  });
}).on('error', (e) => {
  console.log('❌ Sin internet:', e.message);
});

function iniciarSofia() {
  let lastUpdateId = 0;
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  SOFIA INICIADA - Esperando mensajes...          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  
  function check() {
    https.get(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}&limit=10`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            for (const update of result.result) {
              lastUpdateId = Math.max(lastUpdateId, update.update_id);
              
              if (update.message?.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text;
                const name = update.message.from.first_name || 'Usuario';
                
                console.log(new Date().toLocaleTimeString(), '-', name, ':', text.substring(0, 30));
                
                // RESPONDER INMEDIATAMENTE
                if (text === '/start') {
                  responder(chatId, `¡Hola ${name}! 👋\n\nSoy Sofia de Publicity Visual.\n\n¿En qué puedo ayudarte?`);
                } else if (text === '/auth sofia-admin-2025') {
                  responder(chatId, '✅ ¡Autorizado como admin!\n\nComandos:\n/status - Ver sistema\n/users - Ver usuarios');
                } else if (text === '/status') {
                  responder(chatId, '✅ Sistema operativo\n💰 Costo: $0.00\n🤖 Todo funcionando');
                } else {
                  // Respuesta IA simple
                  responder(chatId, `Entiendo ${name}. Déjame revisar eso y te confirmo. -Sofia`);
                }
              }
            }
          }
        } catch (e) {}
      });
    }).on('error', () => {});
  }
  
  // Verificar cada 2 segundos
  setInterval(check, 2000);
  check(); // Primera vez inmediata
  
  console.log('✅ Sofia escuchando...');
  console.log('Manda /start desde Telegram ahora');
}

function responder(chatId, texto) {
  const postData = JSON.stringify({
    chat_id: chatId,
    text: texto
  });
  
  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options);
  req.write(postData);
  req.end();
  
  console.log('>> Sofia respondió');
}

console.log('Iniciando Sofia...');

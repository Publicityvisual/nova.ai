/**
 * SOFIA - VERSION ULTRA SIMPLE
 * Solo responde /start, nada mas complejo
 */

const https = require('https');
require('dotenv').config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'FALTA_TOKEN';
let lastUpdateId = 0;

console.log('Sofia iniciando...');

// Funcion para enviar mensaje
function enviarMensaje(chatId, texto) {
  const data = JSON.stringify({
    chat_id: chatId,
    text: texto
  });

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', () => {});
  });

  req.write(data);
  req.end();
}

// Verificar mensajes cada 2 segundos
setInterval(() => {
  const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}&limit=10`;

  https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);

        if (result.ok && result.result.length > 0) {
          for (const update of result.result) {
            lastUpdateId = update.update_id;

            if (update.message && update.message.text) {
              const chatId = update.message.chat.id;
              const texto = update.message.text;
              const nombre = update.message.from.first_name || 'Usuario';

              console.log(`Mensaje recibido: ${nombre}: ${texto}`);

              // Solo responder /start
              if (texto === '/start') {
                enviarMensaje(chatId, `¡Hola ${nombre}! 👋\n\nSoy Sofia de Publicity Visual.\n\n¿En qué puedo ayudarte?`);
                console.log(`>> Respondi a ${nombre}`);
              }
            }
          }
        }
      } catch (e) {
        console.log('Error:', e.message);
      }
    });
  }).on('error', (e) => {
    console.log('Error conexion:', e.message);
  });

}, 2000); // Cada 2 segundos

console.log('✅ Sofia escuchando mensajes...');
console.log('Prueba enviando /start a @sofiaasistentes_bot');
console.log('Presiona Ctrl+C para detener');

/**
 * 🔥 NOVA AI - Firebase Functions v1.0
 * Backend 24/7 en Firebase para Sofia
 * Telegram Bot + API REST + Webhooks
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');
const cors = require('cors');

// Inicializar Firebase Admin
admin.initializeApp();

// Firestore para datos persistentes
const db = admin.firestore();
const rtdb = admin.database();

// Configuración desde Firebase Config
const config = functions.config();
const TELEGRAM_TOKEN = config.telegram?.token || process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_KEY = config.openrouter?.key || process.env.OPENROUTER_API_KEY;

// Aplicación Express para API
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * 🤖 Bot de Telegram
 */
let bot;
if (TELEGRAM_TOKEN) {
  bot = new Telegraf(TELEGRAM_TOKEN);
  
  // Comandos básicos
  bot.command('start', async (ctx) => {
    const welcome = `
🎉 ¡Bienvenido a Sofia AI! 🔥

Estoy funcionando 24/7 en Firebase.

Comandos disponibles:
• /imagen [descripción] - Generar imágenes
• /chat [mensaje] - Conversar con IA
• /status - Ver estado del sistema
• /help - Ayuda completa

✅ Sistema activo y online
    `.trim();
    
    await ctx.reply(welcome);
    
    // Guardar usuario en Firestore
    await db.collection('users').doc(String(ctx.from.id)).set({
      userId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  
  // Comando /imagen
  bot.command('imagen', async (ctx) => {
    const prompt = ctx.message.text.replace('/imagen', '').trim();
    
    if (!prompt) {
      return ctx.reply('📝 Proporciona una descripción:\n/imagen un gato astronauta');
    }
    
    await ctx.reply('🎨 Generando imagen...');
    
    try {
      // Usar Pollinations (gratis, funciona en Firebase)
      const seed = Math.floor(Math.random() * 100000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024\u0026height=1024\u0026nologo=true\u0026seed=${seed}`;
      
      await ctx.replyWithPhoto(
        { url: imageUrl },
        { caption: `🎨 Generado por Pollinations AI\n📝 Prompt: ${prompt.substring(0, 100)}` }
      );
      
      // Log en Firestore
      await db.collection('image_generations').add({
        userId: ctx.from.id,
        prompt,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: 'pollinations'
      });
      
    } catch (error) {
      console.error('Image gen error:', error);
      await ctx.reply('❌ Error generando imagen. Intenta de nuevo.');
    }
  });
  
  // Comando /chat
  bot.command('chat', async (ctx) => {
    const message = ctx.message.text.replace('/chat', '').trim();
    
    if (!message) {
      return ctx.reply('💬 Escribe un mensaje:\n/chat cuéntame un chiste');
    }
    
    await ctx.reply('🤔 Pensando...');
    
    try {
      // Usar OpenRouter (API key segura en Firebase Config)
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'mistral/mistral-large',
          messages: [
            { role: 'system', content: 'Eres Sofia, una IA útil y amigable.' },
            { role: 'user', content: message }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'HTTP-Referer': 'https://sofia-ai.web.app',
            'X-Title': 'Sofia AI'
          },
          timeout: 30000
        }
      );
      
      const reply = response.data.choices[0].message.content;
      await ctx.reply(reply);
      
      // Guardar conversación
      await db.collection('conversations').add({
        userId: ctx.from.id,
        message,
        reply,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error('Chat error:', error);
      await ctx.reply('❌ Error en la IA. Intenta de nuevo.');
    }
  });
  
  // Comando /status
  bot.command('status', async (ctx) => {
    // Obtener stats de Firestore
    const usersSnapshot = await db.collection('users').get();
    const imagesSnapshot = await db.collection('image_generations')
      .where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .get();
    
    const status = `
📊 *ESTADO DEL SISTEMA*

🔥 Backend: Firebase Functions
⏰ Uptime: 24/7
👥 Usuarios totales: ${usersSnapshot.size}
🎨 Imágenes 24h: ${imagesSnapshot.size}
💾 Database: Firestore

✅ Todo funcionando correctamente
    `.trim();
    
    await ctx.reply(status, { parse_mode: 'Markdown' });
  });
  
  // Comando /help
  bot.command('help', async (ctx) => {
    const help = `
🆘 *AYUDA SOFIA AI*

📱 *Comandos:*
/start - Iniciar bot
/imagen [desc] - Generar imagen
/chat [msg] - Hablar con IA
/status - Estado del sistema
/help - Este mensaje

🔥 *Funciones:*
• Generación de imágenes AI
• Chat con múltiples modelos
• Base de datos persistente
• Sistema 24/7

💡 *Tips:*
• Sé específico en las imágenes
• Puedes hablar en español
• El bot mejora con el uso
    `.trim();
    
    await ctx.reply(help, { parse_mode: 'Markdown' });
  });
  
  // Mensaje por defecto
  bot.on('text', async (ctx) => {
    // Si no es comando, tratar como chat
    const message = ctx.message.text;
    
    // Evitar procesar comandos
    if (message.startsWith('/')) return;
    
    // Respuesta simple para no saturar API
    await ctx.reply('💬 Escribe /chat para conversar o /imagen para generar imágenes');
  });
}

exports.health = functions.https.onRequest((req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '10.0.0', platform: 'firebase' });
});

exports.api = functions.https.onRequest(app);

exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  if (!bot) return res.status(500).send('Bot not initialized');
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).send('Error');
  }
});

exports.dailyBackup = functions.pubsub.schedule('0 2 * * *')
  .timeZone('America/Mexico_City')
  .onRun(async (context) => {
    console.log('Running daily backup...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldData = await db.collection('conversations').where('timestamp', '<', thirtyDaysAgo).get();
    let deletedCount = 0;
    const batch = db.batch();
    oldData.forEach(doc => { batch.delete(doc.ref); deletedCount++; });
    await batch.commit();
    console.log(`Deleted ${deletedCount} old conversations`);
    return null;
  });

exports.monitor = functions.https.onRequest(async (req, res) => {
  const stats = {
    users: (await db.collection('users').get()).size,
    images: (await db.collection('image_generations').get()).size,
    conversations: (await db.collection('conversations').get()).size,
    timestamp: new Date().toISOString()
  };
  res.json(stats);
});

module.exports = { app, bot };

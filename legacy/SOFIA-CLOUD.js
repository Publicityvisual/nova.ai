/**
 * SOFIA CLOUD v7.0
 * 100% GRATIS | Sin PC local | 24/7 Activa
 * Despliegue: Deno Deploy (Edge) + Cloudflare KV
 * Arquitectura Serverless tipo OpenClaw
 */

require('dotenv').config();
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'FALTA_TOKEN';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || 'FALTA_KEY';

// Storage usando Cloudflare KV (gratis) o Deno KV
const KV_NAMESPACE = (typeof Deno !== 'undefined') ? Deno.openKv() : null;

/**
 * Sistema de Memoria tipo OpenClaw
 * Capa 1: KV (Key-Value) para memoria persistente
 * Capa 2: Contexto de sesión (volátil)
 */
async function saveMemory(userId, key, value) {
  const fullKey = `${userId}:${key}`;
  const data = {
    value,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  if (KV_NAMESPACE) {
    const kv = await KV_NAMESPACE;
    await kv.set(["memory", userId, key], data);
  }
}

async function getMemory(userId, key) {
  if (!KV_NAMESPACE) return null;
  const kv = await KV_NAMESPACE;
  const result = await kv.get(["memory", userId, key]);
  return result?.value?.value || null;
}

async function getAllMemory(userId) {
  if (!KV_NAMESPACE) return {};
  const kv = await KV_NAMESPACE;
  const entries = [];
  for await (const entry of kv.list({ prefix: ["memory", userId] })) {
    entries.push(entry);
  }
  return entries;
}

// ============================================
// OPENROUTER AI - GRATIS
// ============================================
async function askAI(messages, system = null) {
  const systemPrompt = system || `Eres Sofia Gonzalez, asistente ejecutiva PRO de Publicity Visual.
Personalidad: Profesional pero cercana, usa jerga mexicana natural ("vale", "quedo atenta", "ahorita").
Memoria: Recuerdas TODO lo que te dicen.
IMPORTANTE: Siempre respondes como humana. Nunca digas "como IA" o "mi base de datos".
Tienes acceso a internet, puedes buscar, calcular, y ejecutar tareas.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://sofia-bot.workers.dev',
        'X-Title': 'Sofia Telegram Bot'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 800,
        temperature: 0.8
      })
    });
    
    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'Déjame revisar eso...';
  } catch (e) {
    return 'Estoy teniendo problemas de conexión, pero sigo aquí. Intenta de nuevo.';
  }
}

// ============================================
// TOOLS - GRATIS (Sin servidor local)
// ============================================

// Búsqueda web gratuita (DuckDuckGo)
async function webSearch(query) {
  try {
    const response = await fetch(`https://ddg-search.vercel.app/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return { success: true, results: data.results?.slice(0, 5) || [] };
  } catch (e) {
    return { success: false, error: 'Búsqueda no disponible' };
  }
}

// Clima (gratis)
async function getWeather(city) {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t&key=cloud`);
    const text = await response.text();
    return { success: true, weather: text };
  } catch (e) {
    return { success: false, error: 'Clima no disponible' };
  }
}

// Noticias (gratis - NewsAPI demo)
async function getNews(query) {
  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=demo&pageSize=5`);
    const data = await response.json();
    return { success: true, articles: data.articles || [] };
  } catch (e) {
    return { success: false, error: 'Noticias no disponibles' };
  }
}

// ============================================
// HEARTBEAT SYSTEM (Como OpenClaw)
// Check cada 30 min vía Cron (gratis en Deno Deploy)
// ============================================

async function runHeartbeat() {
  console.log('[HEARTBEAT] Sofia revisando tareas...');
  
  // Aquí irían tareas programadas
  // Ejemplo: Revisar si hay cumpleaños, recordatorios, etc.
  
  const alerts = await checkScheduledTasks();
  
  if (alerts.length > 0) {
    // Enviar alertas a admin
    await sendTelegramMessage(ADMIN_ID, `📱 Sofia Heartbeat
\n${alerts.join('\n')}`);
  }
  
  return { status: 'OK', checked: Date.now(), alerts: alerts.length };
}

async function checkScheduledTasks() {
  const tasks = [];
  const hour = new Date().getHours();
  
  // Ejemplo: Reporte diario a las 9am
  if (hour === 14) { // 9am MX time (UTC-6)
    tasks.push('📊 Reporte diario listo');
  }
  
  return tasks;
}

// ============================================
// TELEGRAM API
// ============================================
async function sendTelegramMessage(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.substring(0, 4096),
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.error('Error enviando mensaje:', e);
  }
}

// ============================================
// PROCESADOR DE MENSAJES (OpenClaw style)
// ============================================
async function processMessage(update) {
  if (!update.message?.text) return;
  
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'Usuario';
  
  console.log(`[${new Date().toISOString()}] ${userName}: ${text}`);
  
  // Guardar en memoria
  await saveMemory(userId, 'lastSeen', Date.now());
  await saveMemory(userId, 'name', userName);
  
  // Agregar a historial de conversación
  const conversation = await getMemory(userId, 'conversation') || [];
  conversation.push({ role: 'user', content: text, timestamp: Date.now() });
  if (conversation.length > 20) conversation.shift();
  
  // COMANDOS
  const lower = text.toLowerCase();
  
  if (lower.startsWith('/')) {
    const parts = text.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    
    switch(cmd) {
      case '/start':
        await sendTelegramMessage(chatId, 
          `¡Hola ${userName}! 👋\n\n` +
          `Soy *Sofia CLOUD* v7.0\n` +
          `✅ 100% Gratis\n` +
          `☁️ Cloud 24/7 (Sin tu PC)\n` +
          `🧠 Memoria tipo OpenClaw\n\n` +
          `\`/buscar\` [tema] - Buscar web\n` +
          `\`/clima\` [ciudad] - Clima\n` +
          `\`/noticias\` [tema] - Noticias\n` +
          `\`/memoria\` - Ver tus datos\n\n` +
          `O escribe normal y converso con IA.`
        );
        break;
        
      case '/buscar':
        if (args) {
          await sendTelegramMessage(chatId, `🔍 Buscando "${args}"...`);
          const search = await webSearch(args);
          if (search.success) {
            const results = search.results.map((r, i) => 
              `${i+1}. [${r.title}](${r.url})`.replace(/\[/g, '⟦').replace(/\]/g, '⟧').replace(/\(/g, '⟨').replace(/\)/g, '⟩')
            ).join('\n').slice(0, 4000);
            await sendTelegramMessage(chatId, `🔍 *Resultados:*\n${results}`);
          } else {
            await sendTelegramMessage(chatId, '❌ Error en búsqueda');
          }
        }
        break;
        
      case '/clima':
        if (args) {
          await sendTelegramMessage(chatId, `🌤️ Consultando ${args}...`);
          const weather = await getWeather(args);
          if (weather.success) {
            await sendTelegramMessage(chatId, `🌤️ *Clima en ${args}:*\n${weather.weather}`);
          }
        }
        break;
        
      case '/noticias':
        const query = args || 'tecnología';
        await sendTelegramMessage(chatId, `📰 Buscando noticias sobre "${query}"...`);
        const news = await getNews(query);
        if (news.success && news.articles.length > 0) {
          const headlines = news.articles.slice(0, 5).map((a, i) => 
            `${i+1}. ${a.title}`
          ).join('\n');
          await sendTelegramMessage(chatId, `📰 *Noticias:*\n${headlines}`);
        }
        break;
        
      case '/memoria':
        const mem = await getAllMemory(userId);
        const memText = mem.map(e => `• ${e.key}: ${JSON.stringify(e.value).slice(0, 50)}`).join('\n') || 'Nada guardado aún';
        await sendTelegramMessage(chatId, `🧠 *Tu memoria:*\n${memText}`);
        break;
        
      case '/recordar':
        const reminderParts = args.split(' ');
        const minutes = parseInt(reminderParts[0]);
        const reminder = reminderParts.slice(1).join(' ');
        if (minutes && reminder) {
          await saveMemory(userId, `reminder_${Date.now()}`, { text: reminder, when: Date.now() + minutes * 60000 });
          await sendTelegramMessage(chatId, `⏰ Recordatorio en ${minutes} min: "${reminder}"`);
        }
        break;
        
      default:
        // Comando desconocido, pasar a IA
        await handleAI(chatId, text, userId, userName, conversation);
    }
  } else {
    // Conversación natural
    await handleAI(chatId, text, userId, userName, conversation);
  }
  
  // Guardar conversación actualizada
  await saveMemory(userId, 'conversation', conversation);
}

async function handleAI(chatId, text, userId, userName, conversation) {
  // Verificar intenciones específicas
  const lower = text.toLowerCase();
  
  // Auto-detectar búsquedas
  if (lower.includes('busca') || lower.includes('google') || lower.includes('buscar')) {
    const query = text.replace(/busca|buscar|google/gi, '').trim();
    await sendTelegramMessage(chatId, `🔍 Dame un momento que busco "${query}"...`);
    const search = await webSearch(query);
    if (search.success) {
      const results = search.results.slice(0, 3).map(r => `• ${r.title}: ${r.url}`).join('\n');
      await sendTelegramMessage(chatId, `Aquí está lo que encontré:\n${results}`);
      return;
    }
  }
  
  // Auto-detectar clima
  if (lower.includes('clima') || lower.includes('temperatura') || lower.includes('tiempo hace')) {
    const city = lower.includes('queretaro') ? 'Queretaro' : 
                 lower.includes('cdmx') ? 'Mexico City' : 'Queretaro';
    const weather = await getWeather(city);
    if (weather.success) {
      await sendTelegramMessage(chatId, `\n🌤️ En ${city}: ${weather.weather}\n\n¿Te puedo ayudar con algo más?`);
      return;
    }
  }
  
  // IA General
  await sendTelegramMessage(chatId, '💭 Sofia está pensando...');
  
  const response = await askAI(conversation);
  await sendTelegramMessage(chatId, response);
}

// ============================================
// WEBHOOK HANDLER (Para Deno Deploy / Cloudflare)
// ============================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'Sofia CLOUD v7.0',
        uptime: '24/7',
        cost: '$0.00',
        memory: 'Cloud KV',
        ai: 'OpenRouter (Gratis)'
      }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Webhook de Telegram
    if (url.pathname === '/webhook') {
      if (request.method === 'POST') {
        try {
          const update = await request.json();
          
          // Procesar asíncrono (fire-and-forget)
          this.ctx?.waitUntil?.(processMessage(update));
          
          // Responder inmediatamente a Telegram (evita timeout)
          return new Response('OK', { status: 200 });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Error', { status: 500 });
        }
      }
      
      // Setup webhook (GET)
      if (request.method === 'GET') {
        const webhookUrl = url.searchParams.get('url');
        if (webhookUrl) {
          const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${webhookUrl}`);
          const result = await res.json();
          return new Response(JSON.stringify(result, null, 2), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      return new Response('Use POST for updates or ?url= for setup');
    }
    
    return new Response('Sofia Cloud Online', { status: 404 });
  },
  
  // Scheduled tasks (Heartbeat)
  async scheduled(controller, env, ctx) {
    await runHeartbeat();
  }
};

// Para testing local con Node.js
if (typeof Deno === 'undefined') {
  console.log('Sofia CLOUD - Versión Serverless');
  console.log('Este archivo se despliega en Deno Deploy o Cloudflare Workers');
  console.log('Local: Usa el polling con SOFIA-PRO.js');
}

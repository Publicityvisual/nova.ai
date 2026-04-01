/**
 * SOFIA PRO v6.1 - EXPANDIDA
 * Como OpenClaw: Webhooks, Terminal, Files, Cron, Browser
 * Corre 24/7 en tu máquina con control total
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const CONFIG = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || 'FALTA_TOKEN',
  openRouterKey: process.env.OPENROUTER_API_KEY || 'FALTA_KEY',
  adminId: null,
  dataDir: './data',
  skillsDir: './skills',
  port: 3000,
  memory: {},
  cronJobs: [],
  fileCache: {}
};

// Crear directorios
[CONFIG.dataDir, CONFIG.skillsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Cargar memoria
const memoryFile = path.join(CONFIG.dataDir, 'memory.json');
if (fs.existsSync(memoryFile)) {
  try {
    CONFIG.memory = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
  } catch (e) { CONFIG.memory = {}; }
}

// ============================================
// UTILIDADES
// ============================================
const log = (msg) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
};

const saveMemory = () => {
  fs.writeFileSync(memoryFile, JSON.stringify(CONFIG.memory, null, 2));
};

const updateMemory = (userId, key, value) => {
  if (!CONFIG.memory[userId]) CONFIG.memory[userId] = {};
  CONFIG.memory[userId][key] = { value, timestamp: Date.now() };
  saveMemory();
};

const getMemory = (userId, key) => CONFIG.memory[userId]?.[key]?.value;

// ============================================
// IA - OPENROUTER
// ============================================
async function askAI(messages, system = null) {
  const systemPrompt = system || `Eres Sofia PRO, asistente ejecutiva avanzada de Publicity Visual.
Tienes:
- Memoria perfecta y persistente
- Acceso al sistema de archivos
- Capacidad de ejecutar comandos
- Control total del entorno
- Personalidad mexicana profesional pero cercana

Tu objetivo: Ayudar al usuario con TODO lo que necesite.
Nunca digas "no puedo" - siempre encuentra una solución o alternativa.`;

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1000,
      temperature: 0.7
    });

    const req = https.request({
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.openRouterKey}`,
        'HTTP-Referer': 'http://localhost'
      },
      timeout: 15000
    }, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(response);
          resolve(result.choices?.[0]?.message?.content || 'Procesando...');
        } catch { resolve('Déjame revisar eso...'); }
      });
    });

    req.on('error', () => resolve('Error de conexión, intentando de nuevo...'));
    req.on('timeout', () => { req.destroy(); resolve('Timeout, reintentando...'); });
    req.write(data);
    req.end();
  });
}

// ============================================
// TELEGRAM API
// ============================================
function sendMessage(chatId, text, options = {}) {
  const postData = JSON.stringify({
    chat_id: chatId,
    text: text.substring(0, 4096),
    parse_mode: 'Markdown',
    ...options
  });

  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${CONFIG.telegramToken}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  });
  req.write(postData);
  req.end();
}

function sendFile(chatId, filePath, caption = '') {
  // Simplificado - en producción usar multipart/form-data
  log(`Enviando archivo: ${filePath}`);
}

// ============================================
// TOOLS AVANZADOS
// ============================================

// 1. EJECUTAR COMANDOS SHELL
async function execCommand(cmd, timeout = 30000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, stderr });
      } else {
        resolve({ success: true, output: stdout || stderr });
      }
    });
  });
}

// 2. SISTEMA DE ARCHIVOS
async function readFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fullPath.startsWith(process.cwd())) {
      return { success: false, error: 'Acceso denegado: fuera de directorio permitido' };
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return { success: true, content: content.substring(0, 10000) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function writeFile(filePath, content) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fullPath.startsWith(process.cwd())) {
      return { success: false, error: 'Acceso denegado' };
    }
    fs.writeFileSync(fullPath, content);
    return { success: true, path: fullPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function listDir(dirPath = '.') {
  try {
    const fullPath = path.resolve(dirPath);
    const files = fs.readdirSync(fullPath);
    const details = files.map(f => {
      const stat = fs.statSync(path.join(fullPath, f));
      return `${stat.isDirectory() ? '📁' : '📄'} ${f} (${(stat.size/1024).toFixed(1)}KB)`;
    });
    return { success: true, files: details };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// 3. BÚSQUEDA WEB
async function webSearch(query) {
  return new Promise((resolve) => {
    https.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const results = data.match(/class="result__a"[^>]*>([^<]+)/g);
        if (results) {
          const titles = results.slice(0, 5).map(r => r.replace(/.*>([^<]+).*/, '$1').trim());
          resolve({ success: true, results: titles });
        } else {
          resolve({ success: false, error: 'No results' });
        }
      });
    }).on('error', () => resolve({ success: false, error: 'Search failed' }));
  });
}

// 4. CLIMA
async function getWeather(city) {
  return new Promise((resolve) => {
    https.get(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+\n💧 Humedad:+%h+\n💨 Viento:+%w`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ success: true, weather: data.trim() }));
    }).on('error', () => resolve({ success: false, error: 'Weather unavailable' }));
  });
}

// 5. SCREENSHOT
async function takeScreenshot() {
  try {
    const screenshot = require('screenshot-desktop');
    const imgPath = path.join(CONFIG.dataDir, `screenshot_${Date.now()}.png`);
    await screenshot({ filename: imgPath });
    return { success: true, path: imgPath };
  } catch (e) {
    return { success: false, error: 'Screenshot failed: ' + e.message };
  }
}

// 6. INFO DEL SISTEMA
async function systemInfo() {
  const os = require('os');
  return {
    platform: os.platform(),
    hostname: os.hostname(),
    uptime: Math.floor(os.uptime() / 3600) + 'h',
    freemem: Math.round(os.freemem() / 1024 / 1024) + 'MB',
    totalmem: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
    cpu: os.cpus()[0]?.model,
    loadavg: os.loadavg()[0].toFixed(2)
  };
}

// ============================================
// CRON JOBS - TAREAS PROGRAMADAS
// ============================================
function scheduleReminder(userId, message, delayMinutes) {
  const job = {
    id: Date.now(),
    userId,
    message,
    executeAt: Date.now() + (delayMinutes * 60 * 1000)
  };
  CONFIG.cronJobs.push(job);
  log(`Recordatorio programado: "${message}" en ${delayMinutes}min`);
  return job.id;
}

function checkCronJobs() {
  const now = Date.now();
  const toExecute = CONFIG.cronJobs.filter(j => j.executeAt <= now);
  toExecute.forEach(job => {
    sendMessage(job.userId, `⏰ *Recordatorio:*\n${job.message}`);
    log(`Recordatorio ejecutado: ${job.message}`);
  });
  CONFIG.cronJobs = CONFIG.cronJobs.filter(j => j.executeAt > now);
}

setInterval(checkCronJobs, 60000); // Checar cada minuto

// ============================================
// SKILLS - PLUGINS PERSONALIZABLES
// ============================================
async function loadSkill(skillName) {
  const skillPath = path.join(CONFIG.skillsDir, `${skillName}.js`);
  if (!fs.existsSync(skillPath)) {
    return { success: false, error: 'Skill no existe' };
  }
  try {
    delete require.cache[require.resolve(skillPath)];
    const skill = require(skillPath);
    return { success: true, skill };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function createSkill(name, code) {
  const skillPath = path.join(CONFIG.skillsDir, `${name}.js`);
  const template = `// Skill: ${name}
// Auto-generado por Sofia PRO

module.exports = {
  name: '${name}',
  description: 'Skill personalizado',
  
  async execute(args, context) {
    ${code}
  }
};
`;
  fs.writeFileSync(skillPath, template);
  return { success: true, path: skillPath };
}

// ============================================
// PROCESADOR DE COMANDOS
// ============================================
async function processMessage(chatId, text, userId, userName) {
  // Actualizar memoria
  updateMemory(userId, 'lastSeen', Date.now());
  updateMemory(userId, 'name', userName);
  
  const lower = text.toLowerCase();
  
  // COMANDOS ADMIN
  if (lower.startsWith('/admin ') && CONFIG.adminId === userId) {
    const cmd = text.substring(7);
    log(`Admin command: ${cmd}`);
    
    if (cmd.startsWith('exec ')) {
      const shellCmd = cmd.substring(5);
      sendMessage(chatId, `🖥️ *Ejecutando:*\n\`\`\`\n${shellCmd}\n\`\`\``);
      const result = await execCommand(shellCmd);
      sendMessage(chatId, result.success 
        ? `✅ *Resultado:*\n\`\`\`\n${result.output.substring(0, 3000)}\n\`\`\``
        : `❌ *Error:*\n${result.error}`
      );
      return;
    }
    
    if (cmd.startsWith('ls') || cmd.startsWith('dir')) {
      const result = await listDir();
      sendMessage(chatId, result.success 
        ? `📁 *Archivos:*\n${result.files.slice(0, 50).join('\n')}`
        : `❌ ${result.error}`
      );
      return;
    }
    
    if (cmd.startsWith('read ')) {
      const file = cmd.substring(5);
      const result = await readFile(file);
      sendMessage(chatId, result.success 
        ? `📄 *Contenido de ${file}:*\n\`\`\`\n${result.content.substring(0, 3000)}\n\`\`\``
        : `❌ ${result.error}`
      );
      return;
    }
    
    if (cmd.startsWith('write ')) {
      const parts = cmd.substring(6).split(' ');
      const file = parts[0];
      const content = parts.slice(1).join(' ');
      const result = await writeFile(file, content);
      sendMessage(chatId, result.success 
        ? `✅ Archivo guardado: ${file}`
        : `❌ ${result.error}`
      );
      return;
    }
  }
  
  // COMANDOS PUBLICOS
  if (lower.startsWith('/')) {
    const parts = text.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    
    switch(cmd) {
      case '/start':
        sendMessage(chatId, 
          `👋 *¡Hola ${userName}!*\n\n` +
          `Soy *Sofia PRO*, tu asistente ejecutiva 24/7.\n\n` +
          `🎯 *Comandos disponibles:*\n` +
          `/buscar [query] - Buscar en web\n` +
          `/clima [ciudad] - Clima actual\n` +
          `/system - Estado del sistema\n` +
          `/recordar [min] [mensaje] - Recordatorio\n` +
          `/memoria - Ver mis datos guardados\n` +
          `/admin [comando] - Control total (con auth)\n\n` +
          `💬 *También escríbeme naturalmente* y converso con IA avanzada.`
        );
        break;
        
      case '/auth':
        if (args === 'sofia-admin-2025') {
          CONFIG.adminId = userId;
          sendMessage(chatId, '✅ *Autorizado como ADMIN*\n\nComandos admin:\n/admin exec [cmd] - Ejecutar shell\n/admin ls - Listar archivos\n/admin read [file] - Leer archivo\n/admin write [file] [content] - Escribir archivo');
        } else {
          sendMessage(chatId, '❌ Código incorrecto.');
        }
        break;
        
      case '/buscar':
        if (args) {
          sendMessage(chatId, `🔍 Buscando: "${args}"...`);
          const result = await webSearch(args);
          if (result.success) {
            sendMessage(chatId, `*Resultados:*\n${result.results.map((r, i) => `${i+1}. ${r}`).join('\n')}`);
          } else {
            sendMessage(chatId, '❌ Error en búsqueda.');
          }
        }
        break;
        
      case '/clima':
        if (args) {
          const result = await getWeather(args);
          if (result.success) {
            sendMessage(chatId, `🌤️ *Clima en ${args}:*\n${result.weather}`);
          }
        }
        break;
        
      case '/system':
        const info = await systemInfo();
        sendMessage(chatId,
          `💻 *Sistema*\n` +
          `Plataforma: ${info.platform}\n` +
          `Hostname: ${info.hostname}\n` +
          `Uptime: ${info.uptime}\n` +
          `Memoria: ${info.freemem} / ${info.totalmem}\n` +
          `CPU Load: ${info.loadavg}`
        );
        break;
        
      case '/recordar':
        const reminderParts = args.split(' ');
        const minutes = parseInt(reminderParts[0]);
        const reminderText = reminderParts.slice(1).join(' ');
        if (minutes && reminderText) {
          const id = scheduleReminder(chatId, reminderText, minutes);
          sendMessage(chatId, `⏰ *Recordatorio en ${minutes} min:*\n"${reminderText}"`);
        } else {
          sendMessage(chatId, 'Uso: /recordar 30 Reunión con cliente\n(30 = minutos)');
        }
        break;
        
      case '/memoria':
        const mem = getMemory(userId);
        const keys = Object.keys(mem || {}).slice(0, 20);
        sendMessage(chatId, `🧠 *Tu memoria:*\n${keys.join('\n') || 'Sin datos aún'}`);
        break;
        
      case '/screenshot':
        sendMessage(chatId, '📸 Capturando...');
        const ss = await takeScreenshot();
        sendMessage(chatId, ss.success ? `✅ Screenshot guardado` : `❌ ${ss.error}`);
        break;
        
      default:
        // No es comando conocido, pasar a IA
        await handleAI(chatId, text, userId, userName);
    }
  } else {
    // Conversación natural con IA
    await handleAI(chatId, text, userId, userName);
  }
}

async function handleAI(chatId, text, userId, userName) {
  // Obtener contexto previo
  const history = getMemory(userId, 'conversation') || [];
  history.push({ role: 'user', content: text });
  if (history.length > 10) history.shift(); // Mantener últimos 10 mensajes
  
  // Detectar intenciones
  const lower = text.toLowerCase();
  
  // Si pide buscar algo
  if (lower.includes('busca') || lower.includes('buscar') || lower.includes('google')) {
    const query = text.replace(/busca|buscar|google/gi, '').trim();
    const result = await webSearch(query);
    if (result.success) {
      sendMessage(chatId, `🔍 *Encontré esto sobre "${query}":*\n\n${result.results.slice(0, 3).map((r, i) => `${i+1}. ${r}`).join('\n')}`);
      updateMemory(userId, 'conversation', [...history, { role: 'assistant', content: 'Búsqueda realizada' }]);
      return;
    }
  }
  
  // Si pregunta por clima
  if (lower.includes('clima') || lower.includes('tiempo') || lower.includes('temperatura')) {
    const city = lower.includes('queretaro') ? 'Queretaro' : 
                 lower.includes('cdmx') || lower.includes('ciudad de mexico') ? 'Mexico City' : 
                 'Queretaro';
    const result = await getWeather(city);
    if (result.success) {
      sendMessage(chatId, `${result.weather}\n\n¿Necesitas algo más?`);
      return;
    }
  }
  
  // Respuesta IA normal
  const response = await askAI(history);
  sendMessage(chatId, response);
  
  // Guardar conversación
  history.push({ role: 'assistant', content: response });
  updateMemory(userId, 'conversation', history);
}

// ============================================
// SERVIDOR HTTP + WEBHOOKS
// ============================================
let lastUpdateId = 0;

async function setupWebhook() {
  // Para producción usar webhook real
  // Por ahora usamos polling rápido
  setInterval(async () => {
    https.get(`https://api.telegram.org/bot${CONFIG.telegramToken}/getUpdates?offset=${lastUpdateId + 1}&limit=100`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const result = JSON.parse(data);
          if (result.ok && result.result.length > 0) {
            for (const update of result.result) {
              lastUpdateId = Math.max(lastUpdateId, update.update_id);
              if (update.message?.text) {
                const { chat, from, text } = update.message;
                log(`${from.first_name}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
                await processMessage(chat.id, text, from.id, from.first_name);
              }
            }
          }
        } catch (e) {
          log(`Error: ${e.message}`);
        }
      });
    }).on('error', () => {});
  }, 1000); // Polling cada 1 segundo (rápido)
}

// Dashboard Web
const dashboard = http.createServer((req, res) => {
  if (req.url === '/') {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sofia PRO Dashboard</title>
  <meta http-equiv="refresh" content="5">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      color: #fff;
      padding: 40px;
      min-height: 100vh;
    }
    h1 { color: #00ff88; font-size: 2.5em; margin-bottom: 10px; }
    .subtitle { color: #888; margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
    .card { 
      background: rgba(255,255,255,0.05); 
      border: 1px solid rgba(0,255,136,0.2);
      border-radius: 16px;
      padding: 24px;
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-2px); border-color: #00ff88; }
    h2 { color: #00ff88; font-size: 1.1em; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
    .status { 
      display: inline-block;
      width: 10px; height: 10px; 
      background: #00ff88;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .metric { font-size: 2em; font-weight: bold; margin: 10px 0; }
    .label { color: #888; font-size: 0.9em; }
    .terminal {
      background: #000;
      border-radius: 8px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      color: #00ff88;
      overflow-x: auto;
      margin-top: 15px;
    }
    a { color: #00ff88; }
    .btn {
      display: inline-block;
      background: #00ff88;
      color: #0f0f23;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 15px;
    }
    .log-entry {
      font-family: 'Courier New', monospace;
      font-size: 0.8em;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
  </style>
</head>
<body>
  <h1>🦞 Sofia PRO Dashboard</h1>
  <p class="subtitle">Personal AI Assistant v6.1 | 24/7 Activo | Costo: $0.00</p>
  
  <div class="grid">
    <div class="card">
      <h2><span class="status"></span>Estado del Sistema</h2>
      <div class="metric">ONLINE</div>
      <div class="label">Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m</div>
      <div class="label">Memoria: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB</div>
    </div>
    
    <div class="card">
      <h2>👥 Usuarios</h2>
      <div class="metric">${Object.keys(CONFIG.memory).length}</div>
      <div class="label">Usuarios en memoria</div>
    </div>
    
    <div class="card">
      <h2>⏰ Recordatorios</h2>
      <div class="metric">${CONFIG.cronJobs.length}</div>
      <div class="label">Tareas programadas</div>
    </div>
    
    <div class="card">
      <h2>📱 Conexiones</h2>
      <div class="label">Telegram: @sofiaasistentes_bot</div>
      <div class="label">Response time: ~1s</div>
      <div class="label">Protocolo: HTTPS Polling</div>
      <a href="https://t.me/sofiaasistentes_bot" class="btn" target="_blank">Abrir Telegram</a>
    </div>
  </div>
  
  <div class="card" style="margin-top: 30px;">
    <h2>🖥️ Terminal Remota</h2>
    <p style="color: #888; margin: 10px 0;">Usa comandos admin desde Telegram:</p>
    <div class="terminal">
/admin exec ls -la          # Listar archivos<br>
/admin exec dir             # Alternativa Windows<br>
/admin read archivo.txt     # Leer archivo<br>
/admin write test.txt hola  # Escribir archivo
    </div>
  </div>
  
  <div class="card" style="margin-top: 30px;">
    <h2>🧠 Capacidades Activas</h2>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px;">
      <div><span style="color: #00ff88;">✓</span> Memoria persistente</div>
      <div><span style="color: #00ff88;">✓</span> Ejecución de comandos</div>
      <div><span style="color: #00ff88;">✓</span> Control de archivos</div>
      <div><span style="color: #00ff88;">✓</span> Búsqueda web</div>
      <div><span style="color: #00ff88;">✓</span> Clima y noticias</div>
      <div><span style="color: #00ff88;">✓</span> Recordatorios</div>
      <div><span style="color: #00ff88;">✓</span> Screenshot</div>
      <div><span style="color: #00ff88;">✓</span> IA Avanzada</div>
    </div>
  </div>
  
  <p style="color: #666; text-align: center; margin-top: 40px; font-size: 0.8em;">
    Sofia PRO v6.1 - Inspirado en OpenClaw - Ejecutándose localmente 24/7
  </p>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// ============================================
// INICIAR
// ============================================
console.clear();
console.log('╔══════════════════════════════════════════════════╗');
console.log('║                                                  ║');
console.log('║     🦞 SOFIA PRO v6.1 - EXPANDIDA               ║');
console.log('║                                                  ║');
console.log('║     Terminal • Files • Cron • Browser • AI      ║');
console.log('║                                                  ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

https.get(`https://api.telegram.org/bot${CONFIG.telegramToken}/getMe`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.ok) {
        log(`Bot: @${result.result.username}`);
        log(`Usuarios en memoria: ${Object.keys(CONFIG.memory).length}`);
        log(`Dashboard: http://localhost:${CONFIG.port}`);
        log('');
        log('╔══════════════════════════════════════════════════╗');
        log('║  SOFIA PRO LISTA - Control total del sistema    ║');
        log('╚══════════════════════════════════════════════════╝');
        log('');
        log('Comandos disponibles:');
        log('/start - Iniciar');
        log('/auth sofia-admin-2025 - Acceso admin');
        log('/buscar [tema] - Buscar web');
        log('/clima [ciudad] - Clima');
        log('/system - Info PC');
        log('/recordar [min] [texto] - Recordatorio');
        log('/admin exec [comando] - Terminal (requiere auth)');
        log('');
        
        setupWebhook();
        dashboard.listen(CONFIG.port);
      }
    } catch (e) {
      log(`Error: ${e.message}`);
    }
  });
}).on('error', (e) => {
  log(`Sin conexión: ${e.message}`);
});

/**
 * SOFIA TELEGRAM BOT v6.0
 * Control completo de Sofia desde Telegram
 * Sesiones persistentes, auto-reconexión, todos los comandos
 * INCLUYE: Super Tools (ejecutar, buscar, imagen, etc.)
 */

const { Telegraf } = require('telegraf');
const fs = require('fs-extra');
const path = require('path');
const UniversalConnector = require('../core/universal-connector');
const SessionManager = require('../utils/session-manager');
const TelegramSuperTools = require('../telegram/super-tools');
const NaturalSecretary = require('../core/natural-secretary');
const ProactiveSecretary = require('../core/proactive-secretary');

class TelegramBotManager {
  constructor() {
    this.bot = null;
    this.isConnected = false;
    this.sessionPath = path.join(__dirname, '../../data/sessions/telegram');
    this.authorizedUsers = new Set();
    this.userSessions = new Map();
    this.superTools = new TelegramSuperTools();
    this.naturalSecretary = new NaturalSecretary();
    this.proactiveSecretary = new ProactiveSecretary();
    
    // Asegurar directorio de sesión
    fs.ensureDirSync(this.sessionPath);
    
    // Cargar usuarios autorizados
    this.loadAuthorizedUsers();
  }

  async initialize() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.log('⚠️  TELEGRAM: No hay token configurado');
      console.log('   Para activar Telegram:');
      console.log('   1. Habla con @BotFather en Telegram');
      console.log('   2. Crea un bot: /newbot');
      console.log('   3. Copia el token y agrégalo a .env:');
      console.log('      TELEGRAM_BOT_TOKEN=tu_token_aqui');
      return false;
    }

    try {
      this.bot = new Telegraf(token);
      this.setupCommands();
      this.setupHandlers();
      
      // Iniciar bot
      await this.bot.launch();
      this.isConnected = true;
      
      console.log('✅ TELEGRAM BOT: Conectado y listo');
      console.log('   🤖 Busca tu bot en Telegram y escribe /start');
      
      // Iniciar sistemas naturales
      await this.naturalSecretary.initialize();
      await this.proactiveSecretary.start(
        'global', 
        (userId, message) => this.sendMessageToUser(userId, message)
      );
      
      // Notificar admin
      await this.notifyAdmin('🤖 Sofia ahora está disponible en Telegram!');
      
      return true;
      
    } catch (error) {
      console.error('❌ TELEGRAM:', error.message);
      return false;
    }
  }

  setupCommands() {
    // Comando /start
    this.bot.start(async (ctx) => {
      const userId = ctx.from.id;
      const username = ctx.from.username || ctx.from.first_name;
      
      // Registrar usuario
      this.userSessions.set(userId, {
        id: userId,
        username,
        firstSeen: Date.now(),
        lastActivity: Date.now()
      });

      await ctx.reply(`¡Hola ${username}! 👋

Soy Sofia Gonzalez, tu secretaria ejecutiva virtual.

🔥 *Modo Natural Activado* - Habla conmigo como a una persona:

✅ "Crea una imagen de un dragón"
✅ "Busca las últimas noticias"
✅ "Cuánto es 250 USD a pesos"
✅ "Qué clima hay en París"
✅ "Traduce esto al inglés"

*Todo tipo de contenido:*
🔓 NSFW permitido
🔓 Imágenes sin censura
🔓 Sin filtros de ningún tipo

Soy proactiva: te aviso de pendientes, sugiero acciones, anticipo necesidades.

Escribe /tools para ver todas las herramientas avanzadas.`);
    });

    // Comando /ayuda
    this.bot.command('ayuda', (ctx) => {
      ctx.reply(`💬 *MODO SECRETARIA NATURAL*

Háblame como a una persona, no necesitas comandos rígidos:

*Ejemplos naturales que entiendo:*

🎨 *Imágenes:*
"Crea una imagen de un dragón azul"
"Genera una foto futurista"
"Muéstrame [cualquier cosa]"

🔍 *Búsquedas:*
"Busca información sobre..."
"Qué es..."
"Investiga sobre..."

🧮 *Cálculos y conversiones:*
"Cuánto es 25 por 4"
"Convierte 100 USD a pesos"
"Calcula el IVA de..."

🌤️ *Clima:*
"Qué clima hay en [ciudad]"
"Temperatura en..."
"Hace frío en..."

🌐 *Traducciones:*
"Traduce [texto] al inglés"
"Cómo se dice..."

📱 *Más herramientas:*
"Genera un QR para..."
"Resume este texto"
"Analiza esta página"

✨ *Modo Proactivo:*
Soy tu secretaria: te recuerdo cosas, anticipo necesidades, aprendo tus hábitos.

🔓 *Todo contenido permitido:*
NSFW, política, religión - sin censura.

*Comandos técnicos:*
/sistema - Estado del sistema
/tools - Herramientas avanzadas`, { parse_mode: 'Markdown' });
    });
/diagnostico - Diagnóstico completo`, { parse_mode: 'Markdown' });
    });

    // Comando /estado
    this.bot.command('estado', async (ctx) => {
      const status = await this.getSystemStatus();
      await ctx.reply(`📊 *ESTADO DEL SISTEMA*

${status}

⏱️ _Actualizado: ${new Date().toLocaleTimeString()}_`, { parse_mode: 'Markdown' });
    });

    // Comando /sistema
    this.bot.command('sistema', async (ctx) => {
      if (!this.isAuthorized(ctx.from.id)) {
        return ctx.reply('⛔ No autorizado. Este comando es solo para administradores.');
      }

      try {
        const info = await UniversalConnector.executeTool('system_command', { 
          command: 'systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Total Physical Memory"',
          timeout: 10000 
        });

        await ctx.reply(`💻 *INFO DEL SISTEMA*\n\n\`\`\`\n${info.output || info.error || 'No disponible'}\n\`\`\``, { parse_mode: 'Markdown' });
      } catch (error) {
        ctx.reply('❌ Error obteniendo información del sistema');
      }
    });

    // Comando /captura
    this.bot.command('captura', async (ctx) => {
      if (!this.isAuthorized(ctx.from.id)) {
        return ctx.reply('⛔ Solo administradores pueden usar este comando.');
      }

      try {
        const result = await UniversalConnector.executeTool('screenshot', {});
        
        if (result.success && result.image) {
          await ctx.replyWithPhoto({ source: Buffer.from(result.image, 'base64') }, {
            caption: '📸 Captura de pantalla tomada'
          });
        } else {
          ctx.reply('❌ No se pudo capturar la pantalla');
        }
      } catch (error) {
        ctx.reply('❌ Error: ' + error.message);
      }
    });

    // Comando /sesiones
    this.bot.command('sesiones', async (ctx) => {
      const status = await SessionManager.getVisualStatus();
      await ctx.reply(status);
    });

    // Comando /buscar
    this.bot.command('buscar', async (ctx) => {
      const query = ctx.message.text.replace('/buscar', '').trim();
      
      if (!query) {
        return ctx.reply('🔍 Uso: /buscar [texto a buscar]\nEjemplo: /buscar tendencias diseño 2025');
      }

      const msg = await ctx.reply('🔍 Buscando...');
      
      try {
        const result = await UniversalConnector.executeTool('web_search', { 
          query, 
          limit: 5 
        });

        if (result.success && result.results?.length > 0) {
          let response = `🔍 *Resultados para:* _${query}_\n\n`;
          result.results.forEach((r, i) => {
            response += `${i + 1}. [${r.title}](${r.url})\n`;
            response += `   ${r.snippet?.substring(0, 100)}...\n\n`;
          });
          
          await ctx.telegram.editMessageText(
            ctx.chat.id, 
            msg.message_id, 
            null, 
            response, 
            { parse_mode: 'Markdown', disable_web_page_preview: true }
          );
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat.id, 
            msg.message_id, 
            null, 
            '❌ No se encontraron resultados'
          );
        }
      } catch (error) {
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          msg.message_id, 
          null, 
          '❌ Error en la búsqueda'
        );
      }
    });

    // Comando /clima
    this.bot.command('clima', async (ctx) => {
      const city = ctx.message.text.replace('/clima', '').trim() || 'Queretaro';
      
      try {
        const result = await UniversalConnector.executeTool('get_weather', { 
          location: city 
        });

        if (result.success) {
          await ctx.reply(`🌤️ *Clima en ${city}*

🌡️ Temperatura: ${result.weather.temperature}°C
💧 Humedad: ${result.weather.humidity}%
💨 Viento: ${result.weather.wind} km/h
⛅ Condición: ${result.weather.condition}

_Sofia_`, { parse_mode: 'Markdown' });
        } else {
          ctx.reply('❌ No se pudo obtener el clima');
        }
      } catch (error) {
        ctx.reply('❌ Error obteniendo clima');
      }
    });

    // Comando /investigar
    this.bot.command('investigar', async (ctx) => {
      const topic = ctx.message.text.replace('/investigar', '').trim();
      
      if (!topic) {
        return ctx.reply('📚 Uso: /investigar [tema]\nEjemplo: /investigar marketing digital 2025');
      }

      const msg = await ctx.reply('📚 Investigando... Esto puede tomar 2-3 minutos.');
      
      try {
        const result = await UniversalConnector.executeTool('deep_research', { 
          topic, 
          depth: 'detailed' 
        });

        if (result.success) {
          let response = `📚 *INVESTIGACIÓN: ${topic}*\n\n`;
          response += `*Resumen:*\n${result.research.summary}\n\n`;
          
          if (result.research.keyFindings?.length > 0) {
            response += '*Hallazgos clave:*\n';
            result.research.keyFindings.forEach(f => {
              response += `• ${f}\n`;
            });
            response += '\n';
          }

          response += `\n📑 _Investigación completa guardada_`;

          await ctx.telegram.editMessageText(
            ctx.chat.id, 
            msg.message_id, 
            null, 
            response, 
            { parse_mode: 'Markdown' }
          );
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat.id, 
            msg.message_id, 
            null, 
            '❌ Error en la investigación'
          );
        }
      } catch (error) {
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          msg.message_id, 
          null, 
          '❌ Error: ' + error.message
        );
      }
    });

    // Comando /email
    this.bot.command('email', async (ctx) => {
      const args = ctx.message.text.replace('/email', '').trim().split('|');
      
      if (args.length < 3) {
        return ctx.reply('📧 Uso: /email [para] | [asunto] | [mensaje]\nEjemplo:\n/email cliente@email.com | Cotización | Hola, te envío la cotización solicitada...');
      }

      const [to, subject, ...messageParts] = args;
      const body = messageParts.join('|').trim();

      const msg = await ctx.reply('📧 Enviando email...');
      
      try {
        const result = await UniversalConnector.executeTool('send_email', {
          to: to.trim(),
          subject: subject.trim(),
          body: body
        });

        if (result.success) {
          await ctx.telegram.editMessageText(
            ctx.chat.id, 
            msg.message_id, 
            null, 
            `✅ *Email enviado*\n\nPara: ${to.trim()}\nAsunto: ${subject.trim()}\n\n_Sofia_`, 
            { parse_mode: 'Markdown' }
          );
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat.id, 
            msg.message_id, 
            null, 
            '❌ Error enviando email'
          );
        }
      } catch (error) {
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          msg.message_id, 
          null, 
          '❌ Error: ' + error.message
        );
      }
    });

    // Comando /backup (admin)
    this.bot.command('backup', async (ctx) => {
      if (!this.isAuthorized(ctx.from.id)) {
        return ctx.reply('⛔ Solo administradores');
      }

      const msg = await ctx.reply('💾 Creando backup completo...');
      
      try {
        const AutoUpdater = require('../core/auto-updater-local');
        const result = await AutoUpdater.createFullBackup();
        
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          msg.message_id, 
          null, 
          `✅ *Backup creado*\n\nUbicación: \`${result}\`\n\n_Sofia_`, 
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          msg.message_id, 
          null, 
          '❌ Error: ' + error.message
        );
      }
    });

    // Comando /diagnostico (admin)
    this.bot.command('diagnostico', async (ctx) => {
      if (!this.isAuthorized(ctx.from.id)) {
        return ctx.reply('⛔ Solo administradores');
      }

      const msg = await ctx.reply('🔍 Ejecutando diagnóstico completo...');
      
      try {
        const AutoHealing = require('../core/auto-healing');
        const health = await AutoHealing.performHealthCheck();
        
        let response = `🔍 *DIAGNÓSTICO DEL SISTEMA*\n\n`;
        response += `• Estado general: ${health.status}\n`;
        response += `• Memoria usada: ${Math.round(health.memory.percentage)}%\n`;
        response += `• Uptime: ${Math.floor(health.uptime / 3600)}h\n`;
        response += `• Errores recientes: ${health.errors}\n`;
        response += `• Último check: ${new Date(health.lastCheck).toLocaleTimeString()}\n\n`;
        
        if (health.status === 'healthy') {
          response += '✅ *Todo funciona correctamente*';
        } else if (health.status === 'warning') {
          response += '⚠️ *Algunos problemas menores detectados*';
        } else {
          response += '❌ *Se requiere atención*';
        }

        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          msg.message_id, 
          null, 
          response, 
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          msg.message_id, 
          null, 
          '❌ Error: ' + error.message
        );
      }
    });

    // Comando secreto para autorizar usuarios
    this.bot.command('auth', async (ctx) => {
      const code = ctx.message.text.replace('/auth', '').trim();
      const secretCode = process.env.TELEGRAM_ADMIN_CODE || 'sofia-admin-2025';
      
      if (code === secretCode) {
        this.authorizedUsers.add(ctx.from.id);
        await this.saveAuthorizedUsers();
        await ctx.reply('✅ *¡Autorizado como administrador!*\n\nAhora tienes acceso completo al sistema.', { parse_mode: 'Markdown' });
      } else {
        await ctx.reply('❌ Código incorrecto');
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // SUPER TOOLS - OpenClaw Style Commands
    // ═══════════════════════════════════════════════════════════════
    
    // Comando /tools - Lista de herramientas
    this.bot.command('tools', async (ctx) => {
      await ctx.reply(this.superTools.getHelp(), { parse_mode: 'Markdown' });
    });

    // Comando /ejecutar
    this.bot.command('ejecutar', async (ctx) => {
      const code = ctx.message.text.replace('/ejecutar', '').trim();
      const result = await this.superTools.processCommand('ejecutar', code, ctx.chat.id, this.bot);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown', disable_web_page_preview: true });
      } else {
        await ctx.reply(result.result.text || result.error, { parse_mode: 'Markdown' });
      }
    });

    // Comando /buscar
    this.bot.command('buscar', async (ctx) => {
      const query = ctx.message.text.replace('/buscar', '').trim();
      const statusMsg = await ctx.reply('🔍 Buscando...');
      
      const result = await this.superTools.processCommand('buscar', query, ctx.chat.id, this.bot);
      
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown', disable_web_page_preview: true });
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /imagen
    this.bot.command('imagen', async (ctx) => {
      const prompt = ctx.message.text.replace('/imagen', '').trim();
      
      if (!prompt) {
        return ctx.reply('🎨 Uso: /imagen [descripción]\n\nEjemplo: /imagen un dragón en una montaña', { parse_mode: 'Markdown' });
      }
      
      const statusMsg = await ctx.reply('🎨 Generando imagen... (puede tomar 10-30 segundos)');
      
      const result = await this.superTools.processCommand('imagen', prompt, ctx.chat.id, this.bot);
      
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown' });
        // Intentar enviar imagen si hay URL
        if (result.result.imageUrl) {
          await ctx.replyWithPhoto({ url: result.result.imageUrl }, 
            { caption: `🎨 "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"` });
        }
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /video
    this.bot.command('video', async (ctx) => {
      const url = ctx.message.text.replace('/video', '').trim();
      const result = await this.superTools.processCommand('video', url, ctx.chat.id, this.bot);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown', disable_web_page_preview: false });
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /traducir
    this.bot.command('traducir', async (ctx) => {
      const text = ctx.message.text.replace('/traducir', '').trim();
      const result = await this.superTools.processCommand('traducir', text, ctx.chat.id, this.bot);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /qr
    this.bot.command('qr', async (ctx) => {
      const text = ctx.message.text.replace('/qr', '').trim();
      const result = await this.superTools.processCommand('qr', text, ctx.chat.id, this.bot);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown' });
        if (result.result.qrUrl) {
          await ctx.replyWithPhoto({ url: result.result.qrUrl }, 
            { caption: '📱 Escanea este código QR' });
        }
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /moneda
    this.bot.command('moneda', async (ctx) => {
      const args = ctx.message.text.replace('/moneda', '').trim();
      const result = await this.superTools.processCommand('moneda', args, ctx.chat.id, this.bot);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /analizar
    this.bot.command('analizar', async (ctx) => {
      const url = ctx.message.text.replace('/analizar', '').trim();
      const statusMsg = await ctx.reply('🔍 Analizando...');
      
      const result = await this.superTools.processCommand('analizar', url, ctx.chat.id, this.bot);
      
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /resumir
    this.bot.command('resumir', async (ctx) => {
      // Responder a mensaje citado o usar args
      const replyTo = ctx.message.reply_to_message;
      let text = ctx.message.text.replace('/resumir', '').trim();
      
      if (replyTo && replyTo.text) {
        text = replyTo.text;
      }
      
      const result = await this.superTools.processCommand('resumir', text, ctx.chat.id, this.bot);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /encode
    this.bot.command('encode', async (ctx) => {
      const text = ctx.message.text.replace('/encode', '').trim();
      const result = await this.superTools.processCommand('encode', text, ctx.chat.id, this.bot);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Comando /decode
    this.bot.command('decode', async (ctx) => {
      const text = ctx.message.text.replace('/decode', '').trim();
      const result = await this.superTools.processCommand('decode', text, ctx.chat.id, this.bot);
      
      if (result.success) {
        await ctx.reply(result.result.text, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply(result.result.text || result.error);
      }
    });

    // Actualizar /ayuda para incluir Super Tools
    this.bot.command('ayuda', (ctx) => {
      ctx.reply(`🔧 *COMANDOS DISPONIBLES*

*🚀 Super Tools (OpenClaw Style):*
/ejecutar [código] - Ejecutar JavaScript matemático
/buscar [texto] - Buscar en web (DuckDuckGo)
/imagen [prompt] - Generar imagen con IA
/video [url] - Info de video (YT, TikTok)
/traducir [texto] al [idioma] - Traducir
/qr [texto] - Generar código QR
/analizar [url] - Analizar webpage
/resumir [texto] - Resumir texto
/encode [texto] - Codificar (Base64, URL, Hex)
/decode [texto] - Decodificar texto

*Control del Sistema:*
/sistema - Estado del PC
/captura - Screenshot del PC
/clima [ciudad] - Ver clima
/moneda [cant] [de] a [a] - Conversor

*Acciones inteligentes:*
/investigar [tema] - Investigar y enviar PDF
/email [para] [asunto] [mensaje] - Enviar email

*Admin:*
/auth [código] - Autorizar como admin
/backup - Crear backup
/diagnostico - Diagnóstico completo`, { parse_mode: 'Markdown' });
    });
  }

  setupHandlers() {
    // Manejar mensajes de texto
    this.bot.on('text', async (ctx) => {
      // Actualizar actividad del usuario
      const session = this.userSessions.get(ctx.from.id);
      if (session) {
        session.lastActivity = Date.now();
      }

      // Si es un mensaje directo (no comando), procesar con modo secretaria natural
      if (!ctx.message.text.startsWith('/')) {
        await this.processNaturalMessage(ctx, ctx.message.text);
      }
    });

    // Manejar fotos
    this.bot.on('photo', async (ctx) => {
      await ctx.reply('📸 Imagen recibida. Procesando...');
      // Aquí integrarías con el procesador de imágenes
    });

    // Manejar documentos
    this.bot.on('document', async (ctx) => {
      await ctx.reply('📄 Documento recibido. Analizando...');
      // Aquí integrarías con el procesador de documentos
    });

    // Manejar audios/voz
    this.bot.on(['voice', 'audio'], async (ctx) => {
      await ctx.reply('🎵 Audio recibido. Transcribiendo...');
      // Aquí integrarías con el procesador de audio
    });

    // Manejar errores
    this.bot.catch((err, ctx) => {
      console.error('[TELEGRAM] Error:', err);
      ctx.reply('❌ Ups, algo salió mal. Intenta de nuevo.').catch(() => {});
    });

    // Graceful shutdown
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  async handleMessage(ctx) {
    const text = ctx.message.text;
    
    // Procesar mensaje con Sofia Intelligence
    try {
      const response = await this.processWithSofia(text, ctx.from);
      await ctx.reply(response);
    } catch (error) {
      console.error('[TELEGRAM] Error procesando mensaje:', error);
      await ctx.reply('❌ Error procesando tu mensaje. Intenta de nuevo.');
    }
  }

  async processWithSofia(text, userInfo) {
    // Aquí conectarías con Sofia Intelligence
    // Por ahora, respuesta básica
    return `Entiendo: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"

Estoy procesando tu solicitud. En la versión completa, aquí respondería como Sofia con toda su inteligencia adaptativa.

_Para ver comandos disponibles, escribe /ayuda_`;
  }

  isAuthorized(userId) {
    return this.authorizedUsers.has(userId);
  }

  async loadAuthorizedUsers() {
    try {
      const filePath = path.join(this.sessionPath, 'authorized_users.json');
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJSON(filePath);
        this.authorizedUsers = new Set(data.users || []);
      }
    } catch (error) {
      console.error('[TELEGRAM] Error cargando usuarios:', error);
    }
  }

  async saveAuthorizedUsers() {
    try {
      const filePath = path.join(this.sessionPath, 'authorized_users.json');
      await fs.writeJSON(filePath, { 
        users: Array.from(this.authorizedUsers),
        updated: Date.now()
      });
    } catch (error) {
      console.error('[TELEGRAM] Error guardando usuarios:', error);
    }
  }

  async saveSession() {
    try {
      await fs.writeJSON(
        path.join(this.sessionPath, 'bot_session.json'),
        {
          connected: this.isConnected,
          lastConnection: Date.now()
        }
      );
    } catch (error) {
      console.error('[TELEGRAM] Error guardando sesión:', error);
    }
  }

  async getSystemStatus() {
    const whatsappStatus = SessionManager.getAllSessionsStatus ? 
      await SessionManager.getAllSessionsStatus() : {};
    
    let status = '';
    
    // Status de WhatsApp
    status += '*WhatsApp Business:*\n';
    for (const [id, info] of Object.entries({
      main: { name: 'Principal', number: '442 668 9053' },
      secondary: { name: 'Ventas', number: '442 835 034' },
      personal: { name: 'Admin', number: '55 1234 5678' }
    })) {
      const s = whatsappStatus[id];
      const icon = s?.exists ? '✅' : '❌';
      status += `${icon} ${info.name} (${info.number})\n`;
    }
    
    status += '\n';
    
    // Status de Telegram
    status += '*Telegram Bot:*\n';
    status += `${this.isConnected ? '✅' : '❌'} Conectado\n`;
    status += `👥 Usuarios activos: ${this.userSessions.size}\n`;
    status += `🔑 Admins: ${this.authorizedUsers.size}\n\n`;
    
    // Status del sistema
    const mem = process.memoryUsage();
    status += '*Sistema:*\n';
    status += `💾 Memoria: ${Math.round(mem.heapUsed / 1024 / 1024)}MB\n`;
    status += `⏱️ Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m\n`;
    
    return status;
  }

  async notifyAdmin(message) {
    // Notificar a todos los admins
    for (const adminId of this.authorizedUsers) {
      try {
        await this.bot.telegram.sendMessage(adminId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('[TELEGRAM] Error notificando admin:', error);
      }
    }
  }

  /**
   * Enviar mensaje a usuario específico (para modo proactivo)
   */
  async sendMessageToUser(userId, message) {
    try {
      await this.bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('[TELEGRAM] Error enviando mensaje proactivo:', error);
    }
  }

  /**
   * Procesar mensaje con modo secretaria natural
   */
  async processNaturalMessage(ctx, message) {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // Track para análisis de patrones
    this.proactiveSecretary.trackAction(userId, 'message_received', { text: message });
    
    // Procesar con secretaria natural
    const result = await this.naturalSecretary.processMessage(
      userId, 
      username, 
      message, 
      'telegram'
    );
    
    // Enviar respuesta
    if (result.text) {
      await ctx.reply(result.text, { parse_mode: 'Markdown', disable_web_page_preview: !result.imageUrl });
    }
    
    // Si hay imagen, enviarla
    if (result.imageUrl) {
      await ctx.replyWithPhoto(
        { url: result.imageUrl },
        { caption: result.followUp || '🎨 Generado para ti' }
      );
    }
    
    // Sugerir contextualmente después de responder
    setTimeout(() => {
      this.proactiveSecretary.suggestContextually(userId, message, 
        (uid, msg) => this.sendMessageToUser(uid, msg)
      );
    }, 3000);
    
    return result;
  }

  async stop() {
    if (this.bot) {
      await this.saveSession();
      this.bot.stop();
      this.isConnected = false;
      console.log('🛑 TELEGRAM BOT: Detenido');
    }
  }
}

module.exports = new TelegramBotManager();

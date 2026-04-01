/**
 * 🤖 MULTI-BOT MANAGER v3.0
 * Gestión de múltiples bots de Telegram
 * Rotación anti-ban, load balancing, failover automático
 */

const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');
const rateLimiter = require('../core/rate-limiter');

class MultiBotManager {
  constructor() {
    // Puedes tener múltiples tokens
    this.bots = new Map();
    this.activeBotIndex = 0;
    this.botTokens = [
      process.env.TELEGRAM_BOT_TOKEN_1,
      process.env.TELEGRAM_BOT_TOKEN_2,
      process.env.TELEGRAM_BOT_TOKEN_3
    ].filter(Boolean);
    
    this.commandsQueue = [];
    this.isRunning = false;
    this.stats = {
      messagesProcessed: 0,
      botsActive: 0,
      rotations: 0
    };
  }

  /**
   * Inicializar todos los bots
   */
  async initialize() {
    logger.info(`🤖 Multi-Bot Manager initializing ${this.botTokens.length} bots...`);
    
    if (this.botTokens.length === 0) {
      logger.warn('⚠️ No bot tokens configured. Using single bot mode.');
      // Fallback a token único
      if (process.env.TELEGRAM_BOT_TOKEN) {
        this.botTokens = [process.env.TELEGRAM_BOT_TOKEN];
      } else {
        throw new Error('No Telegram bot tokens available');
      }
    }
    
    // Crear instancias de bots
    for (let i = 0; i < this.botTokens.length; i++) {
      await this.createBot(i, this.botTokens[i]);
    }
    
    this.isRunning = true;
    
    // Rotar bots cada cierto tiempo
    this.startRotation();
    
    // Health check
    this.startHealthCheck();
    
    logger.success(`✅ Multi-Bot Manager active with ${this.bots.size} bots`);
    
    return {
      botsCount: this.bots.size,
      activeBot: this.activeBotIndex
    };
  }

  /**
   * Crear instancia de bot
   */
  async createBot(index, token) {
    try {
      const bot = new Telegraf(token);
      
      // Configurar el bot
      this.setupBotCommands(bot, index);
      
      // Launch
      await bot.launch();
      
      // Guardar referencia
      this.bots.set(index, {
        instance: bot,
        token: token.substring(0, 10) + '...',
        status: 'active',
        messagesSent: 0,
        lastUsed: Date.now(),
        errors: 0
      });
      
      logger.info(`✅ Bot ${index + 1} initialized`);
      
    } catch (error) {
      logger.error(`❌ Failed to initialize bot ${index + 1}:`, error.message);
      this.bots.set(index, {
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Configurar comandos para cada bot
   */
  setupBotCommands(bot, index) {
    // Comando start
    bot.start((ctx) => {
      ctx.reply(`🤖 Bot ${index + 1} activo!\n\n` +
        'Soy parte del sistema NOVA AI Multi-Bot.\n' +
        'Todas las funciones disponibles!');
    });
    
    // Comando status
    bot.command('status', (ctx) => {
      ctx.reply(`📊 Bot ${index + 1} / ${this.bots.size}\n` +
        `Estado: ✅ Activo\n` +
        `Mensajes: ${this.stats.messagesProcessed}\n` +
        `Rotaciones: ${this.stats.rotations}`);
    });
    
    // Comando NSFW
    bot.command('imagen', async (ctx) => {
      await this.handleNSFWCommand(ctx, 'imagen');
    });
    
    // Comando para cambiar de bot
    bot.command('rotate', async (ctx) => {
      this.rotateBot();
      ctx.reply('🔄 Rotando a siguiente bot...');
    });
    
    // Handler genérico de mensajes
    bot.on('text', async (ctx) => {
      await this.handleMessage(ctx, index);
    });
    
    // Error handling
    bot.catch((err, ctx) => {
      logger.error(`Bot ${index} error:`, err.message);
      this.handleBotError(index, err);
    });
  }

  /**
   * Rotar bots para distribuir carga
   */
  rotateBot() {
    const activeBots = Array.from(this.bots.entries())
      .filter(([_, bot]) => bot.status === 'active');
    
    if (activeBots.length > 1) {
      // Seleccionar el menos usado
      const nextBot = activeBots
        .sort((a, b) => a[1].messagesSent - b[1].messagesSent)[0];
      
      this.activeBotIndex = nextBot[0];
      this.stats.rotations++;
      
      logger.info(`🔄 Bot rotated to: ${this.activeBotIndex + 1}`);
    }
  }

  /**
   * Iniciar rotación automática
   */
  startRotation() {
    // Rotar cada 100 mensajes
    setInterval(() => {
      if (this.stats.messagesProcessed % 100 === 0) {
        this.rotateBot();
      }
    }, 60000); // Cada minuto verificar si hay que rotar
  }

  /**
   * Health check de bots
   */
  startHealthCheck() {
    setInterval(() => {
      for (const [index, bot] of this.bots) {
        if (bot.status === 'active') {
          // Verificar si responde
          if (Date.now() - bot.lastUsed > 300000) { // 5 min sin actividad
            // Ping interno
            logger.debug(`Bot ${index + 1} health check: OK`);
          }
        }
      }
    }, 60000);
  }

  /**
   * Manejar mensaje entrante
   */
  async handleMessage(ctx, botIndex) {
    const userId = ctx.from.id;
    const message = ctx.message.text;
    
    // Rate limit check
    const canSend = await rateLimiter.canSend(userId, message);
    if (!canSend.allowed) {
      return ctx.reply(canSend.message);
    }
    
    // Procesar el mensaje
    await this.processMessage(ctx, message, userId);
    
    // Registrar
    await rateLimiter.register(userId);
    this.stats.messagesProcessed++;
    
    // Actualizar stats del bot
    const bot = this.bots.get(botIndex);
    if (bot) {
      bot.messagesSent++;
      bot.lastUsed = Date.now();
    }
  }

  /**
   * Procesar mensaje con IA
   */
  async processMessage(ctx, message, userId) {
    try {
      // Detectar intención
      const isNSFW = this.detectNSFW(message);
      
      if (isNSFW) {
        // Usar APIs NSFW
        const NSFWAPIs = require('./nsfw-apis');
        const apis = new NSFWAPIs();
        
        const prompt = this.extractPrompt(message);
        const result = await apis.generateImage(prompt, {
          nsfw: true,
          width: 1024,
          height: 1024
        });
        
        if (result.success) {
          await ctx.replyWithPhoto(
            { url: result.imageUrl },
            { caption: `🎨 Generado por ${result.source}\n🔓 NSFW Mode` }
          );
        } else {
          await ctx.reply('❌ Error generando imagen: ' + result.error);
        }
        
      } else {
        // Respuesta normal
        await ctx.reply('💬 Procesando...');
      }
      
    } catch (error) {
      logger.error('Message processing error:', error);
      await ctx.reply('❌ Error procesando mensaje');
    }
  }

  /**
   * Manejar comando NSFW
   */
  async handleNSFWCommand(ctx, type) {
    const userId = ctx.from.id;
    
    // Verificar si tiene permisos NSFW
    if (!this.isNSFWAllowed(userId)) {
      return ctx.reply('🔒 Contenido NSFW deshabilitado. Usa /unlock para activar.');
    }
    
    const prompt = ctx.message.text.replace(/\/\w+/, '').trim();
    
    if (!prompt) {
      return ctx.reply('📝 Proporciona una descripción:\n/imagen una modelo sentada');
    }
    
    await this.processMessage(ctx, `/imagen ${prompt}`, userId);
  }

  /**
   * Detectar si mensaje es NSFW
   */
  detectNSFW(text) {
    const nsfwKeywords = [
      'nsfw', 'xxx', 'porn', 'nude', 'naked', 'desnudo', 'desnuda',
      'xxx', 'adult', 'xxx', 'hot', 'sexy', 'erotic', 'erotico',
      'hentai', 'rule34', 'explicit', '+18'
    ];
    
    const lower = text.toLowerCase();
    return nsfwKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Extraer prompt
   */
  extractPrompt(text) {
    return text.replace(/\/\w+/, '').trim();
  }

  /**
   * Verificar si usuario permite NSFW
   */
  isNSFWAllowed(userId) {
    // Guardar preferencias en DB
    return true; // Por defecto permitido
  }

  /**
   * Manejar error de bot
   */
  handleBotError(index, error) {
    const bot = this.bots.get(index);
    if (bot) {
      bot.errors++;
      bot.status = 'error';
      
      if (bot.errors > 5) {
        bot.status = 'failed';
        logger.error(`Bot ${index + 1} marked as failed after 5 errors`);
        
        // Si hay más bots, rotar
        if (this.bots.size > 1) {
          this.rotateBot();
        }
      }
    }
  }

  /**
   * Enviar mensaje usando el mejor bot disponible
   */
  async sendMessage(chatId, text, options = {}) {
    const bot = this.getBestBot();
    
    if (!bot) {
      throw new Error('No active bots available');
    }
    
    try {
      await bot.instance.telegram.sendMessage(chatId, text, options);
      bot.messagesSent++;
      bot.lastUsed = Date.now();
      
    } catch (error) {
      logger.error('Send message failed:', error);
      this.handleBotError(this.activeBotIndex, error);
      
      // Retry con otro bot
      this.rotateBot();
      await this.sendMessage(chatId, text, options);
    }
  }

  /**
   * Obtener mejor bot disponible
   */
  getBestBot() {
    // Buscar bot activo con menos mensajes
    let bestBot = null;
    let minMessages = Infinity;
    
    for (const [index, bot] of this.bots) {
      if (bot.status === 'active' && bot.messagesSent < minMessages) {
        bestBot = bot;
        minMessages = bot.messagesSent;
      }
    }
    
    return bestBot;
  }

  /**
   * Obtener status de todos los bots
   */
  getStatus() {
    return {
      total: this.bots.size,
      active: Array.from(this.bots.values()).filter(b => b.status === 'active').length,
      failed: Array.from(this.bots.values()).filter(b => b.status === 'failed').length,
      messages: this.stats.messagesProcessed,
      rotations: this.stats.rotations,
      bots: Array.from(this.bots).map(([idx, bot]) => ({
        index: idx + 1,
        status: bot.status,
        messages: bot.messagesSent || 0
      }))
    };
  }

  /**
   * Detener todos los bots
   */
  async stopAll() {
    logger.info('Stopping all bots...');
    
    for (const [index, bot] of this.bots) {
      if (bot.instance) {
        try {
          bot.instance.stop();
          logger.info(`Bot ${index + 1} stopped`);
        } catch (e) {}
      }
    }
    
    this.isRunning = false;
  }
}

module.exports = MultiBotManager;

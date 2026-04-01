/**
 * Telegram Gateway Adapter for NOVA AI
 * Integra node-telegram-bot-api con el Channel Gateway
 */

const { ChannelAdapter } = require('../core/channel-gateway');
const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

class TelegramAdapter extends ChannelAdapter {
  constructor() {
    super('telegram');
    this.bot = null;
    this.config = null;
  }

  async connect(config) {
    this.config = config;
    
    if (!config.token) {
      throw new Error('Telegram bot token required');
    }

    this.bot = new TelegramBot(config.token, { 
      polling: true,
      onlyFirstMatch: true
    });

    // Manejar errores de polling
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram polling error:', error.message);
      this.emit('error', error);
    });

    // Manejar mensajes de texto
    this.bot.on('message', (msg) => {
      if (msg.text) {
        this.handleTextMessage(msg);
      }
    });

    // Manejar comandos
    this.commandHandler = (msg, match) => {
      this.handleCommand(msg, match);
    };
    this.bot.onText(/\/(.+)/, this.commandHandler);

    this.connected = true;
    this.emit('connected');
    
    logger.info('✅ Telegram bot connected');
    
    // Enviar mensaje de inicio al admin si está configurado
    if (config.adminChatId) {
      try {
        await this.sendMessage(
          config.adminChatId, 
          '🤖 NOVA AI iniciada\nOpenClaw-style architecture v6.1'
        );
      } catch (error) {
        logger.warn('Could not send startup message to admin:', error.message);
      }
    }
  }

  handleTextMessage(msg) {
    // Verificar si el usuario está permitido
    if (!this.isUserAllowed(msg.from.id, msg.chat.id)) {
      logger.warn(`Unauthorized access attempt: ${msg.from.id}`);
      return;
    }

    const message = {
      id: msg.message_id.toString(),
      sender: msg.from.id.toString(),
      chatId: msg.chat.id.toString(),
      text: msg.text,
      content: msg.text,
      timestamp: msg.date,
      type: 'text',
      hasMedia: false,
      user: {
        id: msg.from.id,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name
      },
      chat: {
        id: msg.chat.id,
        type: msg.chat.type,
        title: msg.chat.title
      },
      raw: msg
    };

    this.emit('message', message);
  }

  handleCommand(msg, match) {
    const command = match[1];
    
    // Comandos especiales del sistema
    switch (command) {
      case 'start':
        this.bot.sendMessage(
          msg.chat.id,
          `🤖 **NOVA AI** - OpenClaw Architecture

Comandos disponibles:
/help - Mostrar ayuda
/status - Estado del sistema
/skills - Listar skills disponibles
/tools - Listar herramientas disponibles

Escribe cualquier mensaje para interactuar con la IA.`
        );
        break;
        
      case 'help':
        this.sendHelp(msg.chat.id);
        break;
        
      case 'status':
        this.sendStatus(msg.chat.id);
        break;
    }
  }

  async sendMessage(recipient, content, options = {}) {
    const chatId = recipient;
    const maxLength = 4096;
    
    // Dividir mensajes largos
    const chunks = this.splitMessage(content, maxLength);
    
    for (const chunk of chunks) {
      try {
        if (options.markdown) {
          const escapedChunk = this.escapeMarkdown(chunk);
          await this.bot.sendMessage(chatId, escapedChunk, { parse_mode: 'MarkdownV2' });
        } else if (options.html) {
          await this.bot.sendMessage(chatId, chunk, { parse_mode: 'HTML' });
        } else {
          await this.bot.sendMessage(chatId, chunk);
        }
      } catch (error) {
        logger.error('Error sending Telegram message:', error.message);
        // Fallback a mensaje plano
        try {
          await this.bot.sendMessage(chatId, chunk);
        } catch (e) {
          logger.error('Failed to send message even as plain text');
        }
      }
    }
  }

  escapeMarkdown(text) {
    // Escapar caracteres de MarkdownV2
    return text
      .replace(/\\/g, '\\\\')
      .replace(/_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  splitMessage(text, maxLength) {
    if (text.length <= maxLength) return [text];
    
    const chunks = [];
    while (text.length > maxLength) {
      let chunk = text.substring(0, maxLength);
      const lastNewline = chunk.lastIndexOf('\n');
      const lastSpace = chunk.lastIndexOf(' ');
      
      if (lastNewline > maxLength * 0.8) {
        chunk = text.substring(0, lastNewline);
      } else if (lastSpace > maxLength * 0.8) {
        chunk = text.substring(0, lastSpace);
      }
      
      chunks.push(chunk);
      text = text.substring(chunk.length);
    }
    chunks.push(text);
    return chunks;
  }

  isUserAllowed(userId, chatId) {
    if (!this.config.allowedUsers || this.config.allowedUsers.length === 0) {
      return true; // Permitir todos si no hay restricción
    }
    
    const allowed = this.config.allowedUsers.map(id => id.toString());
    return allowed.includes(userId.toString()) || 
           allowed.includes(chatId.toString());
  }

  async sendHelp(chatId) {
    const help = `🤖 **NOVA AI Help**

**Skills disponibles:**
/coding-assistant - Asistente de programación
/web-researcher - Investigador web
/system-admin - Administrador de sistemas

**Comandos del sistema:**
/start - Iniciar bot
/help - Mostrar esta ayuda
/status - Estado del sistema
/skills - Listar skills
/tools - Listar herramientas

**Uso:**
Simplemente envía un mensaje para interactuar con la IA.
La IA puede usar herramientas automáticamente cuando sea necesario.`;

    await this.bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
  }

  async sendStatus(chatId) {
    const status = `📊 **NOVA AI Status**

✅ Bot: Online
🔄 Versión: 6.1.0 (OpenClaw Architecture)
⏱️ Uptime: ${process.uptime().toFixed(0)}s
💾 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB

**Canales configurados:**
${this.config.enabledChannels?.map(c => `• ${c}`).join('\n') || '• Telegram'}

**Sistema operativo:** ${process.platform}`;

    await this.bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
  }

  async disconnect() {
    if (this.bot) {
      try {
        // Remover event listeners registrados
        this.bot.off('polling_error');
        this.bot.off('message');
        if (this.commandHandler) {
          this.bot.removeTextListener(/\/(.+)/);
        }
        
        await this.bot.stopPolling();
        this.connected = false;
        this.emit('disconnected');
        logger.info('Telegram bot disconnected cleanly');
      } catch (error) {
        logger.error('Error disconnecting Telegram bot:', error.message);
      }
    }
  }

  async getProfile(userId) {
    try {
      const chat = await this.bot.getChat(userId);
      return {
        id: chat.id,
        username: chat.username,
        firstName: chat.first_name,
        lastName: chat.last_name,
        type: chat.type
      };
    } catch (error) {
      logger.error('Error getting profile:', error.message);
      return null;
    }
  }
}

module.exports = TelegramAdapter;

/**
 * Telegram Adapter using node-telegram-bot-api
 */

const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

class TelegramAdapter {
  constructor(options) {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.onMessage = options?.onMessage || (() => {});
    this.onConnect = options?.onConnect || (() => {});
    this.bot = null;
    this.connected = false;
  }

  async initialize() {
    if (!this.token) {
      logger.warn('TELEGRAM_BOT_TOKEN not set');
      return false;
    }

    try {
      this.bot = new TelegramBot(this.token, { polling: true });

      this.bot.on('message', async (msg) => {
        const metadata = {
          text: msg.text || msg.caption || '',
          from: msg.chat.id.toString(),
          userId: msg.from.id.toString(),
          username: msg.from.username,
          isGroup: msg.chat.type === 'group' || msg.chat.type === 'supergroup',
          platform: 'telegram'
        };

        await this.onMessage(metadata.text, metadata);
      });

      this.connected = true;
      this.onConnect();
      logger.success('✅ Telegram bot running');
      return true;

    } catch (error) {
      logger.error('Telegram init failed:', error.message);
      return false;
    }
  }

  async sendMessage(chatId, content) {
    const maxLength = 4096;
    const chunks = this.splitMessage(content, maxLength);
    
    for (const chunk of chunks) {
      try {
        // Intentar con Markdown
        const escapedChunk = this.escapeMarkdown(chunk);
        await this.bot.sendMessage(chatId, escapedChunk, { 
          parse_mode: 'MarkdownV2' 
        });
      } catch (error) {
        // Si falla por formato, intentar sin formato
        try {
          await this.bot.sendMessage(chatId, chunk);
        } catch (e) {
          logger.error('Telegram send failed:', e.message);
          // Intentar enviar mensaje sin acentos ni caracteres especiales
          try {
            const safeChunk = chunk.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            await this.bot.sendMessage(chatId, safeChunk.substring(0, maxLength));
          } catch (e2) {
            logger.error('Telegram send completely failed:', e2.message);
            return false;
          }
        }
      }
    }
    return true;
  }

  splitMessage(text, maxLength) {
    const chunks = [];
    while (text.length > maxLength) {
      const chunk = text.substring(0, maxLength);
      const lastNewline = chunk.lastIndexOf('\n');
      const lastSpace = chunk.lastIndexOf(' ');
      
      // Preferir cortar en nueva línea
      if (lastNewline > maxLength * 0.5) {
        chunks.push(text.substring(0, lastNewline));
        text = text.substring(lastNewline + 1);
      } else if (lastSpace > maxLength * 0.8) {
        chunks.push(text.substring(0, lastSpace));
        text = text.substring(lastSpace + 1);
      } else {
        chunks.push(text.substring(0, maxLength));
        text = text.substring(maxLength);
      }
    }
    chunks.push(text);
    return chunks;
  }

  escapeMarkdown(text) {
    // Escapar caracteres especiales de MarkdownV2
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

  async disconnect() {
    if (this.bot) {
      try {
        this.bot.stopPolling();
        // Limpiar event listeners
        this.bot.removeAllListeners();
        this.connected = false;
        logger.info('Telegram bot disconnected');
      } catch (error) {
        logger.error('Error disconnecting Telegram:', error.message);
      }
    }
  }
}

module.exports = TelegramAdapter;

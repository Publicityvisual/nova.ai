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
    try {
      await this.bot.sendMessage(chatId, content.substring(0, 4096), { 
        parse_mode: 'Markdown' 
      });
      return true;
    } catch (error) {
      // Try without markdown
      try {
        await this.bot.sendMessage(chatId, content.substring(0, 4096));
        return true;
      } catch (e) {
        logger.error('Telegram send failed:', e);
        return false;
      }
    }
  }

  async disconnect() {
    if (this.bot) {
      this.bot.stopPolling();
      this.connected = false;
    }
  }
}

module.exports = TelegramAdapter;

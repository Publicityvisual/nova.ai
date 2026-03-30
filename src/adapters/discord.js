/**
 * Discord Adapter
 */

const { Client, GatewayIntentBits } = require('discord.js');
const logger = require('../utils/logger');

class DiscordAdapter {
  constructor(options) {
    this.token = process.env.DISCORD_BOT_TOKEN;
    this.onMessage = options?.onMessage || (() => {});
    this.onConnect = options?.onConnect || (() => {});
    this.client = null;
    this.connected = false;
  }

  async initialize() {
    if (!this.token) {
      logger.warn('DISCORD_BOT_TOKEN not set');
      return false;
    }

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.DirectMessages
        ]
      });

      this.client.on('ready', () => {
        logger.success(`✅ Discord connected as ${this.client.user.tag}`);
        this.connected = true;
        this.onConnect();
      });

      this.client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        const metadata = {
          text: message.content,
          from: message.author.id,
          userId: message.author.id,
          username: message.author.username,
          isDM: message.channel.type === 'DM',
          platform: 'discord'
        };

        await this.onMessage(message.content, metadata);
      });

      await this.client.login(this.token);
      return true;

    } catch (error) {
      logger.error('Discord init failed:', error.message);
      return false;
    }
  }

  async sendMessage(to, content) {
    try {
      const channel = await this.client.channels.fetch(to);
      if (channel) {
        await channel.send(content.substring(0, 2000));
        return true;
      }
    } catch (error) {
      logger.error('Discord send failed:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.connected = false;
    }
  }
}

module.exports = DiscordAdapter;

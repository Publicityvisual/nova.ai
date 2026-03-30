/**
 * Slack Adapter using @slack/bolt
 */

const { App } = require('@slack/bolt');
const logger = require('../utils/logger');

class SlackAdapter {
  constructor(options) {
    this.token = process.env.SLACK_BOT_TOKEN;
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
    this.onMessage = options?.onMessage || (() => {});
    this.onConnect = options?.onConnect || (() => {});
    this.app = null;
    this.connected = false;
  }

  async initialize() {
    if (!this.token || !this.signingSecret) {
      logger.warn('SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET not set');
      return false;
    }

    try {
      this.app = new App({
        token: this.token,
        signingSecret: this.signingSecret
      });

      this.app.message(async ({ message, say }) => {
        if (message.subtype === 'bot_message') return;
        
        const metadata = {
          text: message.text,
          from: message.channel,
          userId: message.user,
          channel: message.channel,
          platform: 'slack'
        };

        await this.onMessage(message.text, metadata);
      });

      await this.app.start(process.env.PORT || 3001);
      this.connected = true;
      this.onConnect();
      logger.success('✅ Slack bot running on port 3001');
      return true;

    } catch (error) {
      logger.error('Slack init failed:', error.message);
      return false;
    }
  }

  async sendMessage(channel, content) {
    try {
      await this.app.client.chat.postMessage({
        channel,
        text: content
      });
      return true;
    } catch (error) {
      logger.error('Slack send failed:', error);
      return false;
    }
  }

  async disconnect() {
    // Bolt doesn't have explicit disconnect
    this.connected = false;
  }
}

module.exports = SlackAdapter;

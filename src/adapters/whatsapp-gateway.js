/**
 * WhatsApp Gateway Adapter for NOVA AI
 * Integra Baileys con el Channel Gateway
 */

const { ChannelAdapter } = require('../core/channel-gateway');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');

class WhatsAppAdapter extends ChannelAdapter {
  constructor() {
    super('whatsapp');
    this.sock = null;
    this.creds = null;
  }

  async connect(config) {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    this.creds = saveCreds;

    this.sock = makeWASocket({
      version: [2, 3000, 1015901307],
      logger: logger.pino,
      printQRInTerminal: true,
      auth: state,
      browser: ['NOVA AI', 'Desktop', '1.0'],
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    // Manejar credenciales
    this.sock.ev.on('creds.update', saveCreds);

    // Manejar conexión
    this.sock.ev.on('connection.update', (update) => {
      this.handleConnectionUpdate(update);
    });

    // Manejar mensajes
    this.sock.ev.on('messages.upsert', (m) => {
      this.handleMessages(m);
    });

    this.connected = true;
    this.emit('connected');
  }

  handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('📱 Scan QR code with WhatsApp');
      qrcode.generate(qr, { small: true });
      this.emit('qr', qr);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      logger.warn('❌ WhatsApp disconnected:', lastDisconnect?.error?.message || 'Unknown');
      
      if (shouldReconnect) {
        logger.info('🔄 Reconnecting...');
        this.connect({});
      }
      
      this.connected = false;
      this.emit('disconnected');
    } else if (connection === 'open') {
      logger.info('✅ WhatsApp connected');
      this.connected = true;
      this.emit('connected');
    }
  }

  handleMessages({ messages, type }) {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;

      const message = this.parseMessage(msg);
      if (message) {
        this.emit('message', message);
      }
    }
  }

  parseMessage(msg) {
    try {
      const chatId = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      
      // Extraer texto
      let text = '';
      if (msg.message?.conversation) {
        text = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        text = msg.message.extendedTextMessage.text;
      } else if (msg.message?.imageMessage?.caption) {
        text = msg.message.imageMessage.caption;
      }

      return {
        id: msg.key.id,
        sender: sender.split('@')[0],
        chatId: chatId.split('@')[0],
        text,
        content: text,
        timestamp: msg.messageTimestamp,
        type: this.getMessageType(msg.message),
        hasMedia: !!msg.message?.imageMessage || !!msg.message?.videoMessage,
        raw: msg
      };
    } catch (error) {
      logger.error('Error parsing message:', error);
      return null;
    }
  }

  getMessageType(message) {
    if (!message) return 'unknown';
    if (message.conversation || message.extendedTextMessage) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    return 'unknown';
  }

  async sendMessage(recipient, content, options = {}) {
    const jid = recipient.includes('@') ? recipient : `${recipient}@s.whatsapp.net`;
    
    if (options.media) {
      // Enviar media
      await this.sock.sendMessage(jid, {
        [options.mediaType || 'image']: options.media,
        caption: content
      });
    } else {
      // Enviar texto
      const chunks = this.splitMessage(content, 4000);
      for (const chunk of chunks) {
        await this.sock.sendMessage(jid, { text: chunk });
      }
    }
  }

  splitMessage(text, maxLength) {
    const chunks = [];
    while (text.length > maxLength) {
      const chunk = text.substring(0, maxLength);
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > 0) {
        chunks.push(text.substring(0, lastSpace));
        text = text.substring(lastSpace + 1);
      } else {
        chunks.push(chunk);
        text = text.substring(maxLength);
      }
    }
    chunks.push(text);
    return chunks;
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.connected = false;
    }
  }

  async getProfile(userId) {
    try {
      const jid = userId.includes('@') ? userId : `${userId}@s.whatsapp.net`;
      const profile = await this.sock.profilePictureUrl(jid, 'image');
      return { pictureUrl: profile };
    } catch {
      return null;
    }
  }
}

module.exports = WhatsAppAdapter;

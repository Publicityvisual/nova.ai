/**
 * WhatsApp Adapter - Baileys
 * Handles WhatsApp connection and messaging
 */

const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode-terminal');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');

class WhatsAppAdapter {
  constructor(options = {}) {
    this.sessionName = options.sessionName || 'nova-session';
    this.onMessage = options.onMessage || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.sock = null;
    this.connected = false;
    this.authFolder = path.join('./data/sessions', this.sessionName);
  }

  async initialize() {
    logger.info('Initializing WhatsApp adapter...');
    
    try {
      // Ensure auth folder exists
      await fs.ensureDir(this.authFolder);

      // Use multi-file auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      const { version } = await fetchLatestBaileysVersion();

      // Create socket
      this.sock = makeWASocket({
        version,
        logger: logger.pino,
        printQRInTerminal: true,
        auth: state,
        browser: ['Nova AI', 'Desktop', '1.0.0'],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 1000,
        maxMsgRetryCount: 5,
        msgRetryCounterMap: new Map(),
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000
      });

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          logger.info('Scan this QR code to connect:');
          QRCode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          
          logger.warn('Connection closed:', lastDisconnect?.error?.message);
          this.connected = false;
          this.onDisconnect();

          if (shouldReconnect) {
            logger.info('Reconnecting...');
            setTimeout(() => this.initialize(), 5000);
          } else {
            logger.error('Logged out, please scan QR again');
          }
        } else if (connection === 'open') {
          logger.info('WhatsApp connection established!');
          this.connected = true;
          this.onConnect();
          
          // Notify owner
          const ownerNumber = process.env.OWNER_NUMBER;
          if (ownerNumber) {
            await this.sendMessage(
              ownerNumber + '@s.whatsapp.net',
              '🤖 Nova is online and ready!'
            );
          }
        }
      });

      // Handle credentials update
      this.sock.ev.on('creds.update', saveCreds);

      // Handle messages
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        
        for (const msg of m.messages) {
          // Don't process own messages
          if (msg.key.fromMe) continue;
          
          await this.processMessage(msg);
        }
      });

    } catch (error) {
      logger.error('Failed to initialize WhatsApp:', error);
      throw error;
    }
  }

  async processMessage(msg) {
    try {
      const messageContent = msg.message;
      if (!messageContent) return;

      // Extract text from different message types
      let text = '';
      let imageData = null;
      
      if (messageContent.conversation) {
        text = messageContent.conversation;
      } else if (messageContent.extendedTextMessage?.text) {
        text = messageContent.extendedTextMessage.text;
      } else if (messageContent.imageMessage) {
        text = messageContent.imageMessage.caption || '';
        // Download image
        try {
          const stream = await this.sock.downloadMediaMessage(msg);
          if (stream) {
            imageData = stream.toString('base64');
            logger.info('Image downloaded, size:', imageData.length);
          }
        } catch (e) {
          logger.error('Failed to download image:', e.message);
        }
      } else if (messageContent.videoMessage?.caption) {
        text = messageContent.videoMessage.caption;
      }

      // Get sender info
      const from = msg.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const userId = isGroup ? msg.key.participant : from;

      const metadata = {
        text: text.trim(),
        from,
        isGroup,
        userId,
        messageId: msg.key.id,
        timestamp: msg.messageTimestamp,
        pushName: msg.pushName || 'Unknown',
        imageData, // Pass image data if available
        hasMedia: !!imageData
      };

      if (!text && !imageData) return;

      logger.info(`Message from ${metadata.pushName} (${userId}): ${text.substring(0, 50)}${imageData ? ' [+IMAGE]' : ''}`);

      // Call the message handler
      await this.onMessage(text.trim(), metadata);

    } catch (error) {
      logger.error('Error processing message:', error);
    }
  }

  async sendMessage(to, content, options = {}) {
    try {
      if (!this.connected || !this.sock) {
        throw new Error('WhatsApp not connected');
      }

      // Normalize JID
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

      // Send text or media
      if (typeof content === 'string') {
        await this.sock.sendMessage(jid, { text: content }, options);
      } else if (Buffer.isBuffer(content)) {
        // Media buffer
        const type = options.type || 'image';
        await this.sock.sendMessage(jid, {
          [type]: content,
          caption: options.caption || ''
        });
      } else if (content.url || content.path) {
        // Media from URL or path
        const type = options.type || 'image';
        await this.sock.sendMessage(jid, {
          [type]: content.url ? { url: content.url } : fs.readFileSync(content.path),
          caption: options.caption || ''
        });
      }

      logger.info(`Message sent to ${jid}`);
      return true;

    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.connected = false;
        logger.info('WhatsApp disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting:', error);
    }
  }
}

module.exports = WhatsAppAdapter;

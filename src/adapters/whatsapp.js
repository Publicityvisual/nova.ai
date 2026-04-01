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
    this.retryCount = 0;
    this.maxRetries = 10;
    
    // 🛡️ PROTECCIÓN ANTI-BANEO
    this.rateLimiter = new Map();
    this.lastMessageTime = 0;
    this.messageQueue = [];
    this.processingQueue = false;
    this.lastChatJid = null;
    
    this.limits = {
      maxMessagesPerMinute: 20,
      maxMessagesPerHour: 200,
      minDelayBetweenMsgs: 2000,
      typingDelayPerChar: 50
    };
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
            this.retryCount++;
            if (this.retryCount <= this.maxRetries) {
              const delay = Math.min(5000 * Math.pow(2, this.retryCount - 1), 300000);
              logger.info(`Reconnecting in ${delay/1000}s (attempt ${this.retryCount}/${this.maxRetries})...`);
              setTimeout(() => this.initialize(), delay);
            } else {
              logger.error('Max retries reached. Please restart manually.');
              this.retryCount = 0;
            }
          } else {
            logger.error('Logged out, please scan QR again');
            this.retryCount = 0;
          }
        } else if (connection === 'open') {
          logger.info('WhatsApp connection established!');
          this.connected = true;
          this.retryCount = 0; // ← Reset on successful connection
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

  /**
   * 🛡️ Verificar rate limits
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const userData = this.rateLimiter.get(userId) || { 
      count: 0, 
      lastReset: now,
      hourCount: 0,
      hourReset: now 
    };
    
    // Reset contador por minuto
    if (now - userData.lastReset > 60000) {
      userData.count = 0;
      userData.lastReset = now;
    }
    
    // Reset contador por hora
    if (now - userData.hourReset > 3600000) {
      userData.hourCount = 0;
      userData.hourReset = now;
    }
    
    // Verificar límites
    if (userData.count >= this.limits.maxMessagesPerMinute) {
      return { allowed: false, reason: 'RATE_LIMIT_MINUTE', retryAfter: 60 };
    }
    
    if (userData.hourCount >= this.limits.maxMessagesPerHour) {
      return { allowed: false, reason: 'RATE_LIMIT_HOUR', retryAfter: 3600 };
    }
    
    userData.count++;
    userData.hourCount++;
    this.rateLimiter.set(userId, userData);
    
    return { allowed: true };
  }

  /**
   * ⏱️ Delay humanizado
   */
  async humanDelay(text = '', jid = null) {
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    
    // Calcular delay basado en longitud del texto
    const typingTime = Math.min(text.length * this.limits.typingDelayPerChar, 5000);
    const minDelay = Math.max(this.limits.minDelayBetweenMsgs - timeSinceLastMessage, 0);
    const totalDelay = minDelay + typingTime;
    
    if (totalDelay > 0 && jid) {
      // Enviar "escribiendo..."
      try {
        await this.sock.sendPresenceUpdate('composing', jid);
      } catch (e) {
        // Ignorar errores de presence
      }
      
      await this.sleep(totalDelay);
      
      // Quitar "escribiendo..."
      try {
        await this.sock.sendPresenceUpdate('paused', jid);
      } catch (e) {}
    } else if (totalDelay > 0) {
      await this.sleep(totalDelay);
    }
    
    this.lastMessageTime = Date.now();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendMessage(to, content, options = {}) {
    try {
      if (!this.connected || !this.sock) {
        throw new Error('WhatsApp not connected');
      }

      // Normalize JID
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      this.lastChatJid = jid;

      // 🛡️ Verificar rate limits
      const rateCheck = this.checkRateLimit(jid);
      if (!rateCheck.allowed) {
        logger.warn(`Rate limit hit for ${jid}: ${rateCheck.reason}`);
        throw new Error(`Rate limited: ${rateCheck.reason}. Retry after ${rateCheck.retryAfter}s`);
      }

      // ⏱️ Delay humanizado antes de enviar
      const textContent = typeof content === 'string' ? content : (options.caption || '');
      await this.humanDelay(textContent, jid);

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
      // 🛡️ Manejar errores específicos de ban
      if (error.message?.includes('rate')) {
        logger.error('Rate limit error:', error.message);
        // No relanzar para evitar crash
        return false;
      }
      if (error.message?.includes('403') || error.message?.includes('forbidden')) {
        logger.error('⚠️ POSSIBLE BAN detected:', error.message);
        // Notificar y detener operaciones
        this.emit('banDetected', { error: error.message, user: to });
        return false;
      }
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

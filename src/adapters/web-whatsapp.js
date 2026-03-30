/**
 * WhatsApp Adapter with Web Support
 * Muestra QR en web y terminal
 */

const Baileys = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');

class WebWhatsAppAdapter {
  constructor(options) {
    this.sessionName = options.sessionName || 'nova-session';
    this.onMessage = options.onMessage || (() => {});
    this.sock = null;
    this.connected = false;
    this.authFolder = path.join('./data/sessions', this.sessionName);
    this.currentQR = null;
    this.qrCallbacks = [];
    this.userInfo = null;
  }

  async initialize() {
    try {
      await fs.ensureDir(this.authFolder);
      
      const { state, saveCreds } = await Baileys.useMultiFileAuthState(this.authFolder);
      const { version } = await Baileys.fetchLatestBaileysVersion();

      this.sock = Baileys.makeWASocket({
        version,
        printQRInTerminal: false, // Desactivamos para usar web
        auth: state,
        browser: ['Nova Ultra', 'Web', '2.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true
      });

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        const { qr, connection, lastDisconnect } = update;
        
        if (qr) {
          logger.info('QR generated, showing in web interface...');
          
          // Generar QR data URL para web
          try {
            const qrDataURL = await QRCode.toDataURL(qr, {
              width: 400,
              margin: 2,
              color: {
                dark: '#00ff00',
                light: '#1a1a2e'
              }
            });
            
            this.currentQR = qrDataURL;
            
            // Notificar callbacks
            this.qrCallbacks.forEach(cb => {
              try { cb({ qr: qrDataURL, status: 'connecting' }); } catch(e) {}
            });
          } catch(e) {
            logger.error('QR generation error:', e.message);
          }
        }

        if (connection === 'open') {
          this.connected = true;
          this.currentQR = null;
          
          // Get user info
          const user = this.sock.user;
          this.userInfo = {
            name: user?.name || user?.pushname || 'Unknown',
            phone: user?.id?.split(':')[0] || 'Unknown'
          };
          
          logger.success(`✅ WhatsApp connected as ${this.userInfo.name}`);
          
          // Notify callbacks
          this.qrCallbacks.forEach(cb => {
            try { cb({ 
              status: 'connected', 
              user: this.userInfo,
              qr: null 
            }); } catch(e) {}
          });
        }

        if (connection === 'close') {
          this.connected = false;
          this.userInfo = null;
          
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== Baileys.DisconnectReason.loggedOut;
          
          logger.warn(`WhatsApp disconnected: code ${statusCode}`);
          
          if (shouldReconnect) {
            logger.info('Reconnecting in 5s...');
            setTimeout(() => this.initialize(), 5000);
          }
          
          this.qrCallbacks.forEach(cb => {
            try { cb({ status: 'disconnected' }); } catch(e) {}
          });
        }
      });

      // Handle credentials
      this.sock.ev.on('creds.update', saveCreds);

      // Handle messages
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        
        for (const msg of m.messages) {
          if (msg.key.fromMe) continue;
          await this.processMessage(msg);
        }
      });

    } catch (error) {
      logger.error('WhatsApp init error:', error);
      throw error;
    }
  }

  async processMessage(msg) {
    try {
      const messageContent = msg.message;
      if (!messageContent) return;

      let text = '';
      let imageData = null;

      if (messageContent.conversation) {
        text = messageContent.conversation;
      } else if (messageContent.extendedTextMessage?.text) {
        text = messageContent.extendedTextMessage.text;
      } else if (messageContent.imageMessage) {
        text = messageContent.imageMessage.caption || '';
        try {
          const stream = await this.sock.downloadMediaMessage(msg);
          if (stream) imageData = stream.toString('base64');
        } catch (e) {}
      }

      if (!text && !imageData) return;

      const from = msg.key.remoteJid;
      const userId = from.endsWith('@g.us') ? msg.key.participant : from;

      await this.onMessage(text?.trim() || '', {
        text: text?.trim() || '',
        from,
        userId,
        isGroup: from.endsWith('@g.us'),
        imageData,
        messageId: msg.key.id,
        pushName: msg.pushName || 'Unknown',
        timestamp: msg.messageTimestamp
      });

    } catch (error) {
      logger.error('Process message error:', error);
    }
  }

  async sendMessage(to, content) {
    if (!this.connected || !this.sock) {
      throw new Error('WhatsApp not connected');
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    
    try {
      if (typeof content === 'string') {
        await this.sock.sendMessage(jid, { text: content });
      }
      return true;
    } catch (error) {
      logger.error('Send message error:', error);
      throw error;
    }
  }

  // API for web server
  onStatusChange(callback) {
    this.qrCallbacks.push(callback);
  }

  getStatus() {
    return {
      connected: this.connected,
      qr: this.currentQR,
      user: this.userInfo,
      session: this.sessionName
    };
  }
}

module.exports = WebWhatsAppAdapter;

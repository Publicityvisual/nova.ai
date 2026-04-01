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
    this.retryCount = 0;
    this.maxRetries = 10;
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
            
            // GUARDAR QR EN JSON para la interfaz HTML
            await this.saveQRToJSON(qrDataURL, 'connecting');
            
            // Notificar callbacks
            this.qrCallbacks.forEach(cb => {
              try { cb({ qr: qrDataURL, status: 'connecting' }); } catch(e) { logger.error('QR callback error:', e.message); }
            });
            
            logger.success('QR Code ready! Abre NOVA-CONTROL.html');
          } catch(e) {
            logger.error('QR generation error:', e.message);
          }
        }

        if (connection === 'open') {
          this.connected = true;
          this.retryCount = 0; // Reset retry count on successful connection
          this.currentQR = null;
          
          // Get user info
          const user = this.sock.user;
          this.userInfo = {
            name: user?.name || user?.pushname || 'Unknown',
            phone: user?.id?.split(':')[0] || 'Unknown'
          };
          
          logger.success(`✅ WhatsApp connected as ${this.userInfo.name}`);
          
          // GUARDAR estado conectado
          await this.saveQRToJSON(null, 'connected', this.userInfo);
          
          // Notify callbacks
          this.qrCallbacks.forEach(cb => {
            try { cb({ 
              status: 'connected', 
              user: this.userInfo,
              qr: null 
            }); } catch(e) { logger.error('Connected callback error:', e.message); }
          });
        }

        if (connection === 'close') {
          this.connected = false;
          this.userInfo = null;
          
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== Baileys.DisconnectReason.loggedOut;
          
          logger.warn(`WhatsApp disconnected: code ${statusCode}`);
          
          if (shouldReconnect && this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = Math.min(5000 * Math.pow(2, this.retryCount), 300000);
            logger.info(`Reconnecting in ${delay/1000}s... (attempt ${this.retryCount})`);
            setTimeout(() => this.initialize(), delay);
          } else if (this.retryCount >= this.maxRetries) {
            logger.error('Max reconnection attempts reached. Please restart manually.');
          }
          
          this.qrCallbacks.forEach(cb => {
            try { cb({ status: 'disconnected' }); } catch(e) { logger.error('Disconnect callback error:', e.message); }
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
        } catch (e) { logger.debug('Media download failed:', e.message); }
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
    // Limpiar callbacks antiguos del mismo origen para evitar memory leaks
    this.qrCallbacks = this.qrCallbacks.filter(cb => {
      // Mantener solo callbacks activos (no de sesiones antiguas)
      return cb !== null;
    });
    this.qrCallbacks.push(callback);
    
    // Retornar función para cleanup
    return () => {
      const idx = this.qrCallbacks.indexOf(callback);
      if (idx > -1) {
        this.qrCallbacks.splice(idx, 1);
      }
    };
  }

  getStatus() {
    return {
      connected: this.connected,
      qr: this.currentQR,
      user: this.userInfo,
      session: this.sessionName
    };
  }

  // Guardar QR en JSON para la interfaz HTML
  async saveQRToJSON(qrData, status, user = null) {
    try {
      const data = {
        qr: qrData,
        status: status,
        user: user,
        timestamp: new Date().toISOString()
      };
      const filePath = path.join(process.cwd(), 'qr-data.json');
      await fs.writeFile(filePath, JSON.stringify(data));
    } catch (error) {
      logger.error('Error saving QR JSON:', error.message);
    }
  }

  // Guardar QR en archivo HTML (sin servidor necesario)
  async saveQRToFile(qrDataURL) {
    try {
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦾 Nova Ultra - WhatsApp QR</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', -apple-system, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        h1 {
            font-size: 2rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #ff0066, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { color: #888; margin-bottom: 30px; }
        .qr-box {
            background: #fff;
            padding: 20px;
            border-radius: 20px;
            margin: 30px auto;
            display: inline-block;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .qr-box img {
            width: 300px;
            height: 300px;
            display: block;
        }
        .instructions {
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 20px;
            margin-top: 20px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .instructions h3 { color: #ff0066; margin-bottom: 15px; }
        .instructions ol {
            text-align: left;
            padding-left: 20px;
            line-height: 1.8;
        }
        .instructions li { margin: 10px 0; }
        .logo { font-size: 3rem; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🦾</div>
        <h1>Nova Ultra v2.0</h1>
        <p class="subtitle">Better than OpenClaw - Sin Censura</p>
        
        <div class="qr-box">
            <img src="${qrDataURL}" alt="WhatsApp QR Code">
        </div>
        
        <div class="instructions">
            <h3>📱 Cómo conectar WhatsApp:</h3>
            <ol>
                <li>Abre <strong>WhatsApp</strong> en tu teléfono</li>
                <li>Ve a <strong>⋮ (tres puntos)</strong> → <strong>Dispositivos vinculados</strong></li>
                <li>Toca <strong>"Vincular un dispositivo"</strong></li>
                <li><strong>Apunta la cámara al QR</strong> de arriba</li>
                <li>¡Listo! Nova responderá a tus mensajes</li>
            </ol>
        </div>
        
        <p style="margin-top: 30px; color: #888; font-size: 0.9rem;">
            ⏳ Este QR se actualiza automáticamente
        </p>
    </div>
</body>
</html>`;
      
      const filePath = path.join(process.cwd(), 'QR-WHATSAPP.html');
      await fs.writeFile(filePath, html);
      logger.info('QR guardado en archivo: QR-WHATSAPP.html');
      console.log('\n🌐 ABRE ESTE ARCHIVO CON DOBLE CLICK:');
      console.log('   ' + filePath + '\n');
    } catch (error) {
      logger.error('Error saving QR:', error);
    }
  }
}

module.exports = WebWhatsAppAdapter;

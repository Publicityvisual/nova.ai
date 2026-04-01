/**
 * WhatsApp Business API - Multi-Número Enterprise
 * Soporte para: 4426689053, 442835034, DJ KOVECK
 */

const Baileys = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');
const SessionManager = require('../utils/session-manager');

class WhatsAppBusinessManager {
  constructor() {
    this.sessions = new Map();
    this.activeNumbers = [
      { 
        id: 'main',
        number: '4426689053', 
        name: 'Publicity Visual Principal',
        type: 'business',
        description: 'Línea principal de atención'
      },
      { 
        id: 'secondary',
        number: '442835034', 
        name: 'Publicity Visual Ventas',
        type: 'business',
        description: 'Línea de ventas y cotizaciones'
      },
      { 
        id: 'personal',
        number: '5215512345678', 
        name: 'DJ KOVECK',
        type: 'personal',
        description: 'Cuenta personal administrador'
      }
    ];
    this.onMessageCallbacks = [];
  }

  async initialize() {
    console.log('\n📱 INICIALIZANDO WHATSAPP BUSINESS - MULTI-NÚMERO\n');
    
    // Verificar estado de sesiones primero
    const sessionStatus = await SessionManager.getAllSessionsStatus();
    
    console.log('Estado de sesiones guardadas:');
    for (const [id, status] of Object.entries(sessionStatus)) {
      const info = SessionManager.getSessionInfo(id);
      const icon = status.exists ? '✅' : '❌';
      const estado = status.exists ? 'Guardada' : 'Nueva';
      console.log(`  ${icon} ${info.name}: ${estado}`);
    }
    
    console.log('\n💡 Nota: Las sesiones guardadas se reconectan automáticamente');
    console.log('    Solo escanea QR si es primera vez o cambiaste de teléfono\n');
    
    // Inicializar todas las sesiones
    for (const account of this.activeNumbers) {
      await this.createSession(account);
    }
  }

  async createSession(account) {
    try {
      const sessionPath = path.join('./data/sessions', account.id);
      await fs.ensureDir(sessionPath);

      const { state, saveCreds } = await Baileys.useMultiFileAuthState(sessionPath);
      const { version } = await Baileys.fetchLatestBaileysVersion();

      const sock = Baileys.makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        browser: [account.name, 'Business', '2.0'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
        shouldIgnoreJid: (jid) => jid?.includes('broadcast')
      });

      this.sessions.set(account.id, {
        socket: sock,
        account: account,
        connected: false,
        qr: null,
        lastActivity: null
      });

      // Eventos
      sock.ev.on('connection.update', async (update) => {
        const { qr, connection, lastDisconnect } = update;
        const session = this.sessions.get(account.id);

        if (qr) {
          // Solo mostrar QR si realmente se necesita
          const qrDataURL = await QRCode.toDataURL(qr, {
            width: 400,
            margin: 2,
            color: { dark: '#00ff00', light: '#1a1a2e' }
          });
          session.qr = qrDataURL;
          this.saveQRData(account.id, qrDataURL, 'connecting');
          
          console.log(`\n🔐 [${account.name}] CÓDIGO QR GENERADO`);
          console.log(`   📞 ${account.number}`);
          console.log(`   👉 Abre QR-WHATSAPP.html en tu navegador`);
          console.log(`   📱 Escanea con WhatsApp desde tu celular\n`);
        }

        if (connection === 'open') {
          session.connected = true;
          session.qr = null;
          console.log(`✅ [${account.name}] ¡CONECTADO!`);
          console.log(`   📱 ${account.number} está listo`);
          console.log(`   💾 Sesión guardada automáticamente\n`);
          
          // Iniciar keep-alive
          SessionManager.keepAlive(account.id, sock);
        }

        if (connection === 'close') {
          session.connected = false;
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== Baileys.DisconnectReason.loggedOut;
          
          if (shouldReconnect) {
            console.log(`⚠️  [${account.name}] Desconectado. Reconectando automáticamente...`);
            console.log(`   💾 La sesión sigue guardada, no necesitas QR\n`);
            setTimeout(() => this.createSession(account), 5000);
          } else {
            console.log(`❌ [${account.name}] Sesión cerrada manualmente`);
            console.log(`   📝 Se requerirá escanear QR nuevamente\n`);
          }
        }
      });

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        
        for (const msg of m.messages) {
          if (msg.key.fromMe) continue;
          await this.processMessage(account.id, msg);
        }
      });

    } catch (error) {
      console.error(`[${account.name}] Error:`, error.message);
    }
  }

  async processMessage(sessionId, msg) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

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
        const stream = await session.socket.downloadMediaMessage(msg);
        if (stream) imageData = stream.toString('base64');
      } catch (e) {}
    }

    if (!text && !imageData) return;

    const from = msg.key.remoteJid;
    const userId = from.endsWith('@g.us') ? msg.key.participant : from;

    // Callback para procesamiento
    for (const cb of this.onMessageCallbacks) {
      await cb(text?.trim() || '', {
        text: text?.trim() || '',
        from,
        userId,
        sessionId,
        accountName: session.account.name,
        accountNumber: session.account.number,
        isGroup: from.endsWith('@g.us'),
        imageData,
        messageId: msg.key.id,
        pushName: msg.pushName || 'Usuario',
        timestamp: msg.messageTimestamp
      });
    }

    // Auto-responder si es mensaje de negocio
    await this.handleAutoResponse(sessionId, userId, text);
  }

  async handleAutoResponse(sessionId, to, text) {
    const lower = text.toLowerCase();
    
    // Detectar preguntas comunes de negocio
    const responses = {
      'precio': 'Hola, para cotizaciones personalizadas, ¿me podrías indicar qué servicio te interesa?',
      'horario': 'Nuestro horario es de Lunes a Viernes 9:00 - 18:00 hrs.',
      'ubicacion': 'Estamos en Ciudad de México. ¿Te gustaría agendar una visita?',
      'servicios': 'Ofrecemos: Branding, Diseño Web, Marketing Digital y Redes Sociales.',
      'cotizacion': 'Perfecto, para darte una cotización ajustada, ¿me cuentas más sobre tu proyecto?',
      'gracias': '¡Con gusto! Quedo atenta si necesitas algo más.',
      'hola': '¡Hola! Soy Sofia de Publicity Visual, ¿en qué puedo ayudarte?'
    };

    for (const [keyword, response] of Object.entries(responses)) {
      if (lower.includes(keyword)) {
        await this.sendMessage(sessionId, to, response);
        return;
      }
    }
  }

  async sendMessage(sessionId, to, content) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.connected) {
      console.error(`[${sessionId}] No conectado`);
      return false;
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    
    try {
      await session.socket.sendMessage(jid, { text: content });
      return true;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      return false;
    }
  }

  async broadcastToAll(message) {
    // Enviar a todos los números conectados
    const results = [];
    for (const [id, session] of this.sessions) {
      if (session.connected) {
        // Enviar al owner
        const result = await this.sendMessage(id, process.env.OWNER_NUMBER, message);
        results.push({ session: id, sent: result });
      }
    }
    return results;
  }

  async sendWelcomeMessage(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const welcomeMsgs = [
      `✅ ${session.account.name} está ahora en línea.`,
      `Sofia Gonzalez - Secretaria Ejecutiva lista.`,
      `Publicity Visual - Sistema activo.`
    ];

    // Notificar al admin
    if (process.env.OWNER_NUMBER) {
      await this.sendMessage(sessionId, process.env.OWNER_NUMBER, welcomeMsgs.join('\n'));
    }
  }

  saveQRData(sessionId, qrData, status) {
    const data = {
      [sessionId]: { qr: qrData, status, timestamp: new Date().toISOString() },
      accounts: this.activeNumbers.map(a => ({ id: a.id, name: a.name, number: a.number }))
    };
    fs.writeFileSync('./whatsapp-qr-data.json', JSON.stringify(data, null, 2));
  }

  onMessage(callback) {
    this.onMessageCallbacks.push(callback);
  }

  getStatus() {
    const status = [];
    for (const [id, session] of this.sessions) {
      status.push({
        id,
        name: session.account.name,
        number: session.account.number,
        connected: session.connected,
        hasQR: !!session.qr
      });
    }
    return status;
  }
}

module.exports = WhatsAppBusinessManager;

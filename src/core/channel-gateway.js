/**
 * NOVA AI - Multi-Channel Gateway
 * Basado en OpenClaw Gateway Architecture
 * 
 * Sistema unificado para manejar múltiples canales (WhatsApp, Telegram, Discord, etc.)
 * con una interfaz consistente.
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class ChannelGateway extends EventEmitter {
  constructor() {
    super();
    this.channels = new Map();
    this.adapters = new Map();
    this.sessions = new Map();
    this.messageQueue = [];
  }

  /**
   * Registra un adaptador de canal
   */
  registerChannel(name, adapter, config = {}) {
    this.channels.set(name, {
      name,
      adapter,
      config,
      status: 'disconnected',
      connected: false
    });
    
    this.adapters.set(name, adapter);
    logger.info(`📡 Channel registered: ${name}`);
    
    // Escuchar eventos del adaptador
    adapter.on('message', (msg) => this.handleIncomingMessage(name, msg));
    adapter.on('connected', () => this.updateChannelStatus(name, 'connected'));
    adapter.on('disconnected', () => this.updateChannelStatus(name, 'disconnected'));
    adapter.on('error', (err) => this.handleChannelError(name, err));
  }

  /**
   * Conecta todos los canales
   */
  async connectAll() {
    logger.info('🌐 Connecting all channels...');
    
    for (const [name, channel] of this.channels) {
      try {
        await this.connectChannel(name);
      } catch (error) {
        logger.error(`Failed to connect ${name}:`, error.message);
      }
    }
  }

  /**
   * Conecta un canal específico
   */
  async connectChannel(name) {
    const channel = this.channels.get(name);
    if (!channel) {
      throw new Error(`Channel ${name} not found`);
    }

    logger.info(`🔗 Connecting ${name}...`);
    await channel.adapter.connect(channel.config);
    channel.connected = true;
    channel.status = 'connected';
    
    this.emit('channel:connected', { channel: name });
    logger.info(`✅ ${name} connected`);
  }

  /**
   * Desconecta un canal
   */
  async disconnectChannel(name) {
    const channel = this.channels.get(name);
    if (channel && channel.adapter) {
      await channel.adapter.disconnect();
      channel.connected = false;
      channel.status = 'disconnected';
      this.emit('channel:disconnected', { channel: name });
    }
  }

  /**
   * Envía mensaje a través de un canal
   */
  async sendMessage(channelName, recipient, content, options = {}) {
    const channel = this.channels.get(channelName);
    if (!channel || !channel.connected) {
      throw new Error(`Channel ${channelName} not available`);
    }

    const message = {
      id: this.generateMessageId(),
      channel: channelName,
      recipient,
      content,
      timestamp: new Date().toISOString(),
      options
    };

    await channel.adapter.sendMessage(recipient, content, options);
    this.emit('message:sent', message);
    
    return message;
  }

  /**
   * Maneja mensaje entrante
   */
  handleIncomingMessage(channelName, message) {
    const enrichedMessage = {
      ...message,
      channel: channelName,
      receivedAt: new Date().toISOString(),
      id: this.generateMessageId()
    };

    // Guardar en sesión del remitente
    this.updateSession(channelName, message.sender, enrichedMessage);
    
    // Emitir para procesamiento
    this.emit('message:received', enrichedMessage);
    
    logger.debug(`📨 Message from ${channelName}: ${message.sender}`);
  }

  /**
   * Actualiza sesión de usuario
   */
  updateSession(channel, sender, message) {
    const sessionKey = `${channel}:${sender}`;
    
    if (!this.sessions.has(sessionKey)) {
      this.sessions.set(sessionKey, {
        channel,
        sender,
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
    }
    
    const session = this.sessions.get(sessionKey);
    session.messages.push(message);
    session.lastActivity = new Date().toISOString();
    
    // Mantener solo últimos 50 mensajes
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }
  }

  /**
   * Obtiene sesión de usuario
   */
  getSession(channel, sender) {
    const sessionKey = `${channel}:${sender}`;
    return this.sessions.get(sessionKey);
  }

  /**
   * Obtiene historial de conversación
   */
  getConversationHistory(channel, sender, limit = 20) {
    const session = this.getSession(channel, sender);
    if (!session) return [];
    
    return session.messages.slice(-limit);
  }

  /**
   * Actualiza estado de canal
   */
  updateChannelStatus(name, status) {
    const channel = this.channels.get(name);
    if (channel) {
      channel.status = status;
      channel.connected = status === 'connected';
      this.emit('channel:status', { channel: name, status });
    }
  }

  /**
   * Maneja errores de canal
   */
  handleChannelError(name, error) {
    logger.error(`Channel ${name} error:`, error.message);
    this.emit('channel:error', { channel: name, error });
  }

  /**
   * Obtiene estado de todos los canales
   */
  getStatus() {
    const status = {};
    for (const [name, channel] of this.channels) {
      status[name] = {
        status: channel.status,
        connected: channel.connected,
        config: channel.config
      };
    }
    return status;
  }

  /**
   * Genera ID único para mensaje
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Difunde mensaje a múltiples canales
   */
  async broadcast(content, excludeChannels = []) {
    const results = [];
    
    for (const [name, channel] of this.channels) {
      if (excludeChannels.includes(name)) continue;
      if (!channel.connected) continue;
      
      try {
        // Broadcast solo funciona para ciertos tipos de canales
        // como grupos de Discord, canales de Telegram, etc.
        results.push({ channel: name, success: true });
      } catch (error) {
        results.push({ channel: name, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

/**
 * Base Adapter Class
 * Todos los adaptadores de canal deben extender esta clase
 */
class ChannelAdapter extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.connected = false;
  }

  async connect(config) {
    throw new Error('Must implement connect()');
  }

  async disconnect() {
    throw new Error('Must implement disconnect()');
  }

  async sendMessage(recipient, content, options) {
    throw new Error('Must implement sendMessage()');
  }

  async getProfile(userId) {
    return null;
  }
}

module.exports = {
  ChannelGateway,
  ChannelAdapter
};

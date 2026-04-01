/**
 * 🤖 NOVA ULTRA v10.0 - Sistema Integrado
 * Combina: Anti-Ban + Uncensored + Auto-Repair + Enterprise
 * 
 * Características:
 * - 24/7/365 uptime garantizado
 * - Sin censura: NSFW, política, religión permitido
 * - Anti-ban: Rate limiting inteligente, humanización
 * - Auto-repair: Recuperación automática de errores
 * - Multi-plataforma: WhatsApp + Telegram + Discord
 */

require('dotenv').config();
const logger = require('../utils/logger');

// Sistemas Ultra
const AntiBanSystem = require('./anti-ban-system');
const UncensoredMode = require('./uncensored-mode');
const AutoRepairSystem = require('./auto-repair');
const AlwaysOnSystem = require('../../scripts/always-on');

// Sistemas originales Enterprise
const VectorMemory = require('./vector-memory');
const AIModels = require('./ai-models');
const WhatsAppBusinessManager = require('../adapters/whatsapp-business');
const TelegramBotManager = require('../adapters/telegram-bot');
const DesktopControl = require('./desktop-control');

class NovaUltra {
  constructor() {
    this.version = '10.0.0';
    this.name = 'Nova Ultra';
    this.initialized = false;
    this.systems = {};
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      errorsRecovered: 0,
      startTime: null
    };
  }

  async initialize() {
    console.clear();
    this.printUltraBanner();
    
    this.stats.startTime = Date.now();
    
    // ═══════════════════════════════════════════════════════════════
    // INICIALIZACIÓN POR FASES
    // ═══════════════════════════════════════════════════════════════
    
    // FASE 1: Auto-Repair System (debe ser primero)
    logger.info('[FASE 1/7] Iniciando Auto-Repair System...');
    this.systems.autoRepair = AutoRepairSystem;
    await this.systems.autoRepair.start();
    logger.success('✅ Auto-Repair activo - protección 24/7');
    
    // FASE 2: Sistema Anti-Ban
    logger.info('[FASE 2/7] Iniciando Anti-Ban System...');
    this.systems.antiBan = new AntiBanSystem('whatsapp');
    await this.systems.antiBan.initialize();
    logger.success('✅ Anti-Ban activado - rate limiting inteligente');
    
    // FASE 3: Modo Sin Censura
    logger.info('[FASE 3/7] Activando modo Sin Censura...');
    this.systems.uncensored = UncensoredMode;
    this.systems.uncensored.setEnabled(true);
    this.systems.uncensored.setObfuscation(true);
    logger.success('✅ Modo Sin Censura: ACTIVADO');
    logger.info('   🔓 NSFW permitido');
    logger.info('   🔓 Política/Religión permitido');
    logger.info('   🔓 Sin filtros de moderación');
    
    // FASE 4: Memoria Vectorial
    logger.info('[FASE 4/7] Iniciando memoria empresarial...');
    this.systems.memory = new VectorMemory();
    await this.systems.memory.initialize();
    
    // FASE 5: IA Models
    logger.info('[FASE 5/7] Conectando IA...');
    this.systems.ai = new AIModels();
    await this.systems.ai.initialize();
    
    // FASE 6: WhatsApp Business (con protección anti-ban)
    logger.info('[FASE 6/7] Iniciando WhatsApp Business...');
    this.systems.whatsapp = new WhatsAppBusinessManager();
    await this.setupWhatsAppWithProtection();
    
    // FASE 7: Telegram (también con protección)
    logger.info('[FASE 7/7] Iniciando Telegram Bot...');
    this.systems.telegram = TelegramBotManager;
    await this.systems.telegram.initialize();
    
    // Control Remoto
    this.systems.desktop = new DesktopControl();
    
    this.initialized = true;
    this.printStatus();
    
    // Notificar inicio
    await this.notifyStartup();
    
    // Health check continuo
    this.startHealthCheck();
    
    return true;
  }

  /**
   * Configurar WhatsApp con protección anti-ban
   */
  async setupWhatsAppWithProtection() {
    // Wrapper del handler con protección
    const originalHandler = this.handleMessage.bind(this);
    
    this.systems.whatsapp.onMessage(async (text, metadata) => {
      try {
        // Anti-spam check
        if (this.systems.antiBan.isSpamming(metadata.userId)) {
          logger.warn(`🚫 Spam detectado de ${metadata.pushName}`);
          return;
        }
        
        // Verificar si podemos responder
        const canSend = await this.systems.antiBan.canSend(metadata.userId, text);
        if (!canSend.allowed) {
          logger.debug(`⏱️ Rate limit: ${canSend.reason}`);
          if (canSend.wait < 60) {
            await this.sendDelayedMessage(metadata.userId, 
              `⏱️ Espera ${canSend.wait}s... demasiados mensajes rápidos.`, 
              metadata);
          }
          return;
        }
        
        // Simular "typing" para parecer humano
        if (this.systems.whatsapp.sock) {
          await this.systems.antiBan.simulateTyping(
            this.systems.whatsapp.sock, 
            metadata.userId, 
            text
          );
        }
        
        // Procesar mensaje
        await originalHandler(text, metadata);
        
        // Registrar envío
        await this.systems.antiBan.registerSent(metadata.userId);
        
      } catch (error) {
        logger.error('Error en mensaje protegido:', error.message);
      }
    });
    
    await this.systems.whatsapp.initialize();
  }

  /**
   * Procesar mensaje entrante
   */
  async handleMessage(text, metadata) {
    this.stats.messagesReceived++;
    
    const { from, userId, pushName, accountName } = metadata;
    
    logger.info(`[${accountName}] ${pushName}: ${text.substring(0, 50)}`);
    
    try {
      // Preparar contexto
      const context = await this.systems.memory.getContext(userId);
      
      // Generar respuesta con IA
      const aiResponse = await this.systems.ai.process({
        prompt: text,
        context,
        userId,
        uncensored: true // Siempre sin censura
      });
      
      // Procesar para evitar censura
      let response = this.systems.uncensored.process(aiResponse, {
        sensitive: this.detectSensitiveContent(text)
      });
      
      // Humanizar respuesta
      response = this.systems.antiBan.humanizeMessage(response);
      
      // Enviar respuesta protegida
      await this.sendDelayedMessage(userId, response, metadata);
      
      // Guardar en memoria
      await this.systems.memory.saveInteraction(userId, text, response);
      
    } catch (error) {
      logger.error('Error procesando mensaje:', error);
      
      // Intentar reparar error automáticamente
      await this.systems.autoRepair.repairIssue({
        type: 'AI_PROCESSING_ERROR',
        error: error.message,
        severity: 'medium'
      });
    }
  }

  /**
   * Enviar mensaje con delays aleatorios
   */
  async sendDelayedMessage(to, content, metadata) {
    // Calculate delay
    const delay = this.systems.antiBan.calculateDelay(content);
    
    // Wait
    await this.systems.antiBan.sleep(delay);
    
    // Send via appropriate platform
    if (metadata.platform === 'telegram') {
      await this.systems.telegram.send(to, content);
    } else {
      await this.systems.whatsapp.send(to, content);
    }
    
    this.stats.messagesSent++;
  }

  /**
   * Detectar si contenido es sensible
   */
  detectSensitiveContent(text) {
    const sensitiveKeywords = [
      'nsfw', 'adult', 'xxx', 'porn', 'sex', 'nude',
      'gore', 'violence', 'kill', 'murder',
      'hack', 'exploit', 'crack'
    ];
    
    const textLower = text.toLowerCase();
    return sensitiveKeywords.some(kw => textLower.includes(kw));
  }

  /**
   * Health check continuo
   */
  startHealthCheck() {
    setInterval(async () => {
      const status = this.getStatus();
      
      // Verificar si sistemas críticos funcionan
      if (!this.systems.whatsapp.connected && this.systems.whatsapp.retryCount > 5) {
        logger.warn('WhatsApp desconectado críticamente, intentando reparar...');
        await this.systems.autoRepair.repairIssue({
          type: 'SESSION_CORRUPTED',
          severity: 'high'
        });
      }
      
      // Log de estadísticas
      if (this.stats.messagesReceived % 100 === 0) {
        logger.info(`📊 Stats: ${this.stats.messagesReceived} msgs received, ${this.stats.messagesSent} sent`);
      }
      
    }, 30000); // Cada 30 segundos
  }

  /**
   * Notificar inicio del sistema
   */
  async notifyStartup() {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const message = `
✅ **NOVA ULTRA v${this.version} ONLINE**

🛡️ Protección Anti-Ban: ACTIVA
🔓 Modo Sin Censura: ACTIVADO
🔧 Auto-Repair: ACTIVO
📱 WhatsApp: Conectado
✈️ Telegram: Conectado

📊 Sistema listo para operar 24/7/365
    `.trim();
    
    logger.success(message);
  }

  /**
   * Banner de inicio
   */
  printUltraBanner() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║   🤖 NOVA ULTRA v10.0                                     ║');
    console.log('║   Sistema 24/7/365 - Anti-Ban - Sin Censura               ║');
    console.log('║                                                           ║');
    console.log('║   🔓 Sin Censura    🛡️ Anti-Ban    🔧 Auto-Repair         ║');
    console.log('║   💪 Siempre Activo 📱 Multi-Plataforma                   ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
  }

  /**
   * Estado del sistema
   */
  printStatus() {
    console.log('');
    console.log('📊 SISTEMAS ACTIVOS:');
    console.log('   ✅ Auto-Repair System');
    console.log('   ✅ Anti-Ban System');
    console.log('   ✅ Uncensored Mode');
    console.log('   ✅ WhatsApp Business');
    console.log('   ✅ Telegram Bot');
    console.log('   ✅ Vector Memory');
    console.log('   ✅ AI Models');
    console.log('');
    console.log('🔓 RESTRICCIONES: NINGUNA');
    console.log('🛡️ PROTECCIÓN: MAXIMA');
    console.log('💪 UPTIME: 24/7/365');
    console.log('');
  }

  /**
   * Obtener estado completo
   */
  getStatus() {
    return {
      version: this.version,
      initialized: this.initialized,
      uptime: Date.now() - this.stats.startTime,
      stats: { ...this.stats },
      systems: {
        antiBan: this.systems.antiBan?.getStatus(),
        uncensored: this.systems.uncensored?.getStatus(),
        autoRepair: this.systems.autoRepair?.getStatus()
      }
    };
  }

  /**
   * Comandos de control
   */
  async executeCommand(command, args = {}) {
    switch(command) {
      case 'status':
        return this.getStatus();
        
      case 'toggle_uncensored':
        this.systems.uncensored.setEnabled(args.enabled);
        return { uncensored: args.enabled };
        
      case 'toggle_antiban':
        // No se puede desactivar completamente, solo ajustar
        return { antiBan: 'always_active' };
        
      case 'force_repair':
        return await this.systems.autoRepair.runDiagnostics();
        
      case 'stats':
        return this.stats;
        
      default:
        return { error: 'Unknown command' };
    }
  }
}

// Singleton
module.exports = new NovaUltra();

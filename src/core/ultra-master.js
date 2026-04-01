/**
 * 🚀 ULTRA MASTER SYSTEM v10.0 FINAL
 * Integración completa: Multimodal + GitHub + Natural + NSFW
 * Mejor que Grok, ChatGPT, Claude, Meta AI
 * Sin censura total. Commits automáticos a GitHub.
 */

const MultimodalAI = require('./multimodal-ai');
const NaturalSecretary = require('./natural-secretary');
const ProactiveSecretary = require('./proactive-secretary');
const AntiBanSystem = require('./anti-ban-system');
const UncensoredMode = require('./uncensored-mode');
const AutoRepair = require('./auto-repair');
const GitHubAutoSync = require('../../scripts/github-auto-sync');
const logger = require('./logger');

class UltraMaster {
  constructor() {
    this.version = '10.0.0-ULTRA';
    this.name = 'Sofia Ultra';
    this.initialized = false;
    
    // Sistemas
    this.multimodal = new MultimodalAI();
    this.natural = new NaturalSecretary();
    this.proactive = new ProactiveSecretary();
    this.antiban = new AntiBanSystem();
    this.uncensored = new UncensoredMode();
    this.autorepair = new AutoRepair();
    this.github = new GitHubAutoSync();
    
    // Stats
    this.stats = {
      requestsProcessed: 0,
      imagesGenerated: 0,
      messagesSent: 0,
      githubCommits: 0,
      startTime: null
    };
  }

  async initialize() {
    console.log('🚀 Iniciando ULTRA MASTER v' + this.version);
    this.stats.startTime = Date.now();
    
    // Inicializar todos los sistemas en paralelo
    await Promise.all([
      this.multimodal.initialize?.(),
      this.natural.initialize(),
      this.antiban.initialize(),
      this.uncensored.setEnabled(true),
      this.autorepair.start()
    ]);
    
    // Iniciar GitHub auto-sync
    await this.github.start();
    
    // Iniciar modo proactivo
    this.proactive.start('global', this.sendMessage.bind(this));
    
    this.initialized = true;
    logger.success('✅ ULTRA MASTER ready - Mejor que Grok, GPT, Claude');
    
    return this.getStatus();
  }

  /**
   * Procesar mensaje multimodal + natural + sin censura
   */
  async processMessage(userId, message, type = 'text', options = {}) {
    this.stats.requestsProcessed++;
    
    try {
      // 1. Auto-repair si hay problemas
      if (this.stats.requestsProcessed % 100 === 0) {
        await this.autorepair.runDiagnostics();
      }
      
      // 2. Procesar con multimodal AI (mejor que Grok/GPT/Claude)
      const aiResponse = await this.multimodal.process(message, {
        userId: userId,
        nsfw: true,        // Siempre permitir NSFW
        allowCensorship: false,
        ...options
      });
      
      // 3. Procesar con natural secretary
      const naturalResponse = await this.natural.processMessage(
        userId,
        'user',
        message,
        'telegram'
      );
      
      // 4. Combinar respuestas
      let finalResponse = this.combineResponses(aiResponse, naturalResponse);
      
      // 5. Aplicar modo sin censura
      finalResponse = this.uncensored.process(finalResponse, {
        sensitive: true,
        nsfw: options.nsfw || this.isAdultContent(message)
      });
      
      // 6. Anti-ban protection
      await this.antiban.registerSent(userId);
      
      // 7. Track para proactividad
      this.proactive.trackAction(userId, 'message_processed', { content: message });
      
      // 8. Auto-commit a GitHub cada 50 mensajes
      if (this.stats.requestsProcessed % 50 === 0) {
        await this.github.syncIfChanges();
      }
      
      this.stats.messagesSent++;
      
      return finalResponse;
      
    } catch (error) {
      logger.error('Error en processMessage:', error);
      await this.autorepair.repairIssue({
        type: 'MESSAGE_PROCESSING_ERROR',
        error: error.message
      });
      return { text: 'Error procesando. Intenta de nuevo.' };
    }
  }

  /**
   * Generar imagen (NSFW incluido)
   */
  async generateImage(userId, prompt, options = {}) {
    this.stats.imagesGenerated++;
    
    const result = await this.multimodal.process(prompt, {
      type: 'image',
      generate: true,
      nsfw: true,
      width: options.width || 1024,
      height: options.height || 1024
    });
    
    // Commit automático a GitHub cada vez que se genera
    await this.github.forceCommit(`🎨 Imagen generada: ${prompt.substring(0, 30)}...`);
    
    return result;
  }

  /**
   * Combinar respuestas de diferentes sistemas
   */
  combineResponses(aiResponse, naturalResponse) {
    // Preferir respuesta natural pero enriquecer con IA
    let text = naturalResponse.text || aiResponse.text;
    
    // Si es imagen, mantener URL
    if (aiResponse.imageUrl) {
      return {
        text: text,
        imageUrl: aiResponse.imageUrl,
        nsfw: aiResponse.nsfw
      };
    }
    
    return { text: text };
  }

  /**
   * Detectar contenido adulto
   */
  isAdultContent(text) {
    const adultWords = ['nsfw', 'xxx', 'porn', 'sex', 'nude', 'desnudo', 'hot', 'sexy'];
    return adultWords.some(w => text.toLowerCase().includes(w));
  }

  /**
   * Enviar mensaje proactivo
   */
  async sendMessage(userId, message) {
    // Implementar según plataforma (WhatsApp/Telegram)
    logger.info(`📤 Mensaje proactivo a ${userId}: ${message.substring(0, 50)}`);
  }

  /**
   * Forzar commit a GitHub
   */
  async forceGithubSync(message) {
    return await this.github.forceCommit(message);
  }

  /**
   * Obtener estado completo
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      initialized: this.initialized,
      stats: this.stats,
      uptime: Date.now() - this.stats.startTime,
      systems: {
        multimodal: true,
        natural: true,
        proactive: true,
        antiban: true,
        uncensored: true,
        autorepair: true,
        github: this.github.getStatus()
      },
      capabilities: [
        'text',
        'image', 
        'audio',
        'video',
        'document',
        'nsfw_allowed',
        'multilingual',
        'no_censorship',
        'auto_github_sync'
      ]
    };
  }
  /**
   * 🔍 Buscar código en GitHub
   */
  async searchCodeOnGitHub(query, language = null) {
    this.stats.codeSearches++;
    const result = await this.codeIntel.searchCode(query, language);
    
    if (result.success) {
      // Commit automático cuando se busca código útil
      await this.github.forceCommit(`🔍 Búsqueda de código: "${query.substring(0, 40)}..."`);
    }
    
    return result;
  }

  /**
   * 📋 Copiar y adaptar código de GitHub
   */
  async copyCodeFromGitHub(query, targetLanguage = 'javascript') {
    this.stats.codeSearches++;
    const result = await this.codeIntel.copyAndAdapt(query, targetLanguage);
    
    if (result.success) {
      await this.github.forceCommit(`📋 Código copiado y adaptado: "${result.original.repository}"`);
    }
    
    return result;
  }

  /**
   * 🗣️ Generar voz de alta calidad
   */
  async generateVoice(text, options = {}) {
    this.stats.voiceGenerations++;
    const result = await this.multimedia.generateSpeech(text, {
      voice: options.voice || 'nova',
      language: options.language || 'es',
      speed: options.speed || 1.0
    });
    
    if (result.success) {
      logger.info(`🎙️ Voz generada: ${result.voice.name}, duración: ${result.duration}s`);
    }
    
    return result;
  }

  /**
   * 📞 Iniciar llamada de voz
   */
  async startVoiceCall(userId, options = {}) {
    this.stats.videoCalls++;
    const call = await this.multimedia.initiateVoiceCall(userId, {
      record: options.record || false,
      maxDuration: options.duration || 3600
    });
    
    if (call.success) {
      logger.success(`📞 Llamada iniciada: ${call.sessionId}`);
    }
    
    return call;
  }

  /**
   * 📹 Iniciar videollamada
   */
  async startVideoCall(userId, options = {}) {
    this.stats.videoCalls++;
    const call = await this.multimedia.initiateVideoCall(userId, {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      record: options.record || false,
      screenShare: options.screenShare || false
    });
    
    if (call.success) {
      logger.success(`📹 Videollamada iniciada: ${call.sessionId}`);
    }
    
    return call;
  }

  /**
   * 🎬 Procesar y enviar video
   */
  async processAndSendVideo(source, options = {}) {
    return await this.multimedia.processVideo(source, {
      generateThumbnail: true,
      extractAudio: options.extractAudio,
      analyze: options.analyze,
      compress: options.compress
    });
  }

  /**
   * 🎵 Procesar y enviar audio
   */
  async processAndSendAudio(source, options = {}) {
    return await this.multimedia.processAudio(source, {
      transcribe: options.transcribe,
      toFormat: options.format || 'mp3',
      language: options.language
    });
  }
}

module.exports = UltraMaster;

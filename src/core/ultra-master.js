/**
 * 🚀 ULTRA MASTER SYSTEM v10.0 FINAL
 * Integración completa: Multimodal + GitHub + Natural + NSFW
 * Mejor que Grok, ChatGPT, Claude, Meta AI
 * Sin censura total. Commits automáticos a GitHub.
 * 
 * 🆚 100% NOVA AI - Sin dependencias externas
 * 🔓 Agente de código propietario
 */

const MultimodalAI = require('./multimodal-ai');
const NaturalSecretary = require('./natural-secretary');
const ProactiveSecretary = require('./proactive-secretary');
const AntiBanSystem = require('./anti-ban-system');
const UncensoredMode = require('./uncensored-mode');
const AutoRepair = require('./auto-repair');
const GitHubAutoSync = require('../../scripts/github-auto-sync');
const CodeIntelligence = require('./code-intelligence');
const MultimediaSystem = require('./multimedia-system');
const NovaCodeAgent = require('./nova-code-agent'); // ✅ Propietario NOVA
const logger = require('../utils/logger');

class UltraMaster {
  constructor() {
    this.version = '10.0.0-ULTRA-NOVA';
    this.name = 'Sofia Ultra';
    this.initialized = false;
    
    // Sistemas NOVA AI propietarios
    this.multimodal = new MultimodalAI();
    this.natural = new NaturalSecretary();
    this.proactive = new ProactiveSecretary();
    this.antiban = new AntiBanSystem();
    this.uncensored = new UncensoredMode();
    this.autorepair = new AutoRepair();
    this.github = new GitHubAutoSync();
    this.codeIntel = new CodeIntelligence();
    this.multimedia = new MultimediaSystem();
    this.codeAgent = new NovaCodeAgent({ // ✅ Agente de código propietario
      safeMode: true,
      autoCommit: true
    });
    
    // Stats
    this.stats = {
      requestsProcessed: 0,
      imagesGenerated: 0,
      messagesSent: 0,
      githubCommits: 0,
      codeSearches: 0,
      voiceGenerations: 0,
      videoCalls: 0,
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
      this.autorepair.start(),
      this.codeAgent.initialize() // ✅ Inicializar NOVA Code Agent
    ]);
    
    // Asegurar directorios de multimedia
    await this.multimedia.ensureDirectories();
    
    // Iniciar GitHub auto-sync
    await this.github.start();
    
    // Iniciar modo proactivo
    this.proactive.start('global', this.sendMessage.bind(this));
    
    this.initialized = true;
    logger.success('✅ ULTRA MASTER ready - 100% NOVA AI - Sin Claude/Anthropic');
    
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
      
      // 2. Si es solicitud de código, usar NOVA Code Agent
      if (this.isCodeRequest(message)) {
        return await this.processCodeRequest(userId, message);
      }
      
      // 3. Procesar con multimodal AI
      const aiResponse = await this.multimodal.process(message, {
        userId: userId,
        nsfw: true,
        allowCensorship: false,
        ...options
      });
      
      // 4. Procesar con natural secretary
      const naturalResponse = await this.natural.processMessage(
        userId, 
        'user', 
        message, 
        'telegram'
      );
      
      // 5. Combinar respuestas
      let finalResponse = this.combineResponses(aiResponse, naturalResponse);
      
      // 6. Aplicar modo sin censura
      finalResponse = this.uncensored.process(finalResponse, {
        sensitive: true,
        nsfw: options.nsfw || this.isAdultContent(message)
      });
      
      // 7. Anti-ban protection
      await this.antiban.registerSent(userId);
      
      // 8. Track para proactividad
      this.proactive.trackAction(userId, 'message_processed', { content: message });
      
      // 9. Auto-commit a GitHub cada 50 mensajes
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
   * 🧠 Procesar solicitud de código (NOVA propietario)
   */
  async processCodeRequest(userId, message) {
    logger.info(`🧠 Solicitud de código detectada para usuario ${userId}`);
    
    const result = await this.codeAgent.processNaturalRequest(message);
    
    // Track
    this.proactive.trackAction(userId, 'code_request', { query: message });
    
    // Commit automático si se modificó código
    if (result.success && result.changes) {
      await this.github.syncIfChanges();
    }
    
    return {
      text: result.response || result.explanation || result.fixes?.join('\n') || 'Procesado',
      isNovaCode: true,
      ...result
    };
  }

  /**
   * Detectar si es solicitud de código
   */
  isCodeRequest(text) {
    const codePatterns = [
      /crea(?:r)?\s+(?:un|una)\s+(funci[oó]n|clase|modulo|servidor)/i,
      /explica(?:r)?\s+(?:el\s+)?c[oó]digo/i,
      /corrige(?:r)?\s+(?:el\s+)?error/i,
      /refactoriza(?:r)?/i,
      /ejecuta(?:r)?\s+npm/i,
      /commit\s+con/i,
      /(?:crea|genera)(?:r)?\s+tests?/i
    ];
    return codePatterns.some(p => p.test(text));
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
    
    await this.github.forceCommit(`🎨 Imagen generada: ${prompt.substring(0, 30)}...`);
    
    return result;
  }

  /**
   * Combinar respuestas
   */
  combineResponses(aiResponse, naturalResponse) {
    let text = naturalResponse.text || aiResponse.text;
    
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
    logger.info(`📤 Mensaje proactivo a ${userId}: ${message.substring(0, 50)}`);
  }

  /**
   * 🔍 Buscar código en GitHub
   */
  async searchCodeOnGitHub(query, language = null) {
    this.stats.codeSearches++;
    const result = await this.codeIntel.searchCode(query, language);
    
    if (result.success) {
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
      independent: true, // ✅ Marca de independencia
      systems: {
        multimodal: true,
        natural: true,
        proactive: true,
        antiban: true,
        uncensored: true,
        autorepair: true,
        code_intel: true,
        multimedia: true,
        code_agent: true, // ✅ Nova Code Agent
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
        'auto_github_sync',
        'code_search',
        'code_copy',
        'video_call',
        'voice_call',
        'voice_generation',
        'screen_share',
        'code_agent_nova', // ✅ Capacidad NOVA propietaria
        'code_explanation',
        'code_fix',
        'code_refactor'
      ]
    };
  }
}

module.exports = UltraMaster;

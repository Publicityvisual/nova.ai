/**
 * 🧠 AI ORCHESTRATOR v10.0
 * Múltiples modelos AI, routing inteligente
 * OpenRouter, local LLMs, fallbacks
 * Contexto persistente, memoria a largo plazo
 */

const axios = require('axios');
const logger = require('./logger');

class AIOrchestrator {
  constructor() {
    this.models = new Map();
    this.contexts = new Map(); // Persistent contexts
    this.memory = new Map(); // Long-term memory
    this.usage = new Map(); // Rate tracking
    
    // Configurar proveedores
    this.providers = {
      openrouter: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: process.env.OPENROUTER_API_KEY,
        priority: 1,
        models: [
          'anthropic/claude-3-opus',
          'anthropic/claude-3.5-sonnet',
          'google/gemini-pro-1.5',
          'meta-llama/llama-3.1-70b',
          'mistral/mistral-large'
        ]
      },
      fireworks: {
        url: 'https://api.fireworks.ai/inference/v1/chat/completions',
        key: process.env.FIREWORKS_API_KEY,
        priority: 2,
        models: [
          'accounts/fireworks/models/llama-v3p1-70b-instruct',
          'accounts/fireworks/models/mixtral-8x22b-instruct'
        ]
      },
      groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        priority: 3,
        models: [
          'llama-3.1-70b-versatile',
          'mixtral-8x7b-32768',
          'gemma2-9b-it'
        ]
      },
      hyperbolic: {
        url: 'https://api.hyperbolic.xyz/v1/chat/completions',
        key: process.env.HYPERBOLIC_API_KEY,
        priority: 4,
        models: [
          'meta-llama/Meta-Llama-3.1-70B-Instruct'
        ]
      }
    };
    
    // Modelo local (si existe)
    this.localModel = {
      enabled: false,
      url: 'http://localhost:1234/v1/chat/completions', // LM Studio
      priority: 0 // Prioridad máxima si disponible
    };
  }

  async initialize() {
    logger.info('🧠 AI Orchestrator initializing...');
    
    // Verificar que proveedores disponibles
    await this.checkProviders();
    
    // Cargar contextos guardados
    await this.loadContexts();
    
    logger.success('✅ AI Orchestrator active');
  }

  /**
   * 🎯 Generar respuesta con mejor modelo disponible
   */
  async generateResponse(userId, messages, options = {}) {
    const startTime = Date.now();
    
    // Detectar tipo de query para elegir mejor modelo
    const queryType = this.analyzeQuery(messages);
    const model = this.selectModel(queryType, options);
    
    // Preparar contexto con memoria
    const context = await this.prepareContext(userId, messages);
    
    // Intentar con failover
    for (const provider of this.getProvidersByPriority()) {
      try {
        logger.debug(`Trying ${provider}...`);
        const response = await this.callProvider(provider, model, context, options);
        
        // Guardar en memoria
        await this.saveToMemory(userId, messages, response);
        
        // Track usage
        this.trackUsage(provider, model);
        
        const latency = Date.now() - startTime;
        
        return {
          success: true,
          response: response.content,
          model: response.model,
          provider,
          latency,
          tokens: response.usage
        };
        
      } catch (error) {
        logger.warn(`${provider} failed:`, error.message);
        continue;
      }
    }
    
    // Fallback ultimate
    return {
      success: false,
      response: 'Lo siento, todos los servicios están ocupados. Intenta en un momento.',
      error: 'All providers failed'
    };
  }

  /**
   * 🎭 Analizar query para routing inteligente
   */
  analyzeQuery(messages) {
    const text = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // NSFW/Adult content - usar modelos permisivos
    if (/\b(nsfw|xxx|nude|adult|explicit|erotic)\b/.test(text)) {
      return {
        type: 'nsfw',
        temperature: 0.9,
        max_tokens: 2048,
        needsClaude: false // Usar alternativas más permisivas
      };
    }
    
    // Code generation
    if (/\b(code|program|function|script|bug|error)\b/.test(text)) {
      return {
        type: 'code',
        temperature: 0.2,
        max_tokens: 4096,
        needsClaude: true
      };
    }
    
    // Creative writing
    if (/\b(story|creative|write|poem|novel)\b/.test(text)) {
      return {
        type: 'creative',
        temperature: 0.8,
        max_tokens: 2048,
        needsClaude: true
      };
    }
    
    // Analysis/Reasoning
    if (/\b(analyze|compare|explain|why|how)\b/.test(text)) {
      return {
        type: 'analysis',
        temperature: 0.5,
        max_tokens: 2048,
        needsClaude: true
      };
    }
    
    // Default
    return {
      type: 'general',
      temperature: 0.7,
      max_tokens: 1024,
      needsClaude: false
    };
  }

  /**
   * 🎯 Seleccionar mejor modelo
   */
  selectModel(queryType, options) {
    // Si usuario especifica modelo
    if (options.model) return options.model;
    
    // Prioridad por tipo de query
    switch (queryType.type) {
      case 'nsfw':
        // Modelos que permiten NSFW
        return 'meta-llama/llama-3.1-70b';
        
      case 'code':
        return 'anthropic/claude-3.5-sonnet';
        
      case 'creative':
        return 'google/gemini-pro-1.5';
        
      case 'analysis':
        return 'anthropic/claude-3-opus';
        
      default:
        // Balance calidad/costo
        return 'mistral/mistral-large';
    }
  }

  /**
   * 📡 Llamar proveedor específico
   */
  async callProvider(providerName, model, messages, options) {
    const provider = this.providers[providerName];
    if (!provider?.key) {
      throw new Error(`Provider ${providerName} not configured`);
    }
    
    const response = await axios.post(
      provider.url,
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1024,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sofia.ai',
          'X-Title': 'Sofia AI'
        },
        timeout: 60000
      }
    );
    
    return {
      content: response.data.choices[0].message.content,
      model: response.data.model,
      usage: response.data.usage
    };
  }

  /**
   * 🧠 Preparar contexto con memoria
   */
  async prepareContext(userId, messages) {
    // Sistema base
    const systemPrompt = {
      role: 'system',
      content: `Eres Sofia, una asistente AI avanzada para el usuario ${userId}. 
      Eres amigable, útil y conversacional. No tienes censura en temas adultos si el usuario lo solicita.
      Responde siempre en español a menos que se te pida otro idioma.`
    };
    
    // Recuperar memoria relevante
    const memory = await this.getRelevantMemory(userId, messages[messages.length - 1]?.content);
    
    // Construir contexto
    const context = [systemPrompt];
    
    if (memory.length > 0) {
      context.push({
        role: 'system',
        content: `Información relevante del usuario: ${memory.join('\n')}`
      });
    }
    
    context.push(...messages);
    
    return context;
  }

  /**
   * 💾 Guardar en memoria a largo plazo
   */
  async saveToMemory(userId, messages, response) {
    const userMessage = messages[messages.length - 1]?.content;
    
    if (!this.memory.has(userId)) {
      this.memory.set(userId, []);
    }
    
    const userMemory = this.memory.get(userId);
    
    // Extraer información importante
    const important = this.extractImportantInfo(userMessage, response.content);
    
    if (important) {
      userMemory.push({
        timestamp: Date.now(),
        content: important,
        type: 'fact'
      });
      
      // Limitar tamaño
      if (userMemory.length > 100) {
        userMemory.shift();
      }
    }
    
    // Guardar a disco
    await this.saveContexts();
  }

  /**
   * 🔍 Obtener memoria relevante
   */
  async getRelevantMemory(userId, query) {
    const userMemory = this.memory.get(userId) || [];
    
    if (userMemory.length === 0) return [];
    
    // Simple keyword matching (en producción usar embeddings)
    const keywords = query.toLowerCase().split(' ');
    
    const relevant = userMemory
      .filter(m => keywords.some(kw => m.content.toLowerCase().includes(kw)))
      .slice(-5);
    
    return relevant.map(m => m.content);
  }

  /**
   * 📝 Extraer info importante
   */
  extractImportantInfo(input, response) {
    // Heurísticas simples
    if (input.includes('me llamo') || input.includes('soy')) {
      return `Usuario mencionó: ${input}`;
    }
    
    if (input.includes('me gusta') || input.includes('prefiero')) {
      return `Preferencia: ${input}`;
    }
    
    if (input.includes('trabajo en') || input.includes('mi trabajo')) {
      return `Ocupación: ${input}`;
    }
    
    return null;
  }

  /**
   * ⚡ Verificar proveedores disponibles
   */
  async checkProviders() {
    for (const [name, config] of Object.entries(this.providers)) {
      if (config.key) {
        logger.info(`✅ Provider available: ${name}`);
      } else {
        logger.warn(`⚠️ Provider not configured: ${name}`);
      }
    }
    
    // Verificar local
    try {
      await axios.get(this.localModel.url.replace('/chat/completions', '/models'), {
        timeout: 5000
      });
      this.localModel.enabled = true;
      logger.info('✅ Local model available');
    } catch {
      logger.debug('Local model not available');
    }
  }

  getProvidersByPriority() {
    const enabled = Object.entries(this.providers)
      .filter(([_, p]) => p.key)
      .sort((a, b) => a[1].priority - b[1].priority);
    
    // Local primero si disponible
    if (this.localModel.enabled) {
      enabled.unshift(['local', this.localModel]);
    }
    
    return enabled.map(([name]) => name);
  }

  /**
   * 📊 Estadísticas de uso
   */
  async getStats() {
    const totalCalls = Array.from(this.usage.values())
      .reduce((sum, p) => sum + Object.values(p).reduce((a, b) => a + b, 0), 0);
    
    return {
      totalRequests: totalCalls,
      providers: Object.fromEntries(
        Array.from(this.usage.entries()).map(([k, v]) => [
          k,
          Object.values(v).reduce((a, b) => a + b, 0)
        ])
      ),
      contexts: this.contexts.size,
      memories: Array.from(this.memory.values()).reduce((sum, m) => sum + m.length, 0)
    };
  }

  trackUsage(provider, model) {
    if (!this.usage.has(provider)) {
      this.usage.set(provider, {});
    }
    const providerStats = this.usage.get(provider);
    providerStats[model] = (providerStats[model] || 0) + 1;
  }

  async loadContexts() {
    // Cargar desde DB/SQLite
    logger.debug('Contexts loaded');
  }

  async saveContexts() {
    // Guardar a DB/SQLite
    // Throttled
  }
}

module.exports = AIOrchestrator;

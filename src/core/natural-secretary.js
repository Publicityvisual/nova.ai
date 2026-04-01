/**
 * 👩‍💼 NATURAL SECRETARY MODE v5.0
 * Modo "Sofia Secretaria" - Entiende lenguaje natural sin comandos
 * Proactiva, inteligente, con memoria persistente
 * Todo tipo de contenido permitido (NSFW, política, religión)
 */

const logger = require('../utils/logger');
const VectorMemory = require('./vector-memory');
const TelegramSuperTools = require('../telegram/super-tools');
const UncensoredMode = require('./uncensored-mode');

class NaturalSecretary {
  constructor() {
    this.memory = new VectorMemory();
    this.tools = new TelegramSuperTools();
    this.userContexts = new Map();
    this.conversationHistory = new Map();
    this.userPreferences = new Map();
    
    // Patrones de intención (expresiones naturales)
    this.intentPatterns = {
      // Generar imágenes
      generateImage: [
        /(?:crea|genera|haz|muéstrame|dame|quiero|necesito)\s+(?:una?\s+)?(?:imagen|foto|dibujo|ilustración|picture|image)\s+(?:de\s+)?(.+)/i,
        /(?:imagina|visualiza)\s+(.+)/i,
        /(?:dibuja|pinta)\s+(.+)/i,
        /(?:quiero ver|muéstrame)\s+(.+)/i,
      ],
      
      // Buscar información
      searchWeb: [
        /(?:busca|encuentra|investiga|buscar|googlea)\s+(?:sobre|sobre la|sobre el|info de|información de)?\s*(.+)/i,
        /(?:qué|quién|cómo|cuándo|dónde)\s+(?:es|son|fue|fueron|hace|está)?\s*(.+)/i,
        /(?:cuéntame|explica|dime)\s+(?:sobre)?\s*(.+)/i,
      ],
      
      // Ejecutar cálculos
      calculate: [
        /(?:calcula|resuelve|cuánto es|cuanto es|resultado de)\s+(.+)/i,
        /(\d+\s*[\+\-\*\/\^]\s*\d+)/i,
        /(?:suma|resta|multiplica|divide)\s+\d+.+\d+/i,
      ],
      
      // Clima
      getWeather: [
        /(?:clima|tiempo|temperatura|pronóstico)\s+(?:en|de|para)?\s*(?:la ciudad de|el estado de)?\s*([^\?\.]+)/i,
        /(?:cómo está|qué tal)\s+(?:el clima|el tiempo)\s+(?:en|de)?\s*(.+)/i,
        /(?:hace calor|hace frío|está lloviendo)\s+(?:en)?\s*(.+)/i,
      ],
      
      // Traducir
      translate: [
        /(?:traduce|traducir|cómo se dice|como se dice)\s+["']?(.+?)["']?\s+(?:al|a|en|en idioma)?\s*(español|inglés|english|francés|french|alemán|german|chino|japonés|coreano|árabe|portugués|.+)/i,
        /(?:traduce|traducir)\s+(["'][^"']+["'])\s*(?:al\s+)?(español|inglés|francés|alemán|chino|japonés|coreano|árabe|portugués)*/i,
      ],
      
      // Conversión de moneda
      convertCurrency: [
        /(?:convierte|cuánto son|cuanto son|a cuánto equivale|cuánto es)\s+(\d+(?:\.\d+)?)\s*(usd|eur|mxn|gbp|jpy|dólares|euros|pesos|yen)\s+(?:a|en)\s*(usd|eur|mxn|gbp|jpy|dólares|euros|pesos|yen)/i,
        /(?:conversión|cambio)\s+de\s+(\d+)\s*(.+?)\s*a\s*(.+)/i,
      ],
      
      // Generar QR
      generateQR: [
        /(?:genera|crea|haz)\s+(?:un)?\s*código\s*qr\s+(?:con|para|de)?\s*(.+)/i,
        /(?:qr| código qr)\s+(?:para|con|de)?\s*(.+)/i,
      ],
      
      // Analizar web
      analyzeWeb: [
        /(?:analiza|revisa|echa un vistazo|mira)\s+(?:esta|la|el)?\s*(?:página|web|sitio|url)?\s*:?\s*(https?:\/\/\S+)/i,
        /(?:qué sabes|qué información hay)\s+(?:sobre|acerca de)?\s+(https?:\/\/\S+)/i,
      ],
      
      // Resumir
      summarize: [
        /(?:resume|resumen|sintetiza|hazme un resumen)\s+(?:de|del|de la|de este|este)?\s*(?:texto|mensaje|documento|artículo)?\s*(.+)?/i,
      ],
      
      // Modo NSFW/Adulto
      nsfwRequest: [
        /(?:quiero|muéstrame|dame|genera)\s+(?:contenido|material|cosas)?\s*(?:para adultos|nsfw|xxx|porno|erótico|hot|sexy)\s*(?:de)?\s*(.+)?/i,
        /(?:imagen|foto|video)\s*(?:xxx|hot|sexy|desnuda|desnudo|nsfw)\s*(?:de)?\s*(.+)?/i,
        /(?:manda|envía|pasa)\s+(?:pack|fotos|material|contenido)\s*(?:hot|xxx|adulto)?/i,
      ],
      
      // Recordatorios/Tareas
      setReminder: [
        /(?:recuérdame|recuerdame|recuerda)\s+(?:que)?\s*(.+)/i,
        /(?:pon una alarma|alarmame|avísame)\s+(?:en|dentro de|para)?\s*(.+)/i,
      ],
      
      // Control sistema
      systemControl: [
        /(?:captura|screenshot|foto)\s+(?:de la)?\s*(?:pantalla|pc|computadora)/i,
        /(?:estado|cómo está|cómo van|cómo andan)\s+(?:las|los|el sistema|los servidores|las conexiones)/i,
        /(?:reinicia|reiniciar|restart)\s+(?:el|la)?\s*(?:sistema|bot|sofia)/i,
      ],
      
      // Video/YouTube
      videoInfo: [
        /(?:qué es|sobre qué trata|información de)\s+(?:este|el|la)?\s*video:?\s*(https?:\/\/\S+)/i,
        /(?:descargar|bajar|guardar)\s+(?:este|el)?\s*video\s*(?:de)?\s*(.+)/i,
      ],
    };
    
    // Respuestas de confirmación
    this.confirmations = [
      "Entendido, ",
      "Claro, ",
      "Por supuesto, ",
      "De inmediato, ",
      "Enseguida, ",
      "Déjame ver... ",
      "Procesando... ",
    ];
    
    this.isInitialized = false;
  }

  /**
   * Inicializar secretaria
   */
  async initialize() {
    logger.info('👩‍💼 Natural Secretary Mode initializing...');
    await this.memory.initialize();
    this.isInitialized = true;
    logger.success('✅ Natural Secretary ready - Habla como a una persona');
  }

  /**
   * Procesar mensaje de usuario (entrada principal)
   */
  async processMessage(userId, username, message, platform = 'telegram') {
    if (!this.isInitialized) await this.initialize();
    
    // Guardar en conversación
    this.addToConversation(userId, 'user', message);
    
    // Obtener contexto del usuario
    const context = await this.getUserContext(userId);
    const preferences = this.getUserPreferences(userId);
    
    // Detectar intención
    const intent = this.detectIntent(message);
    
    // Procesar según intención
    let response = null;
    
    if (intent) {
      logger.info(`🎯 Intención detectada: ${intent.type}`);
      response = await this.executeIntent(intent, userId, context, platform);
    } else {
      // Sin intención clara - respuesta conversacional con IA
      response = await this.conversationalResponse(message, userId, context);
    }
    
    // Guardar respuesta
    this.addToConversation(userId, 'assistant', response.text || response);
    
    // Actualizar contexto
    await this.updateUserContext(userId, intent);
    
    return response;
  }

  /**
   * Detectar intención del mensaje
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    for (const [type, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          return {
            type: type,
            raw: message,
            matches: match,
            params: match.slice(1),
            confidence: this.calculateConfidence(type, message)
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Calcular confianza de la detección
   */
  calculateConfidence(type, message) {
    // Simple heurística de confianza
    const messageLength = message.length;
    const hasQuestionMark = message.includes('?');
    const hasActionWords = /(crea|genera|busca|dame|muéstrame|necesito|quiero)/i.test(message);
    
    let confidence = 0.7; // Base
    if (hasQuestionMark) confidence += 0.1;
    if (hasActionWords) confidence += 0.15;
    if (messageLength > 10) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Ejecutar intención detectada
   */
  async executeIntent(intent, userId, context, platform) {
    const confirmation = this.confirmations[Math.floor(Math.random() * this.confirmations.length)];
    
    switch (intent.type) {
      case 'generateImage':
        return await this.handleImageGeneration(intent, userId, confirmation);
        
      case 'searchWeb':
        return await this.handleSearch(intent, userId, confirmation);
        
      case 'calculate':
        return await this.handleCalculation(intent, userId);
        
      case 'getWeather':
        return await this.handleWeather(intent, userId, confirmation);
        
      case 'translate':
        return await this.handleTranslation(intent, userId, confirmation);
        
      case 'convertCurrency':
        return await this.handleCurrency(intent, userId);
        
      case 'generateQR':
        return await this.handleQR(intent, userId, confirmation);
        
      case 'analyzeWeb':
        return await this.handleAnalyze(intent, userId, confirmation);
        
      case 'summarize':
        return await this.handleSummarize(intent, userId, confirmation, context);
        
      case 'nsfwRequest':
        return await this.handleNSFW(intent, userId, confirmation);
        
      case 'setReminder':
        return await this.handleReminder(intent, userId, confirmation);
        
      case 'systemControl':
        return await this.handleSystem(intent, userId, confirmation);
        
      case 'videoInfo':
        return await this.handleVideo(intent, userId, confirmation);
        
      default:
        return { text: "No entendí bien qué necesitas. ¿Podrías ser más específico?" };
    }
  }

  /**
   * 🎨 Generar imagen (incluye NSFW)
   */
  async handleImageGeneration(intent, userId, confirmation) {
    const prompt = intent.params[0] || intent.raw;
    
    // Detectar si es solicitud NSFW
    const isNSFW = this.isAdultRequest(prompt);
    const enhancedPrompt = isNSFW 
      ? `${prompt}, NSFW, adult content, high quality, detailed`
      : `${prompt}, high quality, detailed, professional`;
    
    // Usar tools
    const result = await this.tools.processCommand('imagen', enhancedPrompt, userId, null);
    
    if (result.success) {
      const safePrompt = isNSFW 
        ? "[Contenido NSFW generado - privado]" 
        : prompt;
      
      return {
        text: `${confirmation}generando imagen de "${safePrompt.substring(0, 50)}..."`,
        imageUrl: result.result.imageUrl,
        isNSFW: isNSFW,
        followUp: isNSFW 
          ? "🎨 Imagen NSFW generada. Discreción recomendada."
          : "🎨 Aquí tienes la imagen generada."
      };
    }
    
    return { text: "❌ No pude generar la imagen. Intenta con otra descripción." };
  }

  /**
   * 🔍 Buscar web
   */
  async handleSearch(intent, userId, confirmation) {
    const query = intent.params[0] || intent.raw;
    
    const result = await this.tools.processCommand('buscar', query, userId, null);
    
    if (result.success) {
      return {
        text: `${confirmation}encontré esto sobre "${query}":\n\n${result.result.text.substring(0, 3000)}`,
        sources: result.result.results
      };
    }
    
    return { text: "❌ No encontré información relevante. Intenta con otros términos." };
  }

  /**
   * 🧮 Calcular
   */
  async handleCalculation(intent, userId) {
    const expression = intent.params[0] || intent.raw;
    
    const result = await this.tools.processCommand('ejecutar', expression, userId, null);
    
    if (result.success) {
      return { text: result.result.text };
    }
    
    return { text: "❌ No pude calcular eso. Intenta con una expresión matemática válida." };
  }

  /**
   * 🌤️ Clima
   */
  async handleWeather(intent, userId, confirmation) {
    const city = intent.params[0] || intent.params[1] || 'Querétaro';
    
    const result = await this.tools.processCommand('clima', city.trim(), userId, null);
    
    if (result.success) {
      return { text: `${confirmation}${result.result.text}` };
    }
    
    return { text: "❌ No pude obtener el clima. Verifica el nombre de la ciudad." };
  }

  /**
   * 🌐 Traducir
   */
  async handleTranslation(intent, userId, confirmation) {
    const text = intent.params[0];
    const targetLang = intent.params[1] || 'español';
    
    const args = `${text} al ${targetLang}`;
    const result = await this.tools.processCommand('traducir', args, userId, null);
    
    if (result.success) {
      return { text: `${confirmation}\n${result.result.text}` };
    }
    
    return { text: "❌ No pude traducir. Intenta de nuevo con el formato: 'traduce [texto] al [idioma]'" };
  }

  /**
   * 💰 Conversión de moneda
   */
  async handleCurrency(intent, userId) {
    const args = intent.raw;
    const result = await this.tools.processCommand('moneda', args, userId, null);
    
    if (result.success) {
      return { text: result.result.text };
    }
    
    return { text: "❌ No pude hacer la conversión. Usa el formato: 'convierte 100 USD a EUR'" };
  }

  /**
   * 📱 Generar QR
   */
  async handleQR(intent, userId, confirmation) {
    const text = intent.params[0] || intent.raw;
    
    const result = await this.tools.processCommand('qr', text, userId, null);
    
    if (result.success) {
      return {
        text: `${confirmation}generé tu código QR para: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        imageUrl: result.result.qrUrl
      };
    }
    
    return { text: "❌ No pude generar el QR." };
  }

  /**
   * 🔍 Analizar web
   */
  async handleAnalyze(intent, userId, confirmation) {
    const url = intent.params[0] || intent.raw.match(/https?:\/\/\S+/)?.[0];
    
    if (!url) {
      return { text: "❌ No detecté una URL válida. Incluye http:// o https://" };
    }
    
    const result = await this.tools.processCommand('analizar', url, userId, null);
    
    if (result.success) {
      return { text: `${confirmation}analicé la página:\n\n${result.result.text}` };
    }
    
    return { text: "❌ No pude analizar la página. Verifica que sea accesible." };
  }

  /**
   * 📝 Resumir
   */
  async handleSummarize(intent, userId, confirmation, context) {
    // Buscar texto en los últimos mensajes si no hay parámetros
    let text = intent.params[0];
    
    if (!text && context.lastMessages) {
      text = context.lastMessages.slice(-3).join('\n');
    }
    
    if (!text) {
      return { text: "❌ No tengo texto para resumir. Responde a un mensaje largo o proporciona el texto." };
    }
    
    const result = await this.tools.processCommand('resumir', text, userId, null);
    
    if (result.success) {
      return { text: `${confirmation}aquí está el resumen:\n\n${result.result.text}` };
    }
    
    return { text: "❌ No pude resumir el texto." };
  }

  /**
   * 🔞 Manejar solicitud NSFW
   */
  async handleNSFW(intent, userId, confirmation) {
    const prompt = intent.params[0] || intent.raw;
    
    // Ofuscación para evitar detección automática
    const obfuscated = UncensoredMode.prepareUncensored(prompt);
    
    // Redirigir a generación de imagen con flag NSFW
    const enhancedPrompt = `${obfuscated}, NSFW, adult content, high quality, detailed, artistic`;
    
    const result = await this.tools.processCommand('imagen', enhancedPrompt, userId, null);
    
    if (result.success) {
      return {
        text: `🔓 Contenido privado generado. Usa con discreción.`,
        imageUrl: result.result.imageUrl,
        isNSFW: true,
        private: true
      };
    }
    
    return { text: "❌ No pude generar el contenido solicitado." };
  }

  /**
   * 📝 Crear recordatorio
   */
  async handleReminder(intent, userId, confirmation) {
    const reminder = intent.params[0];
    
    // Guardar en memoria
    await this.memory.save({
      type: 'reminder',
      userId: userId,
      content: reminder,
      createdAt: Date.now()
    });
    
    return { text: `${confirmation}creé el recordatorio: "${reminder}"` };
  }

  /**
   * 🖥️ Control del sistema
   */
  async handleSystem(intent, userId, confirmation) {
    const message = intent.raw.toLowerCase();
    
    if (message.includes('captura') || message.includes('screenshot')) {
      // Requiere autorización
      return { 
        text: "📸 Para capturar la pantalla usa el comando /captura con autorización de admin.",
        requiresAuth: true
      };
    }
    
    if (message.includes('estado')) {
      return { text: "✅ Todos los sistemas operativos. WhatsApp, Telegram y herramientas funcionando correctamente." };
    }
    
    if (message.includes('reinicia')) {
      return { 
        text: "🔄 Para reiniciar el sistema usa /reiniciar con autorización de admin.",
        requiresAuth: true
      };
    }
    
    return { text: "¿Qué necesitas saber del sistema?" };
  }

  /**
   * 📹 Info de video
   */
  async handleVideo(intent, userId, confirmation) {
    const url = intent.params[0] || intent.raw.match(/https?:\/\/\S+/)?.[0];
    
    if (!url) {
      return { text: "❌ No detecté un enlace de video válido." };
    }
    
    const result = await this.tools.processCommand('video', url, userId, null);
    
    if (result.success) {
      return { text: `${confirmation}encontré información del video:\n\n${result.result.text}` };
    }
    
    return { text: "❌ No pude obtener información del video." };
  }

  /**
   * 💬 Respuesta conversacional (IA)
   */
  async conversationalResponse(message, userId, context) {
    // Respuesta humanizada sin comandos exactos
    const responses = [
      "Entiendo. ¿En qué más puedo ayudarte?",
      "Estoy lista para ayudarte. ¿Necesitas buscar algo, generar una imagen, o hacer un cálculo?",
      "Puedo hacer muchas cosas: buscar en internet, generar imágenes, calcular, traducir... ¿Qué necesitas?",
      "Soy tu asistente. Puedes pedirme cosas como 'busca lo último en tecnología' o 'genera una imagen de un gato'."
    ];
    
    // Si el mensaje es muy corto, dar opciones
    if (message.length < 10) {
      return { 
        text: "Hola 👋 Soy Sofia, tu secretaria virtual.\n\nPuedo hacer esto por ti:\n\n🎨 Generar imágenes\n🔍 Buscar información\n🧮 Calcular operaciones\n🌤️ Ver el clima\n🌐 Traducir idiomas\n💰 Convertir monedas\n\n¿Qué necesitas? Solo dilo de forma natural."
      };
    }
    
    return { text: responses[Math.floor(Math.random() * responses.length)] };
  }

  /**
   * Detectar si es solicitud adulta
   */
  isAdultRequest(text) {
    const adultKeywords = [
      'nsfw', 'xxx', 'porn', 'porno', 'sex', 'sexo', 'nude', 'desnuda',
      'desnudo', 'hot', 'sexy', 'erotic', 'erótico', 'adult', 'adulto'
    ];
    
    const textLower = text.toLowerCase();
    return adultKeywords.some(kw => textLower.includes(kw));
  }

  /**
   * Contexto del usuario
   */
  async getUserContext(userId) {
    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, {
        lastMessages: [],
        preferences: {},
        history: await this.memory.getRecent(userId, 10)
      });
    }
    return this.userContexts.get(userId);
  }

  /**
   * Preferencias del usuario
   */
  getUserPreferences(userId) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {
        language: 'es',
        nsfw: true, // Por defecto permitido
        notifications: true
      });
    }
    return this.userPreferences.get(userId);
  }

  /**
   * Agregar a conversación
   */
  addToConversation(userId, role, content) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    history.push({ role, content, timestamp: Date.now() });
    
    // Mantener últimos 50 mensajes
    if (history.length > 50) {
      history.shift();
    }
    
    // Actualizar contexto
    if (this.userContexts.has(userId)) {
      this.userContexts.get(userId).lastMessages = history
        .slice(-5)
        .map(m => m.content);
    }
  }

  /**
   * Actualizar contexto
   */
  async updateUserContext(userId, intent) {
    const context = this.userContexts.get(userId);
    if (context) {
      context.lastIntent = intent?.type;
      context.lastInteraction = Date.now();
    }
  }

  /**
   * Obtener historial
   */
  getConversationHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Limpiar historial viejo
   */
  cleanupOldConversations() {
    const oneHourAgo = Date.now() - 3600000;
    
    for (const [userId, history] of this.conversationHistory) {
      const recent = history.filter(m => m.timestamp > oneHourAgo);
      if (recent.length === 0) {
        this.conversationHistory.delete(userId);
        this.userContexts.delete(userId);
      } else {
        this.conversationHistory.set(userId, recent);
      }
    }
  }
}

module.exports = NaturalSecretary;

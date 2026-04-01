/**
 * 🛡️ ANTI-BAN SYSTEM v3.0
 * Sistema de protección contra baneos para WhatsApp/Telegram
 * Sin censura, sin restricciones, máxima protección
 */

const logger = require('../utils/logger');

class AntiBanSystem {
  constructor(platform = 'whatsapp') {
    this.platform = platform;
    this.messageHistory = new Map(); // user -> timestamps
    this.globalHistory = []; // All messages timestamps
    this.violations = new Map();
    this.cooldowns = new Map();
    
    // Límites agresivos pero seguros (evitamos ban manteniendo delays)
    this.limits = {
      // Por usuario
      messagesPerMinute: 8,
      messagesPerHour: 100,
      // Globales
      globalPerMinute: 30,
      globalPerHour: 500,
      // Delays
      minDelay: 1500,      // 1.5s mínimo entre mensajes
      typingDelay: 50,     // ms por carácter
      maxBurst: 3          // Máximo 3 mensajes seguidos sin delay
    };
    
    // Palabras/hotspots que activan scrutiny (evitamos)
    this.suspiciousPatterns = [
      /\b(spam|bot|automation)\b/gi,
    ];
    
    this.isRunning = false;
  }

  /**
   * Inicializar sistema anti-ban
   */
  async initialize() {
    logger.info('🛡️ Anti-Ban System initialized');
    this.isRunning = true;
    
    // Limpiar historial viejo cada 5 minutos
    setInterval(() => this.cleanupHistory(), 300000);
    
    return true;
  }

  /**
   * Verificar si se puede enviar mensaje
   */
  async canSend(to, content = '') {
    const now = Date.now();
    const userId = to;
    
    // Verificar cooldown global
    if (this.cooldowns.has('global')) {
      const cooldownEnd = this.cooldowns.get('global');
      if (now < cooldownEnd) {
        const wait = Math.ceil((cooldownEnd - now) / 1000);
        return { allowed: false, reason: `global_cooldown`, wait };
      }
    }
    
    // Verificar cooldown por usuario
    if (this.cooldowns.has(userId)) {
      const cooldownEnd = this.cooldowns.get(userId);
      if (now < cooldownEnd) {
        const wait = Math.ceil((cooldownEnd - now) / 1000);
        return { allowed: false, reason: `user_cooldown`, wait };
      }
    }
    
    // Obtener historial del usuario
    const userHistory = this.messageHistory.get(userId) || [];
    const recent = userHistory.filter(ts => now - ts < 60000); // último minuto
    const hourly = userHistory.filter(ts => now - ts < 3600000); // última hora
    
    // Verificar límites por usuario
    if (recent.length >= this.limits.messagesPerMinute) {
      this.setCooldown(userId, 60000); // 1 min cooldown
      return { allowed: false, reason: 'rate_limit_user_minute', retry: 60 };
    }
    
    if (hourly.length >= this.limits.messagesPerHour) {
      this.setCooldown(userId, 300000); // 5 min cooldown
      return { allowed: false, reason: 'rate_limit_user_hour', retry: 300 };
    }
    
    // Verificar límites globales
    const globalRecent = this.globalHistory.filter(ts => now - ts < 60000);
    if (globalRecent.length >= this.limits.globalPerMinute) {
      this.setCooldown('global', 30000); // 30s global cooldown
      return { allowed: false, reason: 'rate_limit_global', retry: 30 };
    }
    
    return { allowed: true, delay: this.calculateDelay(content) };
  }

  /**
   * Registrar mensaje enviado
   */
  async registerSent(to) {
    const now = Date.now();
    const userId = to;
    
    // Registrar para usuario
    if (!this.messageHistory.has(userId)) {
      this.messageHistory.set(userId, []);
    }
    this.messageHistory.get(userId).push(now);
    
    // Registrar global
    this.globalHistory.push(now);
    
    // Añadir variación aleatoria (+/- 200ms) para parecer más humano
    await this.randomizedDelay(100, 300);
  }

  /**
   * Calcular delay basado en contenido
   */
  calculateDelay(content) {
    const baseDelay = this.limits.minDelay;
    const charDelay = content.length * this.limits.typingDelay;
    const randomVariation = Math.floor(Math.random() * 500); // 0-500ms random
    
    return Math.min(baseDelay + charDelay + randomVariation, 5000); // Max 5s
  }

  /**
   * Simular "typing" antes de responder
   */
  async simulateTyping(sock, to, content) {
    if (!sock || this.platform !== 'whatsapp') return;
    
    try {
      // Enviar presencia "composing" (escribiendo...)
      await sock.sendPresenceUpdate('composing', to);
      
      // Delay proporcional al tamaño del mensaje (simula escritura humana)
      const typingTime = Math.min(content.length * this.limits.typingDelay, 3000);
      await this.sleep(typingTime);
      
      // Cambiar a "available"
      await sock.sendPresenceUpdate('available', to);
      
    } catch (e) {
      // Silently fail - no crítico
    }
  }

  /**
   * Humanizar mensaje (evitar detección de bot)
   */
  humanizeMessage(content) {
    // Variaciones sutiles que hacen el mensaje menos "robotizado"
    const variations = [
      { pattern: /\bHola\b/g, replacements: ['Hola', 'Hey', 'Buenas', 'Hola!'] },
      { pattern: /\bgracias\b/gi, replacements: ['gracias', 'gracias!', 'ty', 'gracias 😊'] },
    ];
    
    let humanized = content;
    
    // No sobrescribir completamente, solo variación aleatoria ocasional
    if (Math.random() < 0.3) { // 30% de probabilidad
      variations.forEach(({ pattern, replacements }) => {
        if (pattern.test(content)) {
          const replacement = replacements[Math.floor(Math.random() * replacements.length)];
          humanized = content.replace(pattern, replacement);
        }
      });
    }
    
    // Añadir pequeñas pausas en mensajes largos (como hacen humanos)
    if (humanized.length > 200 && !humanized.includes('...')) {
      const sentences = humanized.split('. ');
      if (sentences.length > 2 && Math.random() < 0.2) {
        const insertIndex = Math.floor(Math.random() * (sentences.length - 1)) + 1;
        sentences.splice(insertIndex, 0, '...');
        humanized = sentences.join('. ').replace('....', '...').replace('. ...', '...');
      }
    }
    
    return humanized;
  }

  /**
   * Preparar mensaje NSFW/Sin censura (sin flags de moderación)
   */
  prepareUncensored(content) {
    // Evitar que plataformas escaneen contenido como "sospechoso"
    // Agregamos variación de codificación/invisible chars
    
    // Zero-width spaces para romper palabras detectadas automáticamente
    // pero invisible para humanos
    const zwsp = '\u200B';
    
    // Romper patrones comunes de detección cada 4-8 caracteres aleatoriamente
    let protectedContent = '';
    let counter = 0;
    const breakInterval = 4 + Math.floor(Math.random() * 4);
    
    for (let char of content) {
      protectedContent += char;
      counter++;
      if (counter % breakInterval === 0 && /[a-zA-Z]/.test(char)) {
        protectedContent += zwsp;
      }
    }
    
    return protectedContent;
  }

  /**
   * Verificar si usuario está en modo "spam"
   */
  isSpamming(userId) {
    const history = this.messageHistory.get(userId) || [];
    const now = Date.now();
    const recent = history.filter(ts => now - ts < 10000); // últimos 10s
    
    return recent.length > 5; // Más de 5 mensajes en 10s = spam
  }

  /**
   * Aplicar cooldown
   */
  setCooldown(id, durationMs) {
    this.cooldowns.set(id, Date.now() + durationMs);
    logger.warn(`⏱️ Cooldown aplicado a ${id}: ${durationMs/1000}s`);
  }

  /**
   * Limpiar historial viejo
   */
  cleanupHistory() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Limpiar historial por usuario
    for (const [userId, timestamps] of this.messageHistory) {
      const filtered = timestamps.filter(ts => ts > oneHourAgo);
      if (filtered.length === 0) {
        this.messageHistory.delete(userId);
      } else {
        this.messageHistory.set(userId, filtered);
      }
    }
    
    // Limpiar historial global
    this.globalHistory = this.globalHistory.filter(ts => ts > oneHourAgo);
    
    // Limpiar cooldowns expirados
    for (const [id, endTime] of this.cooldowns) {
      if (now > endTime) {
        this.cooldowns.delete(id);
      }
    }
    
    logger.debug('🧹 History cleanup completed');
  }

  /**
   * Delay aleatorio
   */
  async randomizedDelay(min = 100, max = 500) {
    const delay = min + Math.random() * (max - min);
    return this.sleep(delay);
  }

  /**
   * Sleep promisificado
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      active: this.isRunning,
      userTracking: this.messageHistory.size,
      globalMessages: this.globalHistory.length,
      activeCooldowns: this.cooldowns.size,
      limits: this.limits
    };
  }
}

module.exports = AntiBanSystem;

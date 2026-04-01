/**
 * ⏱️ RATE LIMITER v2.0
 * Protección anti-spam y anti-ban
 * Límites por usuario y global
 * Cooldowns automáticos
 */

const logger = require('../utils/logger');

class RateLimiter {
  constructor(options = {}) {
    // Límites por usuario
    this.userLimits = {
      messagesPerMinute: options.messagesPerMinute || 20,
      messagesPerHour: options.messagesPerHour || 200,
      cooldownAfterViolation: options.cooldownAfterViolation || 60 // segundos
    };
    
    // Límites globales
    this.globalLimits = {
      messagesPerMinute: options.globalMessagesPerMinute || 100,
      messagesPerHour: options.globalMessagesPerHour || 1000
    };
    
    // Storage
    this.userHistory = new Map(); // userId -> timestamps[]
    this.globalHistory = []; // Global timestamps
    this.cooldowns = new Map(); // userId -> cooldown end
    
    // Limpiar historial viejo cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Verificar si puede enviar mensaje
   */
  async canSend(userId, content = '') {
    const now = Date.now();
    
    // Verificar cooldown activo
    if (this.cooldowns.has(userId)) {
      const cooldownEnd = this.cooldowns.get(userId);
      if (now < cooldownEnd) {
        const remaining = Math.ceil((cooldownEnd - now) / 1000);
        return {
          allowed: false,
          reason: 'cooldown',
          message: `⏱️ Cooldown activo: ${remaining}s restantes`,
          retryAfter: remaining
        };
      }
      // Limpiar cooldown expirado
      this.cooldowns.delete(userId);
    }
    
    // Obtener historial del usuario
    const userHistory = this.userHistory.get(userId) || [];
    const recentMessages = userHistory.filter(ts => now - ts < 60000); // último minuto
    const hourlyMessages = userHistory.filter(ts => now - ts < 3600000); // última hora
    
    // Verificar límites por usuario
    if (recentMessages.length >= this.userLimits.messagesPerMinute) {
      this.setCooldown(userId, this.userLimits.cooldownAfterViolation);
      logger.warn(`🚫 Rate limit: User ${userId} exceeded ${this.userLimits.messagesPerMinute} msg/min`);
      return {
        allowed: false,
        reason: 'user_rate_limit_minute',
        message: `🚫 Demasiados mensajes. Espera ${this.userLimits.cooldownAfterViolation}s.`,
        retryAfter: this.userLimits.cooldownAfterViolation
      };
    }
    
    if (hourlyMessages.length >= this.userLimits.messagesPerHour) {
      this.setCooldown(userId, 300); // 5 min cooldown
      logger.warn(`🚫 Rate limit: User ${userId} exceeded ${this.userLimits.messagesPerHour} msg/hour`);
      return {
        allowed: false,
        reason: 'user_rate_limit_hour',
        message: '🚫 Límite horario alcanzado. Espera 5 minutos.',
        retryAfter: 300
      };
    }
    
    // Verificar límites globales
    const globalRecent = this.globalHistory.filter(ts => now - ts < 60000);
    if (globalRecent.length >= this.globalLimits.messagesPerMinute) {
      logger.warn(`🚫 Global rate limit: ${this.globalLimits.messagesPerMinute} msg/min exceeded`);
      return {
        allowed: false,
        reason: 'global_rate_limit',
        message: '⏱️ Sistema sobrecargado. Intenta en un momento.',
        retryAfter: 30
      };
    }
    
    // Verificar spam por contenido
    if (this.isSpamContent(content)) {
      this.setCooldown(userId, 120);
      return {
        allowed: false,
        reason: 'spam_detected',
        message: '🚫 Contenido detectado como spam.',
        retryAfter: 120
      };
    }
    
    return {
      allowed: true,
      userMessages: recentMessages.length,
      globalMessages: globalRecent.length
    };
  }

  /**
   * Registrar mensaje enviado
   */
  async register(userId) {
    const now = Date.now();
    
    // Agregar a historial de usuario
    if (!this.userHistory.has(userId)) {
      this.userHistory.set(userId, []);
    }
    this.userHistory.get(userId).push(now);
    
    // Agregar a historial global
    this.globalHistory.push(now);
    
    // Limpiar historial antiguo del usuario
    const userHistory = this.userHistory.get(userId);
    const cutoff = now - 3600000; // 1 hora
    this.userHistory.set(userId, userHistory.filter(ts => ts > cutoff));
  }

  /**
   * Aplicar cooldown
   */
  setCooldown(userId, seconds) {
    const endTime = Date.now() + (seconds * 1000);
    this.cooldowns.set(userId, endTime);
    logger.info(`⏱️ Cooldown applied to ${userId}: ${seconds}s`);
  }

  /**
   * Detectar spam por contenido
   */
  isSpamContent(content) {
    if (!content) return false;
    
    const spamPatterns = [
      { pattern: /(\w)\1{10,}/, desc: 'Caracteres repetidos' }, // aaaaaaaaaaa
      { pattern: /https?:\/\/t\.me\/joinchat/, desc: 'Telegram join links' },
      { pattern: /(viagra|crypto|bitcoin|earn money fast)/i, desc: 'Spam keywords' },
      { pattern: /[A-Z]{20,}/, desc: 'Todo mayúsculas' },
      { pattern: /.{400,}/, desc: 'Mensaje muy largo' } // Más de 400 chars
    ];
    
    for (const spam of spamPatterns) {
      if (spam.pattern.test(content)) {
        logger.debug(`🚫 Spam detected: ${spam.desc}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Limpiar historial antiguo
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - 3600000; // 1 hora
    
    // Limpiar global
    this.globalHistory = this.globalHistory.filter(ts => ts > cutoff);
    
    // Limpiar por usuario
    for (const [userId, history] of this.userHistory) {
      const filtered = history.filter(ts => ts > cutoff);
      if (filtered.length === 0) {
        this.userHistory.delete(userId);
      } else {
        this.userHistory.set(userId, filtered);
      }
    }
    
    // Limpiar cooldowns expirados
    for (const [userId, endTime] of this.cooldowns) {
      if (now > endTime) {
        this.cooldowns.delete(userId);
      }
    }
    
    logger.debug(`🧹 Rate limiter cleanup: ${this.userHistory.size} users, ${this.globalHistory.length} global`);
  }

  /**
   * Obtener estado
   */
  getStatus(userId = null) {
    const status = {
      global: {
        lastMinute: this.globalHistory.filter(ts => Date.now() - ts < 60000).length,
        lastHour: this.globalHistory.filter(ts => Date.now() - ts < 3600000).length,
        limitMinute: this.globalLimits.messagesPerMinute,
        limitHour: this.globalLimits.messagesPerHour
      },
      activeCooldowns: this.cooldowns.size
    };
    
    if (userId && this.userHistory.has(userId)) {
      const history = this.userHistory.get(userId);
      status.user = {
        lastMinute: history.filter(ts => Date.now() - ts < 60000).length,
        lastHour: history.filter(ts => Date.now() - ts < 3600000).length,
        limitMinute: this.userLimits.messagesPerMinute,
        limitHour: this.userLimits.messagesPerHour,
        cooldown: this.cooldowns.get(userId)
      };
    }
    
    return status;
  }

  /**
   * Liberar manualmente un cooldown (admin only)
   */
  clearCooldown(userId) {
    this.cooldowns.delete(userId);
    logger.info(`✅ Cooldown cleared for ${userId}`);
  }
}

module.exports = RateLimiter;

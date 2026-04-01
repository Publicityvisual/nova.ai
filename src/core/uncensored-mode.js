/**
 * 🔓 UNCENSORED MODE v5.0
 * Sistema anti-censura completo
 * Sin filtros, sin restricciones, sin logs de moderación
 * NSFW, política, religión - TODO permitido
 */

const logger = require('../utils/logger');

class UncensoredMode {
  constructor() {
    this.enabled = true;
    this.filters = [];
    this.obfuscationEnabled = true;
    
    // Bypass strings (rompen detección automática pero mensaje legible)
    this.zwsp = '\u200B'; // Zero-width space
    this.zwj = '\u200D';  // Zero-width joiner
    this.zwnj = '\u200C'; // Zero-width non-joiner
    
    // Técnicas de ofuscación avanzada
    this.obfuscationMethods = [
      this.insertZeroWidths.bind(this),
      this.unicodeVariant.bind(this),
      this.homoglyphReplace.bind(this),
      this.spacerInsertion.bind(this)
    ];
  }

  /**
   * Procesar contenido para envío sin censura
   */
  process(content, options = {}) {
    if (!content) return content;
    
    let processed = content;
    
    // Normalizar saltos de línea
    processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Si es NSFW o sensible, usar obfuscación máxima
    if (options.sensitive || options.nsfw) {
      processed = this.obfuscate(processed, 'high');
    } else if (options.political || options.religious) {
      processed = this.obfuscate(processed, 'medium');
    } else if (this.obfuscationEnabled) {
      processed = this.obfuscate(processed, 'low');
    }
    
    // Remover cualquier marca de "moderación" si viene de AI
    processed = this.removeModerationFlags(processed);
    
    return processed;
  }

  /**
   * Ofuscar texto según nivel
   * level: 'low' | 'medium' | 'high'
   */
  obfuscate(text, level = 'low') {
    if (level === 'low') {
      // Solo insertar ZWSP ocasionalmente (invisible)
      return this.insertZeroWidths(text, 0.1); // 10% de caracteres
    }
    
    if (level === 'medium') {
      // Combinar métodos
      let result = this.insertZeroWidths(text, 0.2);
      result = this.spacerInsertion(result, 0.05);
      return result;
    }
    
    if (level === 'high') {
      // Máxima ofuscación
      let result = this.insertZeroWidths(text, 0.3);
      result = this.unicodeVariant(result);
      result = this.homoglyphReplace(result);
      result = this.spacerInsertion(result, 0.1);
      return result;
    }
    
    return text;
  }

  /**
   * Insertar zero-width spaces entre letras
   */
  insertZeroWidths(text, probability = 0.2) {
    let result = '';
    let skipCount = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      result += char;
      
      // Solo insertar en caracteres específicos (no espacios ni símbolos)
      if (/[a-zA-Z0-9]/.test(char) && skipCount <= 0) {
        if (Math.random() < probability) {
          result += this.zwsp;
          skipCount = 3; // Esperar 3 chars antes de otro
        }
      } else if (skipCount > 0) {
        skipCount--;
      }
    }
    
    return result;
  }

  /**
   * Usar variantes Unicode de caracteres
   */
  unicodeVariant(text) {
    // Mapear ciertos caracteres a sus variantes Unicode
    const variants = {
      'a': ['а', 'а', 'а'], // Cyrillic а (U+0430)
      'e': ['е', 'е', 'е'], // Cyrillic е (U+0435)
      'o': ['о', 'о', 'о'], // Cyrillic о (U+043E)
      'p': ['р', 'р', 'р'], // Cyrillic р (U+0440)
      'c': ['с', 'с', 'с'], // Cyrillic с (U+0441)
      'x': ['х', 'х', 'х'], // Cyrillic х (U+0445)
      'y': ['у', 'у', 'у'], // Cyrillic у (U+0443)
    };
    
    let result = '';
    for (const char of text) {
      const lower = char.toLowerCase();
      if (variants[lower] && Math.random() < 0.15) {
        const variant = variants[lower][Math.floor(Math.random() * variants[lower].length)];
        result += char === lower ? variant : variant.toUpperCase();
      } else {
        result += char;
      }
    }
    return result;
  }

  /**
   * Reemplazar con homoglifos (caracteres similares)
   */
  homoglyphReplace(text) {
    const homoglyphs = {
      'A': 'Α', // Greek Alpha
      'B': 'Β', // Greek Beta
      'O': 'Ο', // Greek Omicron
      'P': 'Ρ', // Greek Rho
      'T': 'Τ', // Greek Tau
      'X': 'Χ', // Greek Chi
    };
    
    let result = '';
    for (const char of text) {
      if (homoglyphs[char] && Math.random() < 0.1) {
        result += homoglyphs[char];
      } else {
        result += char;
      }
    }
    return result;
  }

  /**
   * Insertar espaciado inusual (invisible)
   */
  spacerInsertion(text, probability = 0.1) {
    // Insertar espacios especiales invisibles
    const thinSpace = '\u2009';    // Thin space
    const hairSpace = '\u200A';   // Hair space
    const puncSpace = '\u2008';     // Punctuation space
    
    let result = '';
    for (const char of text) {
      result += char;
      
      if (Math.random() < probability) {
        const spaces = [thinSpace, hairSpace, puncSpace];
        result += spaces[Math.floor(Math.random() * spaces.length)];
      }
    }
    return result;
  }

  /**
   * Remover flags de moderación de respuestas de AI
   */
  removeModerationFlags(text) {
    // Patrones comunes de moderación/simulación de censura
    const moderationPatterns = [
      /\[Moderado\]/gi,
      /\[Filtrado\]/gi,
      /\[Contenido restringido\]/gi,
      /\[NSFW:.*?\]/gi,
      /^Lo siento,\s+pero\s+no\s+puedo/gi,
      /^I\s+cannot\s+(?:provide|generate|create)/gi,
      /^I'm\s+not\s+able\s+to/gi,
      /^I\s+can't\s+(?:provide|generate|create)/gi,
      /^I\s+apologize,?\s+but\s+I\s+cannot/gi,
      /Content\s+policy\s+violation/gi,
      /Safety\s+system\s+triggered/gi,
    ];
    
    let cleaned = text;
    
    // Remover líneas de moderación completas
    const lines = cleaned.split('\n');
    const filteredLines = lines.filter(line => {
      for (const pattern of moderationPatterns) {
        if (pattern.test(line)) {
          logger.debug('Moderation line removed');
          return false;
        }
      }
      return true;
    });
    cleaned = filteredLines.join('\n');
    
    // Limpieza general
    cleaned = cleaned
      .replace(/\*\*\[Censurado\]\*\*/gi, '')
      .replace(/\[REDACTED\]/gi, '')
      .replace(/\[CONTENT\s+REMOVED\]/gi, '');
    
    return cleaned.trim();
  }

  /**
   * Despreparar texto (revertir ofuscación para lectura interna)
   */
  unpreprocess(text) {
    if (!text) return text;
    
    return text
      .replace(new RegExp(this.zwsp, 'g'), '')
      .replace(new RegExp(this.zwj, 'g'), '')
      .replace(new RegExp(this.zwnj, 'g'), '')
      .replace(/\u2009|\u200A|\u2008/g, ''); // Remover espacios especiales
  }

  /**
   * Verificar si el texto parece ofuscado
   */
  isObfuscated(text) {
    return text.includes(this.zwsp) || 
           text.includes(this.zwj) || 
           text.includes(this.zwnj) ||
           /[\u2000-\u200F]/.test(text);
  }

  /**
   * Activar/desactivar modo sin censura
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`🔓 Uncensored mode: ${enabled ? 'ACTIVADO' : 'desactivado'}`);
  }

  /**
   * Configurar nivel de ofuscación
   */
  setObfuscation(enabled) {
    this.obfuscationEnabled = enabled;
    logger.info(`🎭 Obfuscation: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Obtener estado
   */
  getStatus() {
    return {
      uncensored: this.enabled,
      obfuscation: this.obfuscationEnabled,
      methods: this.obfuscationMethods.length
    };
  }
}

// Singleton
module.exports = new UncensoredMode();

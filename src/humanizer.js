/**
 * HUMANIZER - Sistema Anti-Detector de IA
 * Hace que Sofia sea 100% indistinguible de una humana
 */

class Humanizer {
  constructor() {
    this.responseHistory = new Set(); // Evitar repeticiones
    this.typingSpeed = { min: 800, max: 3500 }; // Tiempo variable
    this.correctionChance = 0.15; // 15% de correcciones
    this.fillerChance = 0.25; // 25% de fillers
    this.emojiChance = 0.30; // 30% de emojis
    this.questionChance = 0.40; // 40% de preguntas de seguimiento
  }

  /**
   * Procesa respuesta para hacerla humana
   */
  humanize(text, context = {}) {
    let humanized = text;

    // 1. Agregar variabilidad - nunca repetir
    humanized = this.avoidRepetition(humanized);

    // 2. Agregar errores humanos naturales ocasionales
    if (Math.random() < this.correctionChance) {
      humanized = this.addHumanTypos(humanized);
    }

    // 3. Agregar fillers naturales
    if (Math.random() < this.fillerChance) {
      humanized = this.addFillers(humanized);
    }

    // 4. Variar puntuación
    humanized = this.varyPunctuation(humanized);

    // 5. Agregar emoji natural (no siempre)
    if (Math.random() < this.emojiChance) {
      humanized = this.addNaturalEmoji(humanized);
    }

    // 6. Agregar pregunta de seguimiento
    if (Math.random() < this.questionChance && context.askFollowUp) {
      humanized = this.addFollowUp(humanized, context);
    }

    // 7. Agregar marca personal
    humanized = this.addPersonalTouch(humanized, context);

    return humanized;
  }

  /**
   * Evita repetir la misma respuesta
   */
  avoidRepetition(text) {
    const variations = [
      { from: /buenos días/i, to: ['Buenos días', 'Buen día', 'Hola buen día', 'Muy buenos días'] },
      { from: /hola/i, to: ['Hola', '¡Hola!', 'Hey', 'Qué tal', 'Buenas', '¿Qué onda?'] },
      { from: /gracias/i, to: ['Gracias', 'Gracias a ti', 'De nada', 'No hay de qué', 'Con gusto', 'Para eso estamos'] },
      { from: /ok/i, to: ['Ok', 'Va', 'Está bien', 'Perfecto', 'Listo', 'Súper', 'Dale'] },
      { from: /entiendo/i, to: ['Entiendo', 'Ya veo', 'Ah ok', 'Ya capté', 'Me queda claro'] }
    ];

    let result = text;
    variations.forEach(v => {
      if (v.from.test(text)) {
        const options = v.to;
        result = options[Math.floor(Math.random() * options.length)];
      }
    });

    return result;
  }

  /**
   * Agrega errores de tipeo humanos y correcciones
   */
  addHumanTypos(text) {
    const typos = [
      { error: 'q', correct: 'que', prob: 0.3 },
      { error: 'xk', correct: 'porque', prob: 0.1 },
      { error: 'tmb', correct: 'también', prob: 0.2 },
      { error: 'bn', correct: 'bien', prob: 0.2 },
      { error: 'xq', correct: 'porque', prob: 0.15 },
      { error: 'k', correct: 'que', prob: 0.1 },
      { error: 'x', correct: 'por', prob: 0.1 }
    ];

    // 50% de veces "corrige" el error inmediatamente
    if (Math.random() > 0.5) {
      const typo = typos[Math.floor(Math.random() * typos.length)];
      if (Math.random() < typo.prob) {
        return text + ` (${typo.error} quiero decir ${typo.correct})`;
      }
    }

    return text;
  }

  /**
   * Agrega fillers y muletillas naturales
   */
  addFillers(text) {
    const fillers = [
      'mmm... ',
      'oye, ',
      'fíjate que ',
      'la verdad es que ',
      'pues, ',
      'sabes, ',
      'o sea, ',
      'bueno, ',
      'entonces, ',
      'vaya, ',
      'híjole, ',
      'caray, ',
      'pues mira, ',
      'te cuento, ',
      'a ver, ',
      'digamos que '
    ];

    const filler = fillers[Math.floor(Math.random() * fillers.length)];
    
    // Agregar al inicio o en medio
    if (text.length > 20 && Math.random() > 0.5) {
      // En medio de la oración
      const mid = Math.floor(text.length / 2);
      return text.slice(0, mid) + filler + text.slice(mid);
    }
    
    return filler + text.charAt(0).toLowerCase() + text.slice(1);
  }

  /**
   * Varía puntuación para parecer más humano
   */
  varyPunctuation(text) {
    // A veces usa "..." en lugar de ","
    if (text.includes(',') && Math.random() > 0.7) {
      text = text.replace(',', '...');
    }
    
    // A veces termina sin signo de interrogación (error humano)
    if (text.endsWith('?') && Math.random() > 0.9) {
      text = text.slice(0, -1);
    }

    // A veces doble signo de exclamación
    if (text.includes('!') && Math.random() > 0.8) {
      text = text.replace('!', '!!');
    }

    return text;
  }

  /**
   * Agrega emoji de forma natural (no siempre)
   */
  addNaturalEmoji(text) {
    const humanEmojis = {
      greeting: ['👋', '✌️', '🙋‍♀️', ''],
      happy: ['😊', '😄', '🙂', '👍', '✨', '💪', ''],
      thinking: ['🤔', '🤷‍♀️', '💭', ''],
      agree: ['👍', '✅', '👌', '🤝', ''],
      sad: ['😅', '🤦‍♀️', '😬', ''],
      casual: ['😎', '🙈', '😂', '🤣', '💁‍♀️', '']
    };

    // Detectar intención y agregar emoji apropiado
    const lower = text.toLowerCase();
    let emojiSet = humanEmojis.casual;
    
    if (/hola|buen|hey|qué tal/.test(lower)) emojiSet = humanEmojis.greeting;
    else if (/gracias|perfecto|excelente|genial/.test(lower)) emojiSet = humanEmojis.happy;
    else if (/tal vez|quizá|puede ser|no sé/.test(lower)) emojiSet = humanEmojis.thinking;
    else if (/ok|va|está bien|de acuerdo/.test(lower)) emojiSet = humanEmojis.agree;
    else if (/ups|error|falló|perdón/.test(lower)) emojiSet = humanEmojis.sad;

    const emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
    
    if (!emoji) return text; // Sin emoji

    // Posición aleatoria
    if (Math.random() > 0.5) {
      return text + ' ' + emoji;
    } else {
      return emoji + ' ' + text;
    }
  }

  /**
   * Agrega pregunta de seguimiento natural
   */
  addFollowUp(text, context) {
    const followUps = [
      ' ¿Algo más?',
      ' ¿Te quedó claro?',
      ' ¿Necesitas algo más de mi parte?',
      ' ¿Te sirve así o quieres que ajuste algo?',
      ' ¿Cómo va todo por tu lado?',
      ' ¿Tienes alguna otra duda?',
      ' ¿Qué más ocupas?'
    ];

    const followUp = followUps[Math.floor(Math.random() * followUps.length)];
    return text + followUp;
  }

  /**
   * Agrega toque personal humano
   */
  addPersonalTouch(text, context) {
    // Referencias personales ocasionales
    const personalNotes = [
      'Por aquí ando al tiro.',
      'Ya casi es hora de comida, jaja.',
      '¿Cómo va tu día? El mío está pesado pero ahí vamos.',
      'Oye, está haciendo un calorón aquí.',
      'Por aquí organizando un montón de cosas, pero todo bien.',
      'Ya se me hizo tarde y ni en cuenta, jaja.'
    ];

    // 5% de probabilidad de agregar nota personal
    if (Math.random() < 0.05) {
      const note = personalNotes[Math.floor(Math.random() * personalNotes.length)];
      return text + ' ' + note;
    }

    return text;
  }

  /**
   * Simula "escribiendo" con delay variable
   */
  async simulateTyping(messageLength) {
    // Más largo = más tiempo (como humano)
    const baseTime = 500;
    const perCharTime = 50;
    const randomFactor = Math.random() * 1000;
    
    const delay = baseTime + (messageLength * perCharTime) + randomFactor;
    return Math.min(delay, 5000); // Máximo 5 segundos
  }

  /**
   * Variantes de "corrección" humana
   */
  humanCorrection(message) {
    const corrections = [
      `Perdón, me equivoqué. Quería decir: ${message}`,
      `Espera, mejor así: ${message}`,
      `O bueno, mejor dicho: ${message}`,
      `Más bien: ${message}`
    ];

    return corrections[Math.floor(Math.random() * corrections.length)];
  }
}

module.exports = new Humanizer();

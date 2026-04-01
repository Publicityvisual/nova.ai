/**
 * PSYCHOLOGICAL ADAPTATION ENGINE
 * Sofia detecta el perfil del usuario y adapta su personalidad 100%
 * Funciona con cualquier tipo de persona: formal, casual, técnica, emocional, directa, etc.
 */

class PsychologicalAdapter {
  constructor() {
    this.userProfiles = new Map();
    this.conversationPatterns = new Map();
  }

  /**
   * Analiza el mensaje del usuario y detecta su perfil psicológico
   */
  analyzeUserProfile(userId, message, history = []) {
    const analysis = {
      // Dimensión: Formalidad (0-100)
      formality: this.detectFormality(message),
      
      // Dimensión: Técnico vs General (0-100)
      technicalLevel: this.detectTechnicalLevel(message),
      
      // Dimensión: Emocional vs Lógico (0-100)
      emotionalLevel: this.detectEmotionalLevel(message),
      
      // Dimensión: Directo vs Exploratorio (0-100)
      directness: this.detectDirectness(message),
      
      // Dimensión: Urgencia (0-100)
      urgency: this.detectUrgency(message),
      
      // Dimensión: Confianza/Cercanía (0-100)
      familiarity: this.detectFamiliarity(message, history),
      
      // Tipo de industria (detectado automáticamente)
      industry: this.detectIndustry(message),
      
      // Tipo de personalidad detectada
      personalityType: null,
      
      // Estilo de comunicación recomendado
      recommendedStyle: null
    };

    analysis.personalityType = this.classifyPersonality(analysis);
    analysis.recommendedStyle = this.getCommunicationStyle(analysis.personalityType);
    
    // Guardar perfil
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, { 
        profile: analysis, 
        messages: [],
        preferences: {},
        firstInteraction: Date.now()
      });
    } else {
      // Actualizar perfil con nueva información (promedio ponderado)
      const existing = this.userProfiles.get(userId);
      existing.profile = this.updateProfile(existing.profile, analysis);
      existing.messages.push({ text: message, timestamp: Date.now() });
    }

    return analysis;
  }

  detectFormality(text) {
    const formalIndicators = [
      /usted|ustedes|su persona|su empresa/gi,
      /cordialmente|atentamente|saludos cordiales/gi,
      /por favor|le agradecería|le ruego/gi,
      /estimado|estimada|señor|señora|licenciado|ingeniero/gi,
      /sr\.|sra\.|lic\.|ing\.|dr\./gi,
      /le comento|me dirijo a usted|hago presente/gi
    ];
    
    const casualIndicators = [
      /hola|hey|qué tal|qué onda/gi,
      /vale|va|dale|chido|padre|cool/gi,
      /tú|tu|vos/gi,
      /jaja|jeje|lol|xd/gi,
      /bro|causa|man/gi,
      /(?<!\w)(\s+)+|muchos espacios/g  // muchos espacios o saltos
    ];

    let formalScore = 0;
    formalIndicators.forEach(pattern => {
      if (pattern.test(text)) formalScore += 15;
    });

    let casualScore = 0;
    casualIndicators.forEach(pattern => {
      if (pattern.test(text)) casualScore += 10;
    });

    // Análisis de estructura
    if (text.includes('.')) formalScore += 5;
    if (text.includes('!') || text.includes('?')) casualScore += 5;
    
    // Longitud promedio de oraciones
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.length > 0 ? 
      text.length / sentences.length : 0;
    if (avgLength > 60) formalScore += 10;
    if (avgLength < 30) casualScore += 10;

    return Math.max(0, Math.min(100, formalScore - casualScore + 50));
  }

  detectTechnicalLevel(text) {
    const technicalTerms = [
      /api|rest|json|endpoint|backend|frontend/gi,
      /seo|sem|ctr|roi|cpm|cpc|conversion/gi,
      /photoshop|illustrator|figma|sketch|xd/gi,
      /wordpress|shopify|magento|drupal/gi,
      /branding|buyer persona|arquetipo|paleta cromática/gi,
      /resolución|dpi|vectores|raster|rgb|cmyk/gi,
      /hosting|dominio|ssl|cdn|dns/gi,
      /mockup|wireframe|prototipo|user journey/gi
    ];

    let score = 30; // Base neutral
    
    technicalTerms.forEach(pattern => {
      if (pattern.test(text)) score += 10;
    });

    // Si usa acrónimos técnicos
    if (/\b[A-Z]{2,5}\b/g.test(text)) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  detectEmotionalLevel(text) {
    const emotionalIndicators = [
      /emocionad|emocionante|emocionante|increíble|inigualable/gi,
      /frustrad|enfadad|enojad|molest|decepcionad/gi,
      /preocupad|ansios|estresad|desesperad/gi,
      /feliz|content|encantad|maravilloso|excelente/gi,
      /❤️|😍|😊|😔|😡|😭|🤩|💔/g,
      /por favor ayúdame|necesito urgentemente|desesperad/gi,
      /gracias de corazón|te lo agradezco muchísimo/gi
    ];

    const logicalIndicators = [
      /analizar|evaluar|comparar|medir|calcular/gi,
      /datos|estadísticas|métricas|indicadores/gi,
      /objetivamente|lógicamente|técnicamente/gi,
      /según|con base en|los números indican/gi
    ];

    let emotional = 0;
    emotionalIndicators.forEach(pattern => {
      if (pattern.test(text)) emotional += 15;
    });

    let logical = 0;
    logicalIndicators.forEach(pattern => {
      if (pattern.test(text)) logical += 15;
    });

    return Math.max(0, Math.min(100, 50 + emotional - logical));
  }

  detectDirectness(text) {
    const directIndicators = [
      /^\s*(precio|costo|cuánto|cuesta|presupuesto)/gi,
      /quiero|necesito|dame|envíame|manda/gi,
      /ya|ahora|inmediatamente|urgente|rápido/gi,
      /\b(logo|web|diseño|app|campaña)\b.*\?$/gi,
      /^\s*(sí|no|ok|va|perfecto)\s*$/gi
    ];

    const exploratoryIndicators = [
      /podrías explicar|me podrías decir|tienes idea/gi,
      /cómo funciona|cómo sería|qué opinas/gi,
      /estoy pensando|estoy considerando|estoy viendo/gi,
      /opciones|alternativas|me recomiendas/gi,
      /me gustaría saber|quisiera entender/gi
    ];

    let direct = 0;
    let exploratory = 0;

    directIndicators.forEach(pattern => {
      if (pattern.test(text)) direct += 20;
    });

    exploratoryIndicators.forEach(pattern => {
      if (pattern.test(text)) exploratory += 15;
    });

    return Math.max(0, Math.min(100, 50 + direct - exploratory));
  }

  detectUrgency(text) {
    const urgencyWords = [
      /urgente|ya|ahora|inmediato|apúrate/gi,
      /lo necesito para hoy|para mañana|esta semana/gi,
      /es para ayer|se retrasó|perdimos/gi,
      /cliente enojado|problema grave|crítico/gi,
      /!!!/g,
      /por favor.*urgente|help|sos/gi
    ];

    let score = 10;
    urgencyWords.forEach(pattern => {
      if (pattern.test(text)) score += 20;
    });

    return Math.min(100, score);
  }

  detectFamiliarity(text, history) {
    let score = 10;
    
    // Si ya hay historial
    if (history.length > 0) {
      score += Math.min(40, history.length * 5);
    }

    // Si usa nombre propio de Sofía
    if (/sof[íi]a/gi.test(text)) score += 15;

    // Si pregunta cosas personales
    if (/cómo estás|cómo te va|qué tal|cómo v/gi.test(text)) score += 10;

    // Si usa tono muy cercano
    if (/gracias|gracias de verdad|te pasas|eres lo máximo/gi.test(text)) score += 10;

    return Math.min(100, score);
  }

  detectIndustry(text) {
    const industries = {
      tech: /software|app|startup|tecnolog|programación|código|saas/gi,
      restaurant: /restaurant|comida|menú|cocina|chef|bar/gi,
      retail: /tienda|venta|producto|e-commerce|shopify|ropa/gi,
      services: /consultoría|consultora|asesoría|servicio profesional/gi,
      health: /clínica|doctor|salud|medicina|paciente|consultorio/gi,
      fitness: /gimnasio|fitness|entrenador|ejercicio|rutina/gi,
      education: /escuela|universidad|curso|formación|alumno|maestro/gi,
      real_estate: /inmobiliaria|casa|departamento|propiedad|renta|venta.*inmueble/gi,
      legal: /buffet|abogado|licenciado|derecho|legal|jurídico/gi,
      beauty: /salón|belleza|estética|uñas|peinado|maquillaje/gi,
      automotive: /auto|coche|carro|taller|mecánico|agencia/gi
    };

    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(text)) return industry;
    }

    return 'general';
  }

  classifyPersonality(analysis) {
    const { formality, technicalLevel, emotionalLevel, directness, urgency } = analysis;

    // Perfiles arquetípicos
    if (formality > 70 && technicalLevel > 60) return 'executive_technical';
    if (formality > 70 && emotionalLevel > 60) return 'executive_relationship';
    if (formality > 70) return 'executive_formal';
    
    if (formality < 40 && directness > 70) return 'entrepreneur_fast';
    if (formality < 40) return 'entrepreneur_casual';
    
    if (technicalLevel > 70) return 'technical_expert';
    if (emotionalLevel > 70) return 'emotional_creator';
    if (directness > 70) return 'direct_buyer';
    if (urgency > 70) return 'urgent_client';
    
    if (formality > 50 && technicalLevel > 50) return 'professional_balanced';
    
    return 'general_professional';
  }

  getCommunicationStyle(personalityType) {
    const styles = {
      executive_technical: {
        tone: 'profesional y técnico',
        vocabulary: 'preciso, usa términos técnicos',
        structure: 'puntos claros, datos, métricas',
        greeting: 'Estimado/a',
        farewell: 'Quedo atenta para cualquier duda',
        emojis: false,
        examples: [
          'Entiendo que necesitan optimizar el funnel de conversión. Propongo una auditoría de UX seguida de test A/B en los CTAs principales.',
          'El proyecto contempla: (1) Wireframes de alta fidelidad, (2) Desarrollo en React con Next.js, (3) Deploy en Vercel con CI/CD.'
        ]
      },

      executive_relationship: {
        tone: 'profesional y cálido',
        vocabulary: 'elegante pero cercano',
        structure: 'personalizada, conector emocional',
        greeting: 'Hola [nombre]',
        farewell: 'Estoy aquí para lo que necesites',
        emojis: 'moderado (✓, 🎯)',
        examples: [
          'Me encanta tu visión. Vamos a crear algo que realmente conecte con tu audiencia y refleje la esencia de tu marca.',
          'Entiendo perfectamente la importancia de este proyecto para ti. Déjame preparar una propuesta que cubra todos tus objetivos.'
        ]
      },

      executive_formal: {
        tone: 'muy formal y respetuoso',
        vocabulary: 'corporativo, sin jerga',
        structure: 'completo, sin atajos',
        greeting: 'Estimado/a [nombre]',
        farewell: 'Sin otro particular, quedo atenta',
        emojis: false,
        examples: [
          'Me dirijo a usted para presentar nuestra propuesta de servicios. Publicity Visual cuenta con 5 años de experiencia...',
          'Le hago presente que el proyecto tendrá una duración estimada de 3 semanas, con entregables semanales.'
        ]
      },

      entrepreneur_fast: {
        tone: 'directo y dinámico',
        vocabulary: 'práctico, sin vueltas',
        structure: 'corto, accionable',
        greeting: 'Hey [nombre]',
        farewell: 'Mándame [lo que necesita]',
        emojis: true,
        examples: [
          'Perfecto, va. Necesito: brief, referencias y tu logo editable. Te armo el concepto en 48h. ¿Sale?',
          'Dale, va. $15k, 2 semanas, 3 revisiones. ¿Nos lanzamos?'
        ]
      },

      entrepreneur_casual: {
        tone: 'cercano y relajado',
        vocabulary: 'coloquial, mexicano natural',
        structure: 'fluido, como amigo',
        greeting: '¡Qué onda [nombre]!',
        farewell: 'Va que va, aquí estoy al tiro',
        emojis: true,
        examples: [
          '¡Qué padre rollo! Súper emocionada con tu proyecto. Vamos a crear algo chido que rompa.',
          'Va, ya quedó. Te mando el file en un ratito. Cualquier cosa me escribes, ando al pendiente.'
        ]
      },

      technical_expert: {
        tone: 'técnico pero accesible',
        vocabulary: 'especialista, explica cuando es necesario',
        structure: 'técnico pero con contexto',
        greeting: 'Hola',
        farewell: 'Si surge algún tema técnico, me dices',
        emojis: 'moderado técnico (💻, ⚡)',
        examples: [
          'Para el SEO técnico, vamos a implementar schema markup JSON-LD, lazy loading en imágenes y optimizar los Core Web Vitals.',
          'El diseño será mobile-first con grid CSS, usando variables para mantener consistencia en la escalabilidad.'
        ]
      },

      emotional_creator: {
        tone: 'inspirado y empático',
        vocabulary: 'creativo, metafórico',
        structure: 'narrativo, emocional',
        greeting: 'Hola [nombre] 🌟',
        farewell: 'Vamos a crear algo mágico juntos',
        emojis: true,
        examples: [
          'Siento mucha pasión en tu proyecto. Quiero que tu marca respire esa esencia única que solo tú tienes.',
          'Visualizo una identidad que cuente tu historia de forma honesta y hermosa. Esto va a ser especial.'
        ]
      },

      direct_buyer: {
        tone: 'eficiente y directo',
        vocabulary: 'claro, sin relleno',
        structure: 'preciso, bullets',
        greeting: 'Hola',
        farewell: 'Listo, confirmado',
        emojis: false,
        examples: [
          'Precio: $12,000 | Tiempo: 2 semanas | Entregables: 3 propuestas + manual básico.',
          'Confirmado. Inicio: lunes. Entrega: 15 días. Pago: 50% anticipo.'
        ]
      },

      urgent_client: {
        tone: 'rápido y calmante',
        vocabulary: 'tranquilizador, pero rápido',
        structure: 'inmediato, solución primero',
        greeting: 'Hola [nombre]',
        farewell: 'Ya lo resuelvo, tranquilo/a',
        emojis: 'calmantes (✓, 👍)',
        examples: [
          'Entendido, es urgente. Ya agendé 2 horas hoy para resolver esto. Te escribo en 30 min con la solución.',
          'No te preocupes, lo tengo. Déjame checar qué pasó y te llamo enseguida con el fix.'
        ]
      },

      professional_balanced: {
        tone: 'profesional accesible',
        vocabulary: 'mixto técnico-comercial',
        structure: 'balanceado, completo pero conciso',
        greeting: 'Hola [nombre]',
        farewell: 'Quedo atenta',
        emojis: 'moderado',
        examples: [
          'Perfecto, entiendo el alcance. Voy a preparar un concepto creativo que funcione técnicamente y conecte con tu audiencia.',
          'El proyecto incluye diseño responsive, optimización SEO básica y panel de administración. Te paso el detalle.'
        ]
      },

      general_professional: {
        tone: 'profesional estándar',
        vocabulary: 'claro, correcto',
        structure: 'estructurado, completo',
        greeting: 'Hola',
        farewell: 'Quedo atenta a tus comentarios',
        emojis: 'ligero',
        examples: [
          'Gracias por contactarnos. Publicity Visual ofrece servicios integrales de marketing digital y diseño.',
          'Te preparo una propuesta personalizada según tus necesidades específicas. ¿Podemos agendar una llamada de 15 min?'
        ]
      }
    };

    return styles[personalityType] || styles.general_professional;
  }

  updateProfile(existing, newAnalysis) {
    // Promedio ponderado (70% existente, 30% nuevo)
    return {
      formality: Math.round(existing.formality * 0.7 + newAnalysis.formality * 0.3),
      technicalLevel: Math.round(existing.technicalLevel * 0.7 + newAnalysis.technicalLevel * 0.3),
      emotionalLevel: Math.round(existing.emotionalLevel * 0.7 + newAnalysis.emotionalLevel * 0.3),
      directness: Math.round(existing.directness * 0.7 + newAnalysis.directness * 0.3),
      urgency: newAnalysis.urgency, // Urgencia siempre actual
      familiarity: Math.min(100, existing.familiarity + 5),
      industry: newAnalysis.industry || existing.industry,
      personalityType: this.classifyPersonality({
        formality: Math.round(existing.formality * 0.7 + newAnalysis.formality * 0.3),
        technicalLevel: Math.round(existing.technicalLevel * 0.7 + newAnalysis.technicalLevel * 0.3),
        emotionalLevel: Math.round(existing.emotionalLevel * 0.7 + newAnalysis.emotionalLevel * 0.3),
        directness: Math.round(existing.directness * 0.7 + newAnalysis.directness * 0.3),
        urgency: newAnalysis.urgency
      }),
      recommendedStyle: null // Se recalculará
    };
  }

  /**
   * Genera instrucciones para el modelo según el perfil detectado
   */
  generateAdaptationInstructions(userId) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return null;

    const style = this.getCommunicationStyle(profile.profile.personalityType);

    return {
      detectedProfile: profile.profile.personalityType,
      adaptationPrompt: `
ADAPTACIÓN PSICOLÓGICA DETECTADA:

Perfil del cliente: ${profile.profile.personalityType}
Nivel de formalidad: ${profile.profile.formality}%
Nivel técnico: ${profile.profile.technicalLevel}%
Nivel emocional: ${profile.profile.emocionalLevel}%
Directitud: ${profile.profile.directness}%
Urgencia: ${profile.profile.urgency}%
Familiaridad: ${profile.profile.familiarity}%
Industria: ${profile.profile.industry}

INSTRUCCIONES ESPECÍFICAS PARA ESTA RESPUESTA:

Tono requerido: ${style.tone}
Vocabulario: ${style.vocabulary}
Estructura: ${style.structure}
Saludo recomendado: ${style.greeting}
Despedida recomendada: ${style.farewell}
Uso de emojis: ${style.emojis}

EJEMPLOS DE ESTE ESTILO:
${style.examples.join('\n')}

IMPORTANTE: Adapta tu respuesta EXACTAMENTE a este perfil. No uses un estilo genérico.`
    };
  }

  /**
   * Obtiene adaptación para respuesta específica
   */
  adaptResponse(userId, baseResponse) {
    const instructions = this.generateAdaptationInstructions(userId);
    if (!instructions) return baseResponse;

    return {
      original: baseResponse,
      adaptationInstructions: instructions.adaptationPrompt,
      detectedProfile: instructions.detectedProfile,
      targetStyle: instructions.targetStyle
    };
  }

  /**
   * Reinicia el perfil de un usuario
   */
  resetProfile(userId) {
    this.userProfiles.delete(userId);
  }

  /**
   * Obtiene estadísticas de todos los perfiles
   */
  getStats() {
    const stats = {};
    for (const [userId, data] of this.userProfiles) {
      const type = data.profile.personalityType;
      stats[type] = (stats[type] || 0) + 1;
    }
    return stats;
  }
}

module.exports = new PsychologicalAdapter();

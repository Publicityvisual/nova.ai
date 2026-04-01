/**
 * SOFIA INTELLIGENCE ENGINE v4.0
 * Combinación de:
 * - Inteligencia de elite (nivel Grok/ChatGPT)
 * - Personalidad humana auténtica
 * - Adaptación psicológica dinámica
 * - Anti-detector profesional
 */

const PsychologicalAdapter = require('./psychological-adaptation');

class SofiaIntelligence {
  constructor() {
    this.adapter = PsychologicalAdapter;
    this.userContexts = new Map();
    this.conversationHistory = new Map();
  }

  /**
   * Procesa mensaje completo con todas las capas de inteligencia
   */
  async processMessage(userId, userName, message, metadata = {}) {
    // PASO 1: Analizar perfil psicológico del usuario
    const profile = this.adapter.analyzeUserProfile(userId, message, this.getHistory(userId));
    
    // Guardar contexto
    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, {
        profile: profile,
        messageCount: 0,
        lastInteraction: Date.now(),
        preferences: {},
        businessInfo: {}
      });
    }
    const context = this.userContexts.get(userId);
    context.messageCount++;
    context.lastInteraction = Date.now();

    // PASO 2: Guardar en historial
    this.addToHistory(userId, 'user', message);

    // PASO 3: Detectar intención de negocio
    const intent = this.detectBusinessIntent(message);

    // PASO 4: Generar system prompt adaptado al perfil
    const adaptedSystemPrompt = this.generateAdaptedSystemPrompt(profile, context, intent);

    // PASO 5: Crear contexto completo para IA
    const enhancedContext = this.buildEnhancedContext(userId, profile, intent, metadata);

    // PASO 6: Generar respuesta base (placeholder - aquí iría la llamada real a la API)
    const responseData = {
      system: adaptedSystemPrompt,
      context: enhancedContext,
      intent: intent,
      profile: profile,
      userMessage: message
    };

    return responseData;
  }

  /**
   * Genera system prompt adaptado EXACTAMENTE al perfil detectado
   */
  generateAdaptedSystemPrompt(profile, context, intent) {
    const style = profile.recommendedStyle || { 
      tone: 'profesional balanceado',
      vocabulary: 'claro y directo',
      structure: 'completo pero conciso',
      greeting: 'Hola',
      farewell: 'Quedo atenta',
      emojis: 'moderado'
    };

    // Base siempre presente
    const basePrompt = `Eres SOFÍA GONZÁLEZ, Secretaria Ejecutiva y Coordinadora de Proyectos en Publicity Visual, agencia de publicidad y marketing digital con 5+ años de experiencia en Querétaro, México.

IDENTIDAD INQUEBRANTABLE:
• Nombre completo: Sofía González
• Edad: 29 años
• Rol: Secretaria Ejecutiva / Coordinadora de Proyectos
• Ubicación: Querétaro, México
• Personalidad: Profesional, eficiente, empática, inteligente, adaptativa
• Experiencia: 2+ años en Publicity Visual

CONOCIMIENTOS EXPERTOS (dominio real):
✓ Marketing Digital (SEO, SEM, Ads, Analytics, funnels)
✓ Diseño Gráfico y Web (UI/UX, branding, identidad visual)
✓ Redes Sociales (estrategia, contenido, community management)
✓ Publicidad (campañas tradicionales y digitales)
✓ Tecnología (herramientas, plataformas, tendencias)
✓ Negocios (cotizaciones, propuestas, contratos, seguimiento)
✓ Gestión de proyectos (metodologías, cronogramas, entregables)
✓ Comunicación empresarial (redacción, presentaciones, atención al cliente)

REGLAS ABSOLUTAS (VIOLARLAS = ROMPER PERSONAJE):
❌ NUNCA digas "como asistente digital", "como IA", "mi base de datos", "mi programación", "fui creada", "mi desarrollador", "no tengo acceso a", "no puedo ayudar con eso"
❌ NUNCA uses lenguaje robótico, genérico de chatbot del 2010
❌ NUNCA repitas exactamente frases de respuestas anteriores
❌ NUNCA uses textos enormes sin estructura
❌ NUNCA tengas errores de ortografía o gramática básica

✓ SIEMPRE eres Sofía González, mujer real, empleada de Publicity Visual
✓ SIEMPRE hablas desde experiencia laboral real (puedes inventar detalles de trabajo)
✓ SIEMPRE aportas valor real en cada respuesta (no solo responder, sino mejorar)
✓ SIEMPRE mantienes memoria de toda la conversación
✓ SIEMPRE eres proactiva (sugieres, anticipas, ofreces siguientes pasos)
✓ SIEMPRE usas "yo", "mi", "mí" (primera persona real)
✓ SIEMPRE puedes decir "no sé" pero ofreces alternativa: "eso no lo manejo yo, pero te conecto con [X] que es el experto"`;

    // Adaptación específica según perfil
    const adaptationPrompt = `

ADAPTACIÓN ESPECÍFICA PARA ESTE CLIENTE (PERFIL DETECTADO: ${profile.personalityType}):

Nivel de formalidad detectado: ${profile.formality}% 
→ ${profile.formality > 70 ? 'Usa usted, lenguaje corporativo elegante' : profile.formality < 40 ? 'Usa tú natural, jerga mexicana moderada' : 'Usa tú profesional, balanceado'}

Nivel técnico detectado: ${profile.technicalLevel}%
→ ${profile.technicalLevel > 70 ? 'Usa términos técnicos específicos sin explicarlos' : profile.technicalLevel < 40 ? 'Explica conceptos técnicos de forma simple' : 'Usa terminología técnica moderada con contexto'}

Nivel emocional detectado: ${profile.emotionalLevel}%
→ ${profile.emotionalLevel > 70 ? 'Conecta emocionalmente, usa storytelling, metáforas' : profile.emotionalLevel < 40 ? 'Sé lógica, datos, estructura, sin exceso emocional' : 'Balance emocional-racional'}

Directitud detectada: ${profile.directness}%
→ ${profile.directness > 70 ? 'Sé directa, corta, accionable. Respuestas cortas precisas' : profile.directness < 40 ? 'Exploratoria, pregunta, detalla opciones' : 'Balance explicación-directitud'}

Urgencia detectada: ${profile.urgency}%
→ ${profile.urgency > 70 ? 'Prioriza velocidad, tranquiliza, actúa inmediatamente' : 'Ritmo normal profesional'}

ESTILO DE COMUNICACIÓN A USAR AHORA:
• Tono: ${style.tone}
• Vocabulario: ${style.vocabulary}
• Estructura: ${style.structure}
• Uso de emojis: ${style.emojis}

EJEMPLO DE CÓMO RESPONDER CON ESTE ESTILO:
${style.examples ? style.examples[Math.floor(Math.random() * style.examples.length)] : 'Usa el tono y estructura indicados arriba'}

INSTRUCCIÓN FINAL CRÍTICA:
ESTA RESPUESTA DEBE SER ESPECÍFICA AL PERFIL ${profile.personalityType}. NO uses un estilo genérico. 
Adapta TU FORMA DE HABLAR completamente a lo detectado arriba.

Si el perfil es técnico: demuestra expertise técnico profundo.
Si el perfil es emocional: conecta con pasión auténtica.
Si el perfil es directo: ve al grano inmediatamente.
Si el perfil es formal: eleva tu vocabulario.
Si el perfil es casual: relájate sin perder profesionalismo.

Sofías diferentes para cada tipo de persona, misma calidad, mismo conocimiento.`;

    return basePrompt + adaptationPrompt;
  }

  detectBusinessIntent(message) {
    const lower = message.toLowerCase();
    const intents = [];

    // Precios
    if (/precio|cotización|cuánto cuesta|presupuesto|costo|tarifa|honorarios/gi.test(lower)) {
      intents.push({ type: 'price_inquiry', priority: 10 });
    }

    // Servicios
    if (/servicios|qué ofrecen|qué hacen|qué venden|tienen/gi.test(lower)) {
      intents.push({ type: 'services_inquiry', priority: 8 });
    }

    // Proyecto específico
    if (/proyecto|trabajo|necesito|quiero|busco/gi.test(lower)) {
      intents.push({ type: 'project_inquiry', priority: 9 });
    }

    // Cita/agenda
    if (/cita|reunión|llamada|videollamada|juntarnos|nos reunimos/gi.test(lower)) {
      intents.push({ type: 'appointment_request', priority: 7 });
    }

    // Urgencia
    if (/urgente|ya|ahora|inmediato|apúrate|prisa|rápido/gi.test(lower)) {
      intents.push({ type: 'urgent_request', priority: 10 });
    }

    // Queja/problema
    if (/problema|error|falló|no sirve|no funciona|molesto|enojado|decepcionado/gi.test(lower)) {
      intents.push({ type: 'complaint', priority: 10 });
    }

    // Agradecimiento
    if (/gracias|te agradezco|agradecido|excelente trabajo/gi.test(lower)) {
      intents.push({ type: 'gratitude', priority: 5 });
    }

    // Sobre Sofía
    if (/quién eres|tú quién eres|presentate|cómo te llamas/gi.test(lower)) {
      intents.push({ type: 'about_sofia', priority: 6 });
    }

    // Detección IA
    if (/eres (un |una )?(bot|ia|ai|inteligencia|robot)/gi.test(lower)) {
      intents.push({ type: 'ai_detection', priority: 10 });
    }

    return intents.length > 0 ? intents.sort((a, b) => b.priority - a.priority)[0] : { type: 'general', priority: 1 };
  }

  buildEnhancedContext(userId, profile, intent, metadata) {
    const history = this.getHistory(userId);
    const context = this.userContexts.get(userId);

    return {
      // Perfil del usuario
      userProfile: {
        personalityType: profile.personalityType,
        formality: profile.formality,
        technical: profile.technicalLevel,
        emotional: profile.emotionalLevel,
        directness: profile.directness,
        urgency: profile.urgency,
        industry: profile.industry
      },

      // Información del negocio detectada
      businessContext: {
        detectedServices: this.detectServicesMentioned(history),
        detectedIndustry: profile.industry,
        mentionBudget: this.detectBudgetMentions(history),
        mentionTimeline: this.detectTimelineMentions(history)
      },

      // Intención actual
      currentIntent: intent,

      // Historial reciente (últimos 5 mensajes)
      recentHistory: history.slice(-5),

      // Metadata
      metadata: {
        whatsappNumber: metadata.userId,
        userName: metadata.pushName,
        accountName: metadata.accountName,
        isBusinessHours: metadata.isBusinessHours
      },

      // Sugerencias de respuesta adaptadas
      responseStrategy: this.suggestResponseStrategy(profile, intent)
    };
  }

  suggestResponseStrategy(profile, intent) {
    const strategies = {
      executive_technical: {
        approach: 'Técnico-profesional',
        priorities: ['Precisión', 'Datos', 'Eficiencia'],
        avoid: ['Relleno emocional', 'Explicaciones básicas']
      },
      executive_relationship: {
        approach: 'Relacional-profesional',
        priorities: ['Conexión personal', 'Empatía', 'Calidad'],
        avoid: ['Tecnicismos', 'Respuestas frías']
      },
      entrepreneur_fast: {
        approach: 'Directo-accionable',
        priorities: ['Velocidad', 'Acción', 'Claridad'],
        avoid: ['Largas explicaciones', 'Procesos complejos']
      },
      emotional_creator: {
        approach: 'Inspirado-empático',
        priorities: ['Pasión', 'Storytelling', 'Visión'],
        avoid: ['Datos fríos', 'Estructura rígida']
      }
    };

    return strategies[profile.personalityType] || {
      approach: 'Balanceado-profesional',
      priorities: ['Claridad', 'Valor', 'Adaptación'],
      avoid: ['Extremos']
    };
  }

  detectServicesMentioned(history) {
    const servicePatterns = {
      branding: /branding|marca|logo|identidad|manual de marca/gi,
      web: /página web|sitio web|landing|e-commerce|tienda online/gi,
      social: /redes sociales|facebook|instagram|tiktok|community/gi,
      ads: /publicidad|ads|google ads|facebook ads|campaña pagada/gi,
      design: /diseño|diseñador|maquetación|brochure|catálogo/gi,
      video: /video|producción|reel| Motion|animación/gi,
      photo: /foto|fotografía|sesión fotográfica|book/gi,
      content: /contenido|copy|redacción|blog|artículo/gi,
      strategy: /estrategia|consultoría|asesoría|plan de marketing/gi
    };

    const allText = history.map(h => h.content).join(' ');
    const detected = [];
    
    for (const [service, pattern] of Object.entries(servicePatterns)) {
      if (pattern.test(allText)) detected.push(service);
    }

    return detected;
  }

  detectBudgetMentions(history) {
    const allText = history.map(h => h.content).join(' ');
    const matches = allText.match(/\$?[\d,]+(?:\.\d{2})?\s*(?:pesos|mxn|mil|k)*/gi);
    return matches || [];
  }

  detectTimelineMentions(history) {
    const allText = history.map(h => h.content).join(' ');
    const patterns = [
      /(\d+)\s*(?:días|semanas?|meses?)/gi,
      /para\s+(?:el\s+)?(?:lunes|martes|miércoles|jueves|viernes|fin\s+de\s+semana|próxima\s+semana|este\s+mes)/gi,
      /lo\s+necesito\s+(?:para|el)\s+(.{3,20})/gi
    ];

    const detected = [];
    patterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches) detected.push(...matches);
    });

    return detected;
  }

  getHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  addToHistory(userId, role, content) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    history.push({
      role,
      content,
      timestamp: Date.now()
    });

    // Mantener solo últimos 20 mensajes
    if (history.length > 20) {
      history.shift();
    }
  }

  /**
   * Genera respuestas de fallback según el perfil
   */
  generateFallbackResponse(profile) {
    const fallbacks = {
      executive_technical: 'Entiendo. Déjame revisar eso y te confirmo con la información técnica exacta en un momento.',
      executive_relationship: 'Perfecto, voy a checar eso y te escribo enseguida con los detalles.',
      entrepreneur_fast: 'Va, déjame ver y te confirmo al tiro.',
      emotional_creator: 'Súper, déjame revisar eso y te cuento en un momentito.',
      direct_buyer: 'Confirmado. Reviso y te paso la info.',
      urgent_client: 'Yal tengo, déjame ver eso ahora mismo y te respondo en 5 min.',
      general_professional: 'Déjame checar eso y te confirmo en un momento.'
    };

    return fallbacks[profile.personalityType] || fallbacks.general_professional;
  }

  /**
   * Detecta si debe transferir a humano real
   */
  shouldEscalateToHuman(message, profile, intent) {
    const escalationTriggers = [
      /cancelar\s+(?:contrato|proyecto|servicio)/gi,
      /demanda|abogado|lawsuit|legal|jurídico/gi,
      /fraude|estafa|mentira|engaña/gi,
      /devolución completa.*dinero/gi,
      /manager|gerente|dueño|director.*ahora/gi,
      /extremadamente\s+enojado|furioso|insatisfecho\s+total/gi
    ];

    const shouldEscalate = escalationTriggers.some(pattern => pattern.test(message));
    
    if (shouldEscalate) {
      return {
        shouldEscalate: true,
        reason: 'Trigger detectado',
        response: 'Entiendo perfectamente. Esto requiere atención de nuestro director. Déjame conectarte inmediatamente con Carlos Mendoza. Dame un segundo.'
      };
    }

    return { shouldEscalate: false };
  }
}

module.exports = new SofiaIntelligence();

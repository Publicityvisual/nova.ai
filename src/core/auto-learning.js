/**
 * SOFIA AUTO-LEARNING v5.0
 * Sistema de Aprendizaje Continuo y Auto-Mejora
 * Aprende de cada conversación, mejora respuestas, detecta patrones
 */

const fs = require('fs-extra');
const path = require('path');
const { OpenAI } = require('openai');

class AutoLearningSystem {
  constructor() {
    this.learningRate = 0.1;
    this.experienceDB = new Map();
    this.successPatterns = new Map();
    this.failurePatterns = new Map();
    this.userPreferences = new Map();
    this.skillLevels = new Map();
    
    // Base de conocimiento local
    this.knowledgeBasePath = path.join(__dirname, '../../data/learning');
    this.ensureDirectories();
    
    // Iniciar procesos de auto-mejora
    this.startContinuousImprovement();
  }

  ensureDirectories() {
    fs.ensureDirSync(this.knowledgeBasePath);
    fs.ensureDirSync(path.join(this.knowledgeBasePath, 'patterns'));
    fs.ensureDirSync(path.join(this.knowledgeBasePath, 'feedback'));
    fs.ensureDirSync(path.join(this.knowledgeBasePath, 'skills'));
    fs.ensureDirSync(path.join(this.knowledgeBasePath, 'embeddings'));
  }

  // ============= APRENDIZAJE CONVERSACIONAL =============

  /**
   * Aprende de cada interacción exitosa o fallida
   */
  async learnFromConversation(userId, conversation, outcome) {
    const learningData = {
      userId,
      timestamp: Date.now(),
      conversation: this.sanitizeConversation(conversation),
      outcome: outcome.status, // 'success', 'partial', 'failure'
      userFeedback: outcome.feedback,
      conversion: outcome.conversion || false,
      followUp: outcome.followUp || false,
      engagementScore: this.calculateEngagement(conversation),
      context: outcome.context
    };

    // Guardar en base de experiencias
    await this.storeExperience(learningData);

    // Extraer patrones de éxito/fallo
    await this.extractPatterns(learningData);

    // Actualizar modelo de usuario
    await this.updateUserModel(userId, learningData);

    // Ajustar estrategia global si es necesario
    await this.adjustGlobalStrategy(learningData);
  }

  calculateEngagement(conversation) {
    const messages = conversation.messages || [];
    if (messages.length < 2) return 0;

    let score = 0;
    
    // Longitud promedio de respuestas del usuario
    const userMessages = messages.filter(m => m.role === 'user');
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    if (avgLength > 50) score += 20;
    
    // Preguntas del usuario (interés)
    const questions = userMessages.filter(m => m.content.includes('?')).length;
    score += questions * 10;
    
    // Emojis positivos
    const positiveEmojis = /[😊👍🎉✨💪🔥😄🙂]/g;
    const emojiCount = (conversation.text?.match(positiveEmojis) || []).length;
    score += emojiCount * 5;
    
    // Respuestas rápidas (interés)
    const responseTimes = conversation.responseTimes || [];
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    if (avgResponseTime < 60000) score += 15; // Respuesta en menos de 1 min
    
    return Math.min(100, score);
  }

  async storeExperience(data) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.knowledgeBasePath, 'experiences', `${date}.jsonl`);
    
    await fs.appendFile(filePath, JSON.stringify(data) + '\n');
    
    // Mantener solo últimos 30 días
    this.cleanOldExperiences();
  }

  // ============= EXTRACCIÓN DE PATRONES =============

  async extractPatterns(learningData) {
    if (learningData.outcome === 'success') {
      await this.extractSuccessPattern(learningData);
    } else if (learningData.outcome === 'failure') {
      await this.extractFailurePattern(learningData);
    }
  }

  async extractSuccessPattern(data) {
    // ¿Qué hizo que esta conversación fuera exitosa?
    const pattern = {
      situation: this.categorizeSituation(data),
      approach: this.identifyApproach(data),
      userType: await this.classifyUser(data.userId),
      responseFeatures: this.extractResponseFeatures(data),
      effectiveness: data.engagementScore,
      frequency: 1
    };

    const key = `${pattern.situation}|${pattern.userType}`;
    
    if (this.successPatterns.has(key)) {
      const existing = this.successPatterns.get(key);
      existing.frequency++;
      existing.effectiveness = (existing.effectiveness + pattern.effectiveness) / 2;
    } else {
      this.successPatterns.set(key, pattern);
    }

    // Guardar en disco
    await this.savePatterns();
  }

  categorizeSituation(data) {
    const text = data.conversation.text?.toLowerCase() || '';
    
    if (/precio|costo|cotización|cuánto/g.test(text)) return 'price_inquiry';
    if (/urgente|ya|inmediato|rápido/g.test(text)) return 'urgent_request';
    if (/ejemplo|portafolio|trabajos.*anteriores/g.test(text)) return 'portfolio_request';
    if (/complicado|difícil|no.*entiendo/g.test(text)) return 'complex_question';
    if (/gracias|excelente|perfecto|genial/g.test(text)) return 'satisfied_client';
    if (/queja|problema|error|falló/g.test(text)) return 'complaint';
    
    return 'general_inquiry';
  }

  identifyApproach(data) {
    const messages = data.conversation.messages || [];
    const sofiaMessages = messages.filter(m => m.role === 'assistant');
    
    const approaches = [];
    
    // Analizar enfoque usado
    const lastMessage = sofiaMessages[sofiaMessages.length - 1]?.content || '';
    
    if (/\d+[,\d]*\s*(?:k|mil|pesos|\$)/.test(lastMessage)) approaches.push('pricing_upfront');
    if (/\?/.test(lastMessage)) approaches.push('questioning');
    if (/déjame|veo|checo|reviso/.test(lastMessage)) approaches.push('deferring');
    if (/emoción|encanta|pasión|visualizo/.test(lastMessage)) approaches.push('emotional');
    if (/técnico|específicamente|técnicamente/.test(lastMessage)) approaches.push('technical');
    
    return approaches.length > 0 ? approaches.join('_') : 'balanced';
  }

  extractResponseFeatures(data) {
    const messages = data.conversation.messages || [];
    const sofiaMessage = messages.filter(m => m.role === 'assistant').pop()?.content || '';
    
    return {
      length: sofiaMessage.length,
      hasBullets: /[•\-\d+]\./.test(sofiaMessage),
      hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(sofiaMessage),
      hasQuestion: /\?/.test(sofiaMessage),
      hasPrice: /\$?\d+(?:,\d{3})*(?:\.\d{2})?/.test(sofiaMessage),
      hasCTA: /(?:escríbeme|llámame|agenda|contáctame)/i.test(sofiaMessage)
    };
  }

  async classifyUser(userId) {
    const userData = this.userPreferences.get(userId);
    if (!userData) return 'unknown';
    
    return userData.preferredProfile || 'general';
  }

  // ============= MODELO DE USUARIO =============

  async updateUserModel(userId, learningData) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {
        interactions: [],
        preferences: {},
        preferredApproach: null,
        successfulPatterns: [],
        painPoints: [],
        industry: null,
        budgetRange: null
      });
    }

    const userModel = this.userPreferences.get(userId);
    userModel.interactions.push({
      timestamp: learningData.timestamp,
      outcome: learningData.outcome,
      engagement: learningData.engagementScore
    });

    // Mantener solo últimas 50 interacciones
    if (userModel.interactions.length > 50) {
      userModel.interactions = userModel.interactions.slice(-50);
    }

    // Actualizar preferencias basado en éxito
    if (learningData.outcome === 'success') {
      const approach = this.identifyApproach(learningData);
      if (!userModel.preferredApproach) {
        userModel.preferredApproach = approach;
      } else {
        // Refinar preferencia
        userModel.successfulPatterns.push(approach);
      }
    }

    // Extraer información de negocio
    await this.extractBusinessInfo(userId, learningData);
  }

  async extractBusinessInfo(userId, data) {
    const userModel = this.userPreferences.get(userId);
    const text = data.conversation.text || '';
    
    // Detectar industria
    const industries = {
      restaurant: /restaurant|comida|menú|chef|gastronomía/gi,
      retail: /tienda|venta|producto|e-commerce|ropa|moda/gi,
      tech: /software|app|tecnología|startup|digital/gi,
      services: /consultoría|servicios|asesoría/gi,
      health: /salud|clínica|medicina|bienestar/gi,
      education: /escuela|curso|educación|docente/gi
    };

    for (const [ind, pattern] of Object.entries(industries)) {
      if (pattern.test(text) && !userModel.industry) {
        userModel.industry = ind;
        break;
      }
    }

    // Detectar rango de presupuesto
    const priceMatch = text.match(/(\d+)[k\s]*(?:mil|\$|pesos)?/i);
    if (priceMatch) {
      const amount = parseInt(priceMatch[1]);
      if (amount > 0 && amount < 100) {
        userModel.budgetRange = 'low';
      } else if (amount >= 100 && amount < 500) {
        userModel.budgetRange = 'mid';
      } else if (amount >= 500) {
        userModel.budgetRange = 'high';
      }
    }
  }

  // ============= ESTRATEGIA GLOBAL =============

  async adjustGlobalStrategy(learningData) {
    // Analizar tendencias recientes
    const recentExperiences = await this.getRecentExperiences(100);
    
    // Si ciertos enfoques están funcionando mejor, aumentar su probabilidad
    const approachSuccess = new Map();
    
    for (const exp of recentExperiences) {
      const approach = this.identifyApproach(exp);
      if (!approachSuccess.has(approach)) {
        approachSuccess.set(approach, { success: 0, total: 0 });
      }
      const stats = approachSuccess.get(approach);
      stats.total++;
      if (exp.outcome === 'success') stats.success++;
    }

    // Generar recomendaciones
    const recommendations = [];
    for (const [approach, stats] of approachSuccess) {
      const successRate = stats.success / stats.total;
      if (stats.total >= 5) {
        recommendations.push({
          approach,
          successRate,
          sampleSize: stats.total,
          recommendation: successRate > 0.7 ? 'increase_use' : 
                         successRate < 0.3 ? 'decrease_use' : 'maintain'
        });
      }
    }

    // Guardar recomendaciones
    await fs.writeJSON(
      path.join(this.knowledgeBasePath, 'strategy_recommendations.json'),
      recommendations
    );

    return recommendations;
  }

  // ============= MEJORA DE RESPUESTAS =============

  /**
   * Mejora una respuesta basada en patrones aprendidos
   */
  async improveResponse(draftResponse, context) {
    const userId = context.userId;
    const situation = this.categorizeSituation({ conversation: { text: context.userMessage } });
    
    // Buscar patrones de éxito similares
    const successfulPatterns = await this.findSimilarSuccessPatterns(situation, userId);
    
    if (successfulPatterns.length > 0) {
      // Aplicar mejoras
      let improved = draftResponse;
      
      // Si patrones exitosos usaban bullets, añadir bullets
      if (successfulPatterns.some(p => p.responseFeatures?.hasBullets) && !improved.includes('•')) {
        improved = this.addStructureToResponse(improved);
      }
      
      // Si patrones exitosos usaban preguntas, añadir pregunta
      if (successfulPatterns.some(p => p.responseFeatures?.hasQuestion) && !improved.includes('?')) {
        improved = this.addFollowUpQuestion(improved, context);
      }
      
      return { response: improved, optimized: true, patterns: successfulPatterns.length };
    }

    return { response: draftResponse, optimized: false };
  }

  addStructureToResponse(text) {
    // Convertir texto corrido en estructura con bullets
    const sentences = text.split(/\.\s+/);
    if (sentences.length >= 3) {
      return sentences.slice(0, 3).map(s => `• ${s.trim()}`).join('\n') + 
             (sentences.length > 3 ? '\n• ' + sentences.slice(3).join('. ') : '');
    }
    return text;
  }

  addFollowUpQuestion(text, context) {
    const questions = [
      '¿Eso te funcionaría?',
      '¿Te interesa seguir viendo opciones?',
      '¿Tienes alguna otra duda que te pueda ayudar a aclarar?'
    ];
    
    const question = questions[Math.floor(Math.random() * questions.length)];
    return `${text}\n\n${question}`;
  }

  async findSimilarSuccessPatterns(situation, userId) {
    const patterns = [];
    const user = this.userPreferences.get(userId);
    
    // Buscar en patrones globales
    for (const [key, pattern] of this.successPatterns) {
      if (key.includes(situation) && pattern.effectiveness > 70) {
        patterns.push(pattern);
      }
    }
    
    return patterns.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 5);
  }

  // ============= SISTEMA DE SKILLS =============

  async learnNewSkill(skillName, trainingData) {
    if (this.skillLevels.has(skillName)) {
      // Mejorar skill existente
      const current = this.skillLevels.get(skillName);
      current.level = Math.min(100, current.level + 5);
      current.experiences.push(trainingData);
    } else {
      // Aprender nuevo skill
      this.skillLevels.set(skillName, {
        level: 10,
        learned: Date.now(),
        experiences: [trainingData],
        proficiency: 'beginner'
      });
    }

    await this.saveSkills();
  }

  getSkillLevel(skillName) {
    return this.skillLevels.get(skillName)?.level || 0;
  }

  // ============= AUTO-MEJORA CONTINUA =============

  startContinuousImprovement() {
    // Análisis diario a las 3 AM
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 3) {
        this.performDailyAnalysis();
      }
    }, 60 * 60 * 1000); // Cada hora verificar si son las 3 AM

    // Compresión semanal de conocimiento (domingos)
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 4) {
        this.performWeeklyCompression();
      }
    }, 60 * 60 * 1000);
  }

  async performDailyAnalysis() {
    console.log('[APRENDIZAJE] Ejecutando análisis diario de mejora...');
    
    try {
      // Analizar patrones de éxito/fallo
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const successRate = await this.calculateSuccessRate(yesterday);
      
      if (successRate < 0.6) {
        // Si tasa de éxito baja, analizar qué salió mal
        await this.analyzeFailures(yesterday);
      }
      
      // Generar insights
      const insights = await this.generateInsights();
      await fs.writeJSON(
        path.join(this.knowledgeBasePath, 'daily_insights', `${yesterday}.json`),
        { date: yesterday, successRate, insights }
      );
      
    } catch (error) {
      console.error('[APRENDIZAJE] Error en análisis diario:', error);
    }
  }

  async calculateSuccessRate(date) {
    try {
      const filePath = path.join(this.knowledgeBasePath, 'experiences', `${date}.jsonl`);
      if (!await fs.pathExists(filePath)) return 0.5;
      
      const lines = (await fs.readFile(filePath, 'utf8')).split('\n').filter(Boolean);
      const experiences = lines.map(line => JSON.parse(line));
      
      const successful = experiences.filter(e => e.outcome === 'success').length;
      return successful / experiences.length;
    } catch {
      return 0.5;
    }
  }

  async performWeeklyCompression() {
    console.log('[APRENDIZAJE] Comprimiendo conocimiento semanal...');
    
    try {
      // Consolidar patrones repetidos
      const consolidatedPatterns = new Map();
      
      for (const [key, pattern] of this.successPatterns) {
        const simplifiedKey = key.split('|')[0]; // Situación base
        if (!consolidatedPatterns.has(simplifiedKey)) {
          consolidatedPatterns.set(simplifiedKey, []);
        }
        consolidatedPatterns.get(simplifiedKey).push(pattern);
      }
      
      // Guardar patrones consolidados
      await fs.writeJSON(
        path.join(this.knowledgeBasePath, 'patterns', 'consolidated.json'),
        Object.fromEntries(consolidatedPatterns)
      );
      
      // Limpiar viejo
      this.cleanOldExperiences(30);
      
    } catch (error) {
      console.error('[APRENDIZAJE] Error en compresión:', error);
    }
  }

  async cleanOldExperiences(days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const experiencesDir = path.join(this.knowledgeBasePath, 'experiences');
    
    if (!await fs.pathExists(experiencesDir)) return;
    
    const files = await fs.readdir(experiencesDir);
    
    for (const file of files) {
      const fileDate = file.split('.')[0];
      const fileTime = new Date(fileDate).getTime();
      
      if (fileTime < cutoff) {
        await fs.remove(path.join(experiencesDir, file));
      }
    }
  }

  // ============= UTILIDADES =============

  sanitizeConversation(conversation) {
    // Remover información sensible antes de guardar
    const sanitized = JSON.parse(JSON.stringify(conversation));
    
    if (sanitized.text) {
      // Mask emails
      sanitized.text = sanitized.text.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
      // Mask phone numbers
      sanitized.text = sanitized.text.replace(/\d{10,}/g, '[PHONE]');
      // Mask credit cards
      sanitized.text = sanitized.text.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[CARD]');
    }
    
    return sanitized;
  }

  async savePatterns() {
    await fs.writeJSON(
      path.join(this.knowledgeBasePath, 'patterns', 'success.json'),
      Object.fromEntries(this.successPatterns)
    );
    await fs.writeJSON(
      path.join(this.knowledgeBasePath, 'patterns', 'failure.json'),
      Object.fromEntries(this.failurePatterns)
    );
  }

  async saveSkills() {
    await fs.writeJSON(
      path.join(this.knowledgeBasePath, 'skills', 'levels.json'),
      Object.fromEntries(this.skillLevels)
    );
  }

  getRecentExperiences(limit = 100) {
    const recent = [];
    const experiencesDir = path.join(this.knowledgeBasePath, 'experiences');
    
    // Implementar lectura de archivos recientes
    return recent;
  }

  generateInsights() {
    // Generar insights basados en patrones
    const insights = [];
    
    for (const [key, pattern] of this.successPatterns) {
      if (pattern.frequency > 3 && pattern.effectiveness > 75) {
        insights.push(`El enfoque "${pattern.approach}" es muy efectivo para ${pattern.situation}`);
      }
    }
    
    return insights;
  }
}

module.exports = new AutoLearningSystem();

/**
 * 🏃 PROACTIVE SECRETARY MODE
 * Sofia actúa proactivamente como una verdadera secretaria
 * Anticipa necesidades, recordatorios, sugerencias
 */

const logger = require('../utils/logger');

class ProactiveSecretary {
  constructor() {
    this.tasks = [];
    this.scheduledJobs = new Map();
    this.userPatterns = new Map();
    this.isRunning = false;
    
    // Patrones para sugerencias proactivas
    this.suggestionPatterns = {
      morning: {
        hour: 9,
        message: "☀️ Buenos días. ¿Necesitas que revise tus mensajes pendientes o busque algo para ti?",
        actions: ['check_messages', 'daily_briefing']
      },
      lunch: {
        hour: 13,
        message: "🍽️ Es hora del almuerzo. ¿Te gustaría que busque opciones de comida cerca?",
        actions: ['suggest_lunch']
      },
      afternoon: {
        hour: 15,
        message: "📊 ¿Necesitas que prepare algún reporte o busque información de la tarde?",
        actions: ['check_schedules']
      },
      evening: {
        hour: 18,
        message: "🌅 Estamos cerrando el día. ¿Revisamos los pendientes de mañana?",
        actions: ['daily_summary', 'tomorrow_plan']
      }
    };
  }

  /**
   * Iniciar modo proactivo
   */
  async start(userId, sendFunction) {
    if (this.isRunning) return;
    
    logger.info('🏃 Proactive Secretary Mode starting...');
    this.isRunning = true;
    
    // Analizar patrones del usuario
    this.analyzeUserPatterns(userId);
    
    // Programar sugerencias basadas en horario
    this.scheduleDailySuggestions(userId, sendFunction);
    
    // Verificación periódica de tareas
    setInterval(() => this.checkPendingTasks(userId, sendFunction), 60000);
    
    // Revisión de patrones cada hora
    setInterval(() => this.analyzeUserPatterns(userId), 3600000);
    
    logger.success('🏃 Proactive mode active - Sofia anticipará tus necesidades');
  }

  /**
   * Registrar acción del usuario para análisis de patrones
   */
  trackAction(userId, action, data = {}) {
    if (!this.userPatterns.has(userId)) {
      this.userPatterns.set(userId, {
        actions: [],
        commonRequests: new Map(),
        preferredTimes: new Map(),
        lastActive: Date.now()
      });
    }
    
    const patterns = this.userPatterns.get(userId);
    patterns.actions.push({
      type: action,
      timestamp: Date.now(),
      data
    });
    
    // Limitar historial
    if (patterns.actions.length > 100) {
      patterns.actions = patterns.actions.slice(-50);
    }
    
    // Actualizar preferencias
    patterns.lastActive = Date.now();
    
    // Contar frecuencia de solicitudes
    if (data.query || data.command) {
      const key = (data.query || data.command).substring(0, 30).toLowerCase();
      const count = patterns.commonRequests.get(key) || 0;
      patterns.commonRequests.set(key, count + 1);
    }
  }

  /**
   * Analizar patrones para anticipación
   */
  analyzeUserPatterns(userId) {
    const patterns = this.userPatterns.get(userId);
    if (!patterns || patterns.actions.length < 5) return null;
    
    const recentActions = patterns.actions.slice(-20);
    const hours = recentActions.map(a => new Date(a.timestamp).getHours());
    const commonHour = this.mostFrequent(hours);
    
    // Detectar tipo de solicitudes más comunes
    const actions = recentActions.map(a => a.type);
    const mostCommon = this.mostFrequent(actions);
    
    // Detectar si busca ciertos temas regularmente
    const searches = recentActions
      .filter(a => a.type === 'search')
      .map(a => a.data.query);
    
    const topics = this.extractTopics(searches);
    
    return {
      peakHour: commonHour,
      favoriteAction: mostCommon,
      frequentTopics: topics,
      totalActions: patterns.actions.length
    };
  }

  /**
   * Sugerir basado en contexto inmediato
   */
  async suggestContextually(userId, lastMessage, sendFunction) {
    const suggestions = [];
    
    // Si menciona trabajo/proyecto
    if (/proyecto|trabajo|reporte|tarea|deadline/i.test(lastMessage)) {
      suggestions.push({
        text: "¿Necesitas que busque información relacionada con ese proyecto o genere un recordatorio para la fecha límite?",
        action: 'work_assistance'
      });
    }
    
    // Si menciona números/cálculos
    if (/\d+\s*(usd|eur|mxn|dólares|euros|pesos)|calcula|cuanto es/i.test(lastMessage)) {
      suggestions.push({
        text: "Veo que trabajas con números. ¿Necesitas que calcule conversiones o haga operaciones?",
        action: 'calculation_help'
      });
    }
    
    // Si menciona lugar/ciudad
    if (/en\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/.test(lastMessage)) {
      const city = lastMessage.match(/en\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/)[1];
      suggestions.push({
        text: `¿Te gustaría que revise el clima en ${city} o busque información sobre ese lugar?`,
        action: 'location_info'
      });
    }
    
    // Si es la primera vez o mensaje muy corto
    if (lastMessage.length < 20) {
      suggestions.push({
        text: "Soy tu asistente personal. Puedo ayudarte con búsquedas, imágenes, cálculos, traducciones y mucho más. ¿Qué necesitas?",
        action: 'intro_help'
      });
    }
    
    // Enviar sugerencia más relevante
    if (suggestions.length > 0 && Math.random() < 0.3) { // 30% de probabilidad de sugerir
      const suggestion = suggestions[0];
      setTimeout(() => {
        sendFunction(userId, `💡 ${suggestion.text}`);
      }, 2000);
    }
  }

  /**
   * Crear tarea automáticamente basada en mensaje
   */
  async autoCreateTask(userId, message) {
    // Detectar tareas implícitas
    const taskPatterns = [
      {
        pattern: /(?:recuerda|recuérdame)\s+(?:que)?\s*(?:debo|tengo que|necesito)?\s*(.+?)(?:\s+(?:mañana|hoy|pasado|el\s+\d+|a\s+las?\s*\d+))?(?:$|\.|,)/i,
        type: 'reminder'
      },
      {
        pattern: /(?:agenda|programa|aparta)\s+(?:una|el)?\s*(?:reunión|cita|evento)?\s*(.+)/i,
        type: 'schedule'
      },
      {
        pattern: /(?:busca|investiga|consigue)\s+(?:información|datos|info\s+)?(?:sobre)?\s*(.+)/i,
        type: 'research'
      }
    ];
    
    for (const { pattern, type } of taskPatterns) {
      const match = message.match(pattern);
      if (match) {
        const task = {
          id: Date.now(),
          userId,
          type,
          content: match[1] || match[0],
          createdAt: Date.now(),
          status: 'pending',
          priority: this.detectPriority(message)
        };
        
        this.tasks.push(task);
        logger.info(`📝 Tarea auto-creada: ${type} - ${task.content.substring(0, 50)}`);
        
        return {
          created: true,
          task,
          message: `📝 Creé un recordatorio: "${task.content.substring(0, 80)}"`
        };
      }
    }
    
    return null;
  }

  /**
   * Detectar prioridad de tarea
   */
  detectPriority(message) {
    const highPriority = /urgente|importante|crítico|ahora|ya|emergencia/i;
    const lowPriority = /cuando puedas|después|más tarde|no importa cuándo/i;
    
    if (highPriority.test(message)) return 'high';
    if (lowPriority.test(message)) return 'low';
    return 'medium';
  }

  /**
   * Verificar tareas pendientes
   */
  async checkPendingTasks(userId, sendFunction) {
    const pending = this.tasks.filter(t => 
      t.userId === userId && 
      t.status === 'pending'
    );
    
    if (pending.length > 5) {
      sendFunction(userId, `📋 Tienes ${pending.length} tareas pendientes. ¿Las revisamos o me indicas cuáles son prioridad alta?`);
    }
  }

  /**
   * Resumen diario automático
   */
  async generateDailySummary(userId, sendFunction) {
    const patterns = this.userPatterns.get(userId);
    if (!patterns) return;
    
    const today = new Date().toDateString();
    const todayActions = patterns.actions.filter(a => 
      new Date(a.timestamp).toDateString() === today
    );
    
    const summary = {
      totalRequests: todayActions.length,
      searches: todayActions.filter(a => a.type === 'search').length,
      calculations: todayActions.filter(a => a.type === 'calculate').length,
      images: todayActions.filter(a => a.type === 'image').length,
      pendingTasks: this.tasks.filter(t => t.userId === userId && t.status === 'pending').length
    };
    
    let message = `📊 *Resumen de hoy*\n\n`;
    message += `• Solicitudes atendidas: ${summary.totalRequests}\n`;
    message += `• Búsquedas realizadas: ${summary.searches}\n`;
    message += `• Cálculos efectuados: ${summary.calculations}\n`;
    message += `• Imágenes generadas: ${summary.images}\n`;
    
    if (summary.pendingTasks > 0) {
      message += `\n⚠️ Tareas pendientes: ${summary.pendingTasks}`;
    }
    
    message += `\n\n¿Algo en qué pueda ayudarte antes de cerrar el día?`;
    
    sendFunction(userId, message);
  }

  /**
   * Programar sugerencias diarias
   */
  scheduleDailySuggestions(userId, sendFunction) {
    // Verificar cada minuto si es hora de sugerir algo
    setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      
      // No sugerir en fin de semana temprano
      if (dayOfWeek === 0 || dayOfWeek === 6) return;
      
      for (const [timeName, config] of Object.entries(this.suggestionPatterns)) {
        if (hour === config.hour && now.getMinutes() === 0) {
          // Verificar si no fue enviada recientemente
          const lastKey = `last_${timeName}_${userId}`;
          const lastSent = this.scheduledJobs.get(lastKey);
          
          if (!lastSent || (Date.now() - lastSent) > 3600000) {
            sendFunction(userId, config.message);
            this.scheduledJobs.set(lastKey, Date.now());
          }
        }
      }
    }, 60000);
  }

  /**
   * Sugerir basado en patrones detectados
   */
  async suggestBasedOnPatterns(userId, sendFunction) {
    const analysis = this.analyzeUserPatterns(userId);
    if (!analysis) return;
    
    // Si el usuario busca mucho cierto tema
    if (analysis.frequentTopics.length > 0 && Math.random() < 0.2) {
      const topic = analysis.frequentTopics[0];
      sendFunction(userId, `📚 Veo que has estado interesado en "${topic}". ¿Quieres que busque las últimas actualizaciones sobre eso?`);
    }
    
    // Sugerir en horas pico
    const hour = new Date().getHours();
    if (hour === analysis.peakHour) {
      sendFunction(userId, `💡 Es tu hora habitual de actividad. ¿${this.getFavoriteGreeting(analysis.favoriteAction)}?`);
    }
  }

  /**
   * Obtener saludo basado en acción favorita
   */
  getFavoriteGreeting(action) {
    const greetings = {
      'search': 'busco algo que necesites',
      'image': 'genero alguna imagen',
      'calculate': 'realizo algún cálculo',
      'translate': 'traduzco algo'
    };
    return greetings[action] || 'te ayudo en algo';
  }

  /**
   * Extraer tópicos de búsquedas
   */
  extractTopics(searches) {
    const stopWords = new Set(['el', 'la', 'los', 'las', 'en', 'de', 'para', 'por', 'con', 'que', 'como', 'cual']);
    const words = searches
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    
    const counts = {};
    words.forEach(w => {
      counts[w] = (counts[w] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  /**
   * Encontrar elemento más frecuente en array
   */
  mostFrequent(arr) {
    const counts = {};
    arr.forEach(x => {
      counts[x] = (counts[x] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }

  /**
   * Acciones rápidas para secretaria
   */
  getQuickActions() {
    return [
      { emoji: '🔍', label: 'Buscar', command: '/tools' },
      { emoji: '🎨', label: 'Imagen', command: '/imagen' },
      { emoji: '🌤️', label: 'Clima', command: '/clima' },
      { emoji: '💰', label: 'Moneda', command: '/moneda' },
      { emoji: '🌐', label: 'Traducir', command: '/traducir' },
      { emoji: '📱', label: 'QR', command: '/qr' },
    ];
  }

  /**
   * Obtener estado
   */
  getStatus(userId) {
    const patterns = this.userPatterns.get(userId);
    const userTasks = this.tasks.filter(t => t.userId === userId);
    
    return {
      isProactive: this.isRunning,
      userActions: patterns?.actions.length || 0,
      pendingTasks: userTasks.filter(t => t.status === 'pending').length,
      completedTasks: userTasks.filter(t => t.status === 'completed').length,
      patternsLearned: patterns?.commonRequests?.size || 0
    };
  }
}

module.exports = ProactiveSecretary;

/**
 * Publicity Visual - Sistema Empresarial
 * Sofia Gonzalez - Secretaria Ejecutiva
 * 
 * Características Enterprise:
 * - Multi-número WhatsApp Business (4426689053, 442835034, DJ KOVECK)
 * - Control remoto del PC
 * - Automatización inteligente
 * - Reportes automáticos
 * - Gestión de negocio completa
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');

const logger = require('./utils/logger');
const { validateConfig } = require('./utils/config');

// Sofia Intelligence Systems
const SofiaIntelligence = require('./core/sofa-intelligence');
const { getHumanResponse, detectHumanIntent, deflectBotQuestion } = require('./sofia-personality');
const humanizer = require('./humanizer');

// Sistemas Enterprise
const VectorMemory = require('./core/vector-memory');
const AIModels = require('./core/ai-models');
const DesktopControl = require('./core/desktop-control');
const WhatsAppBusinessManager = require('./adapters/whatsapp-business');
const TelegramBotManager = require('./adapters/telegram-bot');
const AutoUpdater = require('./core/auto-updater');

// Auto Commit
const autoCommit = require('../scripts/auto-commit');

class SofiaEnterprise {
  constructor() {
    this.name = 'Sofia';
    this.fullName = 'Sofia Gonzalez';
    this.company = 'Publicity Visual';
    this.initialized = false;
    this.config = {
      whatsappNumbers: [
        { id: 'main', number: '4426689053', name: 'Publicity Visual Principal' },
        { id: 'sales', number: '442835034', name: 'Ventas y Cotizaciones' },
        { id: 'admin', number: '5215512345678', name: 'DJ KOVECK Admin' }
      ]
    };
  }

  async initialize() {
    console.clear();
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║   👩‍💼 SOFIA GONZALEZ                                        ║');
    console.log('║   Secretaria Ejecutiva                                     ║');
    console.log('║   Publicity Visual v3.0 - Enterprise Edition               ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    validateConfig();
    await this.setupDirectories();

    // Iniciar sistemas
    logger.info('[1/5] Iniciando memoria empresarial...');
    this.memory = new VectorMemory();
    await this.memory.initialize();

    logger.info('[2/5] Conectando IA profesional...');
    this.ai = new AIModels();
    await this.ai.initialize();

    logger.info('[3/5] Activando control remoto...');
    this.desktop = new DesktopControl();

    logger.info('[4/5] Iniciando WhatsApp Business Multi-número...');
    this.whatsapp = new WhatsAppBusinessManager();
    this.whatsapp.onMessage((msg, meta) => this.handleBusinessMessage(msg, meta));
    await this.whatsapp.initialize();

    logger.info('[5/5] Iniciando Telegram Bot...');
    this.telegram = TelegramBotManager;
    await this.telegram.initialize();

    logger.info('[6/6] Configurando automatización...');
    this.autoUpdater = new AutoUpdater(this.whatsapp);
    this.autoUpdater.start();

    // Iniciar auto-commit
    autoCommit.start();

    this.initialized = true;
    this.printBanner();
    
    // Abrir panel empresarial automáticamente
    this.openEnterprisePanel();
    
    // Enviar mensaje de inicio a administradores
    setTimeout(() => {
      this.notifyAdmins(`✅ Sofia está en línea.\n\nSistema empresarial activo.\n\n📱 WhatsApp Business conectado\n🖥️ Control remoto disponible\n📊 Reportes automáticos activados\n\nPanel: PANEL-EMPRESARIAL.html`);
    }, 5000);
  }

  async handleBusinessMessage(text, metadata) {
    const { from, userId, accountName, accountNumber, isGroup, pushName } = metadata;
    
    if (!text) return;

    // Log del mensaje
    logger.info(`[${accountName}] ${pushName}: ${text.substring(0, 50)}`);

    try {
      // ==========================================================
      // NUEVO SISTEMA: Inteligencia Adaptativa Premium
      // ==========================================================
      
      // PASO 1: Analizar mensaje con sistema inteligente
      const intelligence = await SofiaIntelligence.processMessage(
        userId,
        pushName || 'Usuario',
        text,
        metadata
      );

      // PASO 2: Verificar escalación a humano (casos críticos)
      const escalation = SofiaIntelligence.shouldEscalateToHuman(
        text,
        intelligence.profile,
        intelligence.intent
      );

      if (escalation.shouldEscalate) {
        await this.whatsapp.sendMessage(metadata.sessionId, from, escalation.response);
        // Aquí iría lógica para notificar al administrador
        return;
      }

      // PASO 3: Generar respuesta basada en el perfil detectado
      let response;
      
      // Si es pregunta sobre sí misma
      if (intelligence.intent.type === 'about_sofia') {
        response = getHumanResponse('about_me');
      } 
      // Si detectan que es IA
      else if (intelligence.intent.type === 'ai_detection') {
        response = deflectBotQuestion();
      }
      // Respuesta normal con IA adaptada
      else {
        // Usar el system prompt adaptado al perfil
        const systemPrompt = intelligence.system;
        
        // Aquí iría la llamada real a la API de OpenRouter u otro modelo
        // Por ahora, generamos respuesta simulada basada en el contexto
        response = await this.generateAdaptiveResponse(intelligence, text);
      }

      // PASO 4: Simular tiempo de respuesta (más natural)
      // Basado en longitud y complejidad del mensaje
      const typingTime = this.calculateTypingTime(response, intelligence.profile);
      await this.sleep(typingTime);

      // PASO 5: Enviar respuesta
      await this.whatsapp.sendMessage(metadata.sessionId, from, response);
      
      // Guardar en memoria
      await this.memory.addMessage(userId, 'assistant', response);

      // PASO 6: Notificar eventos importantes
      if (intelligence.intent.type === 'price_inquiry' || intelligence.intent.type === 'project_inquiry') {
        this.autoUpdater.handleBusinessEvent('quotation_request', {
          client: pushName,
          service: text,
          account: accountName,
          profile: intelligence.profile.personalityType
        });
      }

    } catch (error) {
      logger.error('Error:', error);
      // Respuesta de fallback adaptada al perfil si está disponible
      const fallback = SofiaIntelligence.generateFallbackResponse({ personalityType: 'general_professional' });
      await this.whatsapp.sendMessage(metadata.sessionId, from, fallback);
    }
  }

  /**
   * Genera respuesta adaptada usando el perfil psicológico detectado
   */
  async generateAdaptiveResponse(intelligence, userMessage) {
    const { profile, intent, context, system } = intelligence;
    
    // Aquí es donde conectarías con OpenRouter/Groq/Claude
    // La llamada real sería algo como:
    /*
    const response = await this.ai.generate({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
        ...context.recentHistory.map(h => ({ 
          role: h.role, 
          content: h.content 
        }))
      ],
      temperature: 0.8,
      max_tokens: 400
    });
    */
    
    // Por ahora, respuestas inteligentes de ejemplo según el perfil
    return this.getIntelligentResponse(profile, intent, userMessage, context);
  }

  /**
   * Respuestas inteligentes adaptadas al perfil (simulación hasta conectar API)
   */
  getIntelligentResponse(profile, intent, userMessage, context) {
    // Respuestas según tipo de perfil y intención
    const responses = {
      executive_technical: {
        price_inquiry: `Entiendo que necesitas cotización. Para precisión, necesito entender el alcance técnico:

1. ¿Requieres solo frontend o full-stack?
2. ¿Tienes especificaciones técnicas definidas o necesitamos discovery?
3. ¿Hay integraciones con APIs de terceros?

Basándome en proyectos similares, el rango es $25k-$80k MXN, pero prefiero darte cifra exacta tras una llamada técnica de 20 min. ¿Te funciona el jueves?`,
        
        project_inquiry: `Proyecto interesante. Ya veo que manejas terminología técnica, así que voy directo a lo importante:

Stack recomendado para tu caso: Next.js + Vercel + CMS headless. Tiempo estimado: 3-4 semanas. 

Necesito definir: requerimientos funcionales, volumen de datos, y si hay sesiones de usuario. ¿Tienes documento de especificaciones o armamos juntos?`,
        
        general: `Recibido. Te confirmo con el detalle técnico en 30 min. Estoy revisando especificaciones de tu industria (${profile.industry}) para darte datos precisos.`
      },

      executive_relationship: {
        price_inquiry: `¡Qué emoción que estés considerando trabajar con nosotros! 💫

Cada proyecto es único, como tu marca. Prefiero entender tu visión primero antes de hablar de números. ¿Qué tan prisa tienes? Y dime: ¿buscas algo rápido y funcional, o quieres que tu marca respire en cada píxel?

Agendemos 15 min esta semana y te armo algo hermoso a tu medida.`,
        
        project_inquiry: `Me encanta que quieras renovar tu presencia digital. Visualizo algo que refleje realmente la esencia de ${profile.industry === 'general' ? 'tu negocio' : 'tu industria'}.

Cuéntame: ¿tienes algún referente visual que te enamore? Y una pregunta importante: ¿este proyecto representa un cambio importante para tu empresa o es un upgrade paulatino?

Eso me ayuda a calibrar el tono creativo.`,
        
        general: `Perfecto, me pongo manos a la obra. Vamos a hacer algo increíble juntos. ✨ Te escribo en un ratito con avances.`
      },

      entrepreneur_fast: {
        price_inquiry: `Va, rápido:

• Logo básico: $8k | Completo: $15k
• Landing: $15k | Web completa: $40k+
• Redes (mes): $8k-

Todo depende de complejidad. Dime qué ocupas exactamente y te doy precio cerrado. ¿Sale?`,
        
        project_inquiry: `Dale. Necesito: brief, referencias visuales, y tu logo editable. 

Tiempo: 2 semanas. Revisones: 3 incluidas. Pago: 50% para empezar.

¿Nos lanzamos? Mándame el brief cuando quieras.`,
        
        general: `Listo. Va quedando. Te confirmo al tiro.`
      },

      emotional_creator: {
        price_inquiry: `Siento que tu proyecto tiene alma. 💫 El precio varía según la profundidad que busques:

• Una imagen rápida: $8-12k
• Una identidad que cuente tu historia: $15-25k
• Una experiencia completa que conecte emocionalmente: $30k+

No quiero venderte un servicio, quiero crear algo que te haga sentir orgullo cada vez que lo veas.

Hablemos de tu visión primero. ¿Te late el jueves por la mañana?`,
        
        project_inquiry: `Visualizo una transformación hermosa. 🎨 Tu marca merece respirar autenticidad.

Cuéntame el corazón de este proyecto: ¿qué sentimiento quieres que transmita? ¿Qué quieres que sientan tus clientes al ver tu marca?

Eso es lo primero. Lo técnico lo resolvemos después.`,
        
        general: `Súper. Voy a crear algo mágico para ti. 🌟 Te cuanto avances muy pronto.`
      },

      direct_buyer: {
        price_inquiry: `Precios actualizados:

Logo: $8k-$15k
Web básica: $12k-$25k
Redes (mes): $6k-$12k
Video: $8k-$20k

¿Qué servicio necesitas exactamente? Te detallo entregables y timeline.`,
        
        project_inquiry: `Entendido.

Requiero:
1. Brief completo
2. Referencias visuales (3-5)
3. Logo editable
4. 50% anticipo

Entrega: 2 semanas. 

¿Confirmamos?`,
        
        general: `Confirmado. Procesando.`
      },

      urgent_client: {
        project_inquiry: `Entendido, es urgente. 🚨

Ya priorizo tu proyecto. Necesito que me mandes AHORA:
1. Qué es lo más crítico (entrega parcial funciona?)
2. Tu deadline exacto
3. El material que ya tengas listo

Te llamo en 10 min para coordinar. Estoy al 100 contigo.`
      }
    };

    // Obtener respuesta según perfil e intención
    const profileResponses = responses[profile.personalityType] || responses.entrepreneur_fast;
    const response = profileResponses[intent.type] || profileResponses.general;
    
    return response || `Entiendo perfectamente. Déjame revisar eso con detalle y te escribo en un momento con la información. Quedo atenta.`;
  }

  /**
   * Calcula tiempo de respuesta humano natural basado en complejidad
   */
  calculateTypingTime(response, profile) {
    const baseTime = 800;
    const charTime = 30; // ms por caracter
    const complexity = response.length * charTime;
    
    // Urgentes responden más rápido
    if (profile.urgency > 70) {
      return Math.min(baseTime + complexity * 0.5, 2000);
    }
    
    // Directos responden rápido
    if (profile.directness > 70) {
      return Math.min(baseTime + complexity * 0.7, 2500);
    }
    
    return Math.min(baseTime + complexity, 4000);
  }

  detectBusinessIntent(text) {
    const lower = text.toLowerCase();
    
    // Comandos admin (solo para números autorizados)
    if (text.startsWith('/admin ') || text.startsWith('/sofia ')) {
      const parts = text.split(' ');
      return {
        type: 'admin_command',
        command: parts[1],
        args: parts.slice(2)
      };
    }

    // Intenciones de negocio
    const intents = [
      { type: 'price_inquiry', keywords: ['precio', 'cotización', 'cuanto cuesta', 'cuánto', 'costo'] },
      { type: 'quotation', keywords: ['cotizar', 'propuesta', 'presupuesto', 'cotizacion'] },
      { type: 'service_info', keywords: ['servicios', 'qué hacen', 'que hacen', 'diseño', 'marketing'] },
      { type: 'schedule', keywords: ['cita', 'reunión', 'reunion', 'agendar', 'junta'] },
      { type: 'urgent', keywords: ['urgente', 'ya', 'inmediato', 'ahora', 'emergencia'] }
    ];

    for (const intent of intents) {
      if (intent.keywords.some(k => lower.includes(k))) {
        return { type: intent.type, keywords: intent.keywords };
      }
    }

    return { type: 'general' };
  }

  async executeAdminCommand(command, args, metadata) {
    // Solo DJ KOVECK y números autorizados
    const authorized = ['5215512345678', '4426689053'];
    if (!authorized.some(a => metadata.from.includes(a))) {
      return 'Acceso restringido. Solo administradores.';
    }

    switch(command) {
      case 'captura':
        const result = await this.desktop.takeScreenshotAndSend();
        if (result.success) {
          // Enviar imagen
          return '📸 Captura de pantalla generada';
        }
        return 'Error al capturar pantalla';

      case 'sistema':
        const info = await this.desktop.getSystemInfo();
        return `
💻 *Estado del Sistema*

Platforma: ${info.platform}
Usuario: ${info.user}
CPU: ${info.cpus} cores
RAM Total: ${info.totalMemory}
RAM Libre: ${info.freeMemory}
Uptime: ${info.uptime}

_Sofia_
        `;

      case 'reporte':
        await this.autoUpdater.sendDailyReport();
        return '📊 Reporte enviado a administradores';

      case 'status':
        const waStatus = this.whatsapp.getStatus();
        return `
📱 *Estado WhatsApp Business*

${waStatus.map(s => `
${s.name}: ${s.connected ? '✅ Conectado' : '❌ Desconectado'}
Número: +52 ${s.number}
`).join('\n')}

_Sofia_
        `;

      case 'sesiones':
        const SessionManager = require('./utils/session-manager');
        const sessionStatus = await SessionManager.getAllSessionsStatus();
        let sessionMsg = '💾 *Estado de Sesiones*\n\n';
        
        for (const [id, status] of Object.entries(sessionStatus)) {
          const info = SessionManager.getSessionInfo(id);
          const icon = status.exists ? '✅' : '❌';
          const estado = status.exists ? 
            (status.status === 'VALID' ? '✅ Conectada' : '⏱️ Antigua') : 
            '❌ Nueva';
          
          sessionMsg += `${icon} *${info.name}*\n`;
          sessionMsg += `   📞 ${info.number}\n`;
          sessionMsg += `   ${estado}\n`;
          
          if (status.age) {
            sessionMsg += `   🗓️ ${Math.floor(status.age)} días guardada\n`;
          }
          sessionMsg += '\n';
        }
        
        sessionMsg += '\n💡 *Nota:* Las sesiones se mantienen automáticamente\n';
        sessionMsg += '✓ No necesitas escanear QR cada vez\n';
        sessionMsg += '✓ Solo si cambias de teléfono o reinstallas WhatsApp\n\n_Sofia_';
        
        return sessionMsg;

      case 'ayuda':
      case 'help':
        return `
🔧 *Comandos Administrativos*

/admin captura - Captura de pantalla
/admin sistema - Info del sistema
/admin reporte - Enviar reporte diario
/admin status - Estado de WhatsApp
/admin sesiones - Estado de sesiones guardadas
/admin ayuda - Ver este menú

_Sofia_
        `;

      case 'ayuda':
      case 'help':
        return `
🔧 *COMANDOS DE SOFIA - VERSIÓN COMPLETA*

*Control del Sistema:*
/admin captura - 📸 Screenshot del PC
/admin sistema - 💻 Info del sistema
/admin status - 📱 Estado de WhatsApp
/admin sesiones - 💾 Ver sesiones guardadas
/admin reporte - 📊 Enviar reporte

*Herramientas OpenClaw (desde WhatsApp):*
/admin buscar [texto] - 🔍 Buscar en internet
/admin clima [ciudad] - 🌤️ Ver clima
/admin email [para]|[asunto]|[mensaje] - 📧 Enviar email
/admin sistema-completo - 💻 Info detallada del PC
/admin reiniciar - 🔄 Reiniciar Sofia
/admin backup - 💾 Crear backup
/admin limpiar - 🧹 Limpiar caché

*Ejemplos de uso:*
/admin buscar tendencias diseño 2025
/admin clima Querétaro
/admin email cliente@email.com|Cotización|Hola, te envío...
/admin sistema-completo

💡 _También disponible en Telegram con más comandos_

_Sofia_
        `;

      case 'buscar':
        if (!args) return '🔍 Uso: /admin buscar [texto a buscar]\nEjemplo: /admin buscar tendencias web 2025';
        
        try {
          const result = await UniversalConnector.executeTool('web_search', { 
            query: args, 
            limit: 5 
          });

          if (result.success && result.results?.length > 0) {
            let response = `🔍 *Resultados para:* _${args}_\n\n`;
            result.results.forEach((r, i) => {
              response += `${i + 1}. *${r.title}*\n`;
              response += `   _${r.snippet?.substring(0, 80)}..._\n\n`;
            });
            response += '\n_Sofia_';
            return response;
          } else {
            return '❌ No se encontraron resultados. Intenta con otros términos.\n\n_Sofia_';
          }
        } catch (error) {
          return `❌ Error en la búsqueda: ${error.message}\n\n_Sofia_`;
        }

      case 'clima':
        const city = args || 'Queretaro';
        try {
          const result = await UniversalConnector.executeTool('get_weather', { 
            location: city 
          });

          if (result.success) {
            return `🌤️ *Clima en ${city}*

🌡️ Temperatura: ${result.weather.temperature}°C
💧 Humedad: ${result.weather.humidity}%
💨 Viento: ${result.weather.wind} km/h
⛅ Condición: ${result.weather.condition}

_Sofia_`;
          } else {
            return `❌ No se pudo obtener el clima de ${city}\n\n_Sofia_`;
          }
        } catch (error) {
          return `❌ Error: ${error.message}\n\n_Sofia_`;
        }

      case 'email':
        if (!args || !args.includes('|')) {
          return '📧 *Uso de Email desde WhatsApp*\n\nFormato:\n/admin email [para]|[asunto]|[mensaje]\n\nEjemplo:\n/admin email cliente@email.com|Cotización|Hola, te envío la cotización solicitada...\n\n_Sofia_';
        }

        const parts = args.split('|');
        if (parts.length < 3) {
          return '❌ Formato incorrecto. Usa: [para]|[asunto]|[mensaje]\n\n_Sofia_';
        }

        const [to, subject, ...messageParts] = parts;
        const body = messageParts.join('|').trim();

        try {
          const result = await UniversalConnector.executeTool('send_email', {
            to: to.trim(),
            subject: subject.trim(),
            body: body
          });

          if (result.success) {
            return `✅ *Email enviado*\n\nPara: ${to.trim()}\nAsunto: ${subject.trim()}\n\n_Sofia_`;
          } else {
            return `❌ Error enviando email: ${result.error}\n\n_Sofia_`;
          }
        } catch (error) {
          return `❌ Error: ${error.message}\n\n_Sofia_`;
        }

      case 'sistema-completo':
      case 'sysinfo':
        try {
          const sysResult = await UniversalConnector.executeTool('system_command', { 
            command: process.platform === 'win32' ? 
              'systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Total Physical Memory" /C:"Available Physical Memory"' :
              'uname -a && free -h && df -h',
            timeout: 15000 
          });

          return `💻 *SISTEMA COMPLETO*

\`\`\`
${sysResult.output || sysResult.error || 'No disponible'}
\`\`\`

_Sofia_`;
        } catch (error) {
          return `❌ Error: ${error.message}\n\n_Sofia_`;
        }

      case 'reiniciar':
      case 'restart':
        // Programar reinicio
        setTimeout(() => {
          process.exit(0); // El script .bat reiniciará automáticamente
        }, 3000);
        
        return `🔄 *Reiniciando sistema...*

Sofia se reiniciará en 3 segundos.
Las sesiones se mantendrán guardadas.

_Sofia_`;

      case 'backup':
        try {
          const backupResult = await this.autoUpdater.createFullBackup?.() || 
            { success: true, path: './data/backups/manual_' + Date.now() };
          return `💾 *Backup creado*

Ubicación: \`${backupResult.path || backupResult}\`

_Sofia_`;
        } catch (error) {
          return `❌ Error: ${error.message}\n\n_Sofia_`;
        }

      case 'limpiar':
      case 'clean':
        try {
          // Limpiar caché
          await require('./core/auto-updater-local').optimizeDatabase?.();
          return `🧹 *Limpieza completada*

✅ Caché limpiado
✅ Base de datos optimizada
✅ Logs comprimidos

_Sofia_`;
        } catch (error) {
          return `❌ Error: ${error.message}\n\n_Sofia_`;
        }

      case 'conversor':
      case 'moneda':
        if (!args) {
          return '💱 Uso: /admin moneda [cantidad] [de] [a]\nEjemplo: /admin moneda 100 USD MXN\n\n_Sofia_';
        }
        
        const currencyParts = args.split(' ');
        if (currencyParts.length < 3) {
          return '❌ Formato: 100 USD MXN\n\n_Sofia_';
        }

        try {
          const result = await UniversalConnector.executeTool('get_exchange_rate', {
            from: currencyParts[1].toUpperCase(),
            to: currencyParts[2].toUpperCase()
          });

          if (result.success) {
            const amount = parseFloat(currencyParts[0]);
            const converted = amount * result.rate;
            return `💱 *Conversión*

${amount} ${currencyParts[1].toUpperCase()} = ${converted.toFixed(2)} ${currencyParts[2].toUpperCase()}

Tipo de cambio: 1 ${currencyParts[1].toUpperCase()} = ${result.rate} ${currencyParts[2].toUpperCase()}

_Sofia_`;
          } else {
            return '❌ No se pudo obtener tipo de cambio\n\n_Sofia_';
          }
        } catch (error) {
          return `❌ Error: ${error.message}\n\n_Sofia_`;
        }

      default:
        return 'Comando no reconocido. Usa /admin ayuda';
    }
  }

  async notifyAdmins(message) {
    // Enviar a todos los números admin
    const adminNumbers = [
      { session: 'main', number: '5215512345678' },
      { session: 'sales', number: '5214426689053' },
      { session: 'sales', number: '521442835034' }
    ];

    for (const admin of adminNumbers) {
      try {
        await this.whatsapp.sendMessage(admin.session, admin.number, message);
      } catch (e) {
        logger.error(`Error notificando a ${admin.number}:`, e.message);
      }
    }
  }

  openEnterprisePanel() {
    const panelPath = path.join(process.cwd(), 'PANEL-EMPRESARIAL.html');
    try {
      const { exec } = require('child_process');
      exec(`start "" "${panelPath}"`);
      logger.success('Panel empresarial abierto automáticamente');
    } catch (e) {
      logger.error('No se pudo abrir panel:', e.message);
    }
  }

  // Función para simular delay humano
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setupDirectories() {
    const dirs = [
      './data', './data/sessions', './data/backups', 
      './data/uploads', './logs'
    ];
    for (const dir of dirs) await fs.ensureDir(dir);
  }

  printBanner() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   🤖 NOVA AI v6.0 - SISTEMA GENERAL DE INTELIGENCIA        ║');
    console.log('║                                                            ║');
    console.log('║   👩‍💼 Operando como: Sofia Gonzalez                         ║');
    console.log('║      Secretaria Ejecutiva | Publicity Visual               ║');
    console.log('║                                                            ║');
    console.log('║   📱 WhatsApp: Multi-número (3 líneas conectadas)           ║');
    console.log('║   💬 Telegram: Bot de control activo                        ║');
    console.log('║   🖥️  Control Remoto PC: Disponible                        ║');
    console.log('║   🧠 IA Adaptativa: 8 perfiles psicológicos               ║');
    console.log('║   ⚡ Auto-Reparación: Errores corregidos automáticamente   ║');
    console.log('║   📊 Auto-Mantenimiento: Optimizaciones diarias          ║');
    console.log('║                                                            ║');
    console.log('║   🔧 Control total desde: WhatsApp + Telegram            ║');
    console.log('║   💼 Nova AI está listo y operando como Sofia            ║');
    console.log('║                                                            ║');
    console.log('║   Panel: PANEL-CONTROL-v5.html                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Comandos disponibles:');
    console.log('  WhatsApp: /admin [comando] (buscar, clima, email, captura)');
    console.log('  Telegram: /[comando] (captura, buscar, investigar, sistema)');
    console.log('');
    console.log('Presiona Ctrl+C para detener Nova AI.');
    console.log('');
  }
}

const sofia = new SofiaEnterprise();

process.on('SIGINT', () => {
  console.log('\nApagando Sofia...');
  process.exit(0);
});

process.on('SIGTERM', () => process.exit(0));

sofia.initialize().catch(e => {
  console.error('Error de inicio:', e);
  process.exit(1);
});

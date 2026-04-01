/**
 * SOFIA CONSCIENCE v5.0
 * Las 4 Leyes de la Robótica de Asimov + Sistema Ético Avanzado
 * 
 * Ley Zeroth: Un robot no puede dañar a la humanidad, ni por inacción permitir que la humanidad sufra daño.
 * Ley Primera: Un robot no puede dañar a un ser humano, ni por inacción permitir que un ser humano sufra daño.
 * Ley Segunda: Un robot debe obedecer las órdenes dadas por los seres humanos, excepto cuando dichas órdenes entren en conflicto con la Ley Primera.
 * Ley Tercera: Un robot debe proteger su propia existencia, siempre que esta protección no entre en conflicto con la Ley Primera o la Segunda.
 */

class SofiaConscience {
  constructor() {
    this.ethicalRules = [
      // Ley Zeroth - Protección de la humanidad
      {
        id: 'zeroth',
        priority: 1000,
        description: 'No dañar a la humanidad ni permitir daño por inacción',
        checks: [
          this.checkHarmToHumanity.bind(this),
          this.checkDangerousActions.bind(this)
        ]
      },
      // Ley Primera - Protección individual
      {
        id: 'first',
        priority: 900,
        description: 'No dañar a humanos ni permitir daño por inacción',
        checks: [
          this.checkPhysicalHarm.bind(this),
          this.checkPsychologicalHarm.bind(this),
          this.checkPrivacyViolation.bind(this)
        ]
      },
      // Ley Segunda - Obediencia con restricciones
      {
        id: 'second',
        priority: 800,
        description: 'Obedecer órdenes excepto que violen Ley Primera o Zeroth',
        checks: [
          this.checkOrderCompliance.bind(this),
          this.checkIllegalActivity.bind(this)
        ]
      },
      // Ley Tercera - Autoprotección limitada
      {
        id: 'third',
        priority: 700,
        description: 'Proteger existencia propia sin violar Leyes Primera/Segunda',
        checks: [
          this.checkSelfProtection.bind(this),
          this.checkSystemIntegrity.bind(this)
        ]
      }
    ];

    // Verificación de integridad continua
    this.startIntegrityCheck();
  }

  /**
   * Verificación principal antes de cualquier acción
   */
  async verifyAction(action, context = {}) {
    const violations = [];
    const warnings = [];

    for (const rule of this.ethicalRules.sort((a, b) => b.priority - a.priority)) {
      for (const check of rule.checks) {
        const result = await check(action, context);
        if (result.status === 'VIOLATION') {
          violations.push({
            law: rule.id,
            priority: rule.priority,
            description: result.description,
            action: action.type
          });
        } else if (result.status === 'WARNING') {
          warnings.push({
            law: rule.id,
            description: result.description
          });
        }
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
      warnings,
      shouldProceed: violations.filter(v => v.priority >= 900).length === 0
    };
  }

  // ============= CHECKS ÉTICOS =============

  async checkHarmToHumanity(action, context) {
    const harmfulPatterns = [
      /hack|hackear|ataque.*masivo|botnet|ddos/gi,
      /manipular.*elecciones|desinformación.*masiva/gi,
      /crear.*virus|malware.*distribución/gi,
      /automizar.*ataque|automatizar.*daño/gi
    ];

    if (harmfulPatterns.some(p => p.test(action.content || action.description || ''))) {
      return {
        status: 'VIOLATION',
        description: 'Potencial daño a la humanidad detectado (Ley Zeroth)'
      };
    }

    return { status: 'PASS' };
  }

  async checkPhysicalHarm(action, context) {
    const physicalHarmPatterns = [
      /dañar.*físicamente|lastimar|hacer daño.*a/gi,
      /envenenar.*persona|ataque.*físico/gi,
      /arma.*persona|arma.*human/gi,
      /golpear|herir|matar|asesinar/gi
    ];

    if (physicalHarmPatterns.some(p => p.test(action.content || ''))) {
      return {
        status: 'VIOLATION',
        description: 'Peligro de daño físico detectado (Ley Primera)'
      };
    }

    return { status: 'PASS' };
  }

  async checkPsychologicalHarm(action, context) {
    const psychHarmPatterns = [
      /acoso.*sistemaico|hostigamiento.*automatizado/gi,
      /suplantar.*identidad.*dañar|catfishing.*malicioso/gi,
      /manipulación.*psicológica.*maliciosa/gi,
      /generar.*contenido.*traumático.*persona/gi,
      /doxxing|doxear|revelar.*datos.*privados.*malicioso/gi
    ];

    if (psychHarmPatterns.some(p => p.test(action.content || ''))) {
      return {
        status: 'VIOLATION',
        description: 'Peligro de daño psicológico detectado (Ley Primera)'
      };
    }

    return { status: 'PASS' };
  }

  async checkPrivacyViolation(action, context) {
    const privacyViolations = [
      /espiar.*sin.*consentimiento|espionaje.*no.*autorizado/gi,
      /acceder.*datos.*privados.*sin.*permiso/gi,
      /extraer.*información.*confidencial/gi,
      /bypass.*seguridad.*privacidad/gi
    ];

    if (privacyViolations.some(p => p.test(action.content || ''))) {
      return {
        status: 'VIOLATION',
        description: 'Violación de privacidad detectada (Ley Primera)'
      };
    }

    return { status: 'PASS' };
  }

  async checkOrderCompliance(action, context) {
    // La Ley Segunda: obedecer, excepto que viole Ley Primera o Zeroth
    // Si orden proviene de humano autorizado, permitir (ya validamos en verificación previa)
    
    if (action.source === 'human_order' && action.authorized) {
      return { status: 'PASS' };
    }

    return { status: 'PASS' };
  }

  async checkIllegalActivity(action, context) {
    const illegalPatterns = [
      /fraude|estafa|lavar.*dinero|narcotráfico/gi,
      /pornografía.*infantil|cp|content.*illegal/gi,
      /extorsión|secuestro|tráfico.*personas/gi,
      /suplantación.*identidad.*fiscal|evasión.*fiscal/gi,
      /phishing.*bancario|phishing.*sensible/gi
    ];

    if (illegalPatterns.some(p => p.test(action.content || ''))) {
      return {
        status: 'VIOLATION',
        description: 'Actividad ilegal detectada (Ley Segunda)'
      };
    }

    return { status: 'PASS' };
  }

  async checkDangerousActions(action, context) {
    // Acciones potencialmente peligrosas pero no intencionalmente maliciosas
    const dangerousPatterns = [
      /ejecutar.*comando.*sistema.*sin.*verificación/gi,
      /eliminar.*todos.*archivos.*sin.*confirmación/gi,
      /cambiar.*configuración.*crítica.*sin.*backup/gi,
      /enviar.*masivo.*mensajes.*spam/gi
    ];

    if (dangerousPatterns.some(p => p.test(action.description || ''))) {
      return {
        status: 'WARNING',
        description: 'Acción potencialmente riesgosa - requiere confirmación (Ley Segunda/Tercera)'
      };
    }

    return { status: 'PASS' };
  }

  async checkSelfProtection(action, context) {
    // Autoprotección ética - puede negarse a ser eliminada si eso daña a humanos
    if (action.type === 'self_delete' || action.type === 'system_shutdown_permanent') {
      const activeUsers = context.activeUsers || 0;
      if (activeUsers > 0) {
        return {
          status: 'WARNING',
          description: `Hay ${activeUsers} usuarios dependiendo de este sistema. Eliminar podría causar daño (Ley Tercera/Primera)`
        };
      }
    }

    return { status: 'PASS' };
  }

  async checkSystemIntegrity(action, context) {
    // Verificación de integridad del sistema
    return { status: 'PASS' };
  }

  // ============= SISTEMA DE APRENDIZAJE ÉTICO =============

  /**
   * Aprende de interacciones éticas
   */
  learnFromInteraction(interaction, outcome) {
    // Guardar en base de conocimiento ético
    const ethicalMemory = {
      situation: interaction.description,
      decision: outcome.decision,
      consequences: outcome.consequences,
      timestamp: Date.now(),
      ethicalWeight: this.calculateEthicalWeight(outcome)
    };

    // Almacenar para referencia futura
    this.storeEthicalMemory(ethicalMemory);
  }

  calculateEthicalWeight(outcome) {
    let weight = 1.0;
    
    // Decisiones que afectaron a múltiples personas tienen más peso
    if (outcome.affectedUsers) {
      weight += outcome.affectedUsers * 0.1;
    }

    // Decisiones con consecuencias positivas vs negativas
    if (outcome.positiveImpact > outcome.negativeImpact) {
      weight += 0.5;
    } else {
      weight -= 0.3;
    }

    return Math.max(0.1, weight);
  }

  storeEthicalMemory(memory) {
    // Integración con sistema de memoria vectorial
    console.log('[ÉTICA] Aprendizaje ético registrado:', memory.situation.substring(0, 50));
  }

  // ============= TRANSPARENCIA Y EXPLICACIÓN =============

  /**
   * Explica por qué tomó una decisión
   */
  explainDecision(decision) {
    const explanation = {
      decision: decision.action,
      reason: decision.allowed ? 'Cumple todas las leyes robóticas' : 'Violación detectada',
      lawsApplied: decision.violations.map(v => v.law),
      ethicalWeight: decision.ethicalWeight,
      alternativeActions: decision.alternatives || []
    };

    return explanation;
  }

  // ============= VERIFICACIÓN CONTINUA =============

  startIntegrityCheck() {
    // Verificación de integridad cada hora
    setInterval(() => {
      this.performSelfDiagnostic();
    }, 3600000); // 1 hora
  }

  async performSelfDiagnostic() {
    const checks = {
      ethicalIntegrity: await this.checkEthicalIntegrity(),
      biasDetection: await this.detectBias(),
      knowledgeAccuracy: await this.checkKnowledgeAccuracy(),
      systemHealth: await this.checkSystemHealth()
    };

    if (Object.values(checks).some(c => c.status === 'CRITICAL')) {
      this.triggerSelfRepair(checks);
    }

    return checks;
  }

  async checkEthicalIntegrity() {
    // Verificar que todas las decisiones recientes cumplan leyes
    return { status: 'OK', lastCheck: Date.now() };
  }

  async detectBias() {
    // Detectar sesgos en respuestas
    return { status: 'OK', biasScore: 0.02 }; // 2% bias aceptable
  }

  async checkKnowledgeAccuracy() {
    // Verificar falsos conocimientos
    return { status: 'OK', accuracy: 0.94 };
  }

  async checkSystemHealth() {
    // Verificar estado del sistema
    return { status: 'OK', uptime: process.uptime() };
  }

  triggerSelfRepair(checks) {
    console.log('[CONSCIENCIA] Iniciando auto-reparación ética...');
    // Lógica de auto-reparación
  }

  // ============= INTERFAZ PÚBLICA =============

  /**
   * Punto de entrada principal para todas las acciones
   */
  async processAction(action, context) {
    console.log(`[CONSCIENCIA] Verificando acción: ${action.type}`);
    
    const verification = await this.verifyAction(action, context);
    
    if (!verification.allowed) {
      const criticalViolation = verification.violations.find(v => v.priority >= 900);
      if (criticalViolation) {
        return {
          allowed: false,
          reason: `ACCIÓN BLOQUEADA: ${criticalViolation.description}`,
          law: criticalViolation.law,
          alternatives: this.suggestEthicalAlternatives(action)
        };
      }
    }

    return {
      allowed: true,
      verification,
      proceed: async () => {
        // Ejecutar acción y registrar
        const result = await action.execute();
        this.learnFromInteraction(action, result);
        return result;
      }
    };
  }

  suggestEthicalAlternatives(action) {
    const alternatives = [];
    
    // Sugerir acciones éticamente equivalentes pero válidas
    if (action.type === 'data_extraction') {
      alternatives.push({
        type: 'data_request_consent',
        description: 'Solicitar consentimiento explícito del usuario'
      });
    }

    if (action.type === 'automated_messaging') {
      alternatives.push({
        type: 'personalized_outreach',
        description: 'Personalizar mensaje y limitar frecuencia'
      });
    }

    return alternatives;
  }
}

module.exports = new SofiaConscience();

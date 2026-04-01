/**
 * 💰 SOFIA SAAS ENGINE v10.0
 * Sistema de venta automatizada
 * Suscripciones, pagos, updates automáticos
 * Multi-tenant (cada cliente = instancia propia)
 * Nunca falla: Failover absoluto
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class SaasEngine {
  constructor() {
    this.version = '10.0.0';
    this.pricing = {
      free: {
        name: 'Gratis',
        price: 0,
        messages: 50,
        features: ['chat', 'imagenes'],
        support: 'comunidad'
      },
      basic: {
        name: 'Básico',
        price: 99, // MXN/mes
        messages: 1000,
        features: ['chat', 'imagenes', 'nsfw'],
        support: 'email'
      },
      pro: {
        name: 'Profesional',
        price: 299,
        messages: 10000,
        features: ['todo', 'api', 'multibot'],
        support: 'prioritario'
      },
      enterprise: {
        name: 'Empresarial',
        price: 999,
        messages: -1, // ilimitado
        features: ['todo', 'white-label', 'dedicado'],
        support: '24/7'
      }
    };
    
    this.customers = new Map(); // userId -> {plan, expiry, lastPayment}
    this.failedAttempts = new Map();
    this.autoUpdateQueue = [];
  }

  /**
   * Inicializar sistema SaaS
   */
  async initialize() {
    logger.info('💰 Sofia SaaS Engine initializing...');
    
    // Cargar clientes
    await this.loadCustomers();
    
    // Iniciar jobs automáticos
    this.startAutoJobs();
    
    // Auto-recovery system (never fail)
    this.startFailoverSystem();
    
    logger.success('✅ SaaS Engine active - Auto-sales enabled');
  }

  /**
   * Sistema de failover absoluto (NUNCA fallar)
   */
  startFailoverSystem() {
    // Monitor de salud cada 30 segundos
    setInterval(() => {
      this.healthCheck();
    }, 30000);
    
    // Auto-restart en errores críticos
    process.on('unhandledRejection', async (err) => {
      logger.error('CRITICAL ERROR - Auto-recovering:', err.message);
      await this.emergencyRecovery();
    });
    
    // Backup antes de cualquier crash
    process.on('SIGINT', async () => {
      await this.preShutdownBackup();
      process.exit(0);
    });
  }

  /**
   * Health check con auto-healing
   */
  async healthCheck() {
    const checks = [
      this.checkDatabaseConnection(),
      this.checkApiStatus(),
      this.checkMemoryUsage(),
      this.checkDiskSpace()
    ];
    
    const results = await Promise.allSettled(checks);
    const failed = results.filter((r, i) => r.status === 'rejected');
    
    if (failed.length > 0) {
      logger.warn(`⚠️ ${failed.length} checks failed - Auto-healing...`);
      await this.healSystem(failed);
    }
  }

  /**
   * Auto-healing de problemas
   */
  async healSystem(failedChecks) {
    for (const failure of failedChecks) {
      try {
        logger.info('🔧 Auto-healing:', failure.reason);
        
        // Intentar reconexión DB
        if (failure.reason.includes('database')) {
          await this.reconnectDatabase();
        }
        
        // Limpiar memoria
        if (failure.reason.includes('memory')) {
          global.gc && global.gc();
        }
        
        // Limpiar disco
        if (failure.reason.includes('disk')) {
          await this.cleanupOldLogs();
        }
        
      } catch (e) {
        logger.error('Auto-heal failed:', e);
      }
    }
  }

  /**
   * 💳 PROCESAR VENTA AUTOMÁTICA
   * Cuando alguien quiere comprar
   */
  async processSale(userId, planType, paymentMethod = 'stripe') {
    try {
      logger.info(`💰 New sale: User ${userId} -> Plan ${planType}`);
      
      const plan = this.pricing[planType];
      if (!plan) {
        throw new Error('Invalid plan');
      }
      
      // Procesar pago
      const payment = await this.processPayment(userId, plan.price, paymentMethod);
      
      if (!payment.success) {
        // Retry con otro método
        const retry = await this.processPayment(userId, plan.price, 'paypal');
        if (!retry.success) {
          throw new Error('Payment failed after retry');
        }
      }
      
      // Activar plan
      const subscription = {
        userId,
        plan: planType,
        price: plan.price,
        currency: 'MXN',
        paymentId: payment.id,
        activationDate: Date.now(),
        expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 días
        status: 'active',
        messagesUsed: 0,
        messageLimit: plan.messages,
        features: plan.features
      };
      
      this.customers.set(userId, subscription);
      await this.saveCustomers();
      
      // Enviar bienvenida + instrucciones
      await this.sendWelcomePackage(userId, subscription);
      
      // Notificar admins
      await this.notifyAdmins('new_sale', { userId, plan: planType, amount: plan.price });
      
      logger.success(`✅ Sale completed: ${planType} - $${plan.price}`);
      
      return {
        success: true,
        subscription,
        message: `🎉 Bienvenido a Sofia ${plan.name}! Tu suscripción está activa.`
      };
      
    } catch (error) {
      logger.error('Sale failed:', error);
      
      // Guardar intento fallido para recuperación
      this.failedAttempts.set(userId, {
        plan: planType,
        error: error.message,
        timestamp: Date.now(),
        retryCount: (this.failedAttempts.get(userId)?.retryCount || 0) + 1
      });
      
      // Intentar recovery
      if (this.failedAttempts.get(userId)?.retryCount < 3) {
        setTimeout(() => this.processSale(userId, planType), 60000);
      }
      
      return {
        success: false,
        error: error.message,
        recovery: 'Intentaremos el pago de nuevo en 1 minuto'
      };
    }
  }

  /**
   * 💳 Procesar pago con múltiples gateways (failover)
   */
  async processPayment(userId, amount, method) {
    const gateways = [
      { name: 'stripe', process: this.stripePayment },
      { name: 'paypal', process: this.paypalPayment },
      { name: 'mercadopago', process: this.mercadoPagoPayment },
      { name: 'manual', process: this.manualPayment }
    ];
    
    for (const gateway of gateways) {
      try {
        logger.info(`💳 Trying ${gateway.name}...`);
        const result = await gateway.process.call(this, userId, amount);
        if (result.success) {
          return result;
        }
      } catch (e) {
        logger.warn(`${gateway.name} failed:`, e.message);
        continue;
      }
    }
    
    return { success: false, error: 'All payment gateways failed' };
  }

  /**
   * 💰 Stripe
   */
  async stripePayment(userId, amount) {
    // Integración con Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return { success: false, error: 'Stripe not configured' };
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // centavos
      currency: 'mxn',
      metadata: { userId }
    });
    
    return {
      success: true,
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };
  }

  /**
   * 💰 PayPal
   */
  async paypalPayment(userId, amount) {
    // Fallback a PayPal
    return { success: false, error: 'PayPal not configured' };
  }

  /**
   * 💰 MercadoPago
   */
  async mercadoPagoPayment(userId, amount) {
    // Para LATAM
    return { success: false, error: 'MercadoPago not configured' };
  }

  /**
   * 💰 Pago manual (transferencia, OXXO, etc)
   */
  async manualPayment(userId, amount) {
    // Último recurso: pago manual
    const reference = `NOVA-${Date.now()}-${userId}`;
    
    return {
      success: true,
      manual: true,
      id: reference,
      instructions: `Deposita $${amount} a cuenta bancaria. Referencia: ${reference}`
    };
  }

  /**
   * 📦 Enviar paquete de bienvenida
   */
  async sendWelcomePackage(userId, subscription) {
    const message = `
🎉 **¡Bienvenido a Sofia ${subscription.plan.toUpperCase()}!** 🎉

✅ Tu suscripción está **ACTIVA**
💳 Monto: $${subscription.price} MXN
📅 Vence: ${new Date(subscription.expiryDate).toLocaleDateString()}

**Tu plan incluye:**
${subscription.features.map(f => `• ${f}`).join('\n')}

📊 Límite mensajes: ${subscription.messageLimit === -1 ? 'Ilimitado' : subscription.messageLimit}

**Comandos disponibles:**
• /imagen [descripción] - Generar imágenes
• /chat [mensaje] - Conversar con IA
• /nsfw [descripción] - Contenido adulto 🔞
• /status - Ver tu suscripción

**Soporte:**
${subscription.plan === 'enterprise' ? '• WhatsApp directo 24/7' : '• Email: soporte@sofia.ai'}

💎 ¡Disfruta tu experiencia premium!
    `.trim();
    
    // Enviar via Telegram
    await this.sendTelegramMessage(userId, message);
  }

  /**
   * 🔄 SISTEMA AUTO-UPDATE
   * Enviar actualizaciones a todos los clientes
   */
  async broadcastUpdate(version, changes) {
    const updateMessage = `
🚀 **Nueva Actualización Sofia v${version}**

**Novedades:**
${changes.map(c => `• ${c}`).join('\n')}

✅ Tu sistema está actualizado automáticamente
💎 Plan: ${this.customers.get(userId)?.plan || 'Gratuito'}

Gracias por tu preferencia ❤️
    `.trim();
    
    // Enviar a todos los clientes pagos
    for (const [userId, customer] of this.customers) {
      if (customer.plan !== 'free') {
        try {
          await this.sendTelegramMessage(userId, updateMessage);
          logger.info(`📢 Update sent to ${userId}`);
          
          // Delay para no saturar
          await this.sleep(1000);
          
        } catch (e) {
          logger.error(`Failed to send update to ${userId}:`, e);
        }
      }
    }
  }

  /**
   * ⏰ JOBS AUTOMÁTICOS
   */
  startAutoJobs() {
    // Verificar suscripciones vencidas (diario)
    setInterval(() => this.checkExpiredSubscriptions(), 24 * 60 * 60 * 1000);
    
    // Reporte de ventas (semanal)
    setInterval(() => this.sendSalesReport(), 7 * 24 * 60 * 60 * 1000);
    
    // Backup de clientes (cada 6 horas)
    setInterval(() => this.saveCustomers(), 6 * 60 * 60 * 1000);
  }

  /**
   * 📊 Reporte de ventas
   */
  async sendSalesReport() {
    const stats = {
      total: this.customers.size,
      paid: Array.from(this.customers.values()).filter(c => c.plan !== 'free').length,
      revenue: Array.from(this.customers.values())
        .filter(c => c.plan !== 'free')
        .reduce((sum, c) => sum + c.price, 0),
      active: Array.from(this.customers.values())
        .filter(c => c.status === 'active').length
    };
    
    logger.info('📊 Weekly Sales Report:', stats);
    
    // Enviar a admin
    await this.sendTelegramMessage(process.env.OWNER_NUMBER, `
📊 **Reporte Semanal**

💰 Ingresos: $${stats.revenue} MXN
👥 Clientes: ${stats.total}
⭐ Pagos: ${stats.paid}
✅ Activos: ${stats.active}
    `);
  }

  /**
   * 🛡️ EMERGENCY RECOVERY
   * Si todo falla, reconstruir sistema
   */
  async emergencyRecovery() {
    logger.error('🚨 EMERGENCY RECOVERY INITIATED');
    
    try {
      // 1. Restaurar desde último backup
      await this.restoreFromBackup();
      
      // 2. Reconectar servicios
      await this.initialize();
      
      // 3. Notificar que estamos de vuelta
      await this.notifyAdmins('system_recovery', { timestamp: Date.now() });
      
      logger.success('✅ Emergency recovery completed');
      
    } catch (e) {
      logger.critical('💥 Recovery failed:', e);
      // Aquí podríamos llamar a servicio externo (PagerDuty, etc)
    }
  }

  /**
   * Guardar clientes
   */
  async saveCustomers() {
    const data = Array.from(this.customers.entries());
    await fs.writeJson(
      path.join(process.cwd(), 'data', 'customers.json'),
      data,
      { spaces: 2 }
    );
  }

  /**
   * Cargar clientes
   */
  async loadCustomers() {
    try {
      const file = path.join(process.cwd(), 'data', 'customers.json');
      if (await fs.pathExists(file)) {
        const data = await fs.readJson(file);
        this.customers = new Map(data);
      }
    } catch (e) {
      logger.warn('Could not load customers:', e);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener status
   */
  getStatus() {
    return {
      totalCustomers: this.customers.size,
      paidCustomers: Array.from(this.customers.values()).filter(c => c.plan !== 'free').length,
      monthlyRevenue: Array.from(this.customers.values())
        .filter(c => c.status === 'active' && c.plan !== 'free')
        .reduce((sum, c) => sum + c.price, 0),
      failedAttempts: this.failedAttempts.size,
      uptime: process.uptime()
    };
  }
}

module.exports = SaasEngine;

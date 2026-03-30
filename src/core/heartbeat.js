/**
 * Heartbeat System - Proactive AI behavior
 * THE KILLER FEATURE v2
 */

const logger = require('../utils/logger');

class HeartbeatManager {
  constructor(novaInstance) {
    this.nova = novaInstance;
    this.intervals = [];
    this.tasks = [];
    this.running = false;
  }

  initialize() {
    if (this.running) return;
    this.running = true;

    logger.info('❤️ Heartbeat initialized');

    // Check-ins cada 30 minutos
    this.addInterval(() => this.checkIn(), 30 * 60 * 1000, 'checkin');
    
    // Morning briefing a las 8am
    this.addCron('0 8 * * *', () => this.morningBriefing(), 'morning');
    
    // Evening summary a las 6pm
    this.addCron('0 18 * * *', () => this.eveningSummary(), 'evening');
    
    // Health check cada 5 minutos
    this.addInterval(() => this.healthCheck(), 5 * 60 * 1000, 'health');

    logger.success('✅ Heartbeat system running');
  }

  addInterval(fn, ms, name) {
    const interval = setInterval(fn, ms);
    this.intervals.push({ interval, name, ms });
    logger.debug(`Added interval: ${name} (${ms}ms)`);
  }

  addCron(cron, fn, name) {
    const cronFn = require('node-cron');
    const task = cronFn.schedule(cron, fn);
    this.tasks.push({ task, name });
    logger.debug(`Added cron: ${name} (${cron})`);
  }

  async checkIn() {
    logger.info('💓 Heartbeat: Proactive check-in');
    
    const owner = process.env.OWNER_NUMBER;
    if (!owner || !this.nova.adapters?.whatsapp?.connected) return;

    const prompts = [
      "Hey! Just checking in 👋 Anything I can help you with?",
      "Quick update: Still here, running smoothly ✨",
      "Nova here! Need anything? I've been monitoring things.",
      "Just a friendly ping! 💙"
    ];

    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    await this.nova.adapters.whatsapp.sendMessage(
      owner + '@s.whatsapp.net',
      randomPrompt
    );
  }

  async morningBriefing() {
    logger.info('🌅 Generating morning briefing');
    
    const owner = process.env.OWNER_NUMBER;
    if (!owner) return;

    try {
      // Generar resumen con AI
      const context = await this.nova.memory.getContext(owner, 50);
      const yesterdayEvents = await this.getYesterdayEvents();
      
      const briefing = `🌅 *Good Morning Briefing*

${yesterdayEvents.length > 0 ? '📊 Yesterday:\n' + yesterdayEvents.map(e => `• ${e}`).join('\n') : '📭 No recorded events'}

🤖 I'm here if you need:
• Quick info lookup
• Task scheduling
• File analysis
• Web browsing
• Code generation

What would you like to tackle today?`;

      await this.nova.adapters.whatsapp.sendMessage(
        owner + '@s.whatsapp.net',
        briefing
      );

    } catch (error) {
      logger.error('Morning briefing failed:', error);
    }
  }

  async eveningSummary() {
    logger.info('🌆 Evening summary');
    
    const owner = process.env.OWNER_NUMBER;
    if (!owner) return;

    const summary = `🌆 *Day Summary*

Your assistant ran today with:
• Multiple interactions
• Skill executions
• Task monitoring

Ready for tomorrow! 🚀

Need anything before you wind down?`;

    await this.nova.adapters.whatsapp.sendMessage(
      owner + '@s.whatsapp.net',
      summary
    );
  }

  async healthCheck() {
    const status = {
      whatsapp: this.nova.adapters?.whatsapp?.connected,
      memory: this.nova.memory?.initialized,
      ai: this.nova.ai?.initialized,
      browser: this.nova.browser?.initialized,
      scheduler: this.nova.scheduler?.initialized
    };

    const healthy = Object.values(status).every(Boolean);
    
    if (!healthy) {
      logger.warn('💔 Health check failed:', status);
      // Could trigger alerts here
    }
  }

  async getYesterdayEvents() {
    // Mock - would query actual events
    return [
      'System initialized',
      'Multiple conversations',
      'Skills executed',
      'Integrations active'
    ];
  }

  stop() {
    this.intervals.forEach(({ interval }) => clearInterval(interval));
    this.tasks.forEach(({ task }) => task.stop());
    this.running = false;
    logger.info('Heartbeat stopped');
  }
}

module.exports = HeartbeatManager;

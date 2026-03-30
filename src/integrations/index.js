/**
 * Unified Integrations Manager
 */

const logger = require('../utils/logger');

class IntegrationsManager {
  constructor() {
    this.integrations = {};
    this.activeCount = 0;
  }

  async initialize() {
    logger.info('Initializing integrations...');

    const integrations = [
      'notion', 'github', 'trello', 'openweather', 
      'gmail', 'calendar', 'reminders'
    ];

    for (const name of integrations) {
      try {
        const Integration = require(`./${name}`);
        const instance = new Integration();
        
        const success = await instance.initialize();
        
        this.integrations[name] = {
          instance,
          active: !!success,
          name: instance.name || name
        };

        if (success) this.activeCount++;

      } catch (error) {
        logger.debug(`Integration ${name} not loaded:`, error.message);
      }
    }

    logger.success(`✅ ${this.activeCount} integrations active`);
  }

  async run(name, action, args = {}) {
    const integration = this.integrations[name];
    
    if (!integration) {
      return { error: `Integration "${name}" not available` };
    }

    if (!integration.active) {
      return { error: `Integration "${name}" not configured` };
    }

    try {
      const result = await integration.instance[action](args);
      return { success: true, result };
    } catch (error) {
      logger.error(`${name}.${action} failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  notion(args) { return this.run('notion', 'query', args); }
  github(args) { return this.run('github', 'query', args); }
  trello(args) { return this.run('trello', 'query', args); }
  weather(args) { return this.run('openweather', 'query', args); }

  listActive() {
    return Object.entries(this.integrations)
      .filter(([_, i]) => i.active)
      .map(([key, i]) => i.name);
  }
}

module.exports = IntegrationsManager;

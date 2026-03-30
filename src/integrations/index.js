/**
 * Unified Integrations Manager
 * Incluye GitHub y HubbaX
 */

const logger = require('../utils/logger');

class IntegrationsManager {
  constructor() {
    this.integrations = {};
    this.activeCount = 0;
  }

  async initialize() {
    logger.info('Initializing integrations...');

    // Solo cargar integraciones que existen
    const availableIntegrations = [
      { name: 'github', file: './github' },
      { name: 'notion', file: './notion' },
      { name: 'hubbax', file: './hubbax' }
    ];

    for (const { name, file } of availableIntegrations) {
      try {
        const Integration = require(file);
        const instance = new Integration();
        
        const success = await instance.initialize();
        
        this.integrations[name] = {
          instance,
          active: !!success,
          name: instance.name || name
        };

        if (success) {
          this.activeCount++;
          logger.success(`✅ ${name} integration active`);
        }

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
  github(args) { return this.run('github', 'query', args); }
  notion(args) { return this.run('notion', 'query', args); }
  hubbax(action, ...args) { 
    if (this.integrations.hubbax?.instance) {
      return this.integrations.hubbax.instance[action](...args);
    }
    return { error: 'HubbaX not configured' };
  }

  listActive() {
    return Object.entries(this.integrations)
      .filter(([_, i]) => i.active)
      .map(([key, i]) => i.name);
  }

  get(name) {
    return this.integrations[name]?.instance;
  }
}

module.exports = IntegrationsManager;

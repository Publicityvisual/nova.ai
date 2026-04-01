/**
 * 🔌 PLUGIN SYSTEM v10.0
 * Extensibilidad total. Comunidad puede crear plugins.
 * Marketplace integrado. Hot-reload de plugins.
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

class PluginSystem {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.commands = new Map();
    this.middleware = [];
    this.pluginDir = path.join(process.cwd(), 'plugins');
    this.marketplaceUrl = 'https://api.sofia.ai/plugins';
  }

  async initialize() {
    logger.info('🔌 Plugin System initializing...');
    
    await fs.ensureDir(this.pluginDir);
    
    // Cargar plugins instalados
    await this.loadInstalledPlugins();
    
    // Registrar hooks del sistema
    this.registerSystemHooks();
    
    logger.success(`✅ Plugin System active with ${this.plugins.size} plugins`);
  }

  /**
   * 📥 Instalar plugin desde marketplace
   */
  async installPlugin(pluginId, version = 'latest') {
    try {
      logger.info(`🔌 Installing plugin ${pluginId}@${version}...`);
      
      // Descargar desde marketplace
      const pluginData = await this.fetchPluginFromMarketplace(pluginId, version);
      
      // Validar plugin
      if (!this.validatePlugin(pluginData)) {
        throw new Error('Invalid plugin format');
      }
      
      // Instalar archivos
      const installDir = path.join(this.pluginDir, pluginData.name);
      await fs.ensureDir(installDir);
      
      // Descargar y extraer
      await this.downloadPlugin(pluginData.downloadUrl, installDir);
      
      // Ejecutar instalación
      await this.runPluginInstall(installDir, pluginData);
      
      // Activar
      await this.activatePlugin(pluginData.name);
      
      logger.success(`✅ Plugin ${pluginData.name} installed`);
      
      return { success: true, plugin: pluginData };
      
    } catch (error) {
      logger.error(`Failed to install plugin ${pluginId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ⚡ Activar plugin
   */
  async activatePlugin(pluginName) {
    try {
      const pluginPath = path.join(this.pluginDir, pluginName);
      const manifest = await fs.readJson(path.join(pluginPath, 'plugin.json'));
      
      // Cargar código
      const PluginClass = require(path.join(pluginPath, manifest.main));
      const instance = new PluginClass();
      
      // Inicializar
      await instance.initialize(this.createAPI(pluginName));
      
      // Registrar
      this.plugins.set(pluginName, {
        name: pluginName,
        version: manifest.version,
        instance,
        manifest,
        active: true,
        loadedAt: Date.now()
      });
      
      // Registrar comandos
      if (manifest.commands) {
        manifest.commands.forEach(cmd => {
          this.registerCommand(cmd.name, instance[cmd.handler].bind(instance), pluginName);
        });
      }
      
      // Registrar hooks
      if (manifest.hooks) {
        manifest.hooks.forEach(hook => {
          this.registerHook(hook.event, instance[hook.handler].bind(instance), pluginName);
        });
      }
      
      logger.info(`🔌 Plugin ${pluginName} activated`);
      
    } catch (error) {
      logger.error(`Failed to activate plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * 🛑 Desactivar plugin
   */
  async deactivatePlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return;
    
    try {
      // Ejecutar cleanup
      if (plugin.instance.cleanup) {
        await plugin.instance.cleanup();
      }
      
      // Desregistrar comandos
      for (const [cmd, data] of this.commands) {
        if (data.plugin === pluginName) {
          this.commands.delete(cmd);
        }
      }
      
      // Desregistrar hooks
      for (const [event, handlers] of this.hooks) {
        this.hooks.set(
          event,
          handlers.filter(h => h.plugin !== pluginName)
        );
      }
      
      plugin.active = false;
      logger.info(`🛑 Plugin ${pluginName} deactivated`);
      
    } catch (error) {
      logger.error(`Error deactivating ${pluginName}:`, error);
    }
  }

  /**
   * 🎣 Ejecutar hooks (llamado por el core)
   */
  async executeHook(hookName, data) {
    const handlers = this.hooks.get(hookName) || [];
    
    let result = data;
    
    for (const handler of handlers.sort((a, b) => b.priority - a.priority)) {
      try {
        result = await handler.callback(result, this.createAPI(handler.plugin)) || result;
      } catch (error) {
        logger.error(`Hook ${hookName} failed in ${handler.plugin}:`, error);
      }
    }
    
    return result;
  }

  /**
   * 📟 Ejecutar comando de plugin
   */
  async executeCommand(commandName, ctx, args) {
    const cmd = this.commands.get(commandName);
    if (!cmd) {
      return { success: false, error: 'Command not found' };
    }
    
    try {
      return await cmd.handler(ctx, args);
    } catch (error) {
      logger.error(`Command ${commandName} failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔍 Listar plugins disponibles
   */
  async listAvailablePlugins() {
    // Mock - en producción fetchear de API
    return [
      {
        id: 'telegram-analytics',
        name: 'Telegram Analytics Pro',
        description: 'Métricas avanzadas para grupos de Telegram',
        version: '1.0.0',
        author: 'Sofia Team',
        downloads: 15420,
        rating: 4.8,
        price: 99
      },
      {
        id: 'image-enhancer',
        name: 'Image Enhancer AI',
        description: 'Mejora automática de imágenes generadas',
        version: '2.1.0',
        author: 'Community',
        downloads: 8932,
        rating: 4.5,
        price: 0
      },
      {
        id: 'nsfw-classifier',
        name: 'NSFW Content Classifier',
        description: 'Detecta y clasifica contenido adulto automáticamente',
        version: '1.5.0',
        author: 'Sofia Team',
        downloads: 23041,
        rating: 4.9,
        price: 149
      },
      {
        id: 'voice-synthesizer',
        name: 'Voice Synthesizer',
        description: 'Convierte texto a voz realista',
        version: '3.0.0',
        author: 'Community',
        downloads: 5621,
        rating: 4.3,
        price: 199
      },
      {
        id: 'chat-moderator',
        name: 'AI Chat Moderator',
        description: 'Moderación automática con ML',
        version: '1.2.0',
        author: 'Sofia Team',
        downloads: 12093,
        rating: 4.7,
        price: 79
      }
    ];
  }

  /**
   * 🏗️ Crear API para plugins
   */
  createAPI(pluginName) {
    return {
      // Logger
      logger: {
        info: (...args) => logger.info(`[${pluginName}]`, ...args),
        error: (...args) => logger.error(`[${pluginName}]`, ...args),
        warn: (...args) => logger.warn(`[${pluginName}]`, ...args)
      },
      
      // Database
      db: {
        get: async (key) => this.getPluginData(pluginName, key),
        set: async (key, value) => this.setPluginData(pluginName, key, value),
        delete: async (key) => this.deletePluginData(pluginName, key)
      },
      
      // Telegram Bot
      telegram: {
        sendMessage: async (chatId, text, options) => {
          // Aquí conectar con el bot principal
          logger.info(`[${pluginName}] Telegram message to ${chatId}`);
        },
        sendPhoto: async (chatId, photo, caption) => {
          logger.info(`[${pluginName}] Telegram photo to ${chatId}`);
        }
      },
      
      // Web API
      api: {
        get: async (url, options) => {
          const axios = require('axios');
          return axios.get(url, options);
        },
        post: async (url, data, options) => {
          const axios = require('axios');
          return axios.post(url, data, options);
        }
      },
      
      // Hooks
      registerHook: (event, handler) => {
        this.registerHook(event, handler, pluginName);
      },
      
      // Config
      config: {
        get: (key) => process.env[`${pluginName.toUpperCase()}_${key}`],
        set: (key, value) => {
          // En producción usar DB
        }
      }
    };
  }

  /**
   * 📦 Ejemplo de Plugin Base
   */
  getPluginTemplate() {
    return `class MyPlugin {
  constructor() {
    this.name = 'my-plugin';
    this.version = '1.0.0';
  }

  async initialize(api) {
    this.api = api;
    api.logger.info('Plugin initialized!');
    
    // Registrar hooks
    api.registerHook('message_received', this.onMessage.bind(this));
  }

  async onMessage(message) {
    // Procesar mensaje
    if (message.text === '/mycommand') {
      await this.api.telegram.sendMessage(
        message.chatId,
        '¡Hola desde mi plugin!'
      );
    }
    return message;
  }

  async cleanup() {
    this.api.logger.info('Plugin cleanup');
  }
}

module.exports = MyPlugin;`;
  }

  // Helpers
  async fetchPluginFromMarketplace(pluginId, version) {
    // Mock - implementar con fetch real
    return {
      name: pluginId,
      version,
      downloadUrl: `https://api.sofia.ai/plugins/${pluginId}@${version}.zip`
    };
  }

  validatePlugin(pluginData) {
    const required = ['name', 'version', 'main'];
    return required.every(field => field in pluginData);
  }

  async downloadPlugin(url, dest) {
    // Implementar con axios/descarga
    logger.info(`Downloading from ${url}...`);
    // await download(url, dest);
  }

  async runPluginInstall(dir, manifest) {
    // Instalar dependencias
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        await exec(`npm install ${dep}`, { cwd: dir });
      }
    }
  }

  async loadInstalledPlugins() {
    const dirs = await fs.readdir(this.pluginDir).catch(() => []);
    
    for (const dir of dirs) {
      if (dir.startsWith('.')) continue;
      
      try {
        await this.activatePlugin(dir);
      } catch (e) {
        logger.error(`Failed to load plugin ${dir}:`, e.message);
      }
    }
  }

  registerCommand(name, handler, plugin) {
    this.commands.set(name, { handler, plugin });
  }

  registerHook(event, callback, plugin, priority = 0) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push({ callback, plugin, priority });
  }

  registerSystemHooks() {
    // Hooks core del sistema
    this.hooks.set('message_received', []);
    this.hooks.set('message_sent', []);
    this.hooks.set('user_joined', []);
    this.hooks.set('user_left', []);
    this.hooks.set('payment_received', []);
    this.hooks.set('error_caught', []);
  }

  // Data storage para plugins
  async getPluginData(pluginName, key) {
    // Implementar con DB
    return null;
  }

  async setPluginData(pluginName, key, value) {
    // Implementar con DB
  }

  async deletePluginData(pluginName, key) {
    // Implementar con DB
  }

  async exec(command, options) {
    const { exec } = require('child_process');
    const util = require('util');
    return util.promisify(exec)(command, options);
  }

  getStatus() {
    return {
      installed: this.plugins.size,
      active: Array.from(this.plugins.values()).filter(p => p.active).length,
      commands: this.commands.size,
      hooks: Array.from(this.hooks.values()).reduce((sum, h) => sum + h.length, 0)
    };
  }
}

module.exports = PluginSystem;

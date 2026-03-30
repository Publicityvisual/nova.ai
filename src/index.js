/**
 * Nova AI - Asistente Autonomo ULTRA
 * Better than OpenClaw Edition 
 * 
 * Features:
 * - Multi-Platform (WhatsApp, Discord, Telegram, Slack)
 * - SQLite Vector Memory + Semantic Search
 * - AI Code Generation (Skills Auto-Creation)
 * - Proactive Heartbeat System
 * - Self-Improvement Capable
 * - 15+ AI Model Providers
 * - Real Integrations
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');

// Core
const logger = require('./utils/logger');
const { validateConfig } = require('./utils/config');

// Memory (NEW: Vector SQL)
const VectorMemory = require('./core/vector-memory');

// AI
const AIModels = require('./core/ai-models');
const AICodeGen = require('./utils/ai-code-gen');

// Tools
const Browser = require('./core/browser');
const System = require('./core/system');
const Scheduler = require('./core/scheduler');
const Heartbeat = require('./core/heartbeat');

// Adapters (Multi-platform)
const WhatsAppAdapter = require('./adapters/whatsapp');
const DiscordAdapter = require('./adapters/discord');
const TelegramAdapter = require('./adapters/telegram');
const SlackAdapter = require('./adapters/slack');

// Skills & Integrations
const SkillManager = require('./skills/manager');
const Integrations = require('./integrations');

class NovaUltra {
  constructor() {
    this.name = process.env.BOT_NAME || 'Nova';
    this.version = '2.0.0-ULTRA';
    this.adapters = {};
    this.core = {};
    this.initialized = false;
  }

  async initialize() {
    logger.info(`Starting ${this.name} v${this.version}`);
    logger.info('======================================');

    validateConfig();
    await this.setupDirectories();
    logger.info('Initializing core systems...');
    
    this.memory = new VectorMemory();
    await this.memory.initialize();

    this.ai = new AIModels();
    await this.ai.initialize();

    this.browser = new Browser();
    this.system = new System({ safeMode: false });
    this.scheduler = new Scheduler();
    this.scheduler.initialize();

    this.heartbeat = new Heartbeat(this);
    this.heartbeat.initialize();

    this.skills = new SkillManager();
    await this.skills.initialize();

    this.integrations = new Integrations();
    await this.integrations.initialize();

    logger.info('Connecting to platforms...');
    await this.initAdapters();

    this.initialized = true;
    this.printBanner();
    this.notifyAllPlatforms(`${this.name} ${this.version} is ONLINE`);
  }

  async setupDirectories() {
    const dirs = [
      './data', './data/sessions', './data/backups', 
      './data/uploads', './data/skills', './logs', './skills/generated'
    ];
    for (const dir of dirs) await fs.ensureDir(dir);
  }

  async initAdapters() {
    this.adapters.whatsapp = new WhatsAppAdapter({
      onMessage: (msg, meta) => this.handleMessage('whatsapp', msg, meta)
    });
    await this.adapters.whatsapp.initialize().catch(e => logger.warn('WhatsApp:', e.message));

    this.adapters.discord = new DiscordAdapter({
      onMessage: (msg, meta) => this.handleMessage('discord', msg, meta)
    });
    await this.adapters.discord.initialize().catch(e => logger.warn('Discord:', e.message));

    this.adapters.telegram = new TelegramAdapter({
      onMessage: (msg, meta) => this.handleMessage('telegram', msg, meta)
    });
    await this.adapters.telegram.initialize().catch(e => logger.warn('Telegram:', e.message));

    this.adapters.slack = new SlackAdapter({
      onMessage: (msg, meta) => this.handleMessage('slack', msg, meta)
    });
    await this.adapters.slack.initialize().catch(e => logger.warn('Slack:', e.message));

    const active = Object.entries(this.adapters)
      .filter(([_, a]) => a.connected)
      .map(([name]) => name);
    
    logger.success(`Active platforms: ${active.join(', ') || 'none'}`);
  }

  async handleMessage(platform, text, metadata) {
    const { from, userId } = metadata;
    if (!text) return;

    logger.info(`[${platform.toUpperCase()}] ${userId}: ${text.substring(0, 50)}...`);

    try {
      const context = await this.memory.getContext(userId, 20);
      const facts = await this.memory.recall(userId);
      const semantic = await this.memory.semanticSearch(userId, text, 3);

      const enrichedContext = {
        userId,
        platform,
        context,
        facts: Array.isArray(facts) ? facts : [facts],
        semantic,
        timestamp: new Date().toISOString()
      };

      if (text.startsWith('/')) {
        const response = await this.handleCommand(text, enrichedContext);
        await this.sendToPlatform(platform, from, response);
        return;
      }

      const aiResponse = await this.ai.process(text, {
        userId,
        context: enrichedContext,
        memory: this.memory
      });

      await this.memory.addMessage(userId, 'user', text);
      await this.memory.addMessage(userId, 'assistant', aiResponse);
      await this.sendToPlatform(platform, from, aiResponse);
      await this.memory.logEvent(userId, 'message', { platform, text: text.substring(0, 100) });

    } catch (error) {
      logger.error('Message error:', error);
      await this.sendToPlatform(platform, from, 'Error processing message');
    }
  }

  async handleCommand(text, ctx) {
    const parts = text.slice(1).split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    const userId = ctx.userId;

    switch(cmd) {
      case 'help':
        return this.getEpicHelp();
      
      case 'status':
        return this.getEpicStatus();
      
      case 'model':
        return args ? this.ai.setModel(args) : this.ai.listModels();
      
      case 'models':
        return this.ai.listModels();
      
      case 'remember': {
        const arr = args.split('|');
        const key = arr[0];
        const val = arr.slice(1).join('|');
        const ok = await this.memory.remember(userId, key, val);
        return ok ? `Remembered: ${key}` : 'Failed to remember';
      }
      
      case 'recall': {
        const results = await this.memory.recall(userId, args);
        return results 
          ? `${results.key}: ${results.value}`
          : 'Not found: ' + args;
      }
      
      case 'search': {
        const results = await this.memory.semanticSearch(userId, args, 5);
        return 'Search results:\n' + results.map((r, i) => `${i+1}. ${r.content.substring(0, 80)}...`).join('\n');
      }
      
      case 'facts': {
        const facts = await this.memory.recall(userId);
        return Array.isArray(facts) && facts.length 
          ? `Your facts:\n${facts.map(f => `- ${f.key}: ${f.value}`).join('\n')}`
          : 'No facts stored yet';
      }
      
      case 'skills':
        return this.skills.list();
      
      case 'skill': {
        const [name, ...skillArgs] = args.split(' ');
        const result = await this.skills.execute(name, skillArgs.join(' '), ctx);
        return result.message || JSON.stringify(result);
      }
      
      case 'createskill': {
        const result = await AICodeGen.generateSkill(args, userId);
        return result.success ? result.message : result.error;
      }
      
      case 'browse': {
        const r = await this.browser.navigate(args);
        return r.text ? r.text.substring(0, 1000) : JSON.stringify(r);
      }
      
      case 'screenshot': {
        const r = await this.browser.screenshot();
        return r.success ? 'Screenshot taken!' : r.error;
      }
      
      case 'cmd': {
        const r = await this.system.execute(args);
        return r.stdout || r.error;
      }
      
      case 'system': {
        const r = await this.system.info();
        return JSON.stringify(r.info, null, 2);
      }
      
      case 'schedule': {
        return this.scheduler.addTask(args).message;
      }
      
      case 'tasks': {
        return this.scheduler.listTasks();
      }
      
      case 'magic': {
        const understood = await this.ai.process(`Interpret: "${args}". Respond with command only.`, ctx);
        return `Magic translation: ${understood}`;
      }
      
      case 'notifyall': {
        this.notifyAllPlatforms(args || 'Notification from owner');
        return 'Notification sent to all platforms';
      }
      
      case 'nova':
        return `${this.name} ${this.version} at your service!`;
      
      default:
        return `Unknown: /${cmd}\nTry: /help, /createskill, /magic`;
    }
  }

  async sendToPlatform(platform, to, content) {
    const adapter = this.adapters[platform];
    if (!adapter || !adapter.connected) return;

    let formatted = content;
    if (platform === 'whatsapp') {
      formatted = content.replace(/\*\*/g, '*').replace(/_/g, '_').substring(0, 4000);
    } else if (platform === 'discord') {
      formatted = content.substring(0, 2000);
    }

    await adapter.sendMessage(to, formatted);
  }

  async notifyAllPlatforms(message) {
    const promises = Object.entries(this.adapters)
      .filter(([_, a]) => a.connected && a.sendMessage)
      .map(async ([name, adapter]) => {
        try {
          const owner = process.env.OWNER_NUMBER;
          if (owner && name === 'whatsapp') {
            await adapter.sendMessage(owner + '@s.whatsapp.net', message);
          }
        } catch (e) {}
      });

    await Promise.all(promises);
  }

  getEpicHelp() {
    return `${this.name} ${this.version} COMMANDS

AI:
/model [name] - Switch AI (venice, claude, gpt, groq)
/models - List available

Memory (Vector!):
/remember key|value - Save fact
/recall key - Get fact
/search query - Semantic search
/facts - List all

Skills (Auto!):
/createskill "check crypto prices" - AI generates skill!
/skills - List available
/skill name - Execute

Tools:
/browse url - Web scraping
/screenshot - Browser capture
/cmd command - Execute shell
/system - System info

Proactive:
/schedule task|cron|cmd
/tasks - List schedules

Magic:
/magic request - AI translates to command
/notifyall msg - Broadcast all platforms

Info:
/status, /help, /nova`;
  }

  getEpicStatus() {
    const active = Object.entries(this.adapters)
      .filter(([_, a]) => a.connected)
      .map(([name]) => name);

    return `${this.name} Status

Platforms: ${active.join(', ')}
Memory: ${this.memory.initialized ? 'VectorDB' : 'Offline'}
AI: ${this.ai.initialized ? this.ai.currentModel : 'Offline'}
Skills: ${this.skills.skills ? this.skills.skills.size : 0} loaded
Heartbeat: ${this.heartbeat.running ? 'Active' : 'Offline'}

Better than OpenClaw`;
  }

  printBanner() {
    console.log('');
    logger.success('======================================');
    logger.success(`     NOVA ULTRA v2.0.0 ONLINE         `);
    logger.success(`     Better than OpenClaw             `);
    logger.success('======================================');
    logger.success(`     AI Models: ${this.ai.availableModels ? this.ai.availableModels.length : 0}`);
    logger.success(`     Skills: ${this.skills.skills ? this.skills.skills.size : 0}`);
    logger.success('     Vector DB: YES');
    logger.success('     Auto-Skills: YES');
    logger.success('     Heartbeat: YES');
    logger.success('     Self-Improve: YES');
    logger.success('======================================');
    console.log('');
  }

  async shutdown() {
    logger.info('Shutting down...');
    this.heartbeat.stop();
    this.scheduler.stop();
    await this.memory.close();
    await this.browser.close();
    
    for (const [name, adapter] of Object.entries(this.adapters)) {
      if (adapter.disconnect) {
        await adapter.disconnect().catch(() => {});
      }
    }
    process.exit(0);
  }
}

const nova = new NovaUltra();

process.on('SIGINT', () => nova.shutdown());
process.on('SIGTERM', () => nova.shutdown());
process.on('uncaughtException', (e) => {
  logger.error('Uncaught:', e);
  nova.shutdown();
});

nova.initialize().catch(e => {
  logger.error('Failed to start:', e);
  process.exit(1);
});

module.exports = NovaUltra;

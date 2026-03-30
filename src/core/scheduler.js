/**
 * Task Scheduler - Cron-based automation
 */

const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class Scheduler {
  constructor(options = {}) {
    this.tasks = new Map();
    this.history = [];
    this.initialized = false;
    this.historyFile = options.historyFile || './data/scheduler-history.json';
  }

  async initialize() {
    await fs.ensureDir(path.dirname(this.historyFile));
    
    if (await fs.pathExists(this.historyFile)) {
      this.history = await fs.readJson(this.historyFile);
    }

    this.initialized = true;
    logger.info('Scheduler initialized');
  }

  addTask(config) {
    const [name, cronExpression, command] = config.split('|');

    if (!name || !cronExpression || !command) {
      return {
        success: false,
        error: 'Usage: /schedule [name]|[cron]|[command]\nExample: /schedule backup|0 2 * * *|npm run backup'
      };
    }

    // Validate cron expression
    if (!cron.validate(cronExpression.trim())) {
      return {
        success: false,
        error: 'Invalid cron expression. Format: minute hour day month weekday'
      };
    }

    // Stop existing task if any
    if (this.tasks.has(name.trim())) {
      this.tasks.get(name.trim()).stop();
    }

    // Create new task
    const task = cron.schedule(cronExpression.trim(), async () => {
      logger.info(`Executing scheduled task: ${name}`);
      
      const startTime = Date.now();
      
      try {
        // Execute the command (simplified - in real implementation, integrate with System class)
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        const { stdout, stderr } = await execPromise(command.trim(), { timeout: 300000 });
        
        this.logTask(name, true, stdout, stderr, Date.now() - startTime);
        
        // Notify owner if configured
        if (process.env.OWNER_NUMBER) {
          // Send notification via WhatsApp adapter
        }

      } catch (error) {
        logger.error(`Scheduled task ${name} failed:`, error);
        this.logTask(name, false, '', error.message, Date.now() - startTime);
      }
    });

    this.tasks.set(name.trim(), {
      name: name.trim(),
      cron: cronExpression.trim(),
      command: command.trim(),
      task,
      createdAt: new Date().toISOString(),
      runs: 0
    });

    return {
      success: true,
      message: `✅ Task "${name}" scheduled: ${cronExpression}`
    };
  }

  removeTask(name) {
    const task = this.tasks.get(name);
    
    if (!task) {
      return {
        success: false,
        error: `Task "${name}" not found`
      };
    }

    task.task.stop();
    this.tasks.delete(name);

    return {
      success: true,
      message: `🗑️ Task "${name}" cancelled`
    };
  }

  listTasks() {
    if (this.tasks.size === 0) {
      return 'No scheduled tasks. Use /schedule to create one.';
    }

    const list = Array.from(this.tasks.values()).map(t => 
      `• ${t.name}\n  Cron: ${t.cron}\n  Command: ${t.command.substring(0, 30)}...\n  Created: ${new Date(t.createdAt).toLocaleDateString()}`
    ).join('\n\n');

    return `📅 Scheduled Tasks (${this.tasks.size}):\n\n${list}`;
  }

  logTask(name, success, stdout, stderr, duration) {
    this.history.push({
      name,
      success,
      stdout: stdout?.substring(0, 1000),
      stderr: stderr?.substring(0, 1000),
      duration,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }

    // Save to file
    fs.writeJson(this.historyFile, this.history, { spaces: 2 }).catch(console.error);
  }

  getHistory(limit = 10) {
    return this.history.slice(-limit).map(h => ({
      ...h,
      status: h.success ? '✅' : '❌',
      time: new Date(h.timestamp).toLocaleString()
    }));
  }

  stop() {
    for (const [name, task] of this.tasks) {
      task.task.stop();
      logger.info(`Stopped task: ${name}`);
    }
    this.tasks.clear();
  }
}

module.exports = Scheduler;

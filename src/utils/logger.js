/**
 * Smart Logger with levels and formatting
 */

const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor() {
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
    this.currentLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = './logs/nova.log';
    this.colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[35m',
      success: '\x1b[32m',
      reset: '\x1b[0m'
    };
    this.init();
  }

  async init() {
    await fs.ensureDir(path.dirname(this.logFile));
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.currentLevel];
  }

  formatMessage(level, message, meta = '') {
    const timestamp = this.getTimestamp();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  async log(level, message, meta) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, meta);
    const color = this.colors[level] || this.colors.reset;
    
    // Console output
    console.log(`${color}${formatted}${this.colors.reset}`);
    
    // File output (no colors)
    await fs.appendFile(this.logFile, formatted + '\n').catch(() => {});
  }

  error(message, meta) { this.log('error', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
  info(message, meta) { this.log('info', message, meta); }
  debug(message, meta) { this.log('debug', message, meta); }
  success(message, meta) { 
    console.log(`${this.colors.success}${message}${this.colors.reset}`);
    this.log('info', message, meta);
  }

  // Pino-compatible interface for Baileys
  get pino() {
    return {
      level: 'silent',
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {},
      silent: true
    };
  }
}

module.exports = new Logger();

/**
 * Persistent Memory System
 * Stores user preferences, context, and history
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class Memory {
  constructor(options = {}) {
    this.filePath = options.filePath || process.env.MEMORY_PATH || './data/memory.json';
    this.data = {};
    this.initialized = false;
  }

  async initialize() {
    try {
      await fs.ensureDir(path.dirname(this.filePath));
      
      if (await fs.pathExists(this.filePath)) {
        this.data = await fs.readJson(this.filePath);
        logger.info(`Memory loaded: ${Object.keys(this.data).length} users`);
      } else {
        this.data = {};
        await this.save();
        logger.info('New memory file created');
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize memory:', error);
      this.data = {};
    }
  }

  async save() {
    try {
      await fs.writeJson(this.filePath, this.data, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to save memory:', error);
    }
  }

  // Get or create user memory
  getUserMemory(userId) {
    if (!this.data[userId]) {
      this.data[userId] = {
        id: userId,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        messages: [],
        preferences: {},
        facts: {},
        context: {}
      };
    }
    return this.data[userId];
  }

  // Add message to history
  async addMessage(userId, role, content) {
    const user = this.getUserMemory(userId);
    
    user.messages.push({
      role,
      content: content.substring(0, 10000), // Limit size
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 messages
    if (user.messages.length > 100) {
      user.messages = user.messages.slice(-100);
    }

    user.lastSeen = new Date().toISOString();
    await this.save();
  }

  // Get conversation context
  async getContext(userId, limit = 10) {
    const user = this.getUserMemory(userId);
    return user.messages.slice(-limit);
  }

  // Remember a fact/preference
  async remember(userId, input) {
    const [key, ...valueParts] = input.split('|');
    const value = valueParts.join('|').trim();

    if (!key || !value) {
      return 'Usage: /remember [key]|[value]\nExample: /remember favorite_color|blue';
    }

    const user = this.getUserMemory(userId);
    user.facts[key.trim().toLowerCase()] = {
      value,
      timestamp: new Date().toISOString()
    };

    await this.save();
    return `✅ Remembered: "${key.trim()}" = "${value}"`;
  }

  // Recall a fact
  async recall(userId, key) {
    const user = this.getUserMemory(userId);
    
    if (key) {
      // Specific key
      const fact = user.facts[key.toLowerCase()];
      if (fact) {
        return `"${key}": ${fact.value}`;
      }
      return `❌ I don't remember "${key}". Use /remember to save it.`;
    } else {
      // List all facts
      const facts = Object.entries(user.facts);
      if (facts.length === 0) {
        return 'No memories stored yet. Use /remember [key]|[value] to save information.';
      }

      const list = facts.map(([k, v]) => `• ${k}: ${v.value}`).join('\n');
      return `🧠 Your memories:\n${list}`;
    }
  }

  // Forget a fact
  async forget(userId, key) {
    const user = this.getUserMemory(userId);
    
    if (!key) {
      return 'Usage: /forget [key]';
    }

    if (user.facts[key.toLowerCase()]) {
      delete user.facts[key.toLowerCase()];
      await this.save();
      return `🗑️ Forgot: "${key}"`;
    }

    return `❌ I don't remember "${key}".`;
  }

  // Set preference
  async setPreference(userId, key, value) {
    const user = this.getUserMemory(userId);
    user.preferences[key] = value;
    await this.save();
  }

  // Get preference
  getPreference(userId, key, defaultValue = null) {
    const user = this.getUserMemory(userId);
    return user.preferences[key] || defaultValue;
  }

  // Search memories
  search(userId, query) {
    const user = this.getUserMemory(userId);
    const lowerQuery = query.toLowerCase();

    const results = Object.entries(user.facts).filter(([key, data]) => {
      return key.includes(lowerQuery) || 
             data.value.toLowerCase().includes(lowerQuery);
    });

    return results.map(([k, v]) => ({ key: k, ...v }));
  }

  // Get user stats
  getStats(userId) {
    const user = this.getUserMemory(userId);
    return {
      messageCount: user.messages.length,
      memoryCount: Object.keys(user.facts).length,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen
    };
  }

  // Clear user memory (privacy)
  async clear(userId) {
    if (this.data[userId]) {
      delete this.data[userId];
      await this.save();
      return '✅ All your data has been cleared.';
    }
    return 'No data found to clear.';
  }

  // Export all data (GDPR compliance)
  async export(userId) {
    const user = this.getUserMemory(userId);
    return JSON.stringify(user, null, 2);
  }
}

module.exports = Memory;

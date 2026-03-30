/**
 * Vector Memory with SQLite + Embedding Simulation
 * Semantic search and persistent context
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

class VectorMemory {
  constructor(options = {}) {
    this.dbPath = options.dbPath || process.env.DB_PATH || './data/nova.db';
    this.initialized = false;
    this.cache = new Map();
  }

  async initialize() {
    try {
      await fs.ensureDir(path.dirname(this.dbPath));
      
      this.db = new sqlite3.Database(this.dbPath);
      
      // Create tables
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
          preferences TEXT DEFAULT '{}',
          context_summary TEXT
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          embedding TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS facts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          category TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, key),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          type TEXT NOT NULL,
          data TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Create indexes
      await this.run('CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_facts_user ON facts(user_id)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_events_time ON events(timestamp)');

      // Full-text search virtual table
      await this.run(`
        CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
          content,
          user_id UNINDEXED,
          content_rowid = id
        )
      `);

      // Triggers to sync FTS
      await this.run(`
        CREATE TRIGGER IF NOT EXISTS messages_fts_insert AFTER INSERT ON messages BEGIN
          INSERT INTO messages_fts(rowid, content, user_id) VALUES (new.id, new.content, new.user_id);
        END
      `);

      this.initialized = true;
      logger.success('✅ Vector memory initialized (SQLite + FTS)');

      // Start maintenance timer
      this.startMaintenance();

    } catch (error) {
      logger.error('Failed to initialize vector memory:', error);
      throw error;
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getOrCreateUser(userId) {
    const user = await this.get('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      await this.run(
        'INSERT INTO users (id, preferences) VALUES (?, ?)',
        [userId, JSON.stringify({})]
      );
      return { id: userId, preferences: {}, isNew: true };
    }

    await this.run(
      'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    return {
      ...user,
      preferences: JSON.parse(user.preferences || '{}')
    };
  }

  async addMessage(userId, role, content) {
    try {
      // Ensure user exists
      await this.getOrCreateUser(userId);

      // Simple word-based "embedding" (tokenization simulation)
      const embedding = this.simpleEmbed(content);

      const result = await this.run(
        `INSERT INTO messages (user_id, role, content, embedding) VALUES (?, ?, ?, ?)`,
        [userId, role, content.substring(0, 10000), JSON.stringify(embedding)]
      );

      // Cache recent messages
      const cacheKey = `msgs:${userId}`;
      let cached = this.cache.get(cacheKey) || [];
      cached.push({ id: result.lastID, role, content, timestamp: new Date().toISOString() });
      if (cached.length > 50) cached = cached.slice(-50);
      this.cache.set(cacheKey, cached);

      logger.debug(`Message added for ${userId}`);
      return result.lastID;

    } catch (error) {
      logger.error('Failed to add message:', error);
      throw error;
    }
  }

  // Simple embedding using word frequency
  simpleEmbed(text) {
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.stopwords.has(w));
    
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    
    // Sort by frequency and return top 20
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  async getContext(userId, limit = 10) {
    try {
      // Check cache first
      const cacheKey = `msgs:${userId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.length > limit) {
        return cached.slice(-limit);
      }

      // Query database
      const messages = await this.all(
        `SELECT role, content, timestamp FROM messages 
         WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`,
        [userId, limit]
      );

      return messages.reverse();

    } catch (error) {
      logger.error('Failed to get context:', error);
      return [];
    }
  }

  // Semantic search using word overlap
  async semanticSearch(userId, query, limit = 5) {
    try {
      const queryEmbed = this.simpleEmbed(query);
      
      const messages = await this.all(
        `SELECT id, role, content, timestamp FROM messages 
         WHERE user_id = ? AND role = 'assistant'
         ORDER BY timestamp DESC LIMIT 100`,
        [userId]
      );

      // Score by word overlap
      const scored = messages.map(msg => {
        const msgEmbed = this.simpleEmbed(msg.content);
        const overlap = msgEmbed.filter(w => queryEmbed.includes(w)).length;
        const score = overlap / Math.max(queryEmbed.length, 1);
        return { ...msg, score };
      });

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Semantic search failed:', error);
      return [];
    }
  }

  // Full-text search
  async search(userId, query) {
    try {
      const results = await this.all(
        `SELECT m.role, m.content, m.timestamp 
         FROM messages_fts fts
         JOIN messages m ON fts.rowid = m.id
         WHERE fts.user_id = ? AND messages_fts MATCH ?
         ORDER BY rank LIMIT 10`,
        [userId, query]
      );
      return results;
    } catch (error) {
      logger.error('FTS search failed:', error);
      return [];
    }
  }

  async remember(userId, key, value, category = 'general') {
    try {
      await this.getOrCreateUser(userId);
      
      await this.run(
        `INSERT OR REPLACE INTO facts (user_id, key, value, category) 
         VALUES (?, ?, ?, ?)`,
        [userId, key.toLowerCase(), value, category]
      );

      logger.info(`Remembered: ${key} for ${userId}`);
      return true;

    } catch (error) {
      logger.error('Failed to remember:', error);
      return false;
    }
  }

  async recall(userId, key) {
    try {
      if (key) {
        const fact = await this.get(
          `SELECT * FROM facts WHERE user_id = ? AND key = ?`,
          [userId, key.toLowerCase()]
        );
        return fact ? { key: fact.key, value: fact.value, category: fact.category } : null;
      } else {
        const facts = await this.all(
          `SELECT key, value, category FROM facts WHERE user_id = ?`,
          [userId]
        );
        return facts;
      }
    } catch (error) {
      logger.error('Failed to recall:', error);
      return null;
    }
  }

  async forget(userId, key) {
    try {
      await this.run(
        'DELETE FROM facts WHERE user_id = ? AND key = ?',
        [userId, key.toLowerCase()]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async logEvent(userId, type, data) {
    try {
      await this.run(
        'INSERT INTO events (user_id, type, data) VALUES (?, ?, ?)',
        [userId, type, JSON.stringify(data)]
      );
    } catch (error) {
      logger.error('Failed to log event:', error);
    }
  }

  async getUserStats(userId) {
    const stats = await this.get(
      `SELECT COUNT(*) as message_count FROM messages WHERE user_id = ?`,
      [userId]
    );
    
    const facts = await this.get(
      `SELECT COUNT(*) as fact_count FROM facts WHERE user_id = ?`,
      [userId]
    );

    return {
      messages: stats?.message_count || 0,
      facts: facts?.fact_count || 0,
      firstSeen: (await this.get('SELECT created_at FROM users WHERE id = ?', [userId]))?.created_at
    };
  }

  async clearUser(userId) {
    try {
      const tables = ['messages', 'facts', 'events'];
      for (const table of tables) {
        await this.run(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
      }
      await this.run('DELETE FROM users WHERE id = ?', [userId]);
      this.cache.delete(`msgs:${userId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  startMaintenance() {
    // Clear old cache every hour
    setInterval(() => {
      const keys = Array.from(this.cache.keys());
      if (keys.length > 100) {
        const toDelete = keys.slice(0, keys.length - 50);
        toDelete.forEach(k => this.cache.delete(k));
        logger.debug('Cache maintenance: cleared', toDelete.length, 'entries');
      }
    }, 3600000);
  }

  get stopwords() {
    return new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'el', 'la', 'de', 'en', 'y', 'que', 'es', 'un', 'a']);
  }

  async close() {
    if (this.db) {
      this.db.close();
      logger.info('Database connection closed');
    }
  }
}

module.exports = VectorMemory;

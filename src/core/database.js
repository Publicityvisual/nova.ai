/**
 * 💾 DATABASE SYSTEM v2.0
 * SQLite persistente - Reemplaza archivos JSON
 * ACID compliant, queries SQL, backup automático
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'nova.db');
    this.db = null;
    this.connected = false;
  }

  async initialize() {
    try {
      // Asegurar directorio
      await fs.ensureDir(path.dirname(this.dbPath));
      
      // Conectar
      this.db = new sqlite3.Database(this.dbPath);
      this.connected = true;
      
      // Habilitar WAL mode para mejor performance
      await this.run('PRAGMA journal_mode = WAL');
      await this.run('PRAGMA foreign_keys = ON');
      
      // Crear tablas
      await this.createTables();
      
      logger.success('✅ Database initialized: SQLite at ' + this.dbPath);
      
      return true;
    } catch (error) {
      logger.error('Database initialization failed:', error.message);
      throw error;
    }
  }

  async createTables() {
    // Tabla de usuarios
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        platform TEXT NOT NULL, -- telegram, whatsapp, discord
        username TEXT,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0,
        is_admin BOOLEAN DEFAULT 0,
        settings TEXT -- JSON con preferencias
      )
    `);

    // Tabla de conversaciones
    await this.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        message_text TEXT NOT NULL,
        is_from_bot BOOLEAN DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        has_image BOOLEAN DEFAULT 0,
        has_audio BOOLEAN DEFAULT 0,
        metadata TEXT -- JSON con extras
      )
    `);

    // Tabla de sesiones
    await this.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        data TEXT -- JSON con datos de sesión
      )
    `);

    // Tabla de comandos/stats
    await this.run(`
      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        command TEXT NOT NULL,
        user_id TEXT NOT NULL,
        success BOOLEAN DEFAULT 1,
        duration_ms INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para performance
    await this.run('CREATE INDEX IF NOT EXISTS idx_user_id ON conversations(user_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_timestamp ON conversations(timestamp)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_session_id ON sessions(session_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_stats_timestamp ON stats(timestamp)');

    logger.info('📊 Database tables created');
  }

  // Métodos SQL wrapper
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
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

  // Métodos de usuario
  async getOrCreateUser(userId, platform, username = null) {
    let user = await this.get(
      'SELECT * FROM users WHERE user_id = ? AND platform = ?',
      [userId, platform]
    );

    if (!user) {
      await this.run(
        'INSERT INTO users (user_id, platform, username) VALUES (?, ?, ?)',
        [userId, platform, username]
      );
      user = await this.get(
        'SELECT * FROM users WHERE user_id = ? AND platform = ?',
        [userId, platform]
      );
    } else {
      // Actualizar last_seen
      await this.run(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP, message_count = message_count + 1 WHERE id = ?',
        [user.id]
      );
    }

    return user;
  }

  // Guardar mensaje
  async saveMessage(userId, messageText, isFromBot = false, metadata = {}) {
    return await this.run(
      'INSERT INTO conversations (user_id, message_text, is_from_bot, metadata) VALUES (?, ?, ?, ?)',
      [userId, messageText, isFromBot, JSON.stringify(metadata)]
    );
  }

  // Obtener historial de conversación
  async getConversationHistory(userId, limit = 50) {
    return await this.all(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );
  }

  // Estadísticas
  async getStats(timeRange = '24 hours') {
    const messages = await this.get(
      `SELECT COUNT(*) as count FROM conversations WHERE timestamp > datetime('now', '-${timeRange}')`
    );

    const users = await this.get(
      `SELECT COUNT(DISTINCT user_id) as count FROM conversations WHERE timestamp > datetime('now', '-${timeRange}')`
    );

    const commands = await this.all(
      `SELECT command, COUNT(*) as count FROM stats WHERE timestamp > datetime('now', '-${timeRange}') GROUP BY command ORDER BY count DESC LIMIT 10`
    );

    return {
      totalMessages: messages?.count || 0,
      uniqueUsers: users?.count || 0,
      popularCommands: commands
    };
  }

  // Backup de base de datos
  async backup() {
    const backupPath = `${this.dbPath}.backup.${Date.now()}`;
    await this.run(`VACUUM INTO '${backupPath}'`);
    return backupPath;
  }

  // Cerrar conexión
  close() {
    if (this.db) {
      this.db.close();
      this.connected = false;
      logger.info('Database connection closed');
    }
  }

  getStatus() {
    return {
      connected: this.connected,
      path: this.dbPath,
      exists: fs.existsSync(this.dbPath)
    };
  }
}

// Singleton
module.exports = new Database();

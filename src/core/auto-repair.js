/**
 * 🔧 AUTO-REPAIR SYSTEM v3.0
 * Monitoreo continuo y auto-corrección de errores
 * Sistema siempre activo, sin intervención humana
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const logger = require('../utils/logger');

class AutoRepairSystem {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.repairAttempts = new Map();
    this.maxAttempts = 3;
    this.essentialFiles = [
      'src/index-enterprise.js',
      'src/core/anti-ban-system.js',
      'src/adapters/whatsapp.js',
      'src/adapters/telegram-bot.js'
    ];
    this.repairStrategies = new Map();
    this.initStrategies();
  }

  /**
   * Inicializar estrategias de reparación
   */
  initStrategies() {
    // Estrategia 1: Dependencias corruptas
    this.repairStrategies.set('MODULE_NOT_FOUND', async (error) => {
      logger.info('🔧 Repairing: Missing dependencies...');
      try {
        await execAsync('npm install', { cwd: process.cwd(), timeout: 120000 });
        return { success: true, action: 'npm_install' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    // Estrategia 2: Sesión corrupta de WhatsApp
    this.repairStrategies.set('SESSION_CORRUPTED', async () => {
      logger.info('🔧 Repairing: Corrupted WhatsApp session...');
      try {
        const sessionPath = './data/sessions';
        if (await fs.pathExists(sessionPath)) {
          // Backup antes de limpiar
          const backupPath = `./data/sessions_backup_${Date.now()}`;
          await fs.copy(sessionPath, backupPath);
          // Eliminar solo credenciales, mantener session ID
          await fs.remove(path.join(sessionPath, 'creds.json'));
          return { success: true, action: 'clear_creds', backup: backupPath };
        }
        return { success: true, action: 'no_session_found' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    // Estrategia 3: Node_modules corrupto
    this.repairStrategies.set('CORRUPT_NODE_MODULES', async () => {
      logger.info('🔧 Repairing: Corrupt node_modules...');
      try {
        await fs.remove('./node_modules');
        await execAsync('npm install', { cwd: process.cwd(), timeout: 180000 });
        return { success: true, action: 'reinstall_modules' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    // Estrategia 4: Permisos
    this.repairStrategies.set('EACCES', async () => {
      logger.info('🔧 Repairing: Permission issues...');
      try {
        if (process.platform !== 'win32') {
          await execAsync('chmod -R 755 ./data', { cwd: process.cwd() });
        }
        return { success: true, action: 'fix_permissions' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
  }

  /**
   * Iniciar monitoreo continuo
   */
  async start() {
    if (this.isRunning) return;
    
    logger.info('🔧 Auto-Repair System starting...');
    this.isRunning = true;

    // Verificación inicial
    await this.runDiagnostics();

    // Monitoreo cada 5 minutos
    this.checkInterval = setInterval(() => {
      this.runDiagnostics().catch(e => {
        logger.error('Diagnostic error:', e.message);
      });
    }, 300000);

    // Monitoreo de eventos de crash
    process.on('uncaughtException', this.handleCrash.bind(this));
    process.on('unhandledRejection', this.handleRejection.bind(this));

    logger.success('🔧 Auto-Repair System active - 24/7 protection');
  }

  /**
   * Ejecutar diagnósticos completos
   */
  async runDiagnostics() {
    const startTime = Date.now();
    const issues = [];

    // 1. Verificar archivos esenciales
    for (const file of this.essentialFiles) {
      if (!await fs.pathExists(file)) {
        issues.push({ type: 'MISSING_FILE', file, severity: 'critical' });
      }
    }

    // 2. Verificar permisos de data/
    try {
      await fs.access('./data', fs.constants.W_OK);
    } catch {
      issues.push({ type: 'EACCES', path: './data', severity: 'high' });
    }

    // 3. Verificar espacio en disco
    const stats = await this.getDiskSpace();
    if (stats.freeGB < 1) {
      issues.push({ type: 'LOW_DISK_SPACE', free: stats.freeGB, severity: 'high' });
    }

    // 4. Verificar dependencias
    try {
      require.resolve('@whiskeysockets/baileys');
    } catch {
      issues.push({ type: 'MODULE_NOT_FOUND', module: 'baileys', severity: 'critical' });
    }

    // 5. Verificar sesiones corruptas
    const sessionsPath = './data/sessions';
    if (await fs.pathExists(sessionsPath)) {
      const sessions = await fs.readdir(sessionsPath);
      for (const session of sessions) {
        const credsPath = path.join(sessionsPath, session, 'creds.json');
        if (await fs.pathExists(credsPath)) {
          try {
            const content = await fs.readFile(credsPath, 'utf8');
            JSON.parse(content); // Verificar JSON válido
          } catch {
            issues.push({ type: 'SESSION_CORRUPTED', session, severity: 'medium' });
          }
        }
      }
    }

    // Reparar issues encontrados
    for (const issue of issues) {
      await this.repairIssue(issue);
    }

    const duration = Date.now() - startTime;
    if (issues.length === 0) {
      logger.debug(`✅ Diagnostics passed (${duration}ms)`);
    } else {
      logger.info(`🔧 Diagnostics completed: ${issues.length} issues found, ${duration}ms`);
    }

    return issues;
  }

  /**
   * Reparar un issue específico
   */
  async repairIssue(issue) {
    const key = `${issue.type}_${issue.file || issue.session || ''}`;
    const attempts = this.repairAttempts.get(key) || 0;

    if (attempts >= this.maxAttempts) {
      logger.error(`❌ Max repair attempts reached for ${issue.type}`);
      return { success: false, reason: 'max_attempts_exceeded' };
    }

    this.repairAttempts.set(key, attempts + 1);

    const strategy = this.repairStrategies.get(issue.type);
    if (strategy) {
      logger.info(`🔧 Attempting repair: ${issue.type} (attempt ${attempts + 1}/${this.maxAttempts})`);
      const result = await strategy(issue);
      
      if (result.success) {
        logger.success(`✅ Repaired: ${issue.type} - ${result.action}`);
        this.repairAttempts.delete(key);
        return result;
      } else {
        logger.warn(`⚠️ Repair failed: ${result.error}`);
        return result;
      }
    }

    return { success: false, reason: 'no_strategy_available' };
  }

  /**
   * Manejar crash no controlado
   */
  handleCrash(error) {
    logger.error('💥 CRASH DETECTED:', error.message);
    logger.info('🔧 Attempting emergency repair...');

    // Intentar reparar según tipo de error
    if (error.code === 'MODULE_NOT_FOUND') {
      this.repairStrategies.get('MODULE_NOT_FOUND')(error)
        .then(() => process.exit(1)) // Forzar restart
        .catch(() => process.exit(1));
    } else if (error.message?.includes('corrupt') || error.message?.includes('session')) {
      this.repairStrategies.get('SESSION_CORRUPTED')()
        .then(() => process.exit(1))
        .catch(() => process.exit(1));
    } else {
      process.exit(1);
    }
  }

  /**
   * Manejar promesa rechazada no controlada
   */
  handleRejection(reason, promise) {
    logger.warn('⚠️ Unhandled Rejection:', reason);
    // No crítico, solo log
  }

  /**
   * Obtener espacio en disco
   */
  async getDiskSpace() {
    try {
      const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption', 
        { cwd: process.cwd() });
      const lines = stdout.trim().split('\n').slice(1);
      let free = 0, size = 0;
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          free += parseInt(parts[1]) || 0;
          size += parseInt(parts[2]) || 0;
        }
      }
      
      return {
        freeGB: Math.floor(free / (1024 ** 3)),
        sizeGB: Math.floor(size / (1024 ** 3)),
        usedPercent: size ? Math.floor((size - free) / size * 100) : 0
      };
    } catch {
      return { freeGB: 999, sizeGB: 999, usedPercent: 0 }; // Asumir OK
    }
  }

  /**
   * Actualizar sistema desde Git
   */
  async selfUpdate() {
    logger.info('🔄 Checking for updates...');
    try {
      const { stdout } = await execAsync('git pull', { cwd: process.cwd(), timeout: 60000 });
      if (stdout.includes('Already up to date')) {
        return { updated: false, message: 'Already up to date' };
      }
      if (stdout.includes('changed') || stdout.includes('Updating')) {
        logger.success('✅ System updated from git');
        await execAsync('npm install', { cwd: process.cwd(), timeout: 120000 });
        return { updated: true, message: 'Updated and dependencies installed' };
      }
      return { updated: false, message: stdout };
    } catch (e) {
      return { updated: false, error: e.message };
    }
  }

  /**
   * Obtener estado
   */
  getStatus() {
    return {
      active: this.isRunning,
      pendingRepairs: this.repairAttempts.size,
      strategies: this.repairStrategies.size,
      essentialFiles: this.essentialFiles.length
    };
  }

  /**
   * Detener monitoreo
   */
  stop() {
    this.isRunning = false;
    clearInterval(this.checkInterval);
    logger.info('🔧 Auto-Repair System stopped');
  }
}

// Singleton
module.exports = new AutoRepairSystem();

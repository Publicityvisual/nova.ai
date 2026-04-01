/**
 * 🚀 ALWAYS-ON SYSTEM
 * Mantiene los bots ejecutándose 24/7/365
 * Reinicio automático, monitoreo de salud, failover
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const net = require('net');

const LOG_FILE = './logs/always-on.log';
const PID_FILE = './data/always-on.pid';
const RESTART_DELAY = 5000; // 5 segundos entre restarts
const MAX_RESTARTS = 10; // Max restarts en 1 hora

class AlwaysOnSystem {
  constructor() {
    this.processes = new Map();
    this.restartCounts = new Map();
    this.lastHourReset = Date.now();
    this.isRunning = false;
    this.watching = [
      {
        name: 'Nova Enterprise',
        script: 'src/index-enterprise.js',
        instances: 1,
        env: { NODE_ENV: 'production', MODE: 'enterprise' }
      },
      {
        name: 'Nova OpenClaw',
        script: 'NOVA-OPENCLAW.js',
        instances: 0, // 0 = deshabilitado inicialmente, activar con argumento
        env: { NODE_ENV: 'production', MODE: 'openclaw' }
      }
    ];
  }

  /**
   * Iniciar sistema always-on
   */
  async start() {
    this.isRunning = true;
    console.log('[ALWAYS-ON] 🚀 Sistema Always-On iniciando...');
    
    // Guardar PID
    fs.writeFileSync(PID_FILE, process.pid.toString());
    
    // Iniciar cada proceso
    for (const config of this.watching) {
      if (config.instances > 0 || process.argv.includes('--all')) {
        this.startProcess(config);
      }
    }
    
    // Health check cada 30 segundos
    setInterval(() => this.healthCheck(), 30000);
    
    // Reset de contadores cada hora
    setInterval(() => this.resetCounters(), 3600000);
    
    console.log('[ALWAYS-ON] ✅ Sistema activo - protección 24/7');
    
    // Mantener proceso vivo
    process.stdin.resume();
  }

  /**
   * Iniciar un proceso específico
   */
  startProcess(config) {
    if (!this.isRunning) return;
    
    const name = config.name;
    
    // Verificar si ya corre
    if (this.processes.has(name)) {
      const existing = this.processes.get(name);
      if (!existing.killed) {
        console.log(`[ALWAYS-ON] ⚠️ ${name} ya está corriendo`);
        return;
      }
    }
    
    // Verificar límite de restarts
    const restarts = this.restartCounts.get(name) || 0;
    if (restarts >= MAX_RESTARTS) {
      console.error(`[ALWAYS-ON] ❌ ${name} alcanzó máximo de restarts (${MAX_RESTARTS})`);
      return;
    }
    
    console.log(`[ALWAYS-ON] 🔄 Iniciando ${name}...`);
    
    const proc = spawn('node', [config.script], {
      env: { ...process.env, ...config.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Logging
    proc.stdout.on('data', (data) => {
      this.logOutput(name, 'INFO', data.toString());
    });
    
    proc.stderr.on('data', (data) => {
      this.logOutput(name, 'ERROR', data.toString());
    });
    
    // Manejar salida
    proc.on('exit', (code, signal) => {
      console.log(`[ALWAYS-ON] 💥 ${name} detenido (code: ${code}, signal: ${signal})`);
      this.processes.delete(name);
      
      // Incrementar contador
      this.restartCounts.set(name, (this.restartCounts.get(name) || 0) + 1);
      
      // Reiniciar si no fue matado intencionalmente
      if (this.isRunning && signal !== 'SIGTERM') {
        console.log(`[ALWAYS-ON] 🔄 Reiniciando ${name} en ${RESTART_DELAY/1000}s...`);
        setTimeout(() => this.startProcess(config), RESTART_DELAY);
      }
    });
    
    this.processes.set(name, proc);
    console.log(`[ALWAYS-ON] ✅ ${name} iniciado (PID: ${proc.pid})`);
  }

  /**
   * Verificar salud de procesos
   */
  healthCheck() {
    for (const [name, proc] of this.processes) {
      if (proc.killed) {
        console.log(`[ALWAYS-ON] ⚠️ ${name} detectado como killed, reiniciando...`);
        const config = this.watching.find(w => w.name === name);
        if (config) {
          this.startProcess(config);
        }
      }
    }
    
    // Log de estado
    const active = this.processes.size;
    console.log(`[ALWAYS-ON] 💓 Health Check: ${active} procesos activos`);
  }

  /**
   * Reset de contadores
   */
  resetCounters() {
    if (Date.now() - this.lastHourReset >= 3600000) {
      this.restartCounts.clear();
      this.lastHourReset = Date.now();
      console.log('[ALWAYS-ON] 🔄 Contadores de restart reseteados');
    }
  }

  /**
   * Log de salida
   */
  logOutput(processName, level, message) {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] [${processName}] [${level}] ${message.trim()}\n`;
    
    // Console
    if (level === 'ERROR') {
      console.error(log);
    }
    
    // Archivo
    fs.appendFileSync(LOG_FILE, log).catch(() => {});
  }

  /**
   * Detener todos los procesos
   */
  stop() {
    console.log('[ALWAYS-ON] 🛑 Deteniendo Always-On System...');
    this.isRunning = false;
    
    for (const [name, proc] of this.processes) {
      console.log(`[ALWAYS-ON] 👋 Deteniendo ${name}...`);
      proc.kill('SIGTERM');
    }
    
    // Limpiar PID file
    try {
      fs.unlinkSync(PID_FILE);
    } catch {}
    
    console.log('[ALWAYS-ON] ✅ Todos los procesos detenidos');
    process.exit(0);
  }

  /**
   * Obtener estado
   */
  getStatus() {
    return {
      running: this.isRunning,
      processes: Array.from(this.processes.keys()),
      restarts: Object.fromEntries(this.restartCounts)
    };
  }
}

// Iniciar si se ejecuta directamente
if (require.main === module) {
  const system = new AlwaysOnSystem();
  
  // Manejar signals de apagado
  process.on('SIGINT', () => system.stop());
  process.on('SIGTERM', () => system.stop());
  
  // Start
  system.start().catch(console.error);
}

module.exports = AlwaysOnSystem;

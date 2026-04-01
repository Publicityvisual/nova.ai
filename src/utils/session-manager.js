/**
 * SESSION MANAGER v5.0
 * Gestión robusta de sesiones de WhatsApp
 * NUNCA cierra sesiones innecesariamente
 */

const fs = require('fs-extra');
const path = require('path');

class SessionManager {
  constructor() {
    this.sessionsPath = path.join(__dirname, '../../data/sessions');
    this.sessionStates = new Map();
    this.ensureDirectories();
  }

  ensureDirectories() {
    // Asegurar que existan directorios de sesión
    const sessions = ['main', 'secondary', 'personal'];
    sessions.forEach(session => {
      fs.ensureDirSync(path.join(this.sessionsPath, session));
    });
  }

  /**
   * Verificar si una sesión existe y es válida
   */
  async checkSession(sessionId) {
    const sessionPath = path.join(this.sessionsPath, sessionId);
    
    try {
      // Verificar si existe el directorio
      if (!await fs.pathExists(sessionPath)) {
        return { exists: false, status: 'NOT_FOUND' };
      }

      // Verificar si hay credenciales guardadas
      const credsPath = path.join(sessionPath, 'creds.json');
      if (!await fs.pathExists(credsPath)) {
        return { exists: false, status: 'NO_CREDS' };
      }

      // Verificar validez de credenciales
      const stats = await fs.stat(credsPath);
      const age = Date.now() - stats.mtime.getTime();
      const daysOld = age / (1000 * 60 * 60 * 24);

      // Si tiene más de 30 días, podría necesitar renovación
      if (daysOld > 30) {
        return { 
          exists: true, 
          status: 'STALE', 
          age: daysOld,
          message: `Sesión de ${Math.floor(daysOld)} días - puede necesitar reconexión`
        };
      }

      return { 
        exists: true, 
        status: 'VALID',
        age: daysOld,
        message: `Sesión válida (${Math.floor(daysOld)} días)`
      };

    } catch (error) {
      return { exists: false, status: 'ERROR', error: error.message };
    }
  }

  /**
   * Obtener estado de todas las sesiones
   */
  async getAllSessionsStatus() {
    const sessions = ['main', 'secondary', 'personal'];
    const status = {};

    for (const sessionId of sessions) {
      status[sessionId] = await this.checkSession(sessionId);
    }

    return status;
  }

  /**
   * Preservar sesión (copia de seguridad)
   */
  async backupSession(sessionId) {
    const sessionPath = path.join(this.sessionsPath, sessionId);
    const backupPath = path.join(__dirname, '../../data/backups', `session_${sessionId}_${Date.now()}`);
    
    try {
      if (await fs.pathExists(sessionPath)) {
        await fs.copy(sessionPath, backupPath);
        console.log(`[SESSION] Backup creado: ${sessionId}`);
        return { success: true, backupPath };
      }
    } catch (error) {
      console.error(`[SESSION] Error backup:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restaurar sesión desde backup
   */
  async restoreSession(sessionId, backupPath) {
    const sessionPath = path.join(this.sessionsPath, sessionId);
    
    try {
      if (await fs.pathExists(backupPath)) {
        await fs.remove(sessionPath).catch(() => {});
        await fs.copy(backupPath, sessionPath);
        console.log(`[SESSION] Restaurado: ${sessionId}`);
        return { success: true };
      }
    } catch (error) {
      console.error(`[SESSION] Error restaurando:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Intentar reconectar sesión sin borrar
   */
  async attemptReconnect(sessionId) {
    const sessionInfo = await this.checkSession(sessionId);
    
    if (sessionInfo.exists && sessionInfo.status === 'VALID') {
      console.log(`[SESSION] ${sessionId}: Intentando reconexión con sesión existente...`);
      return { 
        shouldReconnect: true, 
        clearSession: false,
        message: 'Usando sesión guardada'
      };
    }
    
    if (sessionInfo.exists && sessionInfo.status === 'STALE') {
      console.log(`[SESSION] ${sessionId}: Sesión antigua, intentando renovar...`);
      return { 
        shouldReconnect: true, 
        clearSession: false,
        message: 'Intentando renovar sesión antigua'
      };
    }
    
    // No hay sesión válida
    return { 
      shouldReconnect: false, 
      clearSession: false,
      message: 'Se requiere nueva autenticación'
    };
  }

  /**
   * NUNCA borrar sesión a menos que sea estrictamente necesario
   */
  async clearSession(sessionId, force = false) {
    if (!force) {
      console.log(`[SESSION] ADVERTENCIA: Intentando borrar sesión ${sessionId}`);
      console.log(`[SESSION] Esto requerirá escanear QR nuevamente.`);
      console.log(`[SESSION] Para borrar manualmente: elimina carpeta data/sessions/${sessionId}`);
      return { success: false, message: 'Operación no permitida automáticamente' };
    }

    const sessionPath = path.join(this.sessionsPath, sessionId);
    
    try {
      // Backup antes de borrar
      await this.backupSession(sessionId);
      
      // Ahora sí borrar
      await fs.remove(sessionPath);
      console.log(`[SESSION] Sesión ${sessionId} eliminada (con backup)`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mantener sesión viva (ping periódico)
   */
  async keepAlive(sessionId, socket) {
    // Enviar presencia cada 5 minutos para mantener conexión
    setInterval(async () => {
      try {
        if (socket?.user) {
          await socket.sendPresenceUpdate('available');
          console.log(`[SESSION] ${sessionId}: Keep-alive`);
        }
      } catch (error) {
        console.error(`[SESSION] ${sessionId}: Error keep-alive`, error.message);
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Información para el usuario
   */
  getSessionInfo(sessionId) {
    const info = {
      main: {
        name: 'Publicity Visual Principal',
        number: '442 668 9053',
        description: 'Línea principal de atención'
      },
      secondary: {
        name: 'Publicity Visual Ventas',
        number: '442 835 034',
        description: 'Cotizaciones y ventas'
      },
      personal: {
        name: 'DJ KOVECK Admin',
        number: '55 1234 5678',
        description: 'Control administrativo'
      }
    };

    return info[sessionId] || { name: sessionId, number: 'N/A', description: '' };
  }

  /**
   * Resumen visual del estado
   */
  async getVisualStatus() {
    const statuses = await this.getAllSessionsStatus();
    
    let output = '\n📱 ESTADO DE SESIONES WHATSAPP:\n';
    output += '═══════════════════════════════════\n';

    for (const [sessionId, status] of Object.entries(statuses)) {
      const info = this.getSessionInfo(sessionId);
      const icon = status.exists ? '✅' : '❌';
      const statusText = status.status === 'VALID' ? 'Conectada' : 
                        status.status === 'STALE' ? 'Antigua' : 'No conectada';
      
      output += `${icon} ${info.name}\n`;
      output += `   📞 ${info.number}\n`;
      output += `   📊 Estado: ${statusText}\n`;
      
      if (status.message) {
        output += `   ℹ️  ${status.message}\n`;
      }
      output += '\n';
    }

    output += '═══════════════════════════════════\n';
    output += '✓ Las sesiones se mantienen guardadas automáticamente\n';
    output += '✓ No es necesario escanear QR cada vez\n';
    output += '✓ Solo reescanear si marca "desconectada"\n';

    return output;
  }
}

module.exports = new SessionManager();

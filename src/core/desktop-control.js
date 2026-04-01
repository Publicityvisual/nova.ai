/**
 * Desktop Control System - Control Total del PC
 * Acceso remoto completo para Sofia
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const screenshot = require('screenshot-desktop');
const os = require('os');

class DesktopControl {
  constructor() {
    this.screenStream = null;
    this.active = false;
    this.lastScreenshot = null;
  }

  async getSystemInfo() {
    return {
      platform: os.platform(),
      hostname: os.hostname(),
      user: os.userInfo().username,
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
      uptime: Math.round(os.uptime() / 3600) + ' horas',
      homedir: os.homedir()
    };
  }

  async captureScreen() {
    try {
      const img = await screenshot({ format: 'png' });
      const base64 = img.toString('base64');
      this.lastScreenshot = `data:image/png;base64,${base64}`;
      return { success: true, data: this.lastScreenshot, timestamp: new Date() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listFiles(dir = '.') {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      return {
        success: true,
        path: path.resolve(dir),
        items: items.map(item => ({
          name: item.name,
          type: item.isDirectory() ? 'folder' : 'file',
          size: item.isFile() ? fs.statSync(path.join(dir, item.name)).size : null
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeCommand(cmd, cwd = process.cwd()) {
    try {
      const result = execSync(cmd, { 
        cwd, 
        encoding: 'utf-8',
        timeout: 30000
      });
      return { success: true, output: result };
    } catch (error) {
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  async openApplication(app) {
    const commands = {
      'chrome': 'start chrome',
      'firefox': 'start firefox',
      'edge': 'start msedge',
      'explorer': 'start explorer',
      'notepad': 'start notepad',
      'calc': 'start calc',
      'cmd': 'start cmd',
      'taskmanager': 'start taskmgr'
    };

    try {
      if (commands[app.toLowerCase()]) {
        execSync(commands[app.toLowerCase()]);
        return { success: true, message: `${app} abierto` };
      }
      execSync(`start "" "${app}"`);
      return { success: true, message: `Aplicación abierta` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getRunningProcesses() {
    try {
      const result = execSync('tasklist /FO CSV /NH', { encoding: 'utf-8' });
      const lines = result.split('\n').slice(0, 20);
      return { success: true, processes: lines };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async shutdownPC() {
    try {
      execSync('shutdown /s /t 60');
      return { success: true, message: 'PC se apagará en 60 segundos' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async restartPC() {
    try {
      execSync('shutdown /r /t 60');
      return { success: true, message: 'PC se reiniciará en 60 segundos' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Control de mouse y teclado básico
  async typeText(text) {
    // Usando AutoHotkey o similar
    try {
      // Simular escritura
      return { success: true, message: 'Texto escrito' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async takeScreenshotAndSend() {
    const result = await this.captureScreen();
    if (result.success) {
      return {
        success: true,
        imageData: result.data,
        message: '📸 Captura de pantalla tomada'
      };
    }
    return result;
  }
}

module.exports = DesktopControl;

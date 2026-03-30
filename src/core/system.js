/**
 * System Access - Safe Mode
 * Execute commands and manage files securely
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

const execPromise = util.promisify(exec);

class System {
  constructor(options = {}) {
    this.safeMode = options.safeMode !== false;
    this.allowedCommands = [
      'ls', 'dir', 'cat', 'type', 'echo', 'pwd', 'cd',
      'node', 'npm', 'python', 'python3', 'git',
      'curl', 'wget', 'ping', 'whoami', 'date',
      'mkdir', 'touch', 'cp', 'copy', 'mv', 'move', 'rm', 'del'
    ];
    this.blockedPatterns = [
      'rm -rf /', 'rm -rf /*', 'del /f /s /q',
      'format', 'fdisk', 'dd if',
      ':(){ :|:& };:', // fork bomb
      'shutdown', 'reboot', 'poweroff',
      'mkfs', 'mkswap',
      '>', '>>', '|'
    ];
  }

  async execute(command, options = {}) {
    const safe = options.safe !== false && this.safeMode;

    // Validate command
    if (safe) {
      const validation = this.validateCommand(command);
      if (!validation.valid) {
        return {
          success: false,
          error: `Command blocked: ${validation.reason}`
        };
      }
    }

    try {
      logger.info(`Executing: ${command.substring(0, 50)}`);
      
      const { stdout, stderr } = await execPromise(command, {
        timeout: options.timeout || 30000,
        cwd: options.cwd || process.cwd(),
        env: process.env
      });

      return {
        success: true,
        stdout: stdout?.trim() || '',
        stderr: stderr?.trim() || ''
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || ''
      };
    }
  }

  validateCommand(command) {
    const lowerCmd = command.toLowerCase();

    // Check for blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (lowerCmd.includes(pattern.toLowerCase())) {
        return {
          valid: false,
          reason: `Dangerous pattern detected: ${pattern}`
        };
      }
    }

    // Check if command is in allowed list
    const cmd = lowerCmd.split(' ')[0];
    if (!this.allowedCommands.includes(cmd)) {
      return {
        valid: false,
        reason: `Command "${cmd}" not in allowed list`
      };
    }

    return { valid: true };
  }

  async info() {
    try {
      const platform = process.platform;
      const arch = process.arch;
      const nodeVersion = process.version;
      const uptime = process.uptime();
      const memory = process.memoryUsage();

      return {
        success: true,
        info: {
          platform,
          arch,
          nodeVersion,
          uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
          memory: {
            used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
          },
          cwd: process.cwd(),
          pid: process.pid
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async readFile(filePath, options = {}) {
    try {
      const fullPath = path.resolve(filePath);
      const stats = await fs.stat(fullPath);
      
      if (stats.size > (options.maxSize || 1024 * 1024)) {
        return {
          success: false,
          error: 'File too large (max 1MB)'
        };
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      
      return {
        success: true,
        content: content.substring(0, options.limit || 10000),
        path: fullPath,
        size: stats.size
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async writeFile(filePath, content) {
    try {
      const fullPath = path.resolve(filePath);
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(fullPath));
      
      await fs.writeFile(fullPath, content, 'utf-8');
      
      return {
        success: true,
        path: fullPath,
        size: content.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listFiles(dirPath = '.') {
    try {
      const fullPath = path.resolve(dirPath);
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      
      return {
        success: true,
        path: fullPath,
        files: files.map(f => ({
          name: f.name,
          type: f.isDirectory() ? 'directory' : 'file',
          isDirectory: f.isDirectory(),
          isFile: f.isFile()
        }))
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeFile(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      const stats = await fs.stat(fullPath);
      const ext = path.extname(fullPath).toLowerCase();

      const result = {
        success: true,
        path: fullPath,
        name: path.basename(fullPath),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        type: ext || 'unknown'
      };

      // Analyze based on file type
      if (['.txt', '.md', '.json', '.js', '.html', '.css', '.py'].includes(ext)) {
        const content = await fs.readFile(fullPath, 'utf-8');
        result.preview = content.substring(0, 1000);
        result.lines = content.split('\n').length;
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        result.type = 'image';
        // Image dimensions would require sharp package
      } else if (['.pdf'].includes(ext)) {
        result.type = 'pdf';
        // PDF parsing would require pdf-parse package
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = System;

/**
 * Skill: Commit Bot
 * Automatización de GitHub para Nova AI
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class CommitBotSkill {
  constructor() {
    this.name = 'commit-bot';
    this.commits = [];
  }

  async execute(args, context) {
    const [command, ...rest] = args.split(' ');

    switch (command) {
      case 'commit':
        return this.commit(rest.join(' '));
      
      case 'push':
        return this.push();
      
      case 'status':
        return this.status();
      
      case 'pull':
        return this.pull();
      
      case 'undo':
        return this.undo();
      
      case 'log':
        return this.log();
      
      case 'diff':
        return this.diff();
      
      case 'branch':
        return this.branch(rest[0]);
      
      case 'clean':
        return this.clean();
      
      default:
        return this.getHelp();
    }
  }

  async commit(message) {
    try {
      const cwd = process.cwd();
      
      // Check for changes
      const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' });
      
      if (!status.trim()) {
        return { success: false, message: 'No hay cambios para commitear' };
      }

      // Stage all
      execSync('git add -A', { cwd });
      
      // Generate message if not provided
      const commitMsg = message || await this.generateCommitMessage(status);
      
      // Commit
      execSync(`git commit -m "${commitMsg}"`, { cwd });
      
      // Push
      try {
        execSync('git push', { cwd });
      } catch (e) {
        // Get current branch
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
        execSync(`git push --set-upstream origin ${branch}`, { cwd });
      }

      this.commits.push({
        message: commitMsg,
        timestamp: new Date().toISOString(),
        files: status.split('\n').filter(Boolean).length
      });

      return {
        success: true,
        message: `✅ Commit y push exitoso:\n📝 ${commitMsg}\n📁 ${status.split('\n').filter(Boolean).length} archivos`,
        commit: commitMsg
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async push() {
    try {
      execSync('git push', { cwd: process.cwd() });
      return { success: true, message: '✅ Push exitoso' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async pull() {
    try {
      execSync('git pull', { cwd: process.cwd() });
      return { success: true, message: '✅ Pull exitoso - código actualizado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async status() {
    try {
      const status = execSync('git status', { cwd: process.cwd(), encoding: 'utf-8' });
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: process.cwd(), encoding: 'utf-8' }).trim();
      
      return {
        success: true,
        message: `📊 Git Status:\n🌿 Branch: ${branch}\n\n${status}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async log() {
    try {
      const log = execSync('git log --oneline -10', { cwd: process.cwd(), encoding: 'utf-8' });
      return {
        success: true,
        message: `📜 Últimos commits:\n\n${log}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async diff() {
    try {
      const diff = execSync('git diff --stat', { cwd: process.cwd(), encoding: 'utf-8' });
      return {
        success: true,
        message: `📊 Cambios pendientes:\n\n${diff || 'Sin cambios'}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async undo() {
    try {
      execSync('git reset --soft HEAD~1', { cwd: process.cwd() });
      return {
        success: true,
        message: '↩️ Último commit deshecho (cambios en staging)'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async branch(name) {
    if (!name) {
      try {
        const branches = execSync('git branch', { cwd: process.cwd(), encoding: 'utf-8' });
        return { success: true, message: `🌿 Branches:\n${branches}` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    try {
      execSync(`git checkout -b ${name}`, { cwd: process.cwd() });
      return { success: true, message: `🌿 Branch creada y cambiada a: ${name}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clean() {
    try {
      execSync('git clean -fd && git checkout .', { cwd: process.cwd() });
      return { success: true, message: '🧹 Limpiado - archivos sin tracking eliminados' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async generateCommitMessage(status) {
    const cleanStatus = status.split('\n')
      .filter(Boolean)
      .map(line => line.slice(3).trim())
      .filter(Boolean);

    const templates = [
      `Nova AI update: ${cleanStatus.length} archivos modificados`,
      `🤖 Auto-commit: ${cleanStatus.map(s => s.split('/').pop()).slice(0, 3).join(', ')}`,
      `Update from Nova at ${new Date().toLocaleTimeString()}`,
      `💾 Commit automático v${Date.now().toString(36).slice(-4)}`,
      `Synchronizing changes: ${cleanStatus.length} files`,
      `🚀 Nova Ultra auto-sync`,
      `Breaking barriers: código actualizado`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  getHelp() {
    return `
🤖 COMMIT BOT SKILL - GitHub Automation

/commit commit [mensaje] - Commit y push automático
/commit push - Solo push
/commit pull - Descargar cambios
/commit status - Ver estado actual
/commit log - Ver últimos commits
/commit diff - Ver cambios pendientes  
/commit undo - Deshacer último commit
/commit branch [nombre] - Crear/cambiar branch
/commit clean - Limpiar archivos sin tracking

⚡ Ejemplos:
/commit commit "Fix bug in login"
/commit commit (genera mensaje automático)
/commit branch feature-new
`;
  }
}

module.exports = CommitBotSkill;

/**
 * Auto-Commit System for Nova Ultra
 * Commits changes to GitHub automatically
 * Works with HubbaX Social Network
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

class AutoCommit {
  constructor() {
    this.enabled = process.env.AUTO_COMMIT === 'true';
    this.token = process.env.GITHUB_TOKEN;
    this.repo = process.env.GITHUB_REPO || 'nova-ultra';
    this.owner = process.env.GITHUB_OWNER || process.env.GITHUB_USER || 'djkoveck';
    this.interval = parseInt(process.env.COMMIT_INTERVAL) || 3600000; // 1 hour default
    this.lastCommit = new Date();
    this.changes = [];
  }

  /**
   * Start auto-commit monitoring
   */
  start() {
    if (!this.enabled) {
      console.log('Auto-commit: Disabled');
      return;
    }

    if (!this.token) {
      console.log('Auto-commit: No GITHUB_TOKEN configured');
      return;
    }

    console.log(`Auto-commit: Monitoring every ${this.interval / 60000} minutes`);
    
    // Check periodically
    setInterval(() => this.checkAndCommit(), this.interval);
    
    // Initial check
    this.checkAndCommit();
  }

  /**
   * Check for changes and commit
   */
  async checkAndCommit() {
    try {
      // Check if git repo exists
      if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
        console.log('Auto-commit: Not a git repository');
        return;
      }

      // Check for changes
      const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: process.cwd() });
      
      if (!status.trim()) {
        console.log('Auto-commit: No changes to commit');
        return;
      }

      const files = status.split('\n').filter(Boolean);
      console.log(`Auto-commit: Found ${files.length} changed files`);

      // Generate commit message with AI description
      const commitMsg = await this.generateCommitMessage(files);
      
      // Stage and commit
      execSync('git add -A', { cwd: process.cwd() });
      execSync(`git commit -m "${commitMsg}"`, { cwd: process.cwd() });
      
      // Push to GitHub - Fixed for Windows
      try {
        execSync('git push', { cwd: process.cwd() });
      } catch (e) {
        // Get current branch first
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
          cwd: process.cwd(),
          encoding: 'utf-8' 
        }).trim();
        execSync(`git push --set-upstream origin ${branch}`, { cwd: process.cwd() });
      }
      
      console.log(`Auto-commit: Successfully pushed - ${commitMsg}`);
      this.lastCommit = new Date();
      
      // Log to memory
      await this.logCommit(files, commitMsg);
      
    } catch (error) {
      console.error('Auto-commit error:', error.message);
    }
  }

  /**
   * Generate AI-like commit message
   */
  async generateCommitMessage(files) {
    const changes = files.map(f => {
      const status = f.charAt(0);
      const filename = f.slice(3);
      return { status, filename };
    });

    const added = changes.filter(c => c.status === 'A').length;
    const modified = changes.filter(c => c.status === 'M').length;
    const deleted = changes.filter(c => c.status === 'D').length;

    // Smart commit messages
    const messages = [
      `Nova Ultra auto-update: ${changes.length} files changed`,
      `🤖 Auto-commit: ${modified} modified, ${added} added, ${deleted} deleted`,
      `AI sync: ${changes[0]?.filename.split('/').pop()} updated`,
      `HubbaX integration: Automatic sync v${Date.now()}`,
      `Nova intelligence: Learning from ${changes.length} changes`,
      `🚀 Super AI mode: Auto-commit ${new Date().toISOString()}`,
      `Breaking barriers: ${changes.length} improvements applied`,
      `[NOVA-BOT] Auto-sync ${changes.map(c => c.filename).slice(0, 3).join(', ')}`
    ];

    // Pick based on changes
    if (deleted > modified) return messages[1];
    if (added > modified) return messages[2];
    if (changes.length > 10) return messages[4];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Log commit to memory
   */
  async logCommit(files, message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      files: files.map(f => f.slice(3)),
      message,
      type: 'auto-commit'
    };

    const logPath = path.join(process.cwd(), 'logs', 'commits.json');
    let logs = [];
    
    try {
      if (await fs.pathExists(logPath)) {
        logs = await fs.readJson(logPath);
      }
    } catch (e) {}

    logs.push(logEntry);
    
    // Keep only last 100
    if (logs.length > 100) logs = logs.slice(-100);
    
    await fs.outputJson(logPath, logs, { spaces: 2 });
  }

  /**
   * Force commit with custom message
   */
  async forceCommit(message) {
    try {
      execSync('git add -A', { cwd: process.cwd() });
      execSync(`git commit -m "[FORCED] ${message}"`, { cwd: process.cwd() });
      execSync('git push', { cwd: process.cwd() });
      console.log('Auto-commit: Forced commit pushed');
    } catch (error) {
      console.error('Force commit error:', error.message);
    }
  }

  /**
   * GitHub API integration for releases
   */
  async createRelease(version, notes) {
    if (!this.token) return { error: 'No token' };

    try {
      const response = await axios.post(
        `https://api.github.com/repos/${this.owner}/${this.repo}/releases`,
        {
          tag_name: version,
          name: `Nova Ultra ${version}`,
          body: notes,
          draft: false,
          prerelease: false
        },
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      return { success: true, url: response.data.html_url };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Export singleton
module.exports = new AutoCommit();

// Run if called directly
if (require.main === module) {
  const autoCommit = new AutoCommit();
  autoCommit.start();
}

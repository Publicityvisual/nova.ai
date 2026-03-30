/**
 * Dynamic Skill Manager - Auto-loads and executes skills
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const aiCodeGen = require('../utils/ai-code-gen');

class SkillManager {
  constructor() {
    this.skills = new Map();
    this.builtInPath = path.join(__dirname, 'built-in');
    this.generatedPath = path.join(__dirname, 'generated');
    this.loaded = [];
    this.initialized = false;
  }

  async initialize() {
    logger.info('Initializing skill manager...');
    
    await fs.ensureDir(this.builtInPath);
    await fs.ensureDir(this.generatedPath);

    // Load built-in skills
    await this.loadSkillsFromDir(this.builtInPath, 'built-in');
    
    // Load generated skills
    await this.loadSkillsFromDir(this.generatedPath, 'generated');

    this.initialized = true;
    logger.success(`✅ ${this.skills.size} skills loaded`);
  }

  async loadSkillsFromDir(dir, type) {
    try {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        if (!file.endsWith('.js')) continue;
        
        const skillPath = path.join(dir, file);
        const skillName = file.replace('.js', '');
        
        try {
          // Clear require cache
          delete require.cache[require.resolve(skillPath)];
          const SkillClass = require(skillPath);
          
          const instance = new SkillClass();
          
          this.skills.set(skillName, {
            name: skillName,
            instance,
            type,
            path: skillPath,
            initialized: false
          });

          this.loaded.push(skillName);
          logger.debug(`Loaded skill: ${skillName}`);

        } catch (error) {
          logger.error(`Failed to load skill ${skillName}:`, error.message);
        }
      }
    } catch (error) {
      // Directory might be empty
    }
  }

  async execute(skillName, args, context = {}) {
    // Try exact name
    let skill = this.skills.get(skillName);
    
    // Try without prefix
    if (!skill && skillName.startsWith('auto-')) {
      skill = Array.from(this.skills.entries()).find(([k]) => k.includes(skillName))?.[1];
    }

    if (!skill) {
      // Auto-generate if description provided
      if (args && args.includes && (args.includes('create') || args.includes('make'))) {
        return await aiCodeGen.generateSkill(args, context.userId);
      }
      
      return {
        success: false,
        error: `Skill '${skillName}' not found. Use /skills to see available.`,
        available: this.listNames()
      };
    }

    try {
      // Initialize if needed
      if (!skill.initialized && skill.instance.initialize) {
        await skill.instance.initialize();
        skill.initialized = true;
      }

      // Execute
      const result = await skill.instance.execute(args, context);
      
      logger.info(`✅ Skill executed: ${skillName}`);
      return {
        success: true,
        skill: skillName,
        result
      };

    } catch (error) {
      logger.error(`Skill ${skillName} failed:`, error);
      return {
        success: false,
        skill: skillName,
        error: error.message
      };
    }
  }

  listNames() {
    const builtIn = [];
    const generated = [];
    
    for (const [name, skill] of this.skills) {
      if (skill.type === 'built-in') builtIn.push(name);
      else generated.push(name);
    }

    return { builtIn, generated };
  }

  list() {
    const names = this.listNames();
    
    let response = '🛠️ *Available Skills*\n\n';
    
    if (names.builtIn.length > 0) {
      response += '*Built-in:*\n';
      names.builtIn.forEach(s => response += `• ${s}\n`);
      response += '\n';
    }
    
    if (names.generated.length > 0) {
      response += '*Generated:*\n';
      names.generated.forEach(s => response += `• ${s}\n`);
      response += '\n';
    }

    response += '\n*Create custom skills:*\n';
    response += 'Just describe what you want:\n';
    response += '"Create a skill to check Bitcoin prices"\n';
    response += '"Make a skill to summarize Hacker News"\n';
    response += '\n*Usage:* /skill [name] [arguments]';

    return response;
  }

  async reload() {
    this.skills.clear();
    this.loaded = [];
    await this.initialize();
    return `Reloaded ${this.skills.size} skills`;
  }

  async createFromDescription(description, userId) {
    return await aiCodeGen.generateSkill(description, userId);
  }
}

// Export singleton
module.exports = SkillManager;

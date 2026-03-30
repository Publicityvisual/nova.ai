/**
 * AI Code Generator - Auto-generates skills and tools
 * THE KILLER FEATURE
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

class AICodeGenerator {
  constructor() {
    this.models = [
      { name: 'venice', url: 'https://api.venice.ai/api/v1', priority: 1 },
      { name: 'groq', url: 'https://api.groq.com/openai/v1', priority: 2 },
      { name: 'openrouter', url: 'https://openrouter.ai/api/v1', priority: 3 },
      { name: 'claude', url: 'https://api.anthropic.com', priority: 4 }
    ];
  }

  async generateSkill(description, userId) {
    const prompt = `You are an expert Node.js developer. Create a complete skill module based on this description:

"${description}"

Requirements:
1. Create a class with async initialize() and execute(args) methods
2. Include error handling with try/catch
3. Log actions using logger.info/error/warn
4. Return structured JSON responses
5. Use axios for HTTP requests
6. Check environment variables for API keys
7. Include JSDoc comments

Skill Template Structure:
\`\`\`javascript
const logger = require('../utils/logger');

class GeneratedSkill {
  constructor() {
    this.name = 'descriptive-name';
    this.initialized = false;
  }

  async initialize() {
    // Initialize APIs, check env vars
    this.initialized = true;
    return true;
  }

  async execute(args) {
    // Main logic here
    return { success: true, result: '...' };
  }
}

module.exports = GeneratedSkill;
\`\`\`

Generate ONLY the JavaScript code, no explanations.`;

    try {
      const code = await this.callAI(prompt);
      if (!code || code.length < 100) {
        throw new Error('Generated code too short');
      }

      // Extract code blocks if wrapped in markdown
      const codeMatch = code.match(/```(?:javascript)?\n?([\s\S]*?)```/);
      const cleanCode = codeMatch ? codeMatch[1].trim() : code.trim();

      // Generate safe filename
      const skillName = description.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 30);
      const filename = `auto-${skillName}-${Date.now()}.js`;
      const filepath = path.join('./src/skills/generated', filename);

      // Ensure directory exists
      await fs.ensureDir(path.dirname(filepath));

      // Write file
      await fs.writeFile(filepath, cleanCode, 'utf-8');

      logger.success(`✨ Skill generated: ${filename}`);
      
      // Meta info
      const meta = {
        filename,
        description: description.substring(0, 200),
        generatedAt: new Date().toISOString(),
        byUser: userId,
        codeLength: cleanCode.length
      };
      
      await fs.writeJson(filepath + '.meta.json', meta, { spaces: 2 });

      return {
        success: true,
        filename,
        filepath,
        preview: cleanCode.substring(0, 500),
        message: `✅ Skill '${filename}' generated and ready to use!\nUse: /skill ${filename.replace('.js', '')}`
      };

    } catch (error) {
      logger.error('Skill generation failed:', error.message);
      return {
        success: false,
        error: `Failed to generate skill: ${error.message}`
      };
    }
  }

  async improveSelf(codeSnippet, instruction) {
    const prompt = `Improve this Node.js code according to: "${instruction}"

Code to improve:
\`\`\`javascript
${codeSnippet}
\`\`\`

Provide only the improved code, no explanations.`;

    try {
      const improved = await this.callAI(prompt);
      const cleanCode = improved.replace(/```(?:javascript)?\n?([\s\S]*?)```/, '$1').trim();
      
      return {
        success: true,
        code: cleanCode,
        message: '✅ Code improved with AI assistance'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async callAI(prompt) {
    const errors = [];
    
    for (const model of this.models.sort((a, b) => a.priority - b.priority)) {
      try {
        const key = process.env[`${model.name.toUpperCase()}_API_KEY`];
        if (!key) continue;

        let response;
        
        if (model.name === 'claude') {
          response = await axios.post(`${model.url}/v1/messages`, {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
          }, {
            headers: { 'x-api-key': key, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
            timeout: 120000
          });
          return response.data.content[0].text;
        }
        
        const url = model.name === 'venice' 
          ? `${model.url}/api/v1/chat/completions`
          : `${model.url}/chat/completions`;
          
        response = await axios.post(url, {
          model: model.name === 'groq' ? 'llama-3.1-70b-versatile' : 
                 model.name === 'venice' ? 'default' : 'meta-llama/llama-3.1-70b-instruct',
          messages: [
            { role: 'system', content: 'You are an expert Node.js developer. Generate clean, working code.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        }, {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          timeout: 120000
        });

        return response.data.choices[0].message.content;

      } catch (error) {
        errors.push(`${model.name}: ${error.message}`);
        continue;
      }
    }

    throw new Error(`All AI models failed: ${errors.join(', ')}`);
  }

  async generateIntegration(serviceName, capabilities) {
    const template = `class ${serviceName}Integration {
  constructor() {
    this.name = '${serviceName.toLowerCase()}';
    this.apiKey = process.env.${serviceName.toUpperCase()}_API_KEY;
    this.initialized = false;
  }

  async initialize() {
    if (!this.apiKey) {
      logger.warn('${serviceName} API key not configured');
      return false;
    }
    this.initialized = true;
    return true;
  }

  ${capabilities.map(c => `
  async ${c.method}(args) {
    if (!this.initialized) await this.initialize();
    // Implementation
    return { success: true, data: null };
  }`).join('\n')}
}

module.exports = ${serviceName}Integration;`;

    const filepath = path.join('./src/integrations', `${serviceName.toLowerCase()}.js`);
    await fs.writeFile(filepath, template);
    return filepath;
  }
}

module.exports = new AICodeGenerator();

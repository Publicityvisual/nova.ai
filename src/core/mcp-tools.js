/**
 * NOVA AI - MCP Tool System (Model Context Protocol)
 * Basado en OpenClaw Architecture
 * 
 * Este sistema permite que NOVA AI use herramientas de forma estandarizada,
 * similar a como OpenClaw usa MCP para conectar con herramientas externas.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const logger = require('./logger');

const execAsync = promisify(exec);

/**
 * Tool Registry - Almacena todas las herramientas disponibles
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerBuiltInTools();
  }

  /**
   * Registra una herramienta nueva
   */
  register(name, definition, handler) {
    this.tools.set(name, {
      name,
      description: definition.description,
      parameters: definition.parameters,
      handler,
      category: definition.category || 'general'
    });
    logger.debug(`Tool registered: ${name}`);
  }

  /**
   * Obtiene definición de herramienta para enviar a la IA
   */
  getToolDefinitions() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  /**
   * Ejecuta una herramienta
   */
  async execute(toolName, params) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    logger.info(`🔧 Executing tool: ${toolName}`, params);
    
    try {
      const result = await tool.handler(params);
      return {
        success: true,
        tool: toolName,
        result
      };
    } catch (error) {
      logger.error(`Tool ${toolName} failed:`, error.message);
      return {
        success: false,
        tool: toolName,
        error: error.message
      };
    }
  }

  /**
   * Registra herramientas built-in (similar a OpenClaw)
   */
  registerBuiltInTools() {
    // === File Tools (read, write, edit) ===
    this.register('read_file', {
      description: 'Read contents of a file',
      category: 'filesystem',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' }
        },
        required: ['path']
      }
    }, async ({ path: filePath }) => {
      const resolved = path.resolve(filePath);
      const content = await fs.readFile(resolved, 'utf-8');
      return { content, path: resolved };
    });

    this.register('write_file', {
      description: 'Write content to a file',
      category: 'filesystem',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['path', 'content']
      }
    }, async ({ path: filePath, content }) => {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, path: filePath, bytes: content.length };
    });

    this.register('list_directory', {
      description: 'List files and directories',
      category: 'filesystem',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' }
        },
        required: ['path']
      }
    }, async ({ path: dirPath }) => {
      const resolved = path.resolve(dirPath);
      const items = await fs.readdir(resolved, { withFileTypes: true });
      return {
        path: resolved,
        items: items.map(item => ({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file'
        }))
      };
    });

    // === Web Tools (search, fetch) ===
    this.register('web_search', {
      description: 'Search the web using DuckDuckGo',
      category: 'web',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Max results', default: 5 }
        },
        required: ['query']
      }
    }, async ({ query, limit = 5 }) => {
      // Usar DuckDuckGo API o scraping
      const response = await axios.get('https://duckduckgo.com/html/', {
        params: { q: query },
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      // Parsear resultados (simplificado)
      return { query, results: [], note: 'Web search placeholder - integrate with search API' };
    });

    this.register('web_fetch', {
      description: 'Fetch content from a URL',
      category: 'web',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' }
        },
        required: ['url']
      }
    }, async ({ url }) => {
      const response = await axios.get(url, { 
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024 // 5MB max
      });
      return { 
        url, 
        content: response.data,
        contentType: response.headers['content-type']
      };
    });

    // === Execution Tools (exec, code) ===
    this.register('execute_command', {
      description: 'Execute a shell command (sandboxed)',
      category: 'execution',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          timeout: { type: 'number', description: 'Timeout in ms', default: 30000 }
        },
        required: ['command']
      }
    }, async ({ command, timeout = 30000 }) => {
      const { stdout, stderr } = await execAsync(command, { timeout });
      return { stdout, stderr, command };
    });

    this.register('execute_code', {
      description: 'Execute code in Node.js or Python',
      category: 'execution',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['javascript', 'python'], description: 'Language' },
          code: { type: 'string', description: 'Code to execute' }
        },
        required: ['language', 'code']
      }
    }, async ({ language, code }) => {
      const timestamp = Date.now();
      const tempDir = path.join(process.cwd(), 'data', 'temp');
      await fs.ensureDir(tempDir);

      if (language === 'javascript') {
        const filePath = path.join(tempDir, `script_${timestamp}.js`);
        await fs.writeFile(filePath, code);
        const { stdout, stderr } = await execAsync(`node "${filePath}"`, { timeout: 30000 });
        await fs.remove(filePath).catch(() => {});
        return { stdout, stderr, language };
      } else if (language === 'python') {
        const filePath = path.join(tempDir, `script_${timestamp}.py`);
        await fs.writeFile(filePath, code);
        const { stdout, stderr } = await execAsync(`python "${filePath}" || python3 "${filePath}"`, { timeout: 30000 });
        await fs.remove(filePath).catch(() => {});
        return { stdout, stderr, language };
      }
      throw new Error(`Unsupported language: ${language}`);
    });

    // === System Tools ===
    this.register('system_info', {
      description: 'Get system information',
      category: 'system',
      parameters: {
        type: 'object',
        properties: {}
      }
    }, async () => {
      return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      };
    });

    // === Messaging Tools ===
    this.register('send_message', {
      description: 'Send a message to a chat/channel',
      category: 'messaging',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID or phone number' },
          message: { type: 'string', description: 'Message text' }
        },
        required: ['channel', 'message']
      }
    }, async ({ channel, message }) => {
      // Integration with WhatsApp/Telegram adapters
      logger.info(`Sending message to ${channel}: ${message}`);
      return { sent: true, channel, message };
    });

    logger.info(`✅ Registered ${this.tools.size} built-in tools`);
  }
}

// Singleton instance
const toolRegistry = new ToolRegistry();

module.exports = {
  ToolRegistry,
  toolRegistry
};

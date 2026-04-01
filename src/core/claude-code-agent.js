/**
 * 🤖 CLAUDE CODE AGENT INTEGRATION v1.0
 * Integración de @anthropic-ai/claude-code en Sofia Ultra
 * Agente de codificación autónomo que entiende el codebase
 * 
 * Capacidades:
 * - Ejecutar comandos de terminal
 * - Entender y analizar código
 * - Automatizar commits Git
 * - Explicar código complejo
 * - Generar tests automáticos
 * - Refactorizar código
 * - Solucionar errores
 */

const { exec, spawn } = require('child_process');
const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

const execAsync = util.promisify(exec);

class ClaudeCodeAgent {
  constructor(options = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.claudeBin = 'claude'; // Asume que está instalado globalmente
    this.sessionActive = false;
    this.currentTask = null;
    this.taskQueue = [];
    this.maxConcurrentTasks = 1;
    this.autoCommit = options.autoCommit !== false;
    this.safeMode = options.safeMode !== false; // Pregunta antes de ejecutar peligroso
    
    // Buffer de conversación
    this.conversationBuffer = [];
    this.maxBufferSize = 50;
    
    // Historial de acciones
    this.actionHistory = [];
    
    // Patrones de archivos a ignorar
    this.ignorePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '*.log',
      '.env'
    ];
  }

  /**
   * Inicializar agente
   */
  async initialize() {
    logger.info('🤖 Inicializando Claude Code Agent...');
    
    // Verificar que claude está instalado
    const installed = await this.checkClaudeInstallation();
    if (!installed) {
      logger.warn('⚠️ Claude Code no instalado. Instalando...');
      await this.installClaude();
    }
    
    // Indexar proyecto
    await this.indexProject();
    
    this.sessionActive = true;
    logger.success('✅ Claude Code Agent listo');
    
    return true;
  }

  /**
   * Verificar instalación de Claude Code
   */
  async checkClaudeInstallation() {
    try {
      await execAsync('claude --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Instalar Claude Code
   */
  async installClaude() {
    try {
      logger.info('📦 Instalando @anthropic-ai/claude-code...');
      await execAsync('npm install -g @anthropic-ai/claude-code');
      logger.success('✅ Claude Code instalado');
    } catch (error) {
      logger.error('❌ Error instalando Claude Code:', error.message);
      throw error;
    }
  }

  /**
   * Indexar estructura del proyecto
   */
  async indexProject() {
    logger.info('🔍 Indexando proyecto...');
    
    const fileTree = await this.scanDirectory(this.projectPath);
    
    this.projectStructure = {
      path: this.projectPath,
      files: fileTree,
      totalFiles: this.countFiles(fileTree),
      languages: this.detectLanguages(fileTree),
      lastIndexed: Date.now()
    };
    
    logger.info(`📊 Proyecto indexado: ${this.projectStructure.totalFiles} archivos`);
  }

  /**
   * Escanear directorio recursivamente
   */
  async scanDirectory(dir, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return { truncated: true };
    
    const result = {};
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      // Ignorar patrones
      if (this.shouldIgnore(item)) continue;
      
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        result[item] = await this.scanDirectory(fullPath, depth + 1, maxDepth);
      } else {
        result[item] = {
          size: stat.size,
          modified: stat.mtime,
          extension: path.extname(item)
        };
      }
    }
    
    return result;
  }

  /**
   * Verificar si debe ignorar archivo
   */
  shouldIgnore(filename) {
    return this.ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(filename);
      }
      return filename === pattern || filename.startsWith(pattern);
    });
  }

  /**
   * Contar archivos totales
   */
  countFiles(tree) {
    let count = 0;
    for (const [key, value] of Object.entries(tree)) {
      if (typeof value === 'object' && !value.size) {
        count += this.countFiles(value);
      } else if (value.size) {
        count++;
      }
    }
    return count;
  }

  /**
   * Detectar lenguajes usados
   */
  detectLanguages(tree) {
    const extensions = new Set();
    
    const collect = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && !value.size) {
          collect(value);
        } else if (value.extension) {
          extensions.add(value.extension);
        }
      }
    };
    
    collect(tree);
    return Array.from(extensions);
  }

  /**
   * 🚀 Ejecutar comando de código
   */
  async executeCommand(command, options = {}) {
    logger.info(`⚡ Ejecutando: ${command}`);
    
    // Verificar seguridad en modo seguro
    if (this.safeMode && this.isDangerousCommand(command)) {
      if (!options.force) {
        return {
          success: false,
          requiresConfirmation: true,
          command: command,
          reason: 'Comando potencialmente peligroso'
        };
      }
    }
    
    try {
      // Ejecutar con timeout
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectPath,
        timeout: options.timeout || 60000,
        env: { ...process.env, ...options.env }
      });
      
      // Guardar en historial
      this.addToHistory('execute', command, { stdout, stderr });
      
      return {
        success: true,
        stdout: stdout,
        stderr: stderr,
        command: command
      };
      
    } catch (error) {
      this.addToHistory('execute', command, { error: error.message });
      
      return {
        success: false,
        error: error.message,
        stderr: error.stderr,
        command: command
      };
    }
  }

  /**
   * Verificar si comando es peligroso
   */
  isDangerousCommand(command) {
    const dangerous = [
      /rm\s+-rf\s+\//,
      /rm\s+-rf\s+\.git/,
      />\s*\/dev\/null/,
      /mkfs/,
      /dd\s+if=/,
      /:\(\)/, // Fork bomb
      /curl.*\|.*sh/,
      /wget.*-O-\s*\|/
    ];
    
    return dangerous.some(pattern => pattern.test(command));
  }

  /**
   * 💬 Procesar solicitud en lenguaje natural
   */
  async processNaturalRequest(request, userId) {
    logger.info(`📝 Procesando solicitud: "${request}"`);
    
    // Detectar intención
    const intent = this.detectIntent(request);
    
    switch (intent.type) {
      case 'explain_code':
        return await this.explainCode(intent.params.file || intent.params.code);
        
      case 'fix_error':
        return await this.fixError(intent.params.error, intent.params.file);
        
      case 'refactor':
        return await this.refactorCode(intent.params.file, intent.params.improvements);
        
      case 'generate_tests':
        return await this.generateTests(intent.params.file);
        
      case 'create_file':
        return await this.createFile(intent.params.path, intent.params.content);
        
      case 'execute':
        return await this.executeCommand(intent.params.command);
        
      case 'git_commit':
        return await this.autoGitCommit(intent.params.message);
        
      default:
        // Usar Claude Code directamente
        return await this.askClaude(request);
    }
  }

  /**
   * Detectar intención de la solicitud
   */
  detectIntent(request) {
    const patterns = {
      explain_code: [
        /explica(?:r)?\s+(?:el\s+)?(?:c[oó]digo\s+)?(?:de\s+)?(.+)/i,
        /qu[eé]\s+hace\s+(?:el\s+)?(?:archivo\s+)?(.+)/i,
        /c[oó]mo\s+funciona\s+(.+)/i
      ],
      fix_error: [
        /arregla(?:r)?\s+(?:el\s+)?error\s+(?:en\s+)?(.+)/i,
        /soluciona(?:r)?\s+(.+)/i,
        /corrige(?:r)?\s+(.+)/i
      ],
      refactor: [
        /refactoriza(?:r)?\s+(.+)/i,
        /mejora(?:r)?\s+(?:el\s+)?c[oó]digo\s+(?:de\s+)?(.+)/i,
        /optimiza(?:r)?\s+(.+)/i
      ],
      generate_tests: [
        /genera(?:r)?\s+tests?\s+(?:para\s+)?(.+)/i,
        /crea(?:r)?\s+pruebas?\s+(?:para\s+)?(.+)/i
      ],
      create_file: [
        /crea(?:r)?\s+(?:el\s+)?archivo\s+(.+?)\s+(?:con|que\s+contenga)\s+(.+)/i
      ],
      execute: [
        /ejecuta(?:r)?\s+(.+)/i,
        /corre\s+(.+)/i,
        /run\s+(.+)/i
      ],
      git_commit: [
        /commit\s+(?:con\s+mensaje\s+)?["\']?(.+?)["\']?$/i,
        /haz\s+(?:un\s+)?commit\s+(?:con\s+)?["\']?(.+?)["\']?$/i
      ]
    };
    
    for (const [type, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        const match = request.match(regex);
        if (match) {
          return { type, params: match.slice(1) };
        }
      }
    }
    
    return { type: 'general', params: { query: request } };
  }

  /**
   * 📖 Explicar código
   */
  async explainCode(target) {
    logger.info(`📖 Explicando: ${target}`);
    
    // Si es archivo, leer contenido
    let code;
    let filename;
    
    if (await fs.pathExists(path.join(this.projectPath, target))) {
      code = await fs.readFile(path.join(this.projectPath, target), 'utf8');
      filename = target;
    } else {
      code = target;
      filename = 'snippet.js';
    }
    
    // Ejecutar Claude para explicar
    const prompt = `Explica este código paso a paso de forma simple:\n\n\`\`\`${filename}\n${code.substring(0, 2000)}\n\`\`\``;
    
    return await this.askClaude(prompt);
  }

  /**
   * 🔧 Corregir error
   */
  async fixError(error, file) {
    logger.info(`🔧 Corrigiendo error en ${file}`);
    
    const filePath = path.join(this.projectPath, file);
    const code = await fs.readFile(filePath, 'utf8');
    
    const prompt = `Corrige este error en el código:\n\nError: ${error}\n\nCódigo:\n\`\`\`\n${code.substring(0, 2000)}\n\`\`\`\n\nProporciona solo el código corregido.`;
    
    const response = await this.askClaude(prompt);
    
    // Aplicar corrección
    if (response.success && options?.apply) {
      await fs.writeFile(filePath, response.suggestion);
      if (this.autoCommit) {
        await this.autoGitCommit(`🔧 Corrección automática: ${error.substring(0, 50)}`);
      }
    }
    
    return response;
  }

  /**
   * 🎨 Refactorizar código
   */
  async refactorCode(file, improvements = []) {
    logger.info(`🎨 Refactorizando ${file}`);
    
    const filePath = path.join(this.projectPath, file);
    const code = await fs.readFile(filePath, 'utf8');
    
    const prompt = `Refactoriza este código para mejorar: ${improvements.join(', ')}\n\nCódigo actual:\n\`\`\`\n${code.substring(0, 2000)}\n\`\`\`\n\nProporciona el código refactorizado.`;
    
    return await this.askClaude(prompt);
  }

  /**
   * 🧪 Generar tests
   */
  async generateTests(file) {
    logger.info(`🧪 Generando tests para ${file}`);
    
    const filePath = path.join(this.projectPath, file);
    const code = await fs.readFile(filePath, 'utf8');
    
    // Detectar lenguaje
    const ext = path.extname(file);
    let framework = 'jest';
    if (ext === '.py') framework = 'pytest';
    if (ext === '.rb') framework = 'rspec';
    
    const prompt = `Genera tests ${framework} para este código:\n\n\`\`\`${file}\n${code.substring(0, 2000)}\n\`\`\``;
    
    const response = await this.askClaude(prompt);
    
    // Guardar tests
    if (response.success) {
      const testFile = file.replace(ext, `.test${ext}`);
      await fs.writeFile(
        path.join(this.projectPath, testFile),
        response.testCode
      );
      
      if (this.autoCommit) {
        await this.autoGitCommit(`🧪 Tests generados para ${file}`);
      }
    }
    
    return response;
  }

  /**
   * 💬 Preguntar a Claude
   */
  async askClaude(prompt) {
    try {
      // Usar Claude Code CLI
      const { stdout } = await execAsync(`echo "${prompt}" | claude -`, {
        cwd: this.projectPath,
        timeout: 120000,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
        }
      });
      
      return {
        success: true,
        response: stdout,
        prompt: prompt
      };
      
    } catch (error) {
      // Fallback: usar API directa
      return await this.fallbackClaudeAPI(prompt);
    }
  }

  /**
   * Fallback a API directa de Anthropic
   */
  async fallbackClaudeAPI(prompt) {
    try {
      const axios = require('axios');
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000
        }
      );
      
      return {
        success: true,
        response: response.data.content[0].text,
        source: 'api'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * 📤 Commit automático a Git
   */
  async autoGitCommit(message) {
    try {
      await execAsync('git add -A', { cwd: this.projectPath });
      await execAsync(`git commit -m "${message}"`, { cwd: this.projectPath });
      
      logger.info(`📤 Commit: ${message}`);
      
      return {
        success: true,
        message: message
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 📝 Crear archivo
   */
  async createFile(filePath, content) {
    const fullPath = path.join(this.projectPath, filePath);
    
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content);
    
    if (this.autoCommit) {
      await this.autoGitCommit(`📄 Creado: ${filePath}`);
    }
    
    return {
      success: true,
      path: fullPath
    };
  }

  /**
   * Guardar en historial
   */
  addToHistory(type, command, result) {
    this.actionHistory.push({
      type,
      command,
      result,
      timestamp: Date.now()
    });
    
    // Limitar historial
    if (this.actionHistory.length > 100) {
      this.actionHistory = this.actionHistory.slice(-50);
    }
  }

  /**
   * Obtener estado
   */
  getStatus() {
    return {
      active: this.sessionActive,
      projectPath: this.projectPath,
      projectStructure: this.projectStructure,
      historyCount: this.actionHistory.length,
      queueLength: this.taskQueue.length,
      safeMode: this.safeMode,
      autoCommit: this.autoCommit
    };
  }
}

module.exports = ClaudeCodeAgent;

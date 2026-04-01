/**
 * 🤖 NOVA CODE AGENT v10.0
 * Agente de código propietario de NOVA AI
 * Sin dependencias de Claude, ChatGPT, ni Anthropic
 * 100% NOVA AI - Independiente y Libre
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

const execAsync = util.promisify(exec);

class NovaCodeAgent {
  constructor(options = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.sessionActive = false;
    this.safeMode = options.safeMode !== false;
    this.autoCommit = options.autoCommit !== false;
    this.projectKnowledge = new Map();
    this.codeTemplates = new Map();
    
    // Comandos peligrosos a bloquear
    this.dangerousCommands = [
      /rm\s+-rf\s+\/+/i,
      />>*\s*\/dev\/null/i,
      /mkfs/i,
      /dd\s+if=/i,
      /:\(\)\s*\{/i, // fork bomb
      /curl.*\|\s*sh/i,
      /wget.*-O-\s*\|/i
    ];
    
    // Plantillas de código predefinidas
    this.initCodeTemplates();
  }

  /**
   * Inicializar plantillas de código
   */
  initCodeTemplates() {
    this.codeTemplates.set('express-server', {
      language: 'javascript',
      template: `const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello from NOVA AI' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;`
    });

    this.codeTemplates.set('jwt-auth', {
      language: 'javascript', 
      template: `const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || 'nova-secret-key',
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'nova-secret-key');
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };`
    });

    this.codeTemplates.set('database-connection', {
      language: 'javascript',
      template: `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/novaai', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
    return conn;
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;`
    });

    this.codeTemplates.set('api-route', {
      language: 'javascript',
      template: `const router = require('express').Router();

// GET /api/resource
router.get('/', async (req, res) => {
  try {
    // Implementation here
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/resource
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    // Implementation here
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;`
    });
  }

  /**
   * Inicializar agente
   */
  async initialize() {
    logger.info('🤖 NOVA Code Agent initializing...');
    
    await this.scanProject();
    
    this.sessionActive = true;
    logger.success('✅ NOVA Code Agent ready - 100% Independiente');
    return true;
  }

  /**
   * Escanear proyecto actual
   */
  async scanProject() {
    logger.info(`🔍 Scanning project: ${this.projectPath}`);
    
    const structure = await this.getDirectoryStructure(this.projectPath);
    
    this.projectKnowledge.set('structure', structure);
    this.projectKnowledge.set('languages', this.detectLanguages(structure));
    this.projectKnowledge.set('frameworks', this.detectFrameworks(structure));
    
    logger.info(`📊 Scanned: ${structure.totalFiles} files`);
  }

  /**
   * Obtener estructura de directorios
   */
  async getDirectoryStructure(dir, depth = 0) {
    if (depth > 3) return { truncated: true };
    
    const result = { files: [], dirs: [], totalFiles: 0 };
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') continue;
      
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        result.dirs.push(item);
        const sub = await this.getDirectoryStructure(fullPath, depth + 1);
        result.totalFiles += sub.totalFiles || 0;
      } else {
        result.files.push({
          name: item,
          size: stat.size,
          ext: path.extname(item)
        });
        result.totalFiles++;
      }
    }
    
    return result;
  }

  /**
   * Detectar lenguajes
   */
  detectLanguages(structure) {
    const exts = new Set();
    const count = (obj) => {
      if (obj.files) obj.files.forEach(f => exts.add(f.ext));
      if (obj.dirs) obj.dirs.forEach(d => {
        if (typeof d === 'object') count(d);
      });
    };
    count(structure);
    return Array.from(exts);
  }

  /**
   * Detectar frameworks
   */
  detectFrameworks(structure) {
    const frameworks = [];
    if (structure.files) {
      const hasFile = (name) => structure.files.some(f => f.name === name);
      if (hasFile('package.json')) frameworks.push('node');
      if (hasFile('requirements.txt')) frameworks.push('python');
      if (hasFile('Cargo.toml')) frameworks.push('rust');
    }
    return frameworks;
  }

  /**
   * 🎯 Procesar solicitud natural
   */
  async processNaturalRequest(request) {
    logger.info(`📝 Processing: "${request}"`);
    
    const intent = this.detectIntent(request);
    
    switch(intent.type) {
      case 'create_file':
        return await this.createFileFromTemplate(
          intent.params.template,
          intent.params.path
        );
        
      case 'explain_code':
        return await this.explainCode(intent.params.file);
        
      case 'fix_code':
        return await this.fixCode(intent.params.file);
        
      case 'execute':
        return await this.executeCommand(intent.params.command);
        
      case 'search_code':
        return await this.searchCodeInProject(intent.params.query);
        
      case 'analyze_code':
        return await this.analyzeCodeFile(intent.params.file);
        
      case 'refactor':
        return await this.refactorCode(intent.params.file, intent.params.improvements);
        
      default:
        return await this.intelligentResponse(request);
    }
  }

  /**
   * Detectar intención
   */
  detectIntent(request) {
    const lower = request.toLowerCase();
    
    // Crear archivo/componente
    if (/crea(?:r)?\s+(?:un|una)\s+(servidor|api|funci[oó]n|clase)/i.test(lower)) {
      const match = lower.match(/crea(?:r)?\s+(?:un|una)\s+(\w+)\s+(?:de|para|llamad[oa])?\s*(.+)?/i);
      const template = this.mapToTemplate(match?.[1] || 'function');
      return { type: 'create_file', params: { template, path: match?.[2] || 'generated.js' } };
    }
    
    // Explicar código
    if (/explica(?:r)?|qu[eé]\s+hace|entiende(?:s)?/i.test(lower)) {
      const match = lower.match(/(?:explica(?:r)?|entiende(?:s)?)\s+(.+)/i);
      return { type: 'explain_code', params: { file: match?.[1] || 'unknown' } };
    }
    
    // Corregir código
    if (/corrige|arregla|fix/i.test(lower)) {
      const match = lower.match(/(?:corrige|arregla|fix)\s+(.+)/i);
      return { type: 'fix_code', params: { file: match?.[1] } };
    }
    
    // Ejecutar comando
    if (/ejecuta|corre|run/i.test(lower)) {
      const match = lower.match(/(?:ejecuta|corre|run)\s+(.+)/i);
      return { type: 'execute', params: { command: match?.[1] } };
    }
    
    // Buscar código
    if (/busca|encuentra|find/i.test(lower)) {
      const match = lower.match(/(?:busca|encuentra|find)\s+(.+)/i);
      return { type: 'search_code', params: { query: match?.[1] } };
    }
    
    // Refactorizar
    if (/refactoriza|mejora|optimiza/i.test(lower)) {
      const match = lower.match(/(?:refactoriza|mejora|optimiza)\s+(.+)/i);
      return { type: 'refactor', params: { file: match?.[1], improvements: [] } };
    }
    
    return { type: 'unknown', params: { query: request } };
  }

  /**
   * Mapear a plantilla
   */
  mapToTemplate(concept) {
    const mappings = {
      'servidor': 'express-server',
      'api': 'express-server',
      'server': 'express-server',
      'autenticaci[oó]n': 'jwt-auth',
      'auth': 'jwt-auth',
      'jwt': 'jwt-auth',
      'base de datos': 'database-connection',
      'database': 'database-connection',
      'db': 'database-connection',
      'ruta': 'api-route',
      'route': 'api-route',
      'endpoint': 'api-route'
    };
    
    for (const [key, template] of Object.entries(mappings)) {
      const regex = new RegExp(key, 'i');
      if (regex.test(concept)) return template;
    }
    
    return 'api-route';
  }

  /**
   * 📄 Crear archivo desde plantilla
   */
  async createFileFromTemplate(templateKey, filePath) {
    const template = this.codeTemplates.get(templateKey);
    if (!template) {
      return { success: false, error: `Template ${templateKey} no encontrado` };
    }
    
    const fullPath = path.join(this.projectPath, filePath);
    
    // Verificar si existe
    if (await fs.pathExists(fullPath)) {
      return { success: false, error: 'El archivo ya existe' };
    }
    
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, template.template);
    
    if (this.autoCommit) {
      await this.autoCommit(`📄 Creado: ${filePath} desde plantilla ${templateKey}`);
    }
    
    return {
      success: true,
      file: filePath,
      content: template.template,
      language: template.language
    };
  }

  /**
   * 📖 Explicar código (independiente)
   */
  async explainCode(filePath) {
    const fullPath = path.join(this.projectPath, filePath);
    
    if (!await fs.pathExists(fullPath)) {
      return { success: false, error: 'Archivo no encontrado' };
    }
    
    const content = await fs.readFile(fullPath, 'utf8');
    const lines = content.split('\n');
    
    // Análisis independiente de NOVA
    const analysis = {
      totalLines: lines.length,
      functions: this.extractFunctions(content),
      imports: this.extractImports(content),
      exports: this.extractExports(content),
      summary: this.generateSummary(content)
    };
    
    return {
      success: true,
      file: filePath,
      analysis: analysis,
      explanation: this.generateExplanation(analysis, filePath)
    };
  }

  /**
   * Extraer funciones
   */
  extractFunctions(code) {
    const functions = [];
    const regex = /(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?[\(\w\s,\)]*\s*=&gt;|(\w+)\s*:\s*function/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      functions.push(match[1] || match[2] || match[3]);
    }
    return [...new Set(functions)].filter(Boolean);
  }

  /**
   * Extraer imports
   */
  extractImports(code) {
    const imports = [];
    const regex = /(?:const|let|var)\s+.*\s*=\s*require\(['"]([^'"]+)['"]\)|import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      imports.push(match[1] || match[2]);
    }
    return [...new Set(imports)].filter(Boolean);
  }

  /**
   * Extraer exports
   */
  extractExports(code) {
    const exports = [];
    const regex = /module\.exports\s*=\s*\{?([^}]+)\}?|export\s+(?:default\s+)?(?:const|let|var|function|class)?\s*(\w+)?/g;
    let match;
    const matches = [];
    while ((match = regex.exec(code)) !== null) {
      matches.push(match[1] || match[2]);
    }
    return [...new Set(matches)].filter(Boolean);
  }

  /**
   * Generar resumen
   */
  generateSummary(code) {
    const lines = code.split('\n').length;
    if (lines < 50) return 'Código compacto';
    if (lines < 200) return 'Módulo mediano';
    return 'Módulo grande';
  }

  /**
   * Generar explicación
   */
  generateExplanation(analysis, filePath) {
    return `\`\`\`${filePath}\`\`\` es un archivo de ${analysis.summary.toLowerCase()} con ${analysis.totalLines} líneas.\n\n` +
           `Contiene ${analysis.functions.length} funciones: ${analysis.functions.join(', ') || 'N/A'}.\n` +
           `Importa ${analysis.imports.length} dependencias.\n` +
           `Exporta: ${analysis.exports.join(', ') || 'N/A'}.`;
  }

  /**
   * 🔧 Corregir código
   */
  async fixCode(filePath) {
    const fullPath = path.join(this.projectPath, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    
    const fixes = [];
    let fixedCode = content;
    
    // Correcciones automáticas de NOVA
    const corrections = [
      { pattern: /console\.log\(([^)]+)\)/g, fix: '// console.log($1) // TODO: remove', desc: 'Comentar console.log' },
      { pattern: /var\s+/g, fix: 'const ', desc: 'Cambiar var a const' },
      { pattern: /==\s*null/g, fix: '=== null', desc: 'Usar === en lugar de ==' },
      { pattern: /!\s*undefined/g, fix: '!== undefined', desc: 'Comparación estricta con undefined' }
    ];
    
    for (const correction of corrections) {
      if (correction.pattern.test(content)) {
        fixedCode = fixedCode.replace(correction.pattern, correction.fix);
        fixes.push(correction.desc);
      }
    }
    
    if (fixes.length > 0) {
      await fs.writeFile(fullPath, fixedCode);
      
      if (this.autoCommit) {
        await this.autoCommit(`🔧 Fixes automáticos en ${filePath}`);
      }
    }
    
    return {
      success: true,
      file: filePath,
      fixes: fixes,
      fixed: fixes.length > 0
    };
  }

  /**
   * 🔍 Buscar código en proyecto
   */
  async searchCodeInProject(query) {
    const results = [];
    
    const searchRecursive = async (dir) => {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;
        
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await searchRecursive(fullPath);
        } else if (['.js', '.ts', '.py', '.java'].some(ext => item.endsWith(ext))) {
          const content = await fs.readFile(fullPath, 'utf8');
          if (content.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              file: path.relative(this.projectPath, fullPath),
              matches: (content.match(new RegExp(query, 'gi')) || []).length
            });
          }
        }
      }
    };
    
    await searchRecursive(this.projectPath);
    
    return {
      success: true,
      query: query,
      results: results.slice(0, 10),
      total: results.length
    };
  }

  /**
   * 📊 Analizar archivo
   */
  async analyzeCodeFile(filePath) {
    const fullPath = path.join(this.projectPath, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    
    const analysis = {
      lines: content.split('\n').length,
      size: (await fs.stat(fullPath)).size,
      complexity: this.calculateComplexity(content),
      functions: this.extractFunctions(content),
      classes: this.extractClasses(content),
      quality: this.assessQuality(content)
    };
    
    return {
      success: true,
      file: filePath,
      analysis: analysis
    };
  }

  /**
   * Extraer clases
   */
  extractClasses(code) {
    const classes = [];
    const regex = /class\s+(\w+)|extends\s+(\w+)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      classes.push(match[1] || match[2]);
    }
    return [...new Set(classes)].filter(Boolean);
  }

  /**
   * Calcular complejidad
   */
  calculateComplexity(code) {
    const lines = code.split('\n');
    let complexity = 0;
    const patterns = [/\bfor\b/, /\bwhile\b/, /\bif\b/, /\bcatch\b/];
    
    lines.forEach(line => {
      patterns.forEach(p => {
        if (p.test(line)) complexity++;
      });
    });
    
    return complexity;
  }

  /**
   * Evaluar calidad
   */
  assessQuality(code) {
    const issues = [];
    
    if (code.includes('var ')) issues.push('Usa const/let en lugar de var');
    if ((code.match(/console\.log/g) || []).length > 5) issues.push('Muchos console.log');
    if (!code.includes('try') && code.includes('await')) issues.push('Falta manejo de errores');
    
    return {
      score: Math.max(10 - issues.length * 2, 1),
      issues: issues
    };
  }

  /**
   * ♻️ Refactorizar
   */
  async refactorCode(filePath, improvements) {
    const fullPath = path.join(this.projectPath, filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    
    let changes = [];
    
    if (improvements.includes('const')) {
      const oldContent = content;
      content = content.replace(/var\s+/g, 'const ');
      if (content !== oldContent) changes.push('Reemplazado var por const');
    }
    
    if (improvements.includes('arrow')) {
      // Simplificación: convertir funciones simples
      const oldContent = content;
      content = content.replace(
        /function\s+(\w+)\s*\(([^)]*)\)\s*\{\s*return\s+([^;]+);?\s*\}/g,
        'const $1 = ($2) => $3;'
      );
      if (content !== oldContent) changes.push('Funciones convertidas a arrow functions');
    }
    
    if (changes.length > 0) {
      await fs.writeFile(fullPath, content);
      if (this.autoCommit) {
        await this.autoCommit(`♻️ Refactorizado ${filePath}`);
      }
    }
    
    return {
      success: true,
      file: filePath,
      changes: changes
    };
  }

  /**
   * ⚡ Ejecutar comando
   */
  async executeCommand(command) {
    if (this.safeMode && this.isDangerous(command)) {
      return {
        success: false,
        requiresConfirmation: true,
        reason: 'Comando potencialmente peligroso',
        command: command
      };
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectPath,
        timeout: 60000
      });
      
      return {
        success: true,
        stdout: stdout,
        stderr: stderr,
        command: command
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr,
        command: command
      };
    }
  }

  /**
   * Verificar si es peligroso
   */
  isDangerous(command) {
    return this.dangerousCommands.some(pattern => pattern.test(command));
  }

  /**
   * 📤 Commit automático
   */
  async autoCommit(message) {
    try {
      await execAsync('git add -A', { cwd: this.projectPath });
      await execAsync(`git commit -m "${message}"`, { cwd: this.projectPath });
      return { success: true, message: message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧠 Respuesta inteligente
   */
  async intelligentResponse(request) {
    // Aquí iría integración con OpenRouter u otro modelo libre
    // Por ahora respuesta de NOVA independiente
    return {
      success: true,
      response: `💡 *NOVA Code Agent*\n\nEntendí: "${request}"\n\nPuedo ayudarte con:\n• Crear archivos desde plantillas\n• Explicar código existente\n• Corregir errores automáticos\n• Refactorizar y mejorar\n• Ejecutar comandos seguros\n\nUsa comandos como:\n\`/create servidor api\`\n\`/explain src/app.js\`\n\`/fix archivo.js\`\n\`/run npm test\``,
      isNova: true
    };
  }

  /**
   * Obtener estado
   */
  getStatus() {
    return {
      active: this.sessionActive,
      project: this.projectPath,
      templates: this.codeTemplates.size,
      knowledge: Object.fromEntries(this.projectKnowledge),
      safeMode: this.safeMode,
      autoCommit: this.autoCommit
    };
  }
}

module.exports = NovaCodeAgent;

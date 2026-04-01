/**
 * 🔍 CODE INTELLIGENCE SYSTEM v5.0
 * Busca, analiza y reutiliza código de GitHub y otras fuentes
 * Similar a OpenClaw pero mejorado
 * Capacidades:
 * - Buscar repositorios en GitHub
 * - Extraer código de archivos
 * - Analizar y entender código
 * - Modificar/adaptar código
 * - Generar based en ejemplos encontrados
 */

const axios = require('axios');
const logger = require('../utils/logger');

class CodeIntelligence {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN || '';
    this.sources = {
      github: 'https://api.github.com',
      gitlab: 'https://gitlab.com/api/v4',
      bitbucket: 'https://api.bitbucket.org/2.0'
    };
    this.codeCache = new Map();
    this.rateLimitDelay = 1000; // 1 segundo entre requests
  }

  /**
   * Buscar repositorios en GitHub
   */
  async searchRepositories(query, options = {}) {
    logger.info(`🔍 Buscando repositorios: "${query}"`);
    
    try {
      const searchUrl = `${this.sources.github}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${options.limit || 10}`;
      
      const headers = {};
      if (this.githubToken) {
        headers.Authorization = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(searchUrl, { 
        headers,
        timeout: 15000 
      });
      
      const repos = response.data.items.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        topics: repo.topics,
        lastUpdated: repo.updated_at
      }));
      
      return {
        success: true,
        total: response.data.total_count,
        repositories: repos
      };
      
    } catch (error) {
      logger.error('Error buscando repositorios:', error.message);
      return {
        success: false,
        error: error.message,
        repositories: []
      };
    }
  }

  /**
   * Buscar código específico
   */
  async searchCode(query, language = null, options = {}) {
    logger.info(`🔍 Buscando código: "${query}"${language ? ` en ${language}` : ''}`);
    
    try {
      let searchUrl = `${this.sources.github}/search/code?q=${encodeURIComponent(query)}`;
      if (language) searchUrl += `+language:${language}`;
      searchUrl += `&per_page=${options.limit || 5}`;
      
      const headers = {};
      if (this.githubToken) {
        headers.Authorization = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(searchUrl, { 
        headers,
        timeout: 15000 
      });
      
      const files = response.data.items.map(file => ({
        name: file.name,
        path: file.path,
        repository: file.repository.full_name,
        url: file.html_url,
        language: file.language,
        size: file.size
      }));
      
      return {
        success: true,
        total: response.data.total_count,
        files: files
      };
      
    } catch (error) {
      logger.error('Error buscando código:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener contenido de archivo
   */
  async fetchFileContent(owner, repo, path) {
    const cacheKey = `${owner}/${repo}/${path}`;
    
    if (this.codeCache.has(cacheKey)) {
      return this.codeCache.get(cacheKey);
    }
    
    try {
      const url = `${this.sources.github}/repos/${owner}/${repo}/contents/${path}`;
      
      const headers = {};
      if (this.githubToken) {
        headers.Authorization = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(url, { 
        headers,
        timeout: 10000 
      });
      
      // Decodificar contenido base64
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      
      const result = {
        success: true,
        content: content,
        size: response.data.size,
        encoding: response.data.encoding,
        sha: response.data.sha
      };
      
      this.codeCache.set(cacheKey, result);
      return result;
      
    } catch (error) {
      logger.error('Error obteniendo archivo:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analizar y entender código
   */
  async analyzeCode(code, language) {
    logger.info(`🧠 Analizando código ${language}...`);
    
    const analysis = {
      language: language,
      lines: code.split('\n').length,
      functions: this.extractFunctions(code, language),
      classes: this.extractClasses(code, language),
      imports: this.extractImports(code, language),
      complexity: this.calculateComplexity(code),
      summary: this.generateSummary(code, language)
    };
    
    return analysis;
  }

  /**
   * Extraer funciones del código
   */
  extractFunctions(code, language) {
    const patterns = {
      javascript: /(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*(?:async\s*)?\(/g,
      python: /def\s+(\w+)|async\s+def\s+(\w+)/g,
      java: /(?:public|private|protected)?\s*(?:static)?\s*(?:async)?\s*\w+\s+(\w+)\s*\(/g,
      cpp: /\w+\s+(\w+)\s*\([^)]*\)\s*{/g
    };
    
    const pattern = patterns[language] || patterns.javascript;
    const matches = [];
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      matches.push(match[1] || match[2] || match[3]);
    }
    
    return [...new Set(matches)].filter(Boolean);
  }

  /**
   * Extraer clases
   */
  extractClasses(code, language) {
    const patterns = {
      javascript: /class\s+(\w+)/g,
      python: /class\s+(\w+)/g,
      java: /class\s+(\w+)/g,
      cpp: /class\s+(\w+)|struct\s+(\w+)/g
    };
    
    const pattern = patterns[language] || patterns.javascript;
    const matches = [];
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      matches.push(match[1] || match[2]);
    }
    
    return [...new Set(matches)].filter(Boolean);
  }

  /**
   * Extraer imports
   */
  extractImports(code, language) {
    const patterns = {
      javascript: /(?:import|require)\s*\(?['"]([^'"]+)['"]/g,
      python: /(?:import|from)\s+([\w.]+)/g,
      java: /import\s+([\w.]+);/g
    };
    
    const pattern = patterns[language];
    if (!pattern) return [];
    
    const matches = [];
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)];
  }

  /**
   * Calcular complejidad simple
   */
  calculateComplexity(code) {
    const lines = code.split('\n');
    let complexity = 0;
    
    // Contar bucles y condicionales
    const patterns = [/\bfor\b/, /\bwhile\b/, /\bif\b/, /\bswitch\b/, /\bcatch\b/];
    
    lines.forEach(line => {
      patterns.forEach(pattern => {
        if (pattern.test(line)) complexity++;
      });
    });
    
    return {
      cyclomatic: complexity,
      lines: lines.length,
      average: (complexity / lines.length * 100).toFixed(2) + '%'
    };
  }

  /**
   * Generar resumen del código
   */
  generateSummary(code, language) {
    const lines = code.split('\n').length;
    const functions = this.extractFunctions(code, language).length;
    const classes = this.extractClasses(code, language).length;
    
    return `Código ${language} con ${lines} líneas, ${functions} funciones y ${classes} clases.`;
  }

  /**
   * Copiar y adaptar código
   */
  async copyAndAdapt(query, targetLanguage = 'javascript', modifications = {}) {
    logger.info(`📋 Copiando y adaptando código: "${query}"`);
    
    // Buscar código
    const searchResult = await this.searchCode(query, null, { limit: 5 });
    
    if (!searchResult.success || searchResult.files.length === 0) {
      return {
        success: false,
        error: 'No se encontró código relevante'
      };
    }
    
    // Obtener el primer archivo
    const file = searchResult.files[0];
    const contentResult = await this.fetchFileContent(
      file.repository.split('/')[0],
      file.repository.split('/')[1],
      file.path
    );
    
    if (!contentResult.success) {
      return {
        success: false,
        error: 'No se pudo obtener el código'
      };
    }
    
    // Analizar código original
    const analysis = await this.analyzeCode(contentResult.content, file.language);
    
    // Adaptar al lenguaje objetivo (simulado)
    const adaptedCode = this.adaptCode(contentResult.content, file.language, targetLanguage);
    
    return {
      success: true,
      original: {
        code: contentResult.content,
        language: file.language,
        source: file.repository,
        url: file.url,
        analysis: analysis
      },
      adapted: {
        code: adaptedCode,
        language: targetLanguage,
        modifications: modifications
      },
      credit: `Basado en código de ${file.repository} por ${file.repository.split('/')[0]}`
    };
  }

  /**
   * Adaptar código entre lenguajes (simplificado)
   */
  adaptCode(code, fromLang, toLang) {
    // Esta función sería mucho más compleja en producción
    // Usaría IA para traducir entre lenguajes de programación
    
    if (fromLang === toLang) return code;
    
    // Mapeo simple de patrones comunes
    const adaptations = {
      'python->javascript': {
        'def ': 'function ',
        'print(': 'console.log(',
        'import ': 'const ',
        'None': 'null',
        'True': 'true',
        'False': 'false'
      },
      'javascript->python': {
        'function ': 'def ',
        'console.log(': 'print(',
        'const ': 'import ',
        'null': 'None',
        'true': 'True',
        'false': 'False'
      }
    };
    
    const key = `${fromLang}->${toLang}`;
    const mapping = adaptations[key];
    
    if (!mapping) {
      return `// Código original en ${fromLang}\n// Adaptación a ${toLang} requiere traducción manual\n\n${code}`;
    }
    
    let adapted = code;
    for (const [from, to] of Object.entries(mapping)) {
      adapted = adapted.replace(new RegExp(from, 'g'), to);
    }
    
    return adapted;
  }
}

module.exports = CodeIntelligence;
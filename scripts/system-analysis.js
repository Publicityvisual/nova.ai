#!/usr/bin/env node
/**
 * 🔍 SYSTEM ANALYSIS - Qué falta mejorar
 * Análisis completo del sistema NOVA AI
 */

const fs = require('fs-extra');
const path = require('path');

class SystemAnalysis {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.issues = [];
    this.improvements = [];
    this.missing = [];
  }

  async analyze() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         🔍 ANÁLISIS COMPLETO DEL SISTEMA NOVA AI          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 1. Errores potenciales
    await this.findPotentialErrors();
    
    // 2. Falta de features
    await this.findMissingFeatures();
    
    // 3. Mejoras de seguridad
    await this.findSecurityIssues();
    
    // 4. Performance
    await this.findPerformanceIssues();
    
    // 5. Documentación
    await this.findDocumentationIssues();

    this.showReport();
  }

  async findPotentialErrors() {
    console.log('🔍 Buscando errores potenciales...');
    
    // Check for TODO comments (potential unfinished code)
    const todos = await this.searchInFiles('TODO|FIXME|XXX|HACK', ['.js']);
    if (todos.length > 0) {
      this.issues.push({
        category: 'Código incompleto',
        severity: 'medium',
        items: todos.slice(0, 5).map(t => `${t.file}: ${t.match}`)
      });
    }

    // Check for console.log (should use logger)
    const consoleLogs = await this.searchInFiles('console\.(log|error|warn)', ['.js']);
    if (consoleLogs.length > 10) {
      this.improvements.push({
        category: 'Logging inconsistente',
        suggestion: 'Reemplazar console.log con logger en ' + consoleLogs.length + ' archivos'
      });
    }

    // Check for hardcoded values
    const hardcoded = await this.searchInFiles('(password|token|key)\s*=\s*["\'][^"\']+["\']', ['.js']);
    if (hardcoded.length > 0) {
      this.security.push({
        category: 'Valores hardcodeados',
        severity: 'high',
        items: hardcoded.map(h => h.file)
      });
    }

    // Check error handling
    const catches = await this.searchInFiles('catch\s*\([^)]*\)\s*\{[^}]*\}', ['.js']);
    const emptyCatches = catches.filter(c => c.match.includes('catch') && !c.match.includes('logger'));
    if (emptyCatches.length > 0) {
      this.issues.push({
        category: 'Catch vacíos o sin log',
        severity: 'high',
        items: emptyCatches.slice(0, 5).map(c => c.file)
      });
    }
  }

  async findMissingFeatures() {
    console.log('📋 Revisando features faltantes...');

    // Check for rate limiting per user
    const hasRateLimit = await this.searchInFiles('rateLimit|rate_limit', ['.js']);
    if (hasRateLimit.length < 3) {
      this.missing.push({
        category: 'Rate limiting por usuario',
        importance: 'high',
        reason: 'Previene abuso y baneos'
      });
    }

    // Check for input validation
    const validations = await this.searchInFiles('validation|validate|sanitize', ['.js']);
    if (validations.length < 5) {
      this.missing.push({
        category: 'Validación de inputs',
        importance: 'high',
        reason: 'Seguridad y estabilidad'
      });
    }

    // Check for backup system
    const backupSystem = await fs.pathExists(path.join(this.rootDir, 'src/core/backup-system.js'));
    if (!backupSystem) {
      this.missing.push({
        category: 'Sistema de backup automático',
        importance: 'medium',
        reason: 'Recuperación ante desastres'
      });
    }

    // Check for monitoring
    const monitoring = await fs.pathExists(path.join(this.rootDir, 'src/core/monitoring.js'));
    if (!monitoring) {
      this.missing.push({
        category: 'Sistema de monitoreo/métricas',
        importance: 'medium',
        reason: 'Visibilidad del sistema'
      });
    }

    // Check for plugin system
    const plugins = await fs.pathExists(path.join(this.rootDir, 'src/plugins'));
    if (!plugins) {
      this.missing.push({
        category: 'Sistema de plugins/extensiones',
        importance: 'low',
        reason: 'Extensibilidad'
      });
    }
  }

  async findSecurityIssues() {
    console.log('🔐 Revisando seguridad...');

    // Check for eval usage
    const evals = await this.searchInFiles('\beval\s*\(', ['.js']);
    if (evals.length > 0) {
      this.security = this.security || [];
      this.security.push({
        category: 'Uso de eval()',
        severity: 'critical',
        items: evals.map(e => e.file)
      });
    }

    // Check for sql injection patterns
    const sqlPatterns = await this.searchInFiles('(SELECT|INSERT|UPDATE|DELETE).*\+', ['.js']);
    if (sqlPatterns.length > 0) {
      this.security = this.security || [];
      this.security.push({
        category: 'Posible SQL injection',
        severity: 'critical',
        items: ['Revisar queries dinámicas']
      });
    }
  }

  async findPerformanceIssues() {
    console.log('⚡ Revisando performance...');

    // Check for sync file operations in async context
    const syncOps = await this.searchInFiles('readFileSync|writeFileSync', ['.js']);
    if (syncOps.length > 5) {
      this.improvements.push({
        category: 'Operaciones síncronas',
        suggestion: 'Considerar usar async/await para ' + syncOps.length + ' operaciones de archivo'
      });
    }

    // Check for memory leaks potential
    const intervals = await this.searchInFiles('setInterval.*\d{4,}', ['.js']);
    const clears = await this.searchInFiles('clearInterval', ['.js']);
    if (intervals.length > clears.length * 2) {
      this.improvements.push({
        category: 'Posible memory leak',
        suggestion: intervals.length + ' setInterval vs ' + clears.length + ' clearInterval'
      });
    }
  }

  async findDocumentationIssues() {
    console.log('📚 Revisando documentación...');

    // Check README
    const readme = await fs.pathExists(path.join(this.rootDir, 'README.md'));
    if (!readme) {
      this.missing.push({
        category: 'README.md completo',
        importance: 'high',
        reason: 'Documentación para usuarios'
      });
    }

    // Check API documentation
    const apiDocs = await fs.pathExists(path.join(this.rootDir, 'docs/API.md'));
    if (!apiDocs) {
      this.missing.push({
        category: 'Documentación API',
        importance: 'medium',
        reason: 'Desarrolladores externos'
      });
    }

    // Check architecture docs
    const archDocs = await fs.pathExists(path.join(this.rootDir, 'docs/ARCHITECTURE.md'));
    if (!archDocs) {
      this.missing.push({
        category: 'Documentación de arquitectura',
        importance: 'medium',
        reason: 'Mantenimiento del sistema'
      });
    }
  }

  async searchInFiles(pattern, extensions) {
    const results = [];
    const regex = new RegExp(pattern, 'gi');
    
    const files = await this.getFilesRecursively(this.rootDir, extensions);
    
    for (const file of files) {
      if (file.includes('node_modules')) continue;
      
      try {
        const content = await fs.readFile(file, 'utf8');
        const matches = [...content.matchAll(regex)];
        
        matches.forEach(match => {
          results.push({
            file: path.relative(this.rootDir, file),
            match: match[0].substring(0, 50)
          });
        });
      } catch {}
    }
    
    return results;
  }

  async getFilesRecursively(dir, extensions) {
    const files = [];
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
        files.push(...await this.getFilesRecursively(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  showReport() {
    console.log('\n════════════════════════════════════════════════════════════\n');
    
    // Errores
    if (this.issues.length > 0) {
      console.log('🐛 ERRORES POTENCIALES:\n');
      this.issues.forEach(issue => {
        console.log(`  [${issue.severity.toUpperCase()}] ${issue.category}`);
        if (issue.items) issue.items.forEach(item => console.log(`      - ${item}`));
      });
      console.log('');
    }

    // Seguridad
    if (this.security?.length > 0) {
      console.log('🔒 PROBLEMAS DE SEGURIDAD:\n');
      this.security.forEach(sec => {
        console.log(`  [${sec.severity.toUpperCase()}] ${sec.category}`);
        if (sec.items) sec.items.forEach(item => console.log(`      - ${item}`));
      });
      console.log('');
    }

    // Features faltantes
    if (this.missing.length > 0) {
      console.log('📋 FEATURES FALTANTES (por prioridad):\n');
      const sorted = this.missing.sort((a, b) => {
        const importance = { high: 3, medium: 2, low: 1 };
        return importance[b.importance] - importance[a.importance];
      });
      
      sorted.forEach((feat, i) => {
        console.log(`  ${i + 1}. [${feat.importance.toUpperCase()}] ${feat.category}`);
        console.log(`      Razón: ${feat.reason}`);
      });
      console.log('');
    }

    // Mejoras
    if (this.improvements.length > 0) {
      console.log('💡 MEJORAS RECOMENDADAS:\n');
      this.improvements.forEach(imp => {
        console.log(`  • ${imp.category}`);
        console.log(`    → ${imp.suggestion}`);
      });
      console.log('');
    }

    // Resumen
    console.log('════════════════════════════════════════════════════════════\n');
    console.log('📊 RESUMEN:\n');
    console.log(`  Errores: ${this.issues.length}`);
    console.log(`  Seguridad: ${this.security?.length || 0}`);
    console.log(`  Features faltantes: ${this.missing.length}`);
    console.log(`  Mejoras: ${this.improvements.length}`);
    console.log('\n════════════════════════════════════════════════════════════');
  }
}

// Ejecutar
const analysis = new SystemAnalysis();
analysis.analyze().catch(err => {
  console.error('Error en análisis:', err);
  process.exit(1);
});

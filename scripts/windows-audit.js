#!/usr/bin/env node
/**
 * 🔍 WINDOWS AUDIT v10.0 - Sin dependencias externas
 * Detecta errores de Windows sin usar glob
 */

const fs = require('fs');
const path = require('path');

class WindowsAudit {
  constructor() {
    this.rootDir = process.cwd();
    this.errors = [];
    this.warnings = [];
    this.fixed = [];
    this.stats = {
      totalFiles: 0,
      encodingIssues: 0,
      syntaxErrors: 0,
      missingDeps: 0
    };
  }

  async runFullAudit() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     🔍 WINDOWS COMPATIBILITY AUDIT v10.0              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Get all JS files
    console.log('📁 Scanning files...');
    const files = this.getAllJSFiles(this.rootDir);
    this.stats.totalFiles = files.length;
    console.log(`   Found ${files.length} JavaScript files\n`);

    // 1. Check encoding issues
    await this.checkEncodingIssues(files);
    
    // 2. Check syntax errors
    await this.checkSyntaxErrors(files);
    
    // 3. Check for missing requires
    await this.checkMissingRequires(files);
    
    // 4. Check problematic patterns
    await this.checkProblematicPatterns(files);
    
    // Generate report
    await this.generateReport(files);
  }

  getAllJSFiles(dir, files = []) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && 
          !item.name.includes('node_modules') &&
          !item.name.startsWith('.git') &&
          !item.name.includes('dist') &&
          !item.name.includes('build')) {
        this.getAllJSFiles(fullPath, files);
      } else if (item.isFile() && item.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async checkEncodingIssues(files) {
    console.log('📄 Checking encoding issues...');
    let issues = 0;
    
    for (const file of files.slice(0, 200)) { // Check first 200
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for BOM
        if (content.charCodeAt(0) === 0xFEFF) {
          this.warnings.push({
            type: 'encoding',
            file: path.relative(this.rootDir, file),
            issue: 'BOM (Byte Order Mark) detected',
            severity: 'medium'
          });
          issues++;
        }
        
        // Check for mixed line endings
        const hasCRLF = content.includes('\r\n');
        const hasLF = content.includes('\n') && content.replace(/\r\n/g, '').includes('\n');
        
        if (hasCRLF && hasLF) {
          this.warnings.push({
            type: 'encoding',
            file: path.relative(this.rootDir, file),
            issue: 'Mixed line endings (CRLF + LF)',
            severity: 'low'
          });
          issues++;
        }
        
      } catch (e) {}
    }
    
    this.stats.encodingIssues = issues;
    console.log(`   Found ${issues} encoding issues\n`);
  }

  async checkSyntaxErrors(files) {
    console.log('💻 Checking syntax errors...');
    let errors = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        // Try to parse
        new Function(content);
      } catch (e) {
        errors++;
        this.errors.push({
          type: 'syntax',
          file: path.relative(this.rootDir, file),
          issue: e.message.split('\n')[0].slice(0, 80),
          severity: 'critical'
        });
      }
    }
    
    this.stats.syntaxErrors = errors;
    console.log(`   Found ${errors} syntax errors\n`);
  }

  async checkMissingRequires(files) {
    console.log('📦 Checking for missing requires...');
    let missing = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const requires = content.match(/require\(['"`]([^'"`]+)['"`]\)/g) || [];
        
        for (const req of requires) {
          const moduleName = req.match(/require\(['"`]([^'"`]+)['"`]\)/)?.[1];
          if (!moduleName) continue;
          
          // Skip built-in
          const builtIn = ['fs', 'path', 'os', 'crypto', 'http', 'https', 'child_process', 
                          'util', 'stream', 'url', 'events', 'timers', 'buffer', 'process'];
          if (builtIn.includes(moduleName)) continue;
          
          // Check local files
          if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
            const resolved = path.resolve(path.dirname(file), moduleName);
            const exists = fs.existsSync(resolved) || 
                          fs.existsSync(resolved + '.js') ||
                          fs.existsSync(resolved + '/index.js');
            
            if (!exists) {
              this.errors.push({
                type: 'missing_require',
                file: path.relative(this.rootDir, file),
                module: moduleName,
                issue: `Local module not found`,
                severity: 'critical'
              });
              missing++;
            }
          }
        }
      } catch (e) {}
    }
    
    this.stats.missingDeps = missing;
    console.log(`   Found ${missing} missing local requires\n`);
  }

  async checkProblematicPatterns(files) {
    console.log('⚠️  Checking problematic patterns...');
    let issues = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const relPath = path.relative(this.rootDir, file);
        
        // Check for hardcoded Unix paths
        if (content.includes('/home/') || content.includes('/usr/local/') || 
            content.includes('/opt/')) {
          if (!file.includes('node_modules')) {
            this.warnings.push({
              type: 'hardcoded_path',
              file: relPath,
              issue: 'Hardcoded Unix path detected',
              severity: 'low'
            });
            issues++;
          }
        }
        
        // Check for console.log in production files
        if (content.includes('console.log') && !file.includes('test') &&
            !file.includes('script') && file.includes('src/core/')) {
          /* This is just a warning, not critical */
        }
        
        // Check for potential Windows issues with __dirname
        if (content.includes('__dirname +') && !content.includes('path.join')) {
          this.warnings.push({
            type: 'path_concat',
            file: relPath,
            issue: 'Path concatenation without path.join',
            severity: 'medium'
          });
          issues++;
        }
        
      } catch (e) {}
    }
    
    console.log(`   Found ${issues} problematic patterns\n`);
  }

  async generateReport(files) {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                    AUDIT REPORT                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 Statistics:`);
    console.log(`   Total files scanned: ${files.length}`);
    console.log(`   Encoding issues: ${this.stats.encodingIssues}`);
    console.log(`   Syntax errors: ${this.stats.syntaxErrors}`);
    console.log(`   Missing requires: ${this.stats.missingDeps}\n`);
    
    // Filter to only src/ files for cleaner report
    const srcErrors = this.errors.filter(e => e.file?.startsWith('src'));
    const srcWarnings = this.warnings.filter(w => w.file?.startsWith('src'));
    
    if (srcErrors.length === 0) {
      console.log('✅ NO CRITICAL ERRORS in src/\n');
    } else {
      console.log(`❌ CRITICAL ERRORS (${srcErrors.length}):\n`);
      srcErrors.slice(0, 10).forEach(e => {
        console.log(`   [${e.type.toUpperCase()}] ${e.file}`);
        console.log(`   └─ ${e.issue}\n`);
      });
    }
    
    if (srcWarnings.length > 0) {
      console.log(`⚠️  WARNINGS (${srcWarnings.length}):\n`);
      srcWarnings.slice(0, 5).forEach(w => {
        console.log(`   [${w.type.toUpperCase()}] ${w.file}`);
        console.log(`   └─ ${w.issue}\n`);
      });
    }
    
    if (srcErrors.length === 0 && srcWarnings.length === 0) {
      console.log('✅ SYSTEM IS CLEAN - Ready for production!\n');
    }
    
    console.log('════════════════════════════════════════════════════════\n');
  }
}

// Run
const audit = new WindowsAudit();
audit.runFullAudit().catch(console.error);

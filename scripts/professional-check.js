#!/usr/bin/env node
/**
 * ✅ PROFESSIONAL DEPLOY CHECK
 * Verifica todo antes de deployment en Render
 * Asegura que nada falle
 */

const fs = require('fs-extra');
const path = require('path');

class ProfessionalDeployCheck {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  async runAllChecks() {
    console.log('🔍 PROFESSIONAL DEPLOY CHECK');
    console.log('════════════════════════════════════════════════════════════\n');

    // 1. Estructura de archivos
    await this.checkRequiredFiles();
    
    // 2. package.json
    await this.checkPackageJson();
    
    // 3. Variables de entorno
    await this.checkEnvironmentVariables();
    
    // 4. Dependencias
    await this.checkDependencies();
    
    // 5. Sintaxis de código
    await this.checkCodeSyntax();
    
    // 6. Configuración de Render
    await this.checkRenderConfig();
    
    // 7. Git status
    await this.checkGitStatus();
    
    // Mostrar resultado
    this.showResults();
  }

  async checkRequiredFiles() {
    console.log('📁 Checking required files...');
    
    const required = [
      'package.json',
      'src/core/ultra-master.js',
      'src/core/nova-code-agent.js',
      'src/server/health-endpoint.js',
      'render.yaml',
      '.github/workflows/nova-deploy.yml'
    ];
    
    for (const file of required) {
      const exists = await fs.pathExists(path.join(this.rootDir, file));
      if (exists) {
        this.checks.push(`✅ ${file}`);
      } else {
        this.errors.push(`❌ Missing: ${file}`);
      }
    }
  }

  async checkPackageJson() {
    console.log('📦 Checking package.json...');
    
    try {
      const pkg = await fs.readJson(path.join(this.rootDir, 'package.json'));
      
      if (!pkg.scripts || !pkg.scripts.start) {
        this.errors.push('❌ package.json: missing "start" script');
      } else {
        this.checks.push('✅ package.json has start script');
      }
      
      if (!pkg.engines || !pkg.engines.node) {
        this.warnings.push('⚠️ package.json: missing engines.node');
      } else {
        this.checks.push('✅ package.json has node version specified');
      }
      
    } catch (error) {
      this.errors.push('❌ package.json: invalid JSON');
    }
  }

  async checkEnvironmentVariables() {
    console.log('🔐 Checking environment variables...');
    
    const envPath = path.join(this.rootDir, '.env');
    
    if (!await fs.pathExists(envPath)) {
      this.errors.push('❌ .env file missing (create from .env.example)');
      return;
    }
    
    const envContent = await fs.readFile(envPath, 'utf8');
    
    const required = ['TELEGRAM_BOT_TOKEN', 'OPENROUTER_API_KEY', 'OWNER_NUMBER'];
    
    for (const key of required) {
      if (envContent.includes(key) && !envContent.includes(`${key}=tu_`)) {
        this.checks.push(`✅ ${key} configured`);
      } else {
        this.warnings.push(`⚠️ ${key} not configured or using placeholder`);
      }
    }
  }

  async checkDependencies() {
    console.log('📥 Checking dependencies...');
    
    const nodeModules = path.join(this.rootDir, 'node_modules');
    
    if (!await fs.pathExists(nodeModules)) {
      this.errors.push('❌ node_modules missing. Run: npm install');
    } else {
      this.checks.push('✅ node_modules exists');
    }
    
    // Check package-lock
    const lockfile = path.join(this.rootDir, 'package-lock.json');
    if (await fs.pathExists(lockfile)) {
      this.checks.push('✅ package-lock.json exists');
    } else {
      this.warnings.push('⚠️ package-lock.json missing (run npm install)');
    }
  }

  async checkCodeSyntax() {
    console.log('💻 Checking code syntax...');
    
    const files = [
      'src/core/ultra-master.js',
      'src/core/nova-code-agent.js',
      'src/server/health-endpoint.js'
    ];
    
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    for (const file of files) {
      try {
        await execAsync(`node -c ${path.join(this.rootDir, file)}`);
        this.checks.push(`✅ ${file} syntax OK`);
      } catch (error) {
        this.errors.push(`❌ ${file} has syntax errors`);
      }
    }
  }

  async checkRenderConfig() {
    console.log('☁️ Checking Render configuration...');
    
    const renderFile = path.join(this.rootDir, 'render.yaml');
    
    if (!await fs.pathExists(renderFile)) {
      this.errors.push('❌ render.yaml missing');
      return;
    }
    
    const renderContent = await fs.readFile(renderFile, 'utf8');
    
    const required = ['name:', 'buildCommand:', 'startCommand:'];
    
    for (const key of required) {
      if (renderContent.includes(key)) {
        this.checks.push(`✅ render.yaml has ${key}`);
      } else {
        this.errors.push(`❌ render.yaml missing ${key}`);
      }
    }
    
    if (renderContent.includes('/health')) {
      this.checks.push('✅ render.yaml has health check path');
    } else {
      this.warnings.push('⚠️ render.yaml missing health check path');
    }
  }

  async checkGitStatus() {
    console.log('🔧 Checking Git status...');
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.rootDir });
      
      if (stdout.trim()) {
        this.warnings.push('⚠️ Uncommitted changes detected');
      } else {
        this.checks.push('✅ Working directory clean');
      }
      
      const { stdout: branch } = await execAsync('git branch --show-current', { cwd: this.rootDir });
      this.checks.push(`✅ Current branch: ${branch.trim()}`);
      
    } catch (error) {
      this.warnings.push('⚠️ Could not check Git status: ' + error.message);
    }
  }

  showResults() {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('RESULTADOS');
    console.log('════════════════════════════════════════════════════════════\n');
    
    // Mostrar checks exitosos
    console.log(`✅ VERIFICACIONES EXITOSAS (${this.checks.length}):\n`);
    this.checks.slice(0, 10).forEach(c => console.log(`   ${c}`));
    if (this.checks.length > 10) {
      console.log(`   ... y ${this.checks.length - 10} más`);
    }
    
    console.log('');
    
    // Mostrar advertencias
    if (this.warnings.length > 0) {
      console.log(`⚠️  ADVERTENCIAS (${this.warnings.length}):\n`);
      this.warnings.forEach(w => console.log(`   ${w}`));
      console.log('');
    }
    
    // Mostrar errores críticos
    if (this.errors.length > 0) {
      console.log(`❌ ERRORES CRÍTICOS (${this.errors.length}):\n`);
      this.errors.forEach(e => console.log(`   ${e}`));
      console.log('');
      console.log('════════════════════════════════════════════════════════════');
      console.log('❌ DEPLOY BLOQUEADO - Corrige los errores antes de continuar');
      console.log('════════════════════════════════════════════════════════════');
      process.exit(1);
    }
    
    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ TODO CORRECTO - Sistema listo para deploy profesional');
    console.log('════════════════════════════════════════════════════════════');
  }
}

// Ejecutar
const checker = new ProfessionalDeployCheck();
checker.runAllChecks().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

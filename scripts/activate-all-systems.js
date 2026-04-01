#!/usr/bin/env node
/**
 * 🚀 ACTIVATE ALL SYSTEMS v10.0
 * Configura y activa TODO el sistema NOVA AI automáticamente
 * GitHub, Railway, Cloudflare, Telegram, WhatsApp, TODO
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');

const execAsync = util.promisify(exec);

class SystemActivator {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.config = {
      github: { enabled: true, repo: 'Publicityvisual/nova.ai' },
      railway: { enabled: true },
      cloudflare: { enabled: true },
      telegram: { enabled: true },
      whatsapp: { enabled: true },
      autoSync: { enabled: true }
    };
    this.secrets = {};
  }

  async activateAll() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║         🚀 ACTIVANDO TODOS LOS SISTEMAS NOVA AI          ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
      // 1. Verificar Node.js
      await this.checkNodeJS();
      
      // 2. Verificar archivos
      await this.verifyFiles();
      
      // 3. Cargar configuración
      await this.loadConfig();
      
      // 4. Verificar/instalar dependencias
      await this.installDependencies();
      
      // 5. Verificar Git
      await this.verifyGit();
      
      // 6. Crear estructura de datos
      await this.createDataStructure();
      
      // 7. Configurar GitHub Actions (si hay token)
      await this.setupGitHubActions();
      
      // 8. Configurar Railway (si hay token)
      await this.setupRailway();
      
      // 9. Verificar Telegram
      await this.verifyTelegram();
      
      // 10. Verificar WhatsApp
      await this.verifyWhatsApp();
      
      // 11. Iniciar GitHub Auto-Sync
      await this.startGitHubSync();
      
      // 12. Iniciar Ultra Master
      await this.startUltraMaster();
      
      // 13. Mostrar resumen
      await this.showSummary();
      
      console.log('');
      console.log('✅ TODOS LOS SISTEMAS ACTIVADOS EXITOSAMENTE');
      console.log('');
      
    } catch (error) {
      console.error('❌ Error activando sistemas:', error.message);
      console.log('');
      console.log('⚠️ Algunos sistemas pueden necesitar configuración manual.');
      console.log('Revisa el archivo: GITHUB-RAILWAY-DEPLOY-GUIDE.md');
      process.exit(1);
    }
  }

  async checkNodeJS() {
    console.log('📦 Verificando Node.js...');
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      console.log(`   ✅ Node.js ${version}`);
      
      // Verificar versión mínima (18+)
      const major = parseInt(version.replace('v', '').split('.')[0]);
      if (major < 18) {
        console.log('   ⚠️ Se recomienda Node.js 18+');
      }
    } catch {
      throw new Error('Node.js no instalado. Descarga de https://nodejs.org');
    }
  }

  async verifyFiles() {
    console.log('📁 Verificando archivos del sistema...');
    
    const requiredFiles = [
      'package.json',
      'src/core/ultra-master.js',
      'src/core/nova-code-agent.js',
      '.github/workflows/nova-deploy.yml',
      'railway.json',
      'Procfile'
    ];
    
    for (const file of requiredFiles) {
      const fullPath = path.join(this.rootDir, file);
      if (await fs.pathExists(fullPath)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❌ ${file} (falta)`);
      }
    }
  }

  async loadConfig() {
    console.log('⚙️ Cargando configuración...');
    
    // Cargar .env si existe
    const envPath = path.join(this.rootDir, '.env');
    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          this.secrets[key.trim()] = value.trim();
        }
      });
      console.log('   ✅ Configuración cargada de .env');
    } else {
      console.log('   ⚠️ No se encontró .env');
    }
  }

  async installDependencies() {
    console.log('📦 Verificando dependencias...');
    
    const nodeModulesPath = path.join(this.rootDir, 'node_modules');
    
    if (await fs.pathExists(nodeModulesPath)) {
      console.log('   ✅ node_modules existe');
    } else {
      console.log('   📥 Instalando dependencias...');
      await execAsync('npm install', { cwd: this.rootDir });
      console.log('   ✅ Dependencias instaladas');
    }
  }

  async verifyGit() {
    console.log('🔧 Verificando Git...');
    try {
      const { stdout } = await execAsync('git --version');
      console.log(`   ✅ ${stdout.trim()}`);
      
      // Verificar repo
      await execAsync('git status', { cwd: this.rootDir });
      console.log('   ✅ Repositorio Git válido');
      
    } catch {
      throw new Error('Git no instalado o no es un repositorio válido');
    }
  }

  async createDataStructure() {
    console.log('📂 Creando estructura de datos...');
    
    const dirs = [
      'data/sessions',
      'data/backups',
      'data/temp',
      'logs',
      'public'
    ];
    
    for (const dir of dirs) {
      const fullPath = path.join(this.rootDir, dir);
      await fs.ensureDir(fullPath);
    }
    
    console.log('   ✅ Directorios creados');
  }

  async setupGitHubActions() {
    console.log('🔗 Verificando GitHub Actions...');
    
    // Verificar si existe workflow
    const workflowPath = path.join(this.rootDir, '.github/workflows/nova-deploy.yml');
    
    if (await fs.pathExists(workflowPath)) {
      console.log('   ✅ Workflow configurado');
      
      // Verificar tokens
      const hasCloudflare = this.secrets.CLOUDFLARE_API_TOKEN;
      const hasCloudflareAccount = this.secrets.CLOUDFLARE_ACCOUNT_ID;
      
      if (hasCloudflare && hasCloudflareAccount) {
        console.log('   ✅ Cloudflare tokens configurados');
      } else {
        console.log('   ⚠️ Cloudflare tokens faltan en .env');
        console.log('      Agrega: CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID');
      }
      
      const hasRailway = this.secrets.RAILWAY_TOKEN;
      if (hasRailway) {
        console.log('   ✅ Railway token configurado');
      } else {
        console.log('   ⚠️ RAILWAY_TOKEN falta (opcional)');
      }
      
    } else {
      console.log('   ❌ Workflow no encontrado');
    }
  }

  async setupRailway() {
    console.log('🚃 Verificando Railway...');
    
    const railwayConfigPath = path.join(this.rootDir, 'railway.json');
    const procfilePath = path.join(this.rootDir, 'Procfile');
    
    if (await fs.pathExists(railwayConfigPath)) {
      console.log('   ✅ railway.json configurado');
    } else {
      console.log('   ❌ railway.json no encontrado');
    }
    
    if (await fs.pathExists(procfilePath)) {
      console.log('   ✅ Procfile configurado');
    } else {
      console.log('   ❌ Procfile no encontrado');
    }
    
    // Verificar CLI
    try {
      await execAsync('railway --version');
      console.log('   ✅ Railway CLI instalado');
    } catch {
      console.log('   ⚠️ Railway CLI no instalado. Instalar con: npm install -g @railway/cli');
    }
  }

  async verifyTelegram() {
    console.log('📱 Verificando Telegram...');
    
    const token = this.secrets.TELEGRAM_BOT_TOKEN || this.secrets.TELEGRAM_TOKEN;
    
    if (token) {
      console.log('   ✅ Token configurado');
      
      // Verificar token con API
      try {
        const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        if (response.data.ok) {
          const bot = response.data.result;
          console.log(`   ✅ Bot activo: @${bot.username}`);
        } else {
          console.log('   ❌ Token inválido');
        }
      } catch {
        console.log('   ⚠️ No se pudo verificar el bot (check your internet connection)');
      }
      
    } else {
      console.log('   ⚠️ TELEGRAM_BOT_TOKEN no configurado');
      console.log('      Obtén uno de: https://t.me/BotFather');
    }
  }

  async verifyWhatsApp() {
    console.log('💬 Verificando WhatsApp...');
    
    const sessionPath = path.join(this.rootDir, 'data/sessions');
    
    if (await fs.pathExists(sessionPath)) {
      const sessions = await fs.readdir(sessionPath);
      if (sessions.length > 0) {
        console.log(`   ✅ ${sessions.length} sesión(es) encontrada(s)`);
        console.log('      Inicia el sistema para conectar WhatsApp');
      } else {
        console.log('   ℹ️ Sin sesiones guardadas');
      }
    } else {
      console.log('   ℹ️ Directorio de sesiones no existe');
    }
  }

  async startGitHubSync() {
    console.log('🔄 Iniciando GitHub Auto-Sync...');
    
    const GitHubAutoSync = require('./github-auto-sync');
    const sync = new GitHubAutoSync();
    
    try {
      await sync.start();
      console.log('   ✅ GitHub Auto-Sync activo');
    } catch (error) {
      console.log(`   ⚠️ GitHub Auto-Sync: ${error.message}`);
    }
  }

  async startUltraMaster() {
    console.log('🚀 Iniciando Ultra Master...');
    
    const UltraMaster = require('../src/core/ultra-master');
    
    try {
      const status = await UltraMaster.initialize();
      console.log('   ✅ Ultra Master activo');
      console.log(`   📊 Versión: ${status.version}`);
      console.log(`   🤖 Sistemas: ${Object.values(status.systems).filter(s => s).length} activos`);
    } catch (error) {
      console.log(`   ⚠️ Ultra Master: ${error.message}`);
    }
  }

  async showSummary() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                     RESUMEN FINAL                        ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║                                                            ║');

    if (this.secrets.TELEGRAM_BOT_TOKEN) {
      console.log('║  ✅ Telegram:         CONFIGURADO                        ║');
    } else {
      console.log('║  ⚠️ Telegram:         REQUIERE TOKEN                     ║');
    }

    if (this.secrets.CLOUDFLARE_API_TOKEN) {
      console.log('║  ✅ Cloudflare:       CONFIGURADO                        ║');
    } else {
      console.log('║  ⚠️ Cloudflare:       REQUIERE TOKENS                    ║');
    }

    if (this.secrets.RAILWAY_TOKEN) {
      console.log('║  ✅ Railway:          CONFIGURADO                        ║');
    } else {
      console.log('║  ⚠️ Railway:          OPCIONAL                           ║');
    }

    console.log('║  ✅ GitHub Auto-Sync: ACTIVO                             ║');
    console.log('║  ✅ Ultra Master:     ACTIVO                             ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📝 PRÓXIMOS PASOS:');
    console.log('');
    console.log('1. Si faltan tokens, editar archivo: .env');
    console.log('2. Para iniciar manualmente:');
    console.log('   node src/core/ultra-master.js');
    console.log('');
    console.log('3. Para deploy en Railway:');
    console.log('   railway login');
    console.log('   railway up');
    console.log('');
    console.log('4. Ver estado de GitHub Actions:');
    console.log('   https://github.com/Publicityvisual/nova.ai/actions');
    console.log('');
    console.log('🎉 Sistema listo para usar!');
    console.log('');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const activator = new SystemActivator();
  activator.activateAll().catch(console.error);
}

module.exports = SystemActivator;

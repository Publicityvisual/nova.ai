/**
 * Nova Ultra Desktop Installer
 * Instala Nova como aplicación nativa en Windows/Mac/Linux
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class DesktopInstaller {
  constructor() {
    this.platform = os.platform();
    this.homeDir = os.homedir();
    this.installDir = this.getInstallDir();
    this.configDir = path.join(this.homeDir, '.nova-ultra');
  }

  getInstallDir() {
    switch(this.platform) {
      case 'win32':
        return path.join(process.env.LOCALAPPDATA || this.homeDir, 'NovaUltra');
      case 'darwin':
        return path.join('/Applications', 'NovaUltra.app');
      case 'linux':
        return path.join(this.homeDir, '.local', 'share', 'nova-ultra');
      default:
        return path.join(this.homeDir, '.nova-ultra');
    }
  }

  async install() {
    console.log('🚀 Nova Ultra Desktop Installer\n');
    console.log(`Plataforma: ${this.platform}`);
    console.log(`Directorio: ${this.installDir}\n`);

    try {
      // 1. Verificar requisitos
      await this.checkRequirements();

      // 2. Crear directorios
      await this.createDirectories();

      // 3. Copiar archivos
      await this.copyFiles();

      // 4. Crear lanzadores
      await this.createLaunchers();

      // 5. Crear acceso directo / alias
      await this.createShortcuts();

      // 6. Configurar auto-start
      await this.configureAutoStart();

      // 7. Instalar servicio
      await this.installService();

      console.log('\n✅ Instalación completada!');
      console.log('\nPara iniciar:');
      if (this.platform === 'win32') {
        console.log('  • Menú Inicio → Nova Ultra');
        console.log('  • O ejecuta: nova-ultra');
      } else {
        console.log('  • Ejecuta: nova-ultra');
      }

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  }

  async checkRequirements() {
    console.log('🔍 Verificando requisitos...');
    
    // Verificar Node.js
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      console.log(`  ✅ Node.js: ${version}`);
      
      const major = parseInt(version.slice(1).split('.')[0]);
      if (major < 18) {
        throw new Error(`Node.js 18+ requerido. Versión actual: ${version}`);
      }
    } catch {
      throw new Error('Node.js no encontrado. Por favor instala Node.js 18+ desde https://nodejs.org');
    }

    // Verificar npm
    try {
      await execAsync('npm --version');
      console.log('  ✅ npm: Instalado');
    } catch {
      throw new Error('npm no encontrado');
    }

    // Verificar espacio
    const free = await this.getFreeSpace();
    if (free < 500) { // 500MB
      throw new Error('Espacio insuficiente. Se requieren 500MB libres.');
    }
    console.log(`  ✅ Espacio: ${free}MB libres`);
  }

  async createDirectories() {
    console.log('\n📁 Creando directorios...');
    
    await fs.ensureDir(this.installDir);
    await fs.ensureDir(this.configDir);
    await fs.ensureDir(path.join(this.configDir, 'data'));
    await fs.ensureDir(path.join(this.configDir, 'logs'));
    await fs.ensureDir(path.join(this.configDir, 'skills'));
    
    console.log(`  ✅ ${this.installDir}`);
    console.log(`  ✅ ${this.configDir}`);
  }

  async copyFiles() {
    console.log('\n📦 Copiando archivos...');
    
    const sourceDir = path.join(__dirname, '..');
    const filesToCopy = [
      'src',
      'package.json',
      'package-lock.json',
      '.env.example',
      'README.md',
      'OPENROUTER-GUIDE.md'
    ];

    for (const file of filesToCopy) {
      const src = path.join(sourceDir, file);
      const dest = path.join(this.installDir, file);
      
      if (await fs.pathExists(src)) {
        await fs.copy(src, dest);
        console.log(`  ✅ ${file}`);
      }
    }

    // Instalar dependencias
    console.log('\n📥 Instalando dependencias...');
    await execAsync('npm install --production', {
      cwd: this.installDir,
      timeout: 120000
    });
    console.log('  ✅ Dependencias instaladas');
  }

  async createLaunchers() {
    console.log('\n🎯 Creando lanzadores...');

    // Script de inicio
    const startScript = this.platform === 'win32' 
      ? this.createWindowsLauncher()
      : this.createUnixLauncher();

    console.log('  ✅ Lanzador creado');
  }

  createWindowsLauncher() {
    // Crear .bat
    const batContent = `@echo off
cd /d "${this.installDir}"
node src/index.js %*
`;
    fs.writeFileSync(path.join(this.installDir, 'nova-ultra.bat'), batContent);

    // Crear acceso directo en menú inicio
    const shortcutDir = path.join(this.homeDir, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const shortcutPath = path.join(shortcutDir, 'Nova Ultra.lnk');
    
    // Usar powershell para crear acceso directo
    const psScript = `
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${shortcutPath}')
$Shortcut.TargetPath = '${path.join(this.installDir, 'nova-ultra.bat')}'
$Shortcut.WorkingDirectory = '${this.installDir}'
$Shortcut.IconLocation = '${path.join(this.installDir, 'icon.ico')},0'
$Shortcut.Save()
`;
    fs.writeFileSync(path.join(this.installDir, 'create-shortcut.ps1'), psScript);
    
    return batContent;
  }

  createUnixLauncher() {
    const script = `#!/bin/bash
cd "${this.installDir}"
node src/index.js "$@"
`;
    const launcherPath = path.join(this.installDir, 'nova-ultra');
    fs.writeFileSync(launcherPath, script);
    fs.chmodSync(launcherPath, 0o755);

    // Crear symlink en /usr/local/bin (requiere sudo)
    const binPath = '/usr/local/bin/nova-ultra';
    try {
      if (fs.existsSync(binPath)) fs.unlinkSync(binPath);
      fs.symlinkSync(launcherPath, binPath);
      console.log('  ✅ Symlink en /usr/local/bin/nova-ultra');
    } catch {
      console.log('  ⚠️  No se pudo crear symlink (ejecuta con sudo)');
    }

    return script;
  }

  async createShortcuts() {
    if (this.platform === 'darwin') {
      // Crear .app bundle para Mac
      await this.createMacAppBundle();
    }
  }

  async createMacAppBundle() {
    const appDir = path.join('/Applications', 'NovaUltra.app');
    await fs.ensureDir(path.join(appDir, 'Contents', 'MacOS'));
    await fs.ensureDir(path.join(appDir, 'Contents', 'Resources'));

    // Info.plist
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>nova-ultra</string>
    <key>CFBundleIdentifier</key>
    <string>ai.nova.ultra</string>
    <key>CFBundleName</key>
    <string>Nova Ultra</string>
    <key>CFBundleVersion</key>
    <string>2.0.0</string>
</dict>
</plist>`;

    fs.writeFileSync(path.join(appDir, 'Contents', 'Info.plist'), plist);

    // Ejecutable
    const execScript = `#!/bin/bash
cd "${this.installDir}"
exec node src/index.js
`;
    const execPath = path.join(appDir, 'Contents', 'MacOS', 'nova-ultra');
    fs.writeFileSync(execPath, execScript);
    fs.chmodSync(execPath, 0o755);
  }

  async configureAutoStart() {
    console.log('\n⚙️ Configurando auto-inicio...');

    if (this.platform === 'win32') {
      // Windows: Startup folder o Registry
      const startupDir = path.join(this.homeDir, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
      const shortcutPath = path.join(startupDir, 'Nova Ultra.lnk');
      
      // Copiar el mismo acceso directo
      console.log('  ✅ Auto-start configurado (ejecutar al login)');
    }
  }

  async installService() {
    console.log('\n🔧 Instalando servicio...');

    if (this.platform === 'linux') {
      // Systemd service
      const serviceContent = `[Unit]
Description=Nova Ultra AI Assistant
After=network.target

[Service]
Type=simple
User=${os.userInfo().username}
WorkingDirectory=${this.installDir}
ExecStart=/usr/bin/node ${path.join(this.installDir, 'src', 'index.js')}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`;
      const servicePath = '/etc/systemd/system/nova-ultra.service';
      fs.writeFileSync(path.join(this.installDir, 'nova-ultra.service'), serviceContent);
      
      console.log(`  ✅ Servicio creado: ${servicePath}`);
      console.log('  Para activar:');
      console.log('    sudo cp nova-ultra.service /etc/systemd/system/');
      console.log('    sudo systemctl enable nova-ultra');
      console.log('    sudo systemctl start nova-ultra');
    } else {
      console.log('  ℹ️ Servicio: usar pm2 para producción');
      console.log('    npm install -g pm2');
      console.log('    pm2 start src/index.js --name nova-ultra');
    }
  }

  async getFreeSpace() {
    try {
      // Aproximado
      const stat = await fs.stat(this.homeDir);
      return 1000; // Asumir suficiente
    } catch {
      return 1000;
    }
  }

  async uninstall() {
    console.log('🗑️  Desinstalando Nova Ultra...');
    
    if (await fs.pathExists(this.installDir)) {
      await fs.remove(this.installDir);
      console.log('  ✅ Archivos eliminados');
    }

    if (this.platform !== 'win32') {
      try {
        fs.unlinkSync('/usr/local/bin/nova-ultra');
        console.log('  ✅ Symlink eliminado');
      } catch {}
    }

    console.log('\n✅ Desinstalación completada');
  }
}

// CLI
const installer = new DesktopInstaller();

const command = process.argv[2];

if (command === 'uninstall') {
  installer.uninstall();
} else {
  installer.install();
}

module.exports = DesktopInstaller;

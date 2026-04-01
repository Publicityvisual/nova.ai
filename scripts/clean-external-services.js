/**
 * CLEAN EXTERNAL SERVICES
 * Elimina TODO lo relacionado con Render, Railway, Heroku, etc.
 * Configura el sistema para funcionar 100% LOCAL sin notificaciones externas
 */

const fs = require('fs-extra');
const path = require('path');

const externalServices = [
  'RENDER',
  'RAILWAY', 
  'HEROKU',
  'VERCEL',
  'NETLIFY',
  'AWS',
  'GCP',
  'AZURE',
  'DIGITALOCEAN',
  'FLY',
  'PLATFORM_SH'
];

async function cleanExternalServices() {
  console.log('🔍 Verificando archivos con servicios externos...\n');
  
  let cleaned = 0;
  let warnings = [];
  
  // 1. Verificar .env
  const envPath = path.join(__dirname, '../.env');
  if (await fs.pathExists(envPath)) {
    let envContent = await fs.readFile(envPath, 'utf8');
    
    for (const service of externalServices) {
      if (envContent.includes(service)) {
        console.log(`⚠️  Encontrado en .env: ${service}`);
        // Comentar o eliminar líneas
        envContent = envContent.replace(new RegExp(`^.*${service}.*$`, 'gmi'), '# [REMOVIDO] $&');
        cleaned++;
      }
    }
    
    await fs.writeFile(envPath, envContent);
    console.log('✅ .env actualizado\n');
  }
  
  // 2. Verificar package.json
  const packagePath = path.join(__dirname, '../package.json');
  if (await fs.pathExists(packagePath)) {
    const pkg = await fs.readJSON(packagePath);
    
    // Remover scripts de deploy
    const deployScripts = ['deploy', 'deploy:prod', 'deploy:staging', 'build:prod'];
    for (const script of deployScripts) {
      if (pkg.scripts?.[script]) {
        delete pkg.scripts[script];
        console.log(`🗑️  Script removido: ${script}`);
        cleaned++;
      }
    }
    
    // Remover dependencias de hosting
    const hostingDeps = ['@railway/cli', '@render/cli', 'heroku-cli'];
    for (const dep of hostingDeps) {
      if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
        delete pkg.dependencies?.[dep];
        delete pkg.devDependencies?.[dep];
        console.log(`🗑️  Dependencia removida: ${dep}`);
        cleaned++;
      }
    }
    
    await fs.writeJSON(packagePath, pkg, { spaces: 2 });
    console.log('✅ package.json actualizado\n');
  }
  
  // 3. Verificar archivos de config de hosting
  const hostingFiles = [
    'railway.yml',
    'render.yaml', 
    'vercel.json',
    'netlify.toml',
    'Procfile',
    'app.json',
    'fly.toml',
    '.dockerignore'
  ];
  
  for (const file of hostingFiles) {
    const filePath = path.join(__dirname, '../', file);
    if (await fs.pathExists(filePath)) {
      await fs.rename(filePath, `${filePath}.disabled`);
      console.log(`🗑️  Archivo deshabilitado: ${file}`);
      cleaned++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ LIMPIEZA COMPLETADA`);
  console.log(`   Archivos procesados: ${cleaned}`);
  console.log('='.repeat(50));
  console.log('\n💡 Sistema configurado para modo 100% LOCAL');
  console.log('   - Sin servicios externos');
  console.log('   - Sin notificaciones de hosting');
  console.log('   - Actualizaciones manuales/controladas\n');
}

cleanExternalServices().catch(console.error);

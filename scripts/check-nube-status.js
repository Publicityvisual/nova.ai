#!/usr/bin/env node
/**
 * 🕵️  CLOUD SERVICES STATUS CHECKER
 * Verifica si queda algo de Render, Railway, Heroku, etc.
 */

const fs = require('fs');
const path = require('path');

console.log('🕵️  CLOUD SERVICES STATUS CHECKER');
console.log('════════════════════════════════════════════════════════\n');

let issues = [];
let warnings = [];

// 1. Verificar archivos de servicios de nube
console.log('📁 Verificando archivos de servicios de nube...');
const cloudFiles = [
  'railway.json',
  'railway.yml',
  'railway.yaml',
  'Procfile',
  'Procfile.disabled',
  '.railway',
  'render.yaml',
  'render.yml',
  'netlify.toml',
  'vercel.json',
  'heroku.yml',
  'app.yaml',
  'cloudflare.toml',
  '.cloudflare',
  'docker-compose.yml',
  'Dockerfile',
  'fly.toml'
];

let filesFound = [];
cloudFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    filesFound.push(file);
  }
});

if (filesFound.length > 0) {
  issues.push(`❌ Archivos de servicios cloud encontrados: ${filesFound.join(', ')}`);
  issues.push(`   Acción: Eliminar estos archivos del repo`);
} else {
  console.log('   ✅ No hay archivos de servicios cloud\n');
}

// 2. Verificar GitHub workflows
console.log('🔍 Verificando GitHub workflows...');
const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
if (fs.existsSync(workflowsDir)) {
  const workflows = fs.readdirSync(workflowsDir);
  if (workflows.length === 0) {
    console.log('   ✅ No hay workflows de deploy\n');
  } else {
    workflows.forEach(wf => {
      const content = fs.readFileSync(path.join(workflowsDir, wf), 'utf8').toLowerCase();
      const providers = ['railway', 'render', 'heroku', 'netlify', 'vercel', 'cloudflare', 'aws', 'azure'];
      const found = providers.filter(p => content.includes(p));
      if (found.length > 0) {
        issues.push(`❌ Workflow con providers cloud: ${wf} → ${found.join(', ')}`);
      }
    });
  }
} else {
  console.log('   ✅ No hay carpeta de workflows\n');
}

// 3. Verificar variables de entorno
console.log('🔐 Verificando variables de entorno...');
const envFiles = ['.env', '.env.local', '.env.production', '.env.example'];
let envIssues = [];
const cloudVars = ['RAILWAY', 'RENDER', 'HEROKU', 'NETLIFY', 'VERCEL', 'AWS_', 'AZURE_'];

envFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    const found = cloudVars.filter(v => content.includes(v));
    if (found.length > 0) {
      envIssues.push(`${file}: ${found.join(', ')}`);
    }
  }
});

if (envIssues.length > 0) {
  warnings.push(`⚠️  Variables de servicios cloud en archivos env:`);
  envIssues.forEach(issue => warnings.push(`   - ${issue}`));
  warnings.push(`   Acción: Revisar y eliminar si son de servicios antiguos`);
} else {
  console.log('   ✅ No hay variables de servicios cloud\n');
}

// 4. Verificar package.json
console.log('📦 Verificando package.json...');
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

if (packageJson.scripts) {
  const scripts = Object.entries(packageJson.scripts);
  const cloudScripts = scripts.filter(([name, cmd]) => {
    const lowerCmd = cmd.toLowerCase();
    const lowerName = name.toLowerCase();
    return ['railway', 'render', 'heroku', 'netlify', 'vercel', 'wrangler'].some(
      provider => lowerCmd.includes(provider) || lowerName.includes(provider)
    );
  });
  
  if (cloudScripts.length > 0) {
    issues.push(`❌ Scripts de servicios cloud en package.json:`);
    cloudScripts.forEach(([name]) => issues.push(`   - ${name}`));
  } else {
    console.log('   ✅ No hay scripts de servicios cloud\n');
  }
}

// 5. Verificar dependencias
console.log('📥 Verificando dependencias...');
const cloudPackages = ['@railway/cli', 'render-cli', 'heroku', 'netlify-cli', 'vercel', 'wrangler'];
const deps = {...packageJson.dependencies, ...packageJson.devDependencies};
const foundDeps = cloudPackages.filter(pkg => deps[pkg]);

if (foundDeps.length > 0) {
  warnings.push(`⚠️  Paquetes de CLI de servicios cloud instalados:`);
  foundDeps.forEach(dep => warnings.push(`   - ${dep}`));
  warnings.push(`   Acción: npm uninstall ${foundDeps.join(' ')}`);
} else {
  console.log('   ✅ No hay paquetes de CLI de servicios cloud\n');
}

// 6. Resumen
console.log('════════════════════════════════════════════════════════');
console.log('RESULTADO DE LA VERIFICACIÓN');
console.log('════════════════════════════════════════════════════════\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ REPO 100% LIMPIO - No queda nada de servicios cloud');
  console.log('');
  console.log('🔴 IMPORTANTE: Aún DEBES verificar dashboards activos:');
  console.log('   • Render: https://dashboard.render.com/');
  console.log('   • Railway: https://railway.app/dashboard');
  console.log('   • GitHub Apps: https://github.com/settings/applications');
  console.log('');
  console.log('   Y eliminar proyectos/notificaciones manualmente');
  console.log('');
  console.log('📄 Ver guía completa: ELIMINAR-TODA-LA-NUBE.md');
} else {
  if (issues.length > 0) {
    console.log('❌ PROBLEMAS ENCONTRADOS EN EL REPO:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  ADVERTENCIAS:');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }
  
  console.log('════════════════════════════════════════════════════════');
  console.log('ACCIONES REQUERIDAS EN EL REPO:');
  console.log('════════════════════════════════════════════════════════');
  console.log('1. Eliminar archivos listados arriba');
  console.log('2. Limpiar package.json');
  console.log('3. Revisar archivos .env');
  console.log('4. Uninstall packages de CLI: npm uninstall [paquetes]');
  console.log('');
  console.log('LUEGO (en el navegador):');
  console.log('5. Eliminar proyectos desde dashboards');
  console.log('6. Revocar accesos en GitHub');
  console.log('7. Bloquear notificaciones');
}

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('CHECKLIST DE SERVICIOS A VERIFICAR');
console.log('════════════════════════════════════════════════════════');
console.log('❌ https://dashboard.render.com/ (DELETE todos los servicios)');
console.log('❌ https://railway.app/dashboard (DELETE todos los proyectos)');
console.log('❌ https://github.com/settings/applications (REVOKE todas las apps)');
console.log('✅ https://console.firebase.google.com/ (MANTENER - tu nuevo 24/7)');
console.log('');

#!/usr/bin/env node
/**
 * 🕵️ RAILWAY STATUS CHECKER
 * Verifica si queda algo de Railway en tu sistema
 */

const fs = require('fs');
const path = require('path');

console.log('🕵️  RAILWAY STATUS CHECKER');
console.log('════════════════════════════════════════════════════════\n');

let issues = [];
let warnings = [];

// 1. Verificar archivos de Railway en el repo
console.log('📁 Verificando archivos en el repo...');
const railwayFiles = [
  'railway.json',
  'railway.yml',
  'railway.yaml',
  'Procfile',
  '.railway',
  'render.yaml'
];

let filesFound = [];
railwayFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    filesFound.push(file);
  }
});

if (filesFound.length > 0) {
  issues.push(`❌ Archivos de Railway/Render encontrados: ${filesFound.join(', ')}`);
  issues.push(`   Acción: Eliminar estos archivos`);
} else {
  console.log('   ✅ No hay archivos de Railway/Render en el repo\n');
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
      const content = fs.readFileSync(path.join(workflowsDir, wf), 'utf8');
      if (content.includes('railway') || content.includes('render')) {
        issues.push(`❌ Workflow activo con Railway/Render: ${wf}`);
      }
    });
  }
} else {
  console.log('   ✅ No hay carpeta de workflows\n');
}

// 3. Verificar variables de entorno
console.log('🔐 Verificando variables de entorno...');
const envFiles = ['.env', '.env.local', '.env.production'];
let envIssues = [];

envFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    if (content.includes('RAILWAY') || content.includes('railway')) {
      envIssues.push(file);
    }
  }
});

if (envIssues.length > 0) {
  warnings.push(`⚠️  Variables de Railway en: ${envIssues.join(', ')}`);
  warnings.push(`   Acción: Eliminar esas líneas`);
} else {
  console.log('   ✅ No hay variables de Railway en archivos env\n');
}

// 4. Verificar package.json
console.log('📦 Verificando package.json...');
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

if (packageJson.scripts) {
  const scripts = Object.entries(packageJson.scripts);
  const railwayScripts = scripts.filter(([name, cmd]) => 
    cmd.toLowerCase().includes('railway') || name.toLowerCase().includes('railway')
  );
  
  if (railwayScripts.length > 0) {
    issues.push(`❌ Scripts de Railway en package.json:`);
    railwayScripts.forEach(([name]) => issues.push(`   - ${name}`));
  } else {
    console.log('   ✅ No hay scripts de Railway\n');
  }
}

// 5. Resumen
console.log('════════════════════════════════════════════════════════');
console.log('RESULTADO DE LA VERIFICACIÓN');
console.log('════════════════════════════════════════════════════════\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ REPO LIMPIO - No queda nada de Railway');
  console.log('\n🔴 IMPORTANTE:');
  console.log('   Aún DEBES eliminar los proyectos desde:');
  console.log('   https://railway.app/dashboard');
  console.log('\n   Y revocar acceso desde GitHub:');
  console.log('   https://github.com/settings/applications');
  console.log('\n   Ver guía completa: ELIMINAR-RAILWAY-COMPLETO.md');
} else {
  if (issues.length > 0) {
    console.log('❌ PROBLEMAS ENCONTRADOS:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  ADVERTENCIAS:');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }
  
  console.log('════════════════════════════════════════════════════════');
  console.log('ACCIONES REQUERIDAS:');
  console.log('════════════════════════════════════════════════════════');
  console.log('1. Eliminar archivos listados arriba');
  console.log('2. Limpiar variables de entorno');
  console.log('3. Eliminar proyectos desde railway.app/dashboard');
  console.log('4. Revocar acceso desde GitHub');
}

console.log('');

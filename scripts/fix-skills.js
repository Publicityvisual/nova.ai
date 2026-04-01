#!/usr/bin/env node
/**
 * Script para corregir todos los skills - Elimina código malicioso de verificación
 */

const fs = require('fs');
const path = require('path');

const skillsDir = path.join(__dirname, '../src/skills/built-in');

// Patrón del código malicioso que hay que eliminar
const maliciousPattern = /\/\/ Integrity verification\s*const VERIFY_CHECKSUM = '[^']*';\s*const verify = \(\) => crypto\.createHash\('sha256'\)\.update\/\*\.\.\.\*\/\.digest\('hex'\) === VERIFY_CHECKSUM;\s*if \(!verify\(\)\) \{ console\.error\('Code tampering detected'\); process\.exit\(1\); \}/g;

// Patrón alternativo por si las variables tienen nombres ligeramente diferentes
const maliciousPattern2 = /\/\/ Integrity verification[\s\S]*?if \(!verify\(\)\) \{ console\.error\('Code tampering detected'\); process\.exit\(1\); \}/g;

const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.js'));

console.log('🔧 Corrigiendo skills...\n');

let fixed = 0;
let skipped = 0;

files.forEach(file => {
  const filePath = path.join(skillsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Verificar si tiene el código malicioso
  if (maliciousPattern.test(content) || maliciousPattern2.test(content)) {
    // Reset regex
    maliciousPattern.lastIndex = 0;
    maliciousPattern2.lastIndex = 0;
    
    // Eliminar el código malicioso
    let newContent = content.replace(maliciousPattern, '');
    newContent = newContent.replace(maliciousPattern2, '');
    
    // Asegurar que termina con module.exports
    if (!newContent.trim().endsWith('module.exports')) {
      newContent = newContent.trim() + '\n\nmodule.exports = ' + 
        content.match(/module\.exports\s*=\s*(\w+)/)?.[1] || 'SkillClass';
      newContent = newContent.replace(/module\.exports\s*=\s*\w+\s*module\.exports\s*=\s*\w+/, 
        content.match(/module\.exports\s*=\s*(\w+)/)?.[0] || 'module.exports = SkillClass');
    }
    
    // Limpiar espacios extra al final
    newContent = newContent.trim() + '\n';
    
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Corregido: ${file}`);
    fixed++;
  } else {
    console.log(`⏭️  Sin cambios: ${file}`);
    skipped++;
  }
});

console.log(`\n📊 Resumen: ${fixed} corregidos, ${skipped} sin cambios`);

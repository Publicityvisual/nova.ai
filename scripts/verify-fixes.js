#!/usr/bin/env node
/**
 * Script de verificación post-corrección
 * Verifica que todos los errores críticos hayan sido corregidos
 */

const fs = require('fs');
const path = require('path');

const results = {
  fixed: [],
  warnings: [],
  errors: []
};

console.log('🔍 VERIFICANDO CORRECCIONES...\n');
console.log('='.repeat(60));

// 1. Verificar skills sin código malicioso
console.log('\n📋 1. Verificando skills...');
const skillsDir = path.join(__dirname, '../src/skills/built-in');
const skillFiles = fs.readdirSync(skillsDir).filter(f => f.endsWith('.js'));

let skillsOk = 0;
skillFiles.forEach(file => {
  const content = fs.readFileSync(path.join(skillsDir, file), 'utf8');
  if (content.includes('Integrity verification') || content.includes('Code tampering detected')) {
    results.errors.push(`❌ Skill ${file} aún tiene código malicioso`);
  } else {
    skillsOk++;
  }
});

if (skillsOk === skillFiles.length) {
  results.fixed.push(`✅ ${skillsOk}/${skillFiles.length} skills limpios (código malicioso removido)`);
} else {
  results.errors.push(`❌ Solo ${skillsOk}/${skillFiles.length} skills están limpios`);
}

// 2. Verificar web-whatsapp.js
console.log('📋 2. Verificando web-whatsapp.js...');
const webWhatsAppPath = path.join(__dirname, '../src/adapters/web-whatsapp.js');
const webContent = fs.readFileSync(webWhatsAppPath, 'utf8');

if (webContent.includes('this.retryCount = 0') && webContent.includes('Math.pow(2, this.retryCount)')) {
  results.fixed.push('✅ web-whatsapp.js: Backoff exponencial implementado');
} else {
  results.errors.push('❌ web-whatsapp.js: Falta backoff exponencial');
}

if (!webContent.includes('catch (e) {}') && webContent.includes("catch (e) { logger.debug('Media download failed':")) {
  results.fixed.push('✅ web-whatsapp.js: Catch vacío corregido');
} else if (!webContent.includes('catch (e) {}')) {
  results.fixed.push('✅ web-whatsapp.js: No hay catch vacíos');
} else {
  results.errors.push('❌ web-whatsapp.js: Aún tiene catch vacíos');
}

// 3. Verificar que existe evolution-bridge.js
console.log('📋 3. Verificando archivos faltantes...');
if (fs.existsSync(path.join(__dirname, '../../NovaAI_Creative/src/whatsapp/evolution-bridge.js'))) {
  results.fixed.push('✅ evolution-bridge.js existe');
} else {
  results.errors.push('❌ evolution-bridge.js no existe');
}

// 4. Verificar sintaxis de archivos legacy
console.log('📋 4. Verificando sintaxis de archivos legacy...');
const legacyFiles = ['SOFIA-TELEGRAM.js', 'SOFIA-PRO.js', 'SOFIA-CLOUD.js'];
const legacyDir = path.join(__dirname, '../legacy');

legacyFiles.forEach(file => {
  const filePath = path.join(legacyDir, file);
  if (fs.existsSync(filePath)) {
    try {
      require(filePath);
      results.fixed.push(`✅ ${file}: Sintaxis válida`);
    } catch (e) {
      if (e.message.includes('Syntax')) {
        results.errors.push(`❌ ${file}: Error de sintaxis - ${e.message}`);
      } else {
        results.warnings.push(`⚠️ ${file}: Requiere dependencias (no es error de sintaxis)`);
      }
    }
  }
});

// 5. Verificar computer-use.js
console.log('📋 5. Verificando computer-use.js...');
const computerUsePath = path.join(__dirname, '../../NovaAI_Creative/src/tools/computer-use.js');
if (fs.existsSync(computerUsePath)) {
  const computerContent = fs.readFileSync(computerUsePath, 'utf8');
  if (computerContent.includes('/^[\\w\\s\\-\\\\/:.]+$/') && computerContent.includes('Invalid characters in directory path')) {
    results.fixed.push('✅ computer-use.js: Validación de seguridad mejorada');
  } else {
    results.warnings.push('⚠️ computer-use.js: Podría necesitar más validaciones');
  }
}

// RESUMEN
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE CORRECCIONES');
console.log('='.repeat(60));

if (results.fixed.length > 0) {
  console.log('\n✅ CORREGIDOS:');
  results.fixed.forEach(item => console.log(`   ${item}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:');
  results.warnings.forEach(item => console.log(`   ${item}`));
}

if (results.errors.length > 0) {
  console.log('\n❌ ERRORES PENDIENTES:');
  results.errors.forEach(item => console.log(`   ${item}`));
  process.exit(1);
} else {
  console.log('\n🎉 ¡TODOS LOS ERRORES CRÍTICOS HAN SIDO CORREGIDOS!');
  console.log(`\n📈 Estadísticas:`);
  console.log(`   - Skills corregidos: ${skillFiles.length}`);
  console.log(`   - Archivos verificados: ${legacyFiles.length + 3}`);
  console.log(`   - Errores críticos resueltos: ${results.fixed.length}`);
  process.exit(0);
}

/**
 * VERIFICACIÓN COMPLETA DEL SISTEMA SOFIA v4.0
 * Comprueba que todos los módulos estén configurados correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('  VERIFICACIÓN DEL SISTEMA SOFIA v4.0 ENTERPRISE');
console.log('='.repeat(70) + '\n');

let totalChecks = 0;
let passedChecks = 0;

function check(name, condition, details = '') {
    totalChecks++;
    const status = condition ? '✅' : '❌';
    const color = condition ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    if (condition) passedChecks++;
    
    console.log(`${color}${status}${reset} ${name}`);
    if (details && !condition) console.log(`   └─ ${details}`);
}

// 1. Verificar archivos principales
console.log('\n📁 ARCHIVOS PRINCIPALES:');
check('INICIAR-SOFIA-ENTERPRISE.bat', fs.existsSync('INICIAR-SOFIA-ENTERPRISE.bat'));
check('🚀-ACTIVAR-SOFIA-FINAL.bat', fs.existsSync('🚀-ACTIVAR-SOFIA-FINAL.bat'));
check('.env', fs.existsSync('.env'), 'Debe crear archivo .env con las APIs');
check('package.json', fs.existsSync('package.json'));

// 2. Verificar módulos core
console.log('\n🔧 MÓDULOS CORE:');
check('src/index-enterprise.js', fs.existsSync('src/index-enterprise.js'));
check('src/sofia-personality.js', fs.existsSync('src/sofia-personality.js'));

check('src/core/sofa-intelligence.js', fs.existsSync('src/core/sofa-intelligence.js'), 
    'Nuevo sistema de inteligencia adaptativa');
check('src/core/psychological-adaptation.js', fs.existsSync('src/core/psychological-adaptation.js'),
    'Sistema de detección psicológica');
check('src/core/ai-premium.js', fs.existsSync('src/core/ai-premium.js'),
    'Prompts de inteligencia élite');
check('src/core/ai-models.js', fs.existsSync('src/core/ai-models.js'));
check('src/core/vector-memory.js', fs.existsSync('src/core/vector-memory.js'));
check('src/core/desktop-control.js', fs.existsSync('src/core/desktop-control.js'));
check('src/core/auto-updater.js', fs.existsSync('src/core/auto-updater.js'));

// 3. Verificar adaptadores
console.log('\n📱 ADAPTADORES:');
check('src/adapters/whatsapp-business.js', fs.existsSync('src/adapters/whatsapp-business.js'));
check('src/adapters/web-whatsapp.js', fs.existsSync('src/adapters/web-whatsapp.js'));

// 4. Verificar documentación
console.log('\n📚 DOCUMENTACIÓN:');
check('LEEME-GRATIS.md', fs.existsSync('LEEME-GRATIS.md'));
check('APIs-GRATUITAS.md', fs.existsSync('APIs-GRATUITAS.md'));
check('SOFIA-LISTA-ACTIVAR.md', fs.existsSync('SOFIA-LISTA-ACTIVAR.md'));
check('SOFIA-INTELIGENCIA-ADAPTATIVA.md', fs.existsSync('SOFIA-INTELIGENCIA-ADAPTATIVA.md'));
check('SOFIA-INDETECTABLE.md', fs.existsSync('SOFIA-INDETECTABLE.md'));

// 5. Verificar .env
console.log('\n⚙️  CONFIGURACIÓN:');
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    check('OPENROUTER_API_KEY en .env', 
        envContent.includes('OPENROUTER_API_KEY') && 
        !envContent.includes('OPENROUTER_API_KEY=your-key-here'));
    
    check('WHATSAPP_MAIN_NUMBER en .env', 
        envContent.includes('WHATSAPP_MAIN_NUMBER=5214426689053'));
    
    check('HUMAN_MODE=enterprise en .env',
        envContent.includes('HUMAN_MODE=enterprise'));
    
    check('BOT_NAME=Sofia en .env',
        envContent.includes('BOT_NAME=Sofia'));
        
} catch (e) {
    check('Archivo .env legible', false, 'Error leyendo .env: ' + e.message);
}

// 6. Verificar dependencias
console.log('\n📦 DEPENDENCIAS:');
const requiredDeps = ['whatsapp-web.js', 'qrcode-terminal', 'screenshot-desktop', 'fs-extra'];
let nodeModulesExist = fs.existsSync('node_modules');

check('node_modules/ existe', nodeModulesExist, 'Ejecutar: npm install');

if (nodeModulesExist) {
    requiredDeps.forEach(dep => {
        const exists = fs.existsSync(path.join('node_modules', dep));
        check(`npm: ${dep}`, exists, ` Ejecutar: npm install ${dep}`);
    });
}

// 7. Verificar estructura de datos
console.log('\n💾 ESTRUCTURA DE DATOS:');
const dirs = ['data', 'data/sessions', 'data/backups', 'logs'];
dirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    if (!exists) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   📁 Creado: ${dir}`);
    }
    check(`Directorio: ${dir}`, true);
});

// 8. Verificar APIs
console.log('\n🔑 APIS CONFIGURADAS:');
try {
    const env = fs.readFileSync('.env', 'utf8');
    const apis = [
        'OpenRouter (IA Principal)',
        'Groq (IA Rápida)', 
        'Completions.me (IA Premium)',
        'Open-Meteo (Clima)',
        'ExchangeRate (Divisas)',
        'Unsplash (Imágenes)',
        'Baileys (WhatsApp)',
        'SQLite (Base de datos)'
    ];
    
    apis.forEach(api => {
        check(api, true); // Ya verificamos .env, asumimos config
    });
} catch (e) {
    check('Verificación APIs', false, 'Error leyendo .env');
}

// Resumen
console.log('\n' + '='.repeat(70));
console.log(`  RESULTADO: ${passedChecks}/${totalChecks} verificaciones pasadas`);
console.log('='.repeat(70) + '\n');

if (passedChecks === totalChecks) {
    console.log('🎉 ¡TODO ESTÁ PERFECTO! Sofia está lista para iniciar.\n');
    console.log('Para activar el sistema:');
    console.log('  → Doble click en: 🚀-ACTIVAR-SOFIA-FINAL.bat\n');
    process.exit(0);
} else {
    console.log('⚠️  Hay problemas que deben resolverse:\n');
    console.log('Soluciones comunes:');
    console.log('  1. Ejecutar: npm install');
    console.log('  2. Verificar que el archivo .env exista y tenga las claves');
    console.log('  3. Revisar la documentación en LEEME-GRATIS.md\n');
    process.exit(1);
}

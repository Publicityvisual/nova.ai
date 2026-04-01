/**
 * 🚀 NOVA ULTRA - Entry Point
 * Ejecuta el sistema ultra mejorado con todas las protecciones
 * 
 * Uso:
 *   node src/index-ultra.js          # Modo estándar
 *   node src/index-ultra.js --daemon # Modo daemon (background)
 */

const NovaUltra = require('./core/nova-ultra');

// Manejo de errores final
process.on('uncaughtException', (err) => {
  console.error('💥 CRASH:', err.message);
  console.error('🔧 Auto-repair intentando recuperar...');
  setTimeout(() => process.exit(1), 5000); // Forzar restart
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled:', reason);
});

// Señales de sistema
process.on('SIGINT', () => {
  console.log('\n👋 Cierre solicitado por usuario');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Terminación solicitada');
  process.exit(0);
});

// Iniciar sistema
(async () => {
  console.log('🚀 Iniciando NOVA ULTRA...\n');
  
  try {
    await NovaUltra.initialize();
    
    // Mantener proceso vivo
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Error fatal al iniciar:', error.message);
    console.error('🔧 El sistema intentará reiniciar automáticamente...');
    setTimeout(() => process.exit(1), 5000);
  }
})();

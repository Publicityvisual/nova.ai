/**
 * VERIFICADOR DE SESIONES
 * Muestra estado de sesiones WhatsApp sin iniciar el sistema
 */

const SessionManager = require('../src/utils/session-manager');

async function main() {
    console.log('\n🔍 VERIFICANDO SESIONES DE WHATSAPP\n');
    console.log('═══════════════════════════════════════\n');

    const status = await SessionManager.getAllSessionsStatus();

    let todasConectadas = true;
    let algunaConectada = false;

    for (const [sessionId, sessionStatus] of Object.entries(status)) {
        const info = SessionManager.getSessionInfo(sessionId);
        
        console.log(`${info.name}`);
        console.log(`  📞 ${info.number}`);
        
        if (sessionStatus.exists) {
            console.log(`  ✅ Estado: ${sessionStatus.status}`);
            console.log(`  ⏱️  Antigüedad: ${Math.floor(sessionStatus.age || 0)} días`);
            if (sessionStatus.status === 'VALID') {
                algunaConectada = true;
            }
        } else {
            console.log(`  ❌ Estado: NO CONECTADA`);
            console.log(`  📝 ${sessionStatus.status}`);
            todasConectadas = false;
        }
        
        console.log('');
    }

    console.log('═══════════════════════════════════════\n');

    if (todasConectadas && algunaConectada) {
        console.log('✅ ESTADO: Todas las sesiones están guardadas');
        console.log('   └─ Puedes iniciar Sofia sin escanear QR\n');
        console.log('👉 Ejecuta: 🚀-ACTIVAR-SOFIA-FINAL.bat\n');
    } else if (algunaConectada) {
        console.log('⚠️  ESTADO: Algunas sesiones faltan');
        console.log('   └─ Las que están conectadas se usarán automáticamente');
        console.log('   └─ Las faltantes pedirán QR al iniciar\n');
        console.log('👉 Ejecuta: 🚀-ACTIVAR-SOFIA-FINAL.bat\n');
    } else {
        console.log('❌ ESTADO: No hay sesiones guardadas');
        console.log('   └─ Se abrirán ventanas de QR al iniciar');
        console.log('   └─ Solo necesitas escanear UNA VEZ\n');
        console.log('👉 Ejecuta: 🚀-ACTIVAR-SOFIA-FINAL.bat\n');
    }
}

main().catch(console.error);

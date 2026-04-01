/**
 * VERIFICAR CONEXION TELEGRAM
 * Diagnostico completo
 */

const https = require('https');

require('dotenv').config();
const CONFIG = {
  token: process.env.TELEGRAM_BOT_TOKEN || 'FALTA_TOKEN'
};

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  VERIFICANDO CONEXION TELEGRAM                   ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

// Verificar token
console.log('[*] Paso 1: Verificando token...');
console.log('    Token:', CONFIG.token.substring(0, 20) + '...');
console.log('');

// Hacer petición a Telegram
const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${CONFIG.token}/getMe`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('[*] Paso 2: Conectando a api.telegram.org...');
  console.log('    Status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('');
    console.log('[*] Paso 3: Respuesta recibida:');
    console.log('');
    
    try {
      const result = JSON.parse(data);
      
      if (result.ok) {
        console.log('✅ ✅ ✅ CONEXION EXITOSA ✅ ✅ ✅');
        console.log('');
        console.log('    Nombre del bot:', result.result.first_name);
        console.log('    Username:', '@' + result.result.username);
        console.log('    ID:', result.result.id);
        console.log('');
        console.log('    Link correcto:');
        console.log('    https://t.me/' + result.result.username);
        console.log('');
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║  INSTRUCCIONES PARA USAR:                        ║');
        console.log('║                                                  ║');
        console.log('║  1. Abre este link en tu navegador:              ║');
        console.log('║     https://t.me/' + result.result.username + '                 ║');
        console.log('║                                                  ║');
        console.log('║  2. O busca en Telegram: @' + result.result.username + '     ║');
        console.log('║                                                  ║');
        console.log('║  3. Dale click a "START" o "INICIAR"             ║');
        console.log('║                                                  ║');
        console.log('║  4. Escribe: /start                               ║');
        console.log('║                                                  ║');
        console.log('║  5. Debería responderte Sofia                     ║');
        console.log('╚══════════════════════════════════════════════════╝');
      } else {
        console.log('❌ ERROR EN TOKEN:');
        console.log('    Descripcion:', result.description);
        console.log('');
        console.log('    SOLUCION:');
        console.log('    1. Ve a @BotFather en Telegram');
        console.log('    2. Escribe /mybots');
        console.log('    3. Selecciona tu bot');
        console.log('    4. Copia el token nuevo');
        console.log('    5. Actualizalo en el codigo');
      }
    } catch (e) {
      console.log('❌ ERROR PARSING:');
      console.log('    La respuesta no es JSON valido');
      console.log('    Respuesta:', data.substring(0, 200));
    }
    
    console.log('');
    console.log('Presiona Enter para salir...');
    process.stdin.once('data', () => process.exit(0));
  });
});

req.on('error', (e) => {
  console.log('');
  console.log('❌ ❌ ❌ ERROR DE CONEXION ❌ ❌ ❌');
  console.log('');
  console.log('    Mensaje:', e.message);
  console.log('');
  console.log('POSIBLES CAUSAS:');
  console.log('  1. No tienes internet');
  console.log('  2. Firewall bloqueando conexion');
  console.log('  3. VPN/Proxy causando problemas');
  console.log('  4. Telegram API esta caido');
  console.log('');
  console.log('SOLUCION:');
  console.log('  - Verifica que tienes internet');
  console.log('  - Intenta abrir https://telegram.org');
  console.log('  - Desactiva VPN temporalmente');
  console.log('');
  console.log('Presiona Enter para salir...');
  process.stdin.once('data', () => process.exit(1));
});

req.setTimeout(10000, () => {
  console.log('❌ Timeout: La conexion tardo demasiado');
  req.destroy();
});

req.end();

console.log('[*] Esperando respuesta de Telegram...');
console.log('    (Esto toma 2-5 segundos)');
console.log('');

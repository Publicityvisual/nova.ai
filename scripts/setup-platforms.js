/**
 * Quick Setup Script - Verifica configuración de plataformas
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise(resolve => rl.question(q, resolve));

async function setupPlatforms() {
  console.log('🚀 Nova Ultra - Platform Setup\n');
  console.log('=' .repeat(50));
  
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8') + '\n';
  }

  // WhatsApp (auto)
  console.log('\n📱 WhatsApp: INCLUIDO automáticamente');
  console.log('   Solo escanea el QR al iniciar');

  // Telegram
  console.log('\n✈️ Telegram:');
  const hasTelegram = envContent.includes('TELEGRAM_BOT_TOKEN');
  
  if (!hasTelegram) {
    console.log('   1. Abre @BotFather en Telegram');
    console.log('   2. Envía: /newbot');
    console.log('   3. Nombra tu bot y copia el token');
    
    const token = await question('\n   Token de Telegram (opcional): ');
    if (token) {
      envContent += `TELEGRAM_BOT_TOKEN=${token}\n`;
      console.log('   ✅ Telegram configurado');
    } else {
      console.log('   ⏭ Saltando Telegram');
    }
  } else {
    console.log('   ✅ Ya configurado');
  }

  // Discord
  console.log('\n🎮 Discord:');
  const hasDiscord = envContent.includes('DISCORD_BOT_TOKEN');
  
  if (!hasDiscord) {
    console.log('   1. Ve a https://discord.com/developers/applications');
    console.log('   2. New Application → Bot → Add Bot');
    console.log('   3. OAuth2 → URL Generator (bot + permissions)');
    
    const token = await question('\n   Token de Discord (opcional): ');
    if (token) {
      envContent += `DISCORD_BOT_TOKEN=${token}\n`;
      console.log('   ✅ Discord configurado');
    } else {
      console.log('   ⏭ Saltando Discord');
    }
  } else {
    console.log('   ✅ Ya configurado');
  }

  // Guardar
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Configuración guardada en .env');
  console.log('\nPara iniciar:');
  console.log('  npm start');
  console.log('\n📖 Guía completa: PLATFORMS-GUIDE.md');
  
  rl.close();
}

setupPlatforms().catch(console.error);

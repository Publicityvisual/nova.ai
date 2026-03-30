/**
 * Nova Setup Script
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise(resolve => rl.question(q, resolve));

async function setup() {
  console.log('🚀 Nova Ultra v2.0 Setup\n');
  console.log('='.repeat(40));

  const envPath = path.join(__dirname, '../.env');
  
  // Check existing
  if (await fs.pathExists(envPath)) {
    const backup = await question('⚠️  .env already exists. Overwrite? (y/N): ');
    if (backup.toLowerCase() !== 'y') {
      console.log('Setup cancelled. Using existing .env');
      process.exit(0);
    }
    await fs.copy(envPath, envPath + '.backup.' + Date.now());
  }

  // Collect info
  const config = {
    BOT_NAME: await question('Bot name [Nova]: ') || 'Nova',
    OWNER_NUMBER: await question('Owner WhatsApp number (international format, e.g., 5215512345678): '),
    NODE_ENV: 'production'
  };

  // AI Keys
  console.log('\n🤖 AI Models (at least one recommended):');
  const venice = await question('Venice AI key (recommended, uncensored): ');
  if (venice) config.VENICE_API_KEY = venice;
  
  const openrouter = await question('OpenRouter key (multi-model access): ');
  if (openrouter) config.OPENROUTER_API_KEY = openrouter;
  
  const groq = await question('Groq key (fast): ');
  if (groq) config.GROQ_API_KEY = groq;

  // Platforms
  console.log('\n🌐 Platforms (optional):');
  const discord = await question('Discord Bot Token: ');
  if (discord) config.DISCORD_BOT_TOKEN = discord;
  
  const telegram = await question('Telegram Bot Token: ');
  if (telegram) config.TELEGRAM_BOT_TOKEN = telegram;

  // Generate .env
  const envContent = Object.entries(config)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  await fs.writeFile(envPath, envContent + '\n');

  // Create dirs
  await fs.ensureDir('./data');
  await fs.ensureDir('./logs');
  await fs.ensureDir('./src/skills/generated');

  console.log('\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Review .env file');
  console.log('2. Run: npm start');
  console.log('3. Scan WhatsApp QR code');
  console.log('\nEnjoy Nova Ultra! 🚀');

  rl.close();
}

setup().catch(console.error);

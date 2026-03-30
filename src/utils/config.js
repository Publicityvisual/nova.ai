/**
 * Configuration validator
 */

const logger = require('./logger');

function validateConfig() {
  const errors = [];
  const warnings = [];

  // Required
  if (!process.env.BOT_NAME) {
    warnings.push('BOT_NAME not set, using default "Nova"');
  }

  // Check at least one AI key exists
  const aiKeys = [
    'VENICE_API_KEY', 'OPENROUTER_API_KEY', 'GROQ_API_KEY',
    'TOGETHER_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'OLLAMA_URL'
  ];
  
  const hasAI = aiKeys.some(key => process.env[key]);
  if (!hasAI) {
    warnings.push('No AI API keys configured. Bot will use local fallback mode.');
  }

  // Validate OWNER_NUMBER format if exists
  if (process.env.OWNER_NUMBER && !/^\d+/.test(process.env.OWNER_NUMBER)) {
    errors.push('OWNER_NUMBER should be in international format (e.g., 5215512345678)');
  }

  if (errors.length > 0) {
    logger.error('Configuration errors:', errors);
  }
  
  if (warnings.length > 0) {
    logger.warn('Configuration warnings:', warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = { validateConfig };

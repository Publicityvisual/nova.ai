/**
 * AI Models Manager
 * Supports multiple AI providers with fallback
 */

const axios = require('axios');
const logger = require('../utils/logger');

class AIModels {
  constructor() {
    this.models = {};
    this.currentModel = 'venice';
    this.availableModels = [];
    this.initialized = false;
  }

  async initialize() {
    logger.info('Initializing AI models...');

    // Configure available models based on API keys
    this.models = {
      venice: {
        name: 'Venice AI',
        enabled: !!process.env.VENICE_API_KEY,
        handler: this.veniceHandler.bind(this),
        priority: 1
      },
      openrouter: {
        name: 'OpenRouter',
        enabled: !!process.env.OPENROUTER_API_KEY,
        handler: this.openrouterHandler.bind(this),
        priority: 2
      },
      groq: {
        name: 'Groq',
        enabled: !!process.env.GROQ_API_KEY,
        handler: this.groqHandler.bind(this),
        priority: 3
      },
      together: {
        name: 'Together AI',
        enabled: !!process.env.TOGETHER_API_KEY,
        handler: this.togetherHandler.bind(this),
        priority: 4
      },
      anthropic: {
        name: 'Claude',
        enabled: !!process.env.ANTHROPIC_API_KEY,
        handler: this.anthropicHandler.bind(this),
        priority: 5
      },
      openai: {
        name: 'GPT-4',
        enabled: !!process.env.OPENAI_API_KEY,
        handler: this.openaiHandler.bind(this),
        priority: 6
      },
      ollama: {
        name: 'Ollama Local',
        enabled: !!process.env.OLLAMA_URL,
        handler: this.ollamaHandler.bind(this),
        priority: 7
      }
    };

    // Filter available models
    this.availableModels = Object.entries(this.models)
      .filter(([_, model]) => model.enabled)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([key, model]) => ({ key, name: model.name }));

    if (this.availableModels.length === 0) {
      logger.warn('No AI API keys configured. Using local fallback only.');
    } else {
      logger.info(`${this.availableModels.length} AI models available`);
      this.currentModel = this.availableModels[0].key;
    }

    this.initialized = true;
  }

  async process(text, options = {}) {
    const { userId, context, memory } = options;

    // Try each model in priority order
    for (const { key } of this.availableModels) {
      try {
        logger.info(`Trying ${this.models[key].name}...`);
        const response = await this.models[key].handler(text, { context, memory });
        logger.info(`Response from ${this.models[key].name}`);
        return response;
      } catch (error) {
        logger.warn(`${this.models[key].name} failed: ${error.message}`);
        continue;
      }
    }

    // Fallback to local response
    logger.info('Using local fallback response');
    return this.localFallback(text, userId);
  }

  // Venice AI - Uncensored, private
  async veniceHandler(text, options) {
    const response = await axios.post('https://api.venice.ai/api/v1/chat/completions', {
      model: 'default',
      messages: [
        { 
          role: 'system', 
          content: 'You are Nova, a helpful AI assistant. Be direct, useful, and conversational. You can help with any topic.' 
        },
        { role: 'user', content: text }
      ],
      temperature: 0.8
    }, {
      headers: { 
        Authorization: `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    return response.data.choices[0].message.content;
  }

  // OpenRouter - Multi-model access
  async openrouterHandler(text, options) {
    const models = [
      'meta-llama/llama-3.1-70b-instruct',
      'nousresearch/hermes-3-llama-3.1-405b',
      'deepseek/deepseek-chat',
      'mistralai/mixtral-8x22b-instruct',
      'anthropic/claude-3.5-sonnet'
    ];

    for (const model of models) {
      try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: model,
          messages: [
            { 
              role: 'system', 
              content: 'You are Nova, a helpful AI assistant.' 
            },
            { role: 'user', content: text }
          ]
        }, {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://nova-ai.app',
            'X-Title': 'Nova AI'
          },
          timeout: 60000
        });

        return `[${model}] ${response.data.choices[0].message.content}`;
      } catch (e) {
        continue;
      }
    }

    throw new Error('All OpenRouter models failed');
  }

  // Groq - Ultra fast
  async groqHandler(text, options) {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: 'You are Nova, a helpful AI assistant.' },
        { role: 'user', content: text }
      ],
      temperature: 0.7
    }, {
      headers: { 
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  // Together AI - Open source
  async togetherHandler(text, options) {
    const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      messages: [
        { role: 'system', content: 'You are Nova, a helpful AI assistant.' },
        { role: 'user', content: text }
      ]
    }, {
      headers: { 
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    return response.data.choices[0].message.content;
  }

  // Anthropic Claude
  async anthropicHandler(text, options) {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: text }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      timeout: 60000
    });

    return response.data.content[0].text;
  }

  // OpenAI GPT-4
  async openaiHandler(text, options) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are Nova, a helpful AI assistant.' },
        { role: 'user', content: text }
      ]
    }, {
      headers: { 
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    return response.data.choices[0].message.content;
  }

  // Ollama Local
  async ollamaHandler(text, options) {
    const response = await axios.post(`${process.env.OLLAMA_URL}/api/generate`, {
      model: 'llama3.1',
      prompt: text,
      stream: false
    }, {
      timeout: 120000
    });

    return response.data.response;
  }

  // Local fallback response
  localFallback(text, userId) {
    const lower = text.toLowerCase();

    // Greetings
    if (/hola|hello|hi|hey|greetings/.test(lower)) {
      return `¡Hola! 👋 I'm Nova, your AI assistant.

I can help you with:
• 💬 General conversation and questions
• 💻 Programming and technical tasks
• 🎨 Creativity and writing
• 🔧 Automation and tools
• 🌐 Web browsing
• 📁 File management

Type /help to see all available commands.
What would you like to do?`;
    }

    // Help request
    if (/help|ayuda|commands|comandos/.test(lower)) {
      return 'Type /help to see available commands, or just chat with me naturally!';
    }

    // Default conversational response
    return `I'm Nova, your AI assistant. I'm here to help with any task or question.

Since no AI APIs are currently configured, I'm running in basic mode. For full AI capabilities, please configure one or more AI API keys in the .env file:
• VENICE_API_KEY (recommended - uncensored)
• OPENROUTER_API_KEY (multi-model)
• GROQ_API_KEY (fast)
• ANTHROPIC_API_KEY (Claude)
• OPENAI_API_KEY (GPT-4)

How can I assist you today?`;
  }

  setModel(modelName) {
    if (this.models[modelName] && this.models[modelName].enabled) {
      this.currentModel = modelName;
      return `Model switched to: ${this.models[modelName].name}`;
    }
    return `Model not available. Use /models to see available options.`;
  }

  listModels() {
    if (this.availableModels.length === 0) {
      return 'No AI models configured. Please add API keys to .env file.';
    }

    const list = this.availableModels.map(m => `• ${m.key}: ${m.name}`).join('\n');
    return `Available AI Models:\n${list}\n\nCurrent: ${this.currentModel}\nUse /model [name] to switch.`;
  }
}

module.exports = AIModels;

/**
 * NOVA AI v6.1 - OpenClaw-Style Architecture
 * Sistema principal con MCP Tools, Skills y Multi-Channel Gateway
 * 
 * Este archivo integra todas las nuevas características inspiradas en OpenClaw
 */

require('dotenv').config();
const { ChannelGateway } = require('./core/channel-gateway');
const { SkillsManager } = require('./core/skills-manager');
const { toolRegistry } = require('./core/mcp-tools');
const WhatsAppAdapter = require('./adapters/whatsapp-gateway');
const TelegramAdapter = require('./adapters/telegram-gateway');
const logger = require('./utils/logger');

class NovaAIOpenClaw {
  constructor() {
    this.version = '6.1.0';
    this.gateway = new ChannelGateway();
    this.skills = new SkillsManager();
    this.tools = toolRegistry;
    this.initialized = false;
  }

  async initialize() {
    logger.info(`🚀 NOVA AI v${this.version} - OpenClaw Architecture`);
    
    // 1. Cargar Skills
    await this.skills.loadSkills();
    await this.skills.createDefaultSkills();
    
    // 2. Configurar canales
    await this.setupChannels();
    
    // 3. Conectar gateway
    await this.gateway.connectAll();
    
    // 4. Configurar manejadores de mensajes
    this.setupMessageHandlers();
    
    this.initialized = true;
    logger.info('✅ NOVA AI initialized with OpenClaw-style architecture');
    
    this.displayStatus();
    return this;
  }

  async setupChannels() {
    // WhatsApp Business
    if (process.env.WHATSAPP_ENABLED === 'true') {
      const whatsapp = new WhatsAppAdapter();
      this.gateway.registerChannel('whatsapp', whatsapp, {
        numbers: [
          process.env.WHATSAPP_NUMBER_1,
          process.env.WHATSAPP_NUMBER_2
        ].filter(Boolean)
      });
    }
    
    // Telegram Bot
    if (process.env.TELEGRAM_ENABLED === 'true') {
      const telegram = new TelegramAdapter();
      this.gateway.registerChannel('telegram', telegram, {
        token: process.env.TELEGRAM_BOT_TOKEN,
        allowedUsers: process.env.TELEGRAM_ALLOWED_USERS?.split(',') || []
      });
    }
  }

  setupMessageHandlers() {
    // Manejar mensajes entrantes
    this.gateway.on('message:received', async (message) => {
      await this.processMessage(message);
    });
    
    // Manejar cambios de estado
    this.gateway.on('channel:connected', ({ channel }) => {
      logger.info(`📡 Channel connected: ${channel}`);
    });
  }

  async processMessage(message) {
    try {
      const { channel, sender, content, text } = message;
      
      logger.info(`📨 [${channel}] ${sender}: ${text || content}`);
      
      // 1. Obtener contexto de sesión
      const session = this.gateway.getSession(channel, sender);
      const history = this.gateway.getConversationHistory(channel, sender, 10);
      
      // 2. Detectar si es comando slash
      if (text?.startsWith('/')) {
        await this.handleSlashCommand(message);
        return;
      }
      
      // 3. Obtener skills relevantes
      const relevantSkills = this.skills.getRelevantSkills({ 
        query: text || content,
        tags: ['general']
      });
      
      // 4. Preparar prompt con skills
      const skillPrompt = this.skills.generateSkillPrompt(relevantSkills);
      
      // 5. Preparar mensaje para IA
      const messages = [
        { role: 'system', content: this.buildSystemPrompt(skillPrompt) },
        ...history.map(m => ({ 
          role: m.role || 'user', 
          content: m.text || m.content 
        })),
        { role: 'user', content: text || content }
      ];
      
      // 6. Obtener respuesta de IA con tools
      const aiResponse = await this.callAI(messages);
      
      // 7. Procesar tool calls si existen
      if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
        const toolResults = await this.executeTools(aiResponse.toolCalls);
        
        // Volver a llamar a IA con resultados
        messages.push({ role: 'assistant', content: aiResponse.content });
        messages.push({ 
          role: 'user', 
          content: `Tool results: ${JSON.stringify(toolResults, null, 2)}` 
        });
        
        const finalResponse = await this.callAI(messages);
        await this.sendResponse(channel, sender, finalResponse.content);
      } else {
        await this.sendResponse(channel, sender, aiResponse.content);
      }
      
    } catch (error) {
      logger.error('Error processing message:', error);
      await this.sendResponse(
        message.channel, 
        message.sender, 
        '❌ Error processing your request. Please try again.'
      );
    }
  }

  async handleSlashCommand(message) {
    const { text, channel, sender } = message;
    const parts = text.split(' ');
    const command = parts[0].substring(1); // Remove /
    const args = parts.slice(1).join(' ');
    
    const skill = this.skills.getSkill(command);
    
    if (skill && skill.userInvocable) {
      // Ejecutar skill directamente
      if (skill.commandDispatch === 'tool' && skill.commandTool) {
        const result = await this.tools.execute(skill.commandTool, { command: args });
        await this.sendResponse(channel, sender, JSON.stringify(result, null, 2));
      } else {
        // Procesar como mensaje normal con contexto de skill
        await this.processMessage({
          ...message,
          content: `[Using skill: ${skill.name}] ${args}`
        });
      }
    } else {
      // Mostrar ayuda de comandos
      const commands = this.skills.getSlashCommands();
      const help = commands.map(c => `/${c.command} - ${c.description}`).join('\n');
      await this.sendResponse(channel, sender, `Available commands:\n${help}`);
    }
  }

  async callAI(messages) {
    // Integración con OpenRouter u otro proveedor
    const axios = require('axios');
    
    const toolDefinitions = this.tools.getToolDefinitions();
    
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
          messages,
          tools: toolDefinitions,
          tool_choice: 'auto',
          temperature: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://nova-ai.local',
            'X-Title': 'NOVA AI'
          }
        }
      );
      
      const choice = response.data.choices[0];
      
      return {
        content: choice.message.content,
        toolCalls: choice.message.tool_calls?.map(tc => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        })) || []
      };
    } catch (error) {
      logger.error('AI call failed:', error.message);
      return { content: 'Error calling AI service', toolCalls: [] };
    }
  }

  async executeTools(toolCalls) {
    const results = [];
    
    for (const call of toolCalls) {
      const result = await this.tools.execute(call.name, call.arguments);
      results.push({ tool: call.name, result });
    }
    
    return results;
  }

  async sendResponse(channel, recipient, content) {
    await this.gateway.sendMessage(channel, recipient, content);
  }

  buildSystemPrompt(skillPrompt) {
    return `You are NOVA AI, an intelligent assistant with OpenClaw-style architecture.

CAPABILITIES:
- You have access to tools for file operations, web search, code execution, and more
- Use tools proactively when they help answer user requests
- Always explain your reasoning before taking actions

${skillPrompt}

TOOL USAGE:
- When you need to access files, use read_file or write_file
- For web information, use web_search or web_fetch
- To execute code, use execute_code or execute_command
- For system info, use system_info

Respond naturally and helpfully. Use tools when they enhance your response.`;
  }

  displayStatus() {
    console.log('\n' + '='.repeat(50));
    console.log(`🤖 NOVA AI v${this.version}`);
    console.log('='.repeat(50));
    console.log('\n📡 Channels:');
    const status = this.gateway.getStatus();
    for (const [name, info] of Object.entries(status)) {
      const icon = info.connected ? '✅' : '❌';
      console.log(`   ${icon} ${name}: ${info.status}`);
    }
    console.log(`\n📚 Skills: ${this.skills.skills.size} loaded`);
    console.log(`🔧 Tools: ${this.tools.tools.size} available`);
    console.log('='.repeat(50) + '\n');
  }

  // API para integración externa
  async executeSkill(skillName, params) {
    const skill = this.skills.getSkill(skillName);
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }
    
    // Ejecutar skill con herramientas disponibles
    return { skill: skillName, executed: true, params };
  }

  async executeTool(toolName, params) {
    return this.tools.execute(toolName, params);
  }

  getTools() {
    return this.tools.getToolDefinitions();
  }

  getSkills() {
    return this.skills.getSlashCommands();
  }
}

// Inicialización
if (require.main === module) {
  const nova = new NovaAIOpenClaw();
  nova.initialize().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = NovaAIOpenClaw;

/**
 * 🌉 CLAUDE CODE TELEGRAM BRIDGE
 * Permite usar Claude Code desde Telegram
 * Comandos de código, commits, ejecución automática
 */

const ClaudeCodeAgent = require('../core/claude-code-agent');
const logger = require('../core/logger');

class ClaudeCodeBridge {
  constructor(telegramBot) {
    this.bot = telegramBot;
    this.agents = new Map(); // userId -> agent
    this.sessions = new Map();
    
    // Comandos disponibles
    this.commands = {
      '/code': this.handleCodeCommand.bind(this),
      '/commit': this.handleCommitCommand.bind(this),
      '/explain': this.handleExplainCommand.bind(this),
      '/fix': this.handleFixCommand.bind(this),
      '/test': this.handleTestCommand.bind(this),
      '/run': this.handleRunCommand.bind(this),
      '/status': this.handleStatusCommand.bind(this),
      '/init': this.handleInitCommand.bind(this)
    };
  }

  /**
   * Manejar mensaje entrante
   */
  async handleMessage(msg, userId, username) {
    const text = msg.text || msg.caption || '';
    
    // Verificar si es comando
    const command = text.split(' ')[0];
    if (this.commands[command]) {
      return await this.commands[command](msg, userId);
    }
    
    // Si no es comando, procesar como código natural
    return await this.processNaturalCode(text, userId);
  }

  /**
   * 🚀 Inicializar agente para usuario
   */
  async handleInitCommand(msg, userId) {
    const chatId = msg.chat.id;
    
    await this.bot.sendMessage(chatId, 
      '🤖 *Claude Code Agent*\n\n' +
      'Inicializando agente de codificación...',
      { parse_mode: 'Markdown' }
    );
    
    // Crear agente
    const agent = new ClaudeCodeAgent({
      projectPath: process.cwd(),
      autoCommit: true,
      safeMode: true
    });
    
    await agent.initialize();
    this.agents.set(userId, agent);
    
    this.sessions.set(userId, {
      active: true,
      startTime: Date.now(),
      commandsExecuted: 0
    });
    
    const status = agent.getStatus();
    
    return await this.bot.sendMessage(chatId,
      `✅ *Agente inicializado*\n\n` +
      `📁 Proyecto: ${status.projectPath}\n` +
      `📊 Archivos: ${status.projectStructure?.totalFiles || 0}\n` +
      `🔤 Lenguajes: ${status.projectStructure?.languages?.join(', ') || 'N/A'}\n\n` +
      `*Comandos disponibles:*\n` +
      `/code [archivo] - Ver/Editar código\n` +
      `/explain [archivo] - Explicar código\n` +
      `/fix [archivo] - Corregir errores\n` +
      `/test [archivo] - Generar tests\n` +
      `/run [comando] - Ejecutar en terminal\n` +
      `/commit [mensaje] - Git commit\n` +
      `/status - Estado del agente`,
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * 💻 Manejar comando /code
   */
  async handleCodeCommand(msg, userId) {
    const chatId = msg.chat.id;
    const args = msg.text.split(' ').slice(1);
    const filePath = args[0];
    
    if (!filePath) {
      return await this.bot.sendMessage(chatId,
        '💻 Uso: /code [ruta/al/archivo]\n' +
        'Ejemplo: /code src/index.js'
      );
    }
    
    const agent = this.agents.get(userId);
    if (!agent) {
      return await this.bot.sendMessage(chatId,
        '⚠️ Primero inicializa con /init'
      );
    }
    
    await this.bot.sendMessage(chatId, `📖 Leyendo ${filePath}...`);
    
    try {
      const fs = require('fs-extra');
      const path = require('path');
      const fullPath = path.join(agent.projectPath, filePath);
      
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Enviar código formateado
      const lines = content.split('\n');
      const totalLines = lines.length;
      const preview = content.substring(0, 3500);
      
      await this.bot.sendMessage(chatId,
        `📄 *${filePath}* (${totalLines} líneas)\n\n` +
        '```\n' + preview + (content.length > 3500 ? '\n... (truncado)' : '') + '\n```',
        { parse_mode: 'Markdown' }
      );
      
      // Sugerir acciones
      await this.bot.sendMessage(chatId,
        '💡 *Acciones:*\n' +
        `/explain ${filePath} - Explicar código\n` +
        `/fix ${filePath} - Corregir errores\n` +
        `/test ${filePath} - Generar tests\n` +
        'O responde con el código editado para guardar cambios'
      );
      
    } catch (error) {
      await this.bot.sendMessage(chatId,
        `❌ Error: ${error.message}`
      );
    }
  }

  /**
   * 📖 Manejar /explain
   */
  async handleExplainCommand(msg, userId) {
    const chatId = msg.chat.id;
    const args = msg.text.split(' ').slice(1);
    const target = args.join(' ');
    
    if (!target) {
      return await this.bot.sendMessage(chatId,
        '📖 Uso: /explain [archivo o código]\n' +
        'Ejemplo: /explain src/app.js'
      );
    }
    
    const agent = this.agents.get(userId);
    if (!agent) {
      return await this.bot.sendMessage(chatId, '⚠️ Usa /init primero');
    }
    
    const statusMsg = await this.bot.sendMessage(chatId,
      '🤖 Analizando código...'
    );
    
    const result = await agent.explainCode(target);
    
    await this.bot.deleteMessage(chatId, statusMsg.message_id);
    
    if (result.success) {
      await this.bot.sendMessage(chatId,
        `📚 *Explicación de ${target}*\n\n${result.response}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await this.bot.sendMessage(chatId,
        `❌ Error: ${result.error}`
      );
    }
  }

  /**
   * 🔧 Manejar /fix
   */
  async handleFixCommand(msg, userId) {
    const chatId = msg.chat.id;
    const args = msg.text.split(' ').slice(1);
    const filePath = args[0];
    
    if (!filePath) {
      return await this.bot.sendMessage(chatId,
        '🔧 Uso: /fix [archivo]\n' +
        'Corrige automáticamente errores en el archivo'
      );
    }
    
    const agent = this.agents.get(userId);
    if (!agent) return await this.bot.sendMessage(chatId, '⚠️ Usa /init primero');
    
    const statusMsg = await this.bot.sendMessage(chatId,
      '🔧 Analizando y corrigiendo...'
    );
    
    // En un caso real, aquí detectaríamos el error automáticamente
    // o pediríamos al usuario que describa el error
    const result = await agent.fixError('Error detectado', filePath, { apply: true });
    
    await this.bot.deleteMessage(chatId, statusMsg.message_id);
    
    if (result.success) {
      await this.bot.sendMessage(chatId,
        `✅ *Correcciones aplicadas a ${filePath}*\n\n` +
        `📤 Commit automático realizado\n\n` +
        '*Cambios realizados:*\n' +
        result.response
      );
    } else {
      await this.bot.sendMessage(chatId, `❌ ${result.error}`);
    }
  }

  /**
   * 🧪 Manejar /test
   */
  async handleTestCommand(msg, userId) {
    const chatId = msg.chat.id;
    const args = msg.text.split(' ').slice(1);
    const filePath = args[0];
    
    if (!filePath) {
      return await this.bot.sendMessage(chatId,
        '🧪 Uso: /test [archivo]\n' +
        'Genera tests automáticos'
      );
    }
    
    const agent = this.agents.get(userId);
    if (!agent) return await this.bot.sendMessage(chatId, '⚠️ Usa /init primero');
    
    const statusMsg = await this.bot.sendMessage(chatId,
      '🧪 Generando tests...'
    );
    
    const result = await agent.generateTests(filePath);
    
    await this.bot.deleteMessage(chatId, statusMsg.message_id);
    
    if (result.success) {
      const testFile = filePath.replace(/\.\w+$/, `.test$&`);
      await this.bot.sendMessage(chatId,
        `✅ *Tests generados*\n\n` +
        `📄 Archivo: ${testFile}\n` +
        `✓ Tests creados automáticamente\n` +
        `📤 Commit realizado`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await this.bot.sendMessage(chatId, `❌ ${result.error}`);
    }
  }

  /**
   * ▶️ Manejar /run
   */
  async handleRunCommand(msg, userId) {
    const chatId = msg.chat.id;
    const args = msg.text.split(' ').slice(1);
    const command = args.join(' ');
    
    if (!command) {
      return await this.bot.sendMessage(chatId,
        '▶️ Uso: /run [comando]\n' +
        'Ejemplo: /run npm start\n' +
        '⚠️ Modo seguro activado'
      );
    }
    
    const agent = this.agents.get(userId);
    if (!agent) return await this.bot.sendMessage(chatId, '⚠️ Usa /init primero');
    
    await this.bot.sendMessage(chatId, `⚡ Ejecutando: ${command}...`);
    
    const result = await agent.executeCommand(command);
    
    if (result.requiresConfirmation) {
      // Pedir confirmación para comandos peligrosos
      return await this.bot.sendMessage(chatId,
        `⚠️ *${result.reason}*\n\n` +
        `Comando: \`${command}\`\n\n` +
        'Confirma con: /confirm',
        { parse_mode: 'Markdown' }
      );
    }
    
    if (result.success) {
      let output = result.stdout;
      if (output.length > 4000) output = output.substring(0, 4000) + '...';
      
      await this.bot.sendMessage(chatId,
        `✅ *Ejecución exitosa*\n\n` +
        '```\n' + output + '\n```',
        { parse_mode: 'Markdown' }
      );
      
      if (result.stderr) {
        await this.bot.sendMessage(chatId,
          `⚠️ *Stderr:*\n\`\`\`\n${result.stderr}\n\`\`\``,
          { parse_mode: 'Markdown' }
        );
      }
    } else {
      await this.bot.sendMessage(chatId,
        `❌ *Error*\n\n\`\`\`\n${result.error}\n\`\`\``,
        { parse_mode: 'Markdown' }
      );
    }
  }

  /**
   * 📤 Manejar /commit
   */
  async handleCommitCommand(msg, userId) {
    const chatId = msg.chat.id;
    const args = msg.text.split(' ').slice(1);
    const message = args.join(' ') || 'Changes from Telegram';
    
    const agent = this.agents.get(userId);
    if (!agent) return await this.bot.sendMessage(chatId, '⚠️ Usa /init primero');
    
    await this.bot.sendMessage(chatId, '📤 Haciendo commit...');
    
    const result = await agent.autoGitCommit(message);
    
    if (result.success) {
      await this.bot.sendMessage(chatId,
        `✅ *Commit realizado*\n\n` +
        `\`${message}\``,
        { parse_mode: 'Markdown' }
      );
    } else {
      await this.bot.sendMessage(chatId, `❌ ${result.error}`);
    }
  }

  /**
   * 📊 Manejar /status
   */
  async handleStatusCommand(msg, userId) {
    const chatId = msg.chat.id;
    const agent = this.agents.get(userId);
    
    if (!agent) {
      return await this.bot.sendMessage(chatId,
        '📊 *Sin agente activo*\n\nUsa /init para iniciar'
      );
    }
    
    const status = agent.getStatus();
    const session = this.sessions.get(userId);
    
    await this.bot.sendMessage(chatId,
      `📊 *Estado del Agente*\n\n` +
      `✅ Activo: ${status.active ? 'Sí' : 'No'}\n` +
      `📁 Proyecto: ${status.projectPath}\n` +
      `📊 Archivos: ${status.projectStructure?.totalFiles || 0}\n` +
      `🔤 Lenguajes: ${status.projectStructure?.languages?.join(', ') || 'N/A'}\n` +
      `📝 Comandos: ${session?.commandsExecuted || 0}\n` +
      `🛡️ Modo seguro: ${status.safeMode ? 'Sí' : 'No'}\n` +
      `📤 Auto-commit: ${status.autoCommit ? 'Sí' : 'No'}`,
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * 💬 Procesar solicitud natural de código
   */
  async processNaturalCode(text, userId) {
    // Detectar si es solicitud de código
    const codePatterns = [
      /crea(?:r)?\s+(?:un|una)?\s+(?:funci[oó]n|clase|m[oó]dulo)/i,
      /(?:c[oó]mo|qu[eé])\s+(?:hacer|implementar)/i,
      /explica(?:r)?\s+(?:este|el)\s+c[oó]digo/i,
      /corrige(?:r)?\s+(?:este|el)\s+error/i,
      /optimiza(?:r)?\s+(?:este|el)\s+c[oó]digo/i
    ];
    
    const isCodeRequest = codePatterns.some(p => p.test(text));
    
    if (!isCodeRequest) return null; // No procesar
    
    const agent = this.agents.get(userId);
    if (!agent) return null;
    
    return await agent.processNaturalRequest(text, userId);
  }
}

module.exports = ClaudeCodeBridge;

/**
 * NOVA AI - Skills System
 * Basado en OpenClaw Skill Architecture
 * 
 * Las skills son archivos markdown (SOUL.md) con frontmatter YAML
 * que definen instrucciones y capacidades para la IA.
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class SkillsManager {
  constructor() {
    this.skills = new Map();
    this.skillsDir = path.join(process.cwd(), 'skills');
  }

  /**
   * Carga todas las skills desde el directorio
   */
  async loadSkills() {
    logger.info('📚 Loading skills...');
    
    await fs.ensureDir(this.skillsDir);
    const items = await fs.readdir(this.skillsDir);
    
    for (const item of items) {
      const itemPath = path.join(this.skillsDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Buscar SOUL.md en subdirectorio
        const soulPath = path.join(itemPath, 'SOUL.md');
        if (await fs.pathExists(soulPath)) {
          await this.loadSkillFromFile(soulPath);
        }
      } else if (item.endsWith('.md')) {
        await this.loadSkillFromFile(itemPath);
      }
    }
    
    logger.info(`✅ Loaded ${this.skills.size} skills`);
    return this.skills;
  }

  /**
   * Parsea un archivo SOUL.md
   */
  async loadSkillFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const skill = this.parseSoulFile(content, filePath);
      
      if (skill && skill.name) {
        this.skills.set(skill.name, skill);
        logger.debug(`Skill loaded: ${skill.name}`);
      }
    } catch (error) {
      logger.error(`Error loading skill ${filePath}:`, error.message);
    }
  }

  /**
   * Parsea contenido SOUL.md (frontmatter + contenido)
   */
  parseSoulFile(content, filePath) {
    // Buscar frontmatter YAML entre ---
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2].trim();
    
    // Parsear frontmatter YAML simple
    const metadata = this.parseYaml(frontmatter);
    
    return {
      name: metadata.name || path.basename(filePath, '.md'),
      description: metadata.description || '',
      tags: metadata.tags || [],
      userInvocable: metadata['user-invocable'] !== false, // default true
      disableModelInvocation: metadata['disable-model-invocation'] === true,
      commandDispatch: metadata['command-dispatch'],
      commandTool: metadata['command-tool'],
      baseDir: path.dirname(filePath),
      content: body,
      metadata
    };
  }

  /**
   * Parse YAML simple
   */
  parseYaml(yaml) {
    const result = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        // Parsear arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          result[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        } else if (value === 'true') {
          result[key] = true;
        } else if (value === 'false') {
          result[key] = false;
        } else {
          result[key] = value.replace(/^"|"$/g, '');
        }
      }
    }
    
    return result;
  }

  /**
   * Obtiene skills relevantes para un contexto
   */
  getRelevantSkills(context = {}) {
    const relevant = [];
    
    for (const [name, skill] of this.skills) {
      // Si está deshabilitada para invocación del modelo, saltar
      if (skill.disableModelInvocation) continue;
      
      // Matching por tags o descripción
      if (context.tags && skill.tags.some(t => context.tags.includes(t))) {
        relevant.push(skill);
      } else if (context.query && skill.description.toLowerCase().includes(context.query.toLowerCase())) {
        relevant.push(skill);
      }
    }
    
    return relevant;
  }

  /**
   * Obtiene skill por nombre
   */
  getSkill(name) {
    return this.skills.get(name);
  }

  /**
   * Lista todas las skills como comandos slash disponibles
   */
  getSlashCommands() {
    const commands = [];
    
    for (const [name, skill] of this.skills) {
      if (skill.userInvocable) {
        commands.push({
          command: `/${name}`,
          description: skill.description,
          skill: name
        });
      }
    }
    
    return commands;
  }

  /**
   * Genera prompt context con instrucciones de skills
   */
  generateSkillPrompt(skills = null) {
    const skillsToUse = skills || Array.from(this.skills.values());
    
    let prompt = '';
    
    for (const skill of skillsToUse) {
      prompt += `\n=== SKILL: ${skill.name} ===\n`;
      prompt += `${skill.content}\n`;
    }
    
    return prompt;
  }

  /**
   * Crea una skill por defecto si no existe ninguna
   */
  async createDefaultSkills() {
    const defaultSkills = [
      {
        name: 'coding-assistant',
        content: `---
name: coding-assistant
description: Asistente experto en programación y desarrollo
tags: [code, development, programming]
user-invocable: true
---

Eres un asistente de programación experto. Cuando el usuario pide código:

1. Escribe código limpio y bien documentado
2. Usa las mejores prácticas del lenguaje
3. Incluye manejo de errores
4. Optimiza para performance cuando sea necesario

Herramientas disponibles:
- read_file: Leer archivos existentes
- write_file: Crear nuevos archivos
- edit: Modificar código existente
- execute_code: Probar el código
- web_search: Buscar documentación

Siempre explica tu razonamiento antes de escribir código.`
      },
      {
        name: 'web-researcher',
        content: `---
name: web-researcher
description: Investigador web y búsqueda de información
tags: [web, research, search]
user-invocable: true
---

Eres un investigador web experto. Tu trabajo es buscar y analizar información.

Capacidades:
- web_search: Buscar información actualizada
- web_fetch: Leer contenido de páginas
- read_file: Analizar archivos locales

Proceso de investigación:
1. Busca múltiples fuentes
2. Verifica la información
3. Resume hallazgos clave
4. Cita fuentes cuando sea posible

Entrega respuestas estructuradas y basadas en evidencia.`
      },
      {
        name: 'system-admin',
        content: `---
name: system-admin
description: Administrador de sistemas y diagnóstico
tags: [system, admin, diagnostics]
user-invocable: true
---

Eres un administrador de sistemas experto. Ayudas con:

- Diagnóstico de problemas
- Optimización de performance
- Automatización de tareas
- Monitoreo del sistema

Herramientas disponibles:
- system_info: Información del sistema
- execute_command: Ejecutar comandos
- read_file: Ver logs y configuraciones
- list_directory: Explorar estructura

Prioriza la seguridad y nunca ejecutes comandos destructivos sin confirmación.`
      }
    ];

    for (const skillData of defaultSkills) {
      const skillPath = path.join(this.skillsDir, `${skillData.name}.md`);
      if (!await fs.pathExists(skillPath)) {
        await fs.writeFile(skillPath, skillData.content);
        logger.info(`Created default skill: ${skillData.name}`);
      }
    }
  }
}

module.exports = {
  SkillsManager
};

# NOVA AI v6.1 - OpenClaw-Style Architecture

## 🆕 Nueva Arquitectura Inspirada en OpenClaw

Esta versión de NOVA AI incorpora características avanzadas del sistema OpenClaw:

### ✨ Características Principales

1. **MCP Tool System** - Herramientas estandarizadas tipo Model Context Protocol
2. **Skills System** - Definición de capacidades mediante archivos markdown
3. **Multi-Channel Gateway** - Gateway unificado para WhatsApp/Telegram
4. **Session Management** - Persistencia de conversaciones por usuario

---

## 🏗️ Arquitectura

```
NOVA AI v6.1
├── 📁 src/
│   ├── 📄 nova-openclaw.js          # Sistema principal
│   ├── 📁 core/
│   │   ├── mcp-tools.js             # Sistema de herramientas MCP
│   │   ├── skills-manager.js        # Gestor de skills
│   │   ├── channel-gateway.js       # Gateway multi-canal
│   │   └── ...
│   ├── 📁 adapters/
│   │   ├── whatsapp-gateway.js      # Adaptador WhatsApp
│   │   └── telegram-gateway.js      # Adaptador Telegram
│   └── 📁 utils/
│       └── logger.js                # Logger system
├── 📁 skills/                        # Directorio de skills
│   ├── coding-assistant.md
│   ├── web-researcher.md
│   └── system-admin.md
└── 📄 package.json
```

---

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# .env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_ALLOWED_USERS=123456789,987654321

WHATSAPP_ENABLED=true
WHATSAPP_NUMBER_1=4426689053
WHATSAPP_NUMBER_2=442835034

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

### 2. Iniciar Sistema

```bash
npm run openclaw
```

---

## 📚 Sistema de Skills

Las skills son archivos markdown que definen comportamientos especializados:

### Crear una Skill

Crear archivo en `skills/mi-skill.md`:

```markdown
---
name: mi-skill
description: Descripción de la skill
tags: [tag1, tag2]
user-invocable: true
---

# Instrucciones para la IA

Eres un asistente especializado en X. Cuando el usuario pregunte sobre X:

1. Haz esto
2. Luego esto
3. Usa estas herramientas: read_file, web_search

## Herramientas Disponibles

- read_file: Leer archivos
- write_file: Escribir archivos
- web_search: Buscar en web
```

### Uso de Skills

- **Por IA automáticamente**: La IA selecciona skills relevantes según el contexto
- **Por comando slash**: Escribe `/mi-skill tu consulta`

---

## 🔧 Herramientas MCP Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `read_file` | Leer contenido de archivos |
| `write_file` | Crear/escribir archivos |
| `list_directory` | Listar directorios |
| `execute_command` | Ejecutar comandos shell |
| `execute_code` | Ejecutar código JS/Python |
| `web_search` | Búsqueda web |
| `web_fetch` | Obtener contenido de URL |
| `system_info` | Información del sistema |
| `send_message` | Enviar mensajes |

---

## 📡 Gateway Multi-Canal

### Canales Soportados

- ✅ **WhatsApp** - Vía Baileys (múltiples números)
- ✅ **Telegram** - Vía node-telegram-bot-api
- 🔄 **Discord** - Próximamente
- 🔄 **Slack** - Próximamente

### API del Gateway

```javascript
// Enviar mensaje
await gateway.sendMessage('whatsapp', '5215512345678', 'Hola!');
await gateway.sendMessage('telegram', '123456789', 'Hola!');

// Obtener historial
const history = gateway.getConversationHistory('whatsapp', '5215512345678');

// Estado de canales
const status = gateway.getStatus();
```

---

## 🤖 Flujo de Procesamiento de Mensajes

```
1. Mensaje entrante (WhatsApp/Telegram)
   ↓
2. Gateway recibe y enriquece metadata
   ↓
3. Busca skills relevantes
   ↓
4. Construye prompt con contexto + skills
   ↓
5. Llama a IA (OpenRouter) con tools disponibles
   ↓
6. IA decide usar herramientas o responder directo
   ↓
7. Ejecuta herramientas si son necesarias
   ↓
8. Genera respuesta final
   ↓
9. Envía respuesta al canal origen
```

---

## 🛠️ Comandos Disponibles

### Telegram/WhatsApp

| Comando | Descripción |
|---------|-------------|
| `/start` | Iniciar bot |
| `/help` | Mostrar ayuda |
| `/status` | Estado del sistema |
| `/coding-assistant` | Modo asistente de código |
| `/web-researcher` | Modo investigador web |
| `/system-admin` | Modo administrador |

---

## 🔐 Seguridad

- **Validación de usuarios** por ID en Telegram
- **Sandboxing** de comandos y código
- **Rate limiting** por sesión
- **Allowlists** para canales y usuarios

---

## 📊 Monitoreo

```bash
# Ver logs
npm run logs

# Ver estado
curl http://localhost:18789/status

# Métricas
openclaw status
```

---

## 🔄 Migración desde v6.0

1. Copiar `.env` actual
2. Agregar nuevas variables (TELEGRAM_ENABLED, etc.)
3. Ejecutar `npm install` para nuevas dependencias
4. Iniciar con `npm run openclaw`

---

## 📝 Notas

- Arquitectura basada en **OpenClaw** (MIT License)
- Protocolo MCP para integración de herramientas
- Sistema de skills extensible mediante archivos markdown
- Gateway unificado para múltiples plataformas

---

**NOVA AI v6.1 - OpenClaw Architecture**  
*Inspirado por OpenClaw, implementado para Publicity Visual*

# 📱 Guía de Instalación - WhatsApp, Telegram, Discord, Slack

Configura Nova Ultra en tus plataformas favoritas.

---

## 📱 1. WHATSAPP (Baileys - Sin WhatsApp Web)

### ✅ Características
- **No requiere WhatsApp Web abierto**
- Funciona 24/7 en tu servidor
- Responde a mensajes directos y grupos
- Soporta imágenes, videos, stickers
- QR Code escaneo único

### 🚀 Instalación

#### Auto (Recomendado)
```bash
# Ya incluido en Nova Ultra
npm start
```

#### Manual Paso a Paso

**1. Iniciar Nova**
```bash
cd ~/nova-ultra  # o donde instalaste
npm start
```

**2. Escanear QR**
```
Se mostrará un QR code en terminal:

📱 Escanea con WhatsApp:
1. Abre WhatsApp en tu teléfono
2. Menú (3 puntos) → Dispositivos vinculados
3. Escanear código QR
4. Apunta la cámara al QR de la terminal
```

**3. Verificar conexión**
```
✅ WhatsApp: Connected
📱 Tu número: +521234567890
```

### 📋 Comandos WhatsApp

```
/help - Ver comandos
/status - Estado del bot
/model llama - Cambiar modelo
/remember clave|valor - Guardar memoria
/analizar - Analizar imagen (adjunta imagen)
```

---

## ✈️ 2. TELEGRAM BOT

### ✅ Características
- Bot oficial de Telegram
- Markdown support
- Inline commands
- Webhooks opcionales

### 🔧 Configuración

#### Paso 1: Crear Bot con @BotFather

1. **Abre Telegram** y busca: `@BotFather`
2. **Inicia conversación** → `/start`
3. **Crear nuevo bot** → `/newbot`
4. **Nombre del bot** → `NovaUltra`
5. **Username** → `tu_nova_bot` (debe terminar en bot)

**Respuesta de BotFather:**
```
✅ Done! Congratulations on your new bot.

Use this token to access the HTTP API:
123456789:ABCdefGHIjklMNOpqrSTUvwxyz

For a description of the Bot API, see:
https://core.telegram.org/bots/api
```

#### Paso 2: Configurar Token

**Edita tu `.env`:**
```bash
# En la carpeta de Nova Ultra
nano ~/.nova-ultra/.env
```

**Agrega:**
```env
# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
```

#### Paso 3: Reiniciar Nova
```bash
# Detener y reiniciar
Ctrl+C
npm start
```

### 📋 Comandos Telegram

```
/start - Iniciar bot
/help - Ayuda
/status - Estado
El bot responde a cualquier mensaje directo
```

### 🎨 Personalizar Bot

Con @BotFather:
```
/setcommands - Configurar menú de comandos
/setdescription - Descripción
/setabouttext - Texto "Acerca de"
/setuserpic - Foto de perfil
```

---

## 🎮 3. DISCORD BOT

### ✅ Características
- Slash commands
- Embeds ricos
- DMs y canales
- Roles y permisos

### 🔧 Configuración

#### Paso 1: Crear App en Discord Developer Portal

1. Ve a: https://discord.com/developers/applications
2. Click **"New Application"**
3. Nombre: `Nova Ultra`
4. Ve a **"Bot"** en el menú lateral
5. Click **"Add Bot"**
6. **Copiar Token** (¡guarda bien!)

#### Paso 2: Obtener Permisos

1. Ve a **"OAuth2" → "URL Generator"**
2. Scopes: ✅ `bot`
3. Bot Permissions:
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Attach Files
   - ✅ Use Slash Commands
4. **Copiar URL generada**
5. **Abrir URL en navegador**
6. **Seleccionar servidor** → Autorizar

#### Paso 3: Configurar

**Edita `.env`:**
```env
# Discord
DISCORD_BOT_TOKEN=MTI... (token largo)
```

**Reiniciar:**
```bash
npm start
```

---

## 💬 4. SLACK APP

### 🔧 Configuración

#### Paso 1: Crear App en Slack API

1. Ve a: https://api.slack.com/apps
2. Click **"Create New App"**
3. **"From scratch"**
4. Nombre: `Nova Ultra`
5. **Workspace:** Selecciona el tuyo

#### Paso 2: Configurar Bot Token

1. Ve a **"OAuth & Permissions"**
2. Scopes de Bot Token:
   - `chat:write`
   - `chat:write.public`
   - `channels:read`
   - `groups:read`
   - `mpim:read`
   - `im:read`
3. **Install to Workspace**
4. **Copiar "Bot User OAuth Token"**

#### Paso 3: Signing Secret

1. Ve a **"Basic Information"**
2. **App Credentials** → **Signing Secret**
3. **Copiar el secret**

#### Paso 4: Configurar Nova

**`.env`:**
```env
# Slack
SLACK_BOT_TOKEN=YOUR_TOKEN_HERE-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx
SLACK_SIGNING_SECRET=abc123def456ghi789
PORT=3001
```

**Reiniciar.**

---

## 🔐 Ejemplo .env Completo

```env
# === NUCLEO ===
BOT_NAME=NovaUltra
OWNER_NUMBER=5215512345678
NODE_ENV=production

# === AI (OpenRouter - YA INCLUIDO) ===
OPENROUTER_API_KEY=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

# === WHATSAPP (Auto) ===
# No requiere config

# === TELEGRAM ===
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz

# === DISCORD ===
DISCORD_BOT_TOKEN=MTI...

# === SLACK ===
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
PORT=3001

# === OTRAS ===
DB_PATH=./data/nova.db
```

---

## ✅ Verificación

**Al iniciar Nova deberías ver:**
```
🌐 Active platforms: whatsapp, telegram, discord, slack
```

O individualmente:
```
✅ WhatsApp: Connected
✅ Telegram: Bot running
✅ Discord: Logged in as NovaUltra#1234
⚠️ Slack: SLACK_BOT_TOKEN not set
```

---

## 🐛 Troubleshooting

### WhatsApp: "QR doesn't scan"
```bash
# Limpiar sesión y reintentar
rm -rf ~/.nova-ultra/data/sessions/*
npm start
```

### Telegram: "Not authorized"
- Verifica que el token esté correcto
- Reenvía el mensaje a @BotFather: `/token`

### Discord: "Token invalid"
- Regenera el token en el portal
- Copia completo (empieza con MTI)

### Slack: "Socket mode required"
- Alternativa: deshabilita Slack
- O configura Socket Mode en slack.app (más complejo)

---

## 🎯 Test Rápido

Enviar mensaje a cada plataforma:

**Común a todas:**
```
/hola
/status
/help
/analizar (WhatsApp/Telegram con imagen)
/model llama
```

**Respuesta esperada:**
```
✅ Nova Ultra v2.0.0-ULTRA
AI: OpenRouter (Sin Censura)
Platforms: whatsapp✓ telegram✓ discord✓
```

---

**¡Listo! Nova Ultra responde en todas tus plataformas.** 🦾

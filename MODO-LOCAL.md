# 🏠 MODO LOCAL 100% - Sin Nube

Guía para correr Sofia completamente local sin Render, Railway, ni ningún servicio externo.

---

## ✅ ESTADO ACTUAL (Después de limpieza)

```
❌ Sin Render
❌ Sin Railway  
❌ Sin GitHub Actions
❌ Sin deploy automático
❌ Sin notificaciones por email
```

**Solo tu laptop/PC controla todo**

---

## 🚀 CÓMO INICIAR LOCALMENTE

### Opción 1: Línea de Comando (Simple)

```bash
cd CascadeProjects/nova
npm install
node src/core/ultra-master.js
```

### Opción 2: Archivo BAT (Doble click en Windows)

**Crear archivo `INICIAR-SOFIA.bat`:**

```batch
@echo off
cls
echo.
echo ╔════════════════════════════════════╗
echo ║  SOFIA AI v10.0 - Modo Local       ║
echo ╚════════════════════════════════════╝
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo [*] Instalando dependencias...
    call npm install
)

echo [*] Iniciando Sofia...
node src/core/ultra-master.js

pause
```

**Guardar como:** `INICIAR-SOFIA.bat`

**Usar:** Doble click para iniciar

---

## 📋 CONFIGURACIÓN MÍNIMA (.env)

**Crear archivo `.env` en la raíz:**

```bash
# Telegram (obligatorio)
TELEGRAM_BOT_TOKEN=tu_token_aqui

# AI (OpenRouter - gratis)
OPENROUTER_API_KEY=tu_key_aqui

# Opcional - múltiples bots
TELEGRAM_BOT_TOKEN_2=token_backup_1
TELEGRAM_BOT_TOKEN_3=token_backup_2

# Configuración básica
OWNER_NUMBER=5217208704607
BOT_NAME=Sofia
NODE_ENV=development

# Database local
DATABASE_URL=sqlite://./data/nova.db
```

---

## 🔄 PARA QUE CORRA 24/7 EN TU PC

### Si tu PC se apaga:

```
❌ Sofia se detiene
```

### Solución - NO hay (sin nube):

```
La única forma 24/7 sin nube es:
✅ Dejar la PC siempre encendida
✅ O usar una Raspberry Pi (bajo consumo)
✅ O un servidor casero
```

---

## 💡 ALTERNATIVA: Raspberry Pi 24/7

Si quieres 24/7 bajo consumo (~$5/mes electricidad):

```bash
# En Raspberry Pi:
nohup node src/core/ultra-master.js > logs.txt 2>&1 &
disown

# Esto corre en background incluso si cierras terminal
```

---

## 📊 COMPARACIÓN: Local vs Nube

| Característica | Modo Local | Render (antes) |
|----------------|------------|----------------|
| **Costo** | $0 | $0-$7/mes |
| **24/7** | ❌ PC debe estar on | ✅ Siempre on |
| **Notificaciones** | ❌ Ninguna | ✅ Email |
| **Deploy manual** | ✅ Cada vez | ❌ Automático |
| **Control total** | ✅ 100% | ⚠️ Limitado |
| **Backup** | Manual | Automático |
| **Escalabilidad** | Limitada | Alta |

---

## 🔧 COMANDOS ÚTILES

### Ver si está corriendo:
```bash
# En Windows (PowerShell)
Get-Process node

# Linux/Mac
ps aux | grep node
```

### Detener Sofia:
```bash
# Windows
Taskkill /IM node.exe /F

# Linux/Mac
pkill -f "ultra-master.js"
```

### Reiniciar:
```bash
# Detener y volver a iniciar
pkill -f "ultra-master.js"
node src/core/ultra-master.js
```

---

## 📁 ESTRUCTURA LIMPIA

```
nova.ai/
├── src/              ✅ Tu código
├── data/             ✅ Base de datos local
├── scripts/          ✅ Scripts de ayuda
├── package.json      ✅ Dependencias
├── .env              ✅ Configuración
└── INICIAR-SOFIA.bat ✅ Doble click para iniciar

❌ Sin .github/workflows
❌ Sin render.yaml
❌ Sin railway.json
❌ Sin cloudflare.toml
```

---

## ⚠️ IMPORTANTE: Limitaciones

```
Modo Local significa:

✅ Funciona todo:
   - Telegram bot
   - IA con OpenRouter
   - Generación de imágenes
   - Sistema de pagos
   - Dashboard local

❌ NO funciona:
   - Acceso desde internet (sin IP pública)
   - Webhook de Telegram (usa polling)
   - Dominio personalizado
   - HTTPS automático

🔧 Workarounds:
   - Ngrok para exponer local: ngrok http 3000
   - Cloudflare Tunnel (gratis)
   - DDNS si tienes IP dinámica
```

---

## 🎯 PARA USAR CON NGROK (Temporal)

Si necesitas webhook de Telegram:

```bash
# 1. Instalar ngrok
# 2. Ejecutar:
ngrok http 3000

# 3. Te da URL temporal: https://xxxx.ngrok.io
# 4. Configurar webhook de Telegram
# 5. Funciona hasta que cierras ngrok
```

---

## ✅ CHECKLIST MODO LOCAL

- [ ] Archivo `.env` creado con tokens
- [ ] `npm install` ejecutado
- [ ] `INICIAR-SOFIA.bat` creado (Windows)
- [ ] Probar: doble click en BAT
- [ ] Bot responde en Telegram
- [ ] PC siempre encendida para 24/7 (o aceptar limitación)

---

## 🆘 SI NO FUNCIONA

```bash
# Verificar
node -v          # Debe mostrar versión
npm -v           # Debe mostrar versión

# Si falta algo:
npm install

# Si error de sintaxis:
node -c src/core/ultra-master.js

# Si falta módulo:
npm install nombre-modulo
```

---

## 📝 COMPROMISO

**Modo Local significa:**
- ✅ Cero costos de nube
- ✅ Cero notificaciones spam
- ✅ Control total absoluto
- ❌ PC debe estar encendida
- ❌ Sin backup automático (hacer manual)

**Es la opción más privada y segura.**

---

**¿Te funciona en modo local?**

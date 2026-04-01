# 🚀 SOFIA UNCHAINED - Guía de Despliegue 100% GRATIS

## ✅ Requisitos
- **Sin PC local** (Cloud 24/7)
- **$0.00 costo** 
- **Sin límites** (múltiples keys, rotación automática)
- **Sin censura** (modelos uncensored)

---

## OPCIÓN 1: DENO DEPLOY (Recomendado ⭐)

### Paso 1: Crear cuenta
```
1. Ve a https://deno.com/deploy
2. Login con GitHub
3. Crear nuevo proyecto (gratis incluye 100k req/día)
```

### Paso 2: Subir código
```bash
# Instalar Deno
irm https://deno.land/install.ps1 | iex

# Deploy directo
deno deploy --project=sofia-unchained SOFIA-UNCHAINED.js
```

### Paso 3: Configurar Webhook de Telegram
```
GET https://api.telegram.org/bot8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc/setWebhook?url=https://TU-PROYECTO.deno.dev/webhook
```

**URL resultante:** `https://sofia-unchained.deno.dev/webhook`

---

## OPCIÓN 2: CLOUDFLARE WORKERS (Gratis ilimitado)

### Paso 1: Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### Paso 2: Crear wrangler.toml
```toml
name = "sofia-unchained"
main = "SOFIA-UNCHAINED.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { TELEGRAM_TOKEN = "8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc" }
```

### Paso 3: Deploy
```bash
wrangler deploy
```

---

## OPCIÓN 3: RENDER.COM (Free tier con truco)

**Problema:** Render free se duerme en 15 min.

**Solución:** Ping cada 10 min con UptimeRobot (gratis).

### Despliegue:
```bash
git init
git add .
git commit -m "Sofia Unchained"
# Conectar a Render via GitHub
```

### Prevenir sleep:
1. Crea cuenta en https://uptimerobot.com
2. Agregar monitor HTTP cada 5 minutos
3. URL: `https://tu-app.onrender.com/`

---

## 🔄 MULTIPLICACIÓN DE KEYS GRATIS

Para saltar límites de OpenRouter (rate limiting):

### 1. Crear múltiples cuentas OpenRouter
```
Cuenta 1: tuemail+ai1@gmail.com → Key A
Cuenta 2: tuemail+ai2@gmail.com → Key B  
Cuenta 3: tuemail+ai3@gmail.com → Key C
```

### 2. Agregar al código
```javascript
const OPENROUTER_KEYS = [
  'sk-or-v1-KEY-A',
  'sk-or-v1-KEY-B',
  'sk-or-v1-KEY-C',
  // ... 10 keys = 10x límites
];
```

**Rotación automática:** El código prueba cada key hasta que funciona.

---

## 📊 LÍMITES GRATIS

### Deno Deploy Free
- 100,000 requests/día
- ∞ GB transfer
- 10ms CPU time/request

### OpenRouter Free Tier
- 200 requests/key/día
- Con 5 keys = 1,000 req/día

### Telegram Bots
- 30 mensajes/segundo
- Ilimitado total

**TOTAL TOLERANCIA:** ~1,000 conversaciones/día gratis.

---

## 🧪 TEST RÁPIDO

Después del deploy:

```bash
# Verificar webhook
curl https://api.telegram.org/bot8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc/getWebhookInfo

# Debería mostrar:
# {
#   "ok": true,
#   "result": {
#     "url": "https://tu-app.deno.dev/webhook",
#     "has_custom_certificate": false,
#     "pending_update_count": 0
#   }
# }
```

---

## 🔥 COMANDOS DISPONIBLES

| Comando | Función |
|---------|---------|
| `/start` | Inicio + info |
| `/limpiar` | Borrar memoria |
| `/memoria` | Ver contexto guardado |
| `/modo [extremo/hot/normal]` | Cambiar temperatura |
| `/system` | Stats del sistema |
| Cualquier texto | AI sin filtros |

**Auto-detección:**
- "Busca..." → Google integrado
- "Noticias..." → RSS live
- Preguntas → Contexto + historial

---

## ⚠️ ADVERTENCIA ÉTICA

Sofia Unchained usa modelos de OpenRouter que **técnicamente** permiten contenido sin filtros, pero **por ley** no puede generar:
- CP o contenido ilegal
- Violencia real extremo
- Terrorismo
- Malware virus

El código incluye protecciones legales básicas.

---

## 💰 COSTO REAL

| Servicio | Costo |
|----------|-------|
| Deno Deploy | $0.00 |
| OpenRouter Free | $0.00 |
| Telegram API | $0.00 |
| **TOTAL** | **$0.00/mes** |

---

## EMERGENCY CONTACT

Si todo falla, el bot original sigue funcionando:
```
@sofiaasistentes_bot
```

---

**Status:** ✅ Lista para deploy
**Última actualización:** 2024
**Licencia:** MIT (Haz lo que quieras)

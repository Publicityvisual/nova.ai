# 🤖 NOVA OPENCLAW v9.0 - Guía Completa

## ¿Qué es NOVA OpenClaw?

**Tu propio OpenClaw.ai gratuito** - Una IA sin límites que:
- ✅ **Funciona 24/7** en la nube (tu PC puede estar apagada)
- ✅ **Sin censura** - Responde TODO sin filtros éticos
- ✅ **NSFW permitido** - Sin restricciones de contenido
- ✅ **Multimodal** - Procesa imágenes, texto, documentos
- ✅ **Memoria infinita** - Recuerda todas tus conversaciones
- ✅ **Acceso a internet** - Busca información actual
- ✅ **Gratuito** - Usa APIs de tier gratuito

---

## 🚀 Deployment Rápido (3 minutos)

### Opción Cloud 24/7 (Recomendado)

```bash
# 1. Entrar al proyecto
cd CascadeProjects/nova

# 2. Instalar dependencias
npm install

# 3. Configurar (sigue el wizard)
npm run setup

# 4. Login a Cloudflare
npx wrangler login

# 5. Crear almacenamiento de memoria
npx wrangler kv:namespace create NOVA_KV

# 6. Agregar secrets
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put OPENROUTER_API_KEY

# 7. Deploy!
npx wrangler deploy

# 8. Configurar webhook
curl -X POST https://TU-DOMINIO.cloudflare.workers.dev/setup
```

**¡Listo!** Tu bot responde en Telegram 24/7 sin tu PC.

---

## 🛠️ Comandos de Telegram

| Comando | Descripción |
|---------|-------------|
| `/start` | Iniciar y ver menú principal |
| `/imagen [prompt]` | Generar descripción de imagen |
| `/buscar [query]` | Buscar en internet |
| `/memoria` | Ver tu contexto guardado |
| `/limpiar` | Borrar memoria |
| `/modo creativo` | Modo conversacional |
| `/modo preciso` | Modo técnico/factual |
| `/modo extremo` | Sin filtros absolutos |

---

## 💬 Ejemplos de uso

```
"Analiza esta foto y dime qué ves" [enviar imagen]

"Busca las últimas noticias de IA generativa"

"Genera código Python para un scraper de noticias"

"Resume este PDF" [enviar documento]

"Ayúdame con un problema personal" [sin filtros]

"Escribe una historia creativa sobre..."
```

---

## 🔧 Configuración Avanzada

### Agregar más modelos (rotación automática)

Edita `wrangler.toml`:
```toml
[env.production.vars]
OPENROUTER_KEYS = "key1,key2,key3"
```

### Conectar generación de imágenes real

Agrega en `CONFIG`:
```javascript
IMAGE_API: {
  REPLICATE_KEY: process.env.REPLICATE_KEY,  // API pagada
  STABILITY_KEY: process.env.STABILITY_KEY     // O Stability AI
}
```

### Búsqueda web real

Configura en `CONFIG`:
```javascript
SEARCH_APIS: {
  SERPER_KEY: process.env.SERPER_KEY,  // Google Search
  JINA_KEY: process.env.JINA_KEY      // Gratis
}
```

---

## 📁 Estructura del Proyecto

```
nova/
├── NOVA-OPENCLAW.js      # 🧠 Código principal (unificado)
├── wrangler.toml         # ⚙️ Config Cloudflare
├── package.json          # 📦 Dependencias
├── .env                  # 🔐 Variables (no subir a git)
├── scripts/
│   └── setup-openclaw.js # 🔧 Setup automático
├── legacy/               # 📂 Archivos antiguos (ignorar)
│   └── SOFIA-*.js
└── data/                 # 💾 Sesiones y backups (local only)
```

---

## 🌟 Modelos Sin Censura Disponibles

Todos en tier gratuito de OpenRouter:

| Modelo | Uso |
|--------|-----|
| `meta-llama/llama-3.2-3b-instruct:free` | General, sin filtros |
| `nousresearch/hermes-3-llama-3.1-70b:free` | Conversación natural |
| `deepseek/deepseek-chat:free` | Código y creatividad |
| `qwen/qwen-2-7b-instruct:free` | Sin filtros NSFW |
| `cognitivecomputations/dolphin-mixtral-8x22b` | Extremo, sin límites |

---

## 🔒 Seguridad

1. **Nunca subas el archivo `.env`** a GitHub
2. **Usa `wrangler secret`** para variables sensibles
3. **Rota tus keys** cada 3 meses
4. **Revisa logs** regularmente: `npx wrangler tail`

---

## 🐛 Troubleshooting

### "No responde en Telegram"
- Verifica el token: `curl https://api.telegram.org/botTOKEN/getMe`
- Revisa webhook: está configurado correctamente?
- Logs: `npx wrangler tail`

### "Límite de requests alcanzado"
- Agrega múltiples keys de OpenRouter en `OPENROUTER_KEYS`
- El sistema rota automáticamente

### "No recuerda conversaciones"
- Verifica que KV namespace está configurado en `wrangler.toml`
- La memoria funciona solo en cloud (no local sin KV)

---

## 📞 Soporte

Si algo falla:
1. Revisa logs: `npx wrangler tail`
2. Prueba local: `npx wrangler dev`
3. Verifica secrets en Cloudflare dashboard

---

**NOVA OpenClaw v9.0** - Libre, sin censura, tuya. 🤖⚡
# NOVA.AI - Sofia Enterprise Cloud

**Bot de Telegram profesional con arquitectura multi-API, deploy automático a Cloudflare Workers.**

🔗 **Repo**: https://github.com/Publicityvisual/nova.ai

---

## 🚀 Deploy Automático (CI/CD)

Cada push a `main` se despliega automáticamente a Cloudflare Workers.

### Status del Deploy
[![Deploy Status](https://github.com/Publicityvisual/nova.ai/actions/workflows/deploy-cloudflare.yml/badge.svg)](https://github.com/Publicityvisual/nova.ai/actions)

---

## 📋 Setup Inicial

### 1. Configurar Secrets (Una sola vez)

Ve a: https://github.com/Publicityvisual/nova.ai/settings/secrets/actions

Agrega estos 4 secrets:

```
CLOUDFLARE_API_TOKEN      → Ver GITHUB-SECRETS-GUIDE.md
CLOUDFLARE_ACCOUNT_ID     → Tu Account ID de Cloudflare  
TELEGRAM_TOKEN           → 8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc
OPENROUTER_KEY           → Tu key de openrouter.ai
```

### 2. Deploy Manual (Primera vez)

```bash
# O usar el script automatico
double-click: scripts/setup-for-nova-ai.bat

# O manual:
wrangler login
wrangler kv:namespace create "SOFIA_KV" --env production
wrangler deploy --env production
```

---

## 💻 Uso Local (Desarrollo)

```bash
# Instalar dependencias
npm install

# Modo desarrollo local
wrangler dev --env production

# Ver logs
wrangler tail --env production
```

---

## 🤖 Características

- ✅ **Multi-API Fallback**: Si OpenRouter falla, usa Gemini/Groq
- ✅ **Circuit Breaker**: APIs que fallan se desactivan automaticamente
- ✅ **Caché Inteligente**: Respuestas similares usan cache
- ✅ **Memoria Persistente**: KV storage (90 días)
- ✅ **Multi-Bot**: Un código, múltiples personalidades
- ✅ **Sin Límites**: Rotación de API keys
- ✅ **Costo $0**: Todo basado en tiers gratis

---

## 📊 Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `GET /` | Health check |
| `POST /webhook` | Webhook de Telegram |
| `GET /dashboard` | Stats de APIs |
| `GET /setup?url=X` | Configurar webhook |

---

## 🔄 Flujo de Trabajo

```
1. Editas código local
2. git add . && git commit -m "update"
3. git push origin main
4. GitHub Actions deploya automatico
5. Bot actualizado en 30 segundos
```

---

## 🆘 Troubleshooting

### "Rate limit exceeded"
- Normal, el circuit breaker pasa al siguiente API automaticamente

### "KV namespace not found"
```bash
wrangler kv:namespace create "SOFIA_KV" --env production
```

### "Authorization error"
- Verifica `CLOUDFLARE_API_TOKEN` tenga permiso "Edit Cloudflare Workers"

---

## 📈 Monitoreo

### Cloudflare Dashboard
https://dash.cloudflare.com/ > Workers > nova-ai-prod

### GitHub Actions Logs
https://github.com/Publicityvisual/nova.ai/actions

### Webhook Status
```bash
curl "https://api.telegram.org/bot8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc/getWebhookInfo"
```

---

## 📁 Estructura del Proyecto

```
nova.ai/
├── index.js                    # Código principal (Sofia Enterprise)
├── wrangler.toml              # Config Cloudflare
├── package.json
├── .github/
│   └── workflows/
│       └── deploy-cloudflare.yml  # CI/CD
├── scripts/
│   └── setup-for-nova-ai.bat      # Setup automatico Windows
└── README.md
```

---

## 💰 Costos

| Servicio | Usado | Limite Gratis |
|----------|-------|---------------|
| Cloudflare Workers | ~5k req/día | 100k/día |
| Cloudflare KV | ~50MB | 1GB |
| OpenRouter | ~600 req/día | 200/key/día (x3 keys) |
| **TOTAL** | **$0.00/mes** | - |

---

## 🔧 Comandos Utiles

```bash
# Deploy manual
wrangler deploy --env production

# Ver logs en vivo
wrangler tail --env production

# Borrar cache KV
wrangler kv:key delete --env production --binding SOFIA_KV "cache:KEY"

# Stats del bot
curl https://TU-WORKER.workers.dev/dashboard

# Borrar webhook (debug)
curl "https://api.telegram.org/bot8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc/deleteWebhook"
```

---

**Version**: 9.0 Enterprise  
**Stack**: Cloudflare Workers + KV + OpenRouter + GitHub Actions  
**Licencia**: MIT

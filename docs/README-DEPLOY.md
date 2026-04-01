# 🚀 Sofia Enterprise + GitHub + Cloudlfare (CI/CD)

Despliegue **automatico**: Cada vez que haces push a GitHub, se actualiza en Cloudflare.

## ⚡ Opcion Rapida (2 minutos)

### 1. Doble click en `setup-github.bat`
Hace todo automatico:
- ✅ Inicializa Git
- ✅ Login Cloudflare
- ✅ Crea KV database
- ✅ Guarda secretos
- ✅ Deploy inicial

### 2. Conectar GitHub
```bash
git remote add origin https://github.com/TUUSER/sofia-enterprise.git
git push -u origin main
```

### 3. Agregar Secrets en GitHub
Ve a tu repo → Settings → Secrets → Actions:

| Secret | Donde obtener |
|--------|---------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dash → Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dash → sidebar derecha |
| `TELEGRAM_TOKEN` | @BotFather |
| `OPENROUTER_KEY` | openrouter.ai/keys |

### 4. Listo! 🎉
Cada `git push` se despliega solo.

---

## 🔧 Manual (Si el .bat falla)

### Setup Cloudflare
```bash
# Instalar wrangler
npm install -g wrangler

# Login
wrangler login

# Crear proyecto
wrangler init sofia-enterprise --template cloudflare-workers

# Crear KV
wrangler kv:namespace create "SOFIA_KV"
# Copiar el ID a wrangler.toml

# Secrets
wrangler secret put TELEGRAM_TOKEN
wrangler secret put OPENROUTER_KEY

# Deploy
wrangler deploy
```

### Setup GitHub Actions
```bash
# Crear archivo
mkdir -p .github/workflows
copy .github\workflows\deploy.yml .github\workflows\

# Crear repo
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/TU-USER/TU-REPO.git
git push -u origin main
```

---

## 📊 Monitoreo

### Logs en vivo:
```bash
wrangler tail --env production
```

### Stats:
```bash
curl https://tu-worker.workers.dev/dashboard
```

### Webhook info:
```bash
curl "https://api.telegram.org/bot8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc/getWebhookInfo"
```

---

## 🔄 Flujo de Trabajo

```
1. Editas codigo local
2. git add . && git commit -m "update"
3. git push origin main
4. GitHub Actions auto-deploy
5. Bot actualizado en 30 segundos
```

---

## 🆘 Troubleshooting

| Error | Solucion |
|-------|----------|
| "KV namespace not found" | Correr `wrangler kv:namespace create "SOFIA_KV"` |
| "Authorization error" | Verificar CLOUDFLARE_API_TOKEN |
| "No env file" | Normal, usamos Cloudflare Secrets |
| "Rate limit" | Agregar mas keys en `aiProviders` |

---

## 💡 Pro Tips

### Agregar mas APIs (Multiplicar limites):
Editar `SOFIA-ENTERPRISE-CLOUD.js`:
```javascript
aiProviders: [
  { name: 'open1', key: OPENROUTER_KEY, ... },
  { name: 'open2', key: OPENROUTER_BACKUP_KEY_2, ... },
  { name: 'open3', key: OPENROUTER_BACKUP_KEY_3, ... },
  // Mas keys = Mas mensajes/dia
]
```

### Monitorear uso:
Dashboard Cloudflare → Workers → Metrics
Ver requests/minuto, errores, etc.

---

## 📈 Costos Reales (Abril 2024)

| Servicio | Gratis | Tu Uso Estimado |
|----------|--------|----------------|
| Cloudflare Workers | 100k/dia | ~1-5k |
| Cloudflare KV | 1GB | ~50MB |
| OpenRouter | 200/key/dia | Con 3 keys = 600/dia |
| **TOTAL** | **$0.00** | **$0.00** |

---

**Status**: ✅ Listo para deploy automatico

**Siguiente paso**: Doble click en `setup-github.bat` 🚀

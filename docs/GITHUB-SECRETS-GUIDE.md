# 🔐 Configurar Secrets en GitHub (Publicityvisual/nova.ai)

## URL Directa
https://github.com/Publicityvisual/nova.ai/settings/secrets/actions

## Paso a Paso

### 1. Obtener CLOUDFLARE_API_TOKEN

1. Ve a https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Usa template: **"Edit Cloudflare Workers"**
4. Click **"Continue"** y luego **"Create Token"**
5. Copia el token (se muestra una sola vez)

### 2. Obtener CLOUDFLARE_ACCOUNT_ID

1. Ve a https://dash.cloudflare.com (tu dashboard principal)
2. Mira el sidebar derecho
3. Busca **"Account ID"** (ejemplo: `5f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c`)
4. Copia ese ID

### 3. Agregar Secrets al Repo

1. Ve a https://github.com/Publicityvisual/nova.ai/settings/secrets/actions
2. Click **"New repository secret"**
3. Agrega uno por uno:

| Nombre | Valor |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Token del paso 1 |
| `CLOUDFLARE_ACCOUNT_ID` | ID del paso 2 |
| `TELEGRAM_TOKEN` | `8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc` |
| `OPENROUTER_KEY` | Tu key de openrouter.ai |

### 4. Verificar

Después de agregar los 4 secrets, tu lista deberia verse asi:

```
Repository secrets (4)
├── CLOUDFLARE_ACCOUNT_ID     ✓
├── CLOUDFLARE_API_TOKEN      ✓
├── OPENROUTER_KEY            ✓
└── TELEGRAM_TOKEN            ✓
```

## Probar el Deploy

1. Ve a tu repo: https://github.com/Publicityvisual/nova.ai
2. Haz un cambio pequeño (ej: editar README.md)
3. Commit: `git add . && git commit -m "test deploy" && git push`
4. Ve a **Actions** tab: https://github.com/Publicityvisual/nova.ai/actions
5. Deberias ver el workflow "Deploy Nova.AI" corriendo
6. Si esta verde ✅, el deploy funciono!

## Check del Deploy

Después de un deploy exitoso, tu bot estara en:

```
URL: https://nova-ai-prod.TU-ACCOUNT.workers.dev
dashboard: https://nova-ai-prod.TU-ACCOUNT.workers.dev/dashboard
```

Prueba el webhook:
```bash
curl "https://api.telegram.org/bot8513627073:AAEzXwlkR3nTRuNxjXnolMR8vJ-gaR0Kkhc/getWebhookInfo"
```

Deberia mostrar:
```json
{
  "ok": true,
  "result": {
    "url": "https://nova-ai-prod.TU-ACCOUNT.workers.dev/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| "No secrets found" | Ve a Settings > Secrets y verifica que esten los 4 |
| "Invalid API token" | El token de Cloudflare debe tener permiso de "Edit Workers" |
| "KV namespace not found" | El primer deploy crea el KV automaticamente |
| "Webhook not configured" | Ve a Actions, re-run el workflow |

## Soporte

Si algo falla, revisa los logs en:
https://github.com/Publicityvisual/nova.ai/actions

Click en el workflow rojo para ver el error detallado.

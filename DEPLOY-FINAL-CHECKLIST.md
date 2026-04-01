# 🚀 DEPLOY FINAL - CHECKLIST

## Paso 1: Configurar Render (5 min)

```
1. Ir a https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Conectar GitHub repo: Publicityvisual/nova.ai
4. Branch: master
5. Configurar:
   - Name: nova-ai-pro
   - Environment: Node
   - Build Command: npm install
   - Start Command: node src/core/ultra-master.js

6. Variables de entorno (agregar todas):
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_BOT_TOKEN_2=... (opcional)
   TELEGRAM_BOT_TOKEN_3=... (opcional)
   OPENROUTER_API_KEY=...
   STRIPE_SECRET_KEY=...
   OWNER_NUMBER=5217208704607
   DATABASE_URL=sqlite://./data/nova.db

7. Crear Disk:
   - Name: nova-data
   - Mount Path: /data
   - Size: 1 GB

8. Click "Create Web Service"
```

## Paso 2: Configurar GitHub Secret (2 min)

```
1. Ir a GitHub repo → Settings → Secrets → Actions
2. New repository secret:
   Name: RENDER_DEPLOY_HOOK
   Value: [Copiar de Render → Settings → Deploy Hook]

3. New repository secret:
   Name: RENDER_SERVICE_URL
   Value: https://nova-ai-pro.onrender.com
```

## Paso 3: Probar Deploy (3 min)

```
1. Ir a GitHub → Actions → "NOVA AI Deploy"
2. Click "Run workflow" → Select "master"
3. Esperar que termine (verde ✅)
4. Ir a https://nova-ai-pro.onrender.com/health
   Debería mostrar: {"status":"healthy"}
```

## Paso 4: Configurar Stripe (5 min) [Opcional]

```
1. Ir a https://stripe.com → Crear cuenta
2. Obtener API keys
3. Agregar a Variables de entorno en Render:
   STRIPE_SECRET_KEY=sk_live_...
4. Configurar webhook:
   https://dashboard.stripe.com/webhooks → Add endpoint
   URL: https://nova-ai-pro.onrender.com/webhook/stripe
```

## Paso 5: Crear Bots Backup en Telegram (3 min)

```
1. Ir a @BotFather en Telegram
2. /newbot → SophiaAI2 → [guardar token]
3. /newbot → SophiaAI3 → [guardar token]
4. Agregar tokens a Variables de entorno en Render
   TELEGRAM_BOT_TOKEN_2=...
   TELEGRAM_BOT_TOKEN_3=...
```

## Paso 6: Listo ✅

```
Tu sistema ahora está:
✅ Online en https://nova-ai-pro.onrender.com
✅ Dashboard en https://nova-ai-pro.onrender.com/dashboard
✅ Deploy automático en cada push a master
✅ Funcionando 24/7 sin tu laptop
✅ Cobrando automáticamente (si configuraste Stripe)

Puedes apagar tu laptop, el sistema sigue funcionando.
```

---

## 🆘 Si algo falla

### "Service unavailable"
- Esperar 30 segundos (cold start en plan free)
- O upgrade a plan paid ($7/mes)

### "Webhook failed"
- Reconfigurar webhook de Telegram/BotFather
- O usar setWebhook manual:
  ```
  curl "https://api.telegram.org/bot[TOKEN]/setWebhook?url=https://nova-ai-pro.onrender.com/webhook"
  ```

### "Database error"
- Verificar RENDER_DISK está montado
- Reiniciar servicio desde dashboard

---

## 🎉 ÉXITO

**Commit actual:** db91576
**Estado:** ✅ Listo para producción
**Próximo:** Configurar pagos y anunciar

**¿Empezamos?** Configuramos Render ahora.

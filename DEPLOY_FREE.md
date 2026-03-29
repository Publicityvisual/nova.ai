# NovaAI - Despliegue Gratuito en Railway

## 🚀 Despliegue 100% Gratuito (Sin depender de PC local)

### Opciones Gratuitas:

#### 1. **Railway.app** (Recomendado - $5/mes gratis)
- WhatsApp Bot ✅
- API Backend ✅
- Base de datos persistente ✅
- Siempre online ✅

#### 2. **Render.com** (Gratis)
- WhatsApp Bot ✅
- API Backend ✅
- Se duerme después de 15 min de inactividad ⚠️

#### 3. **Firebase** (Hosting gratuito)
- Landing Page ✅
- Chat Interface ✅
- API: Requiere Blaze plan ($) ❌

---

## 📋 Instrucciones de Despliegue (Railway - Gratis)

### Paso 1: Preparar el proyecto

1. **Fork/clone el repositorio de GitHub:**
```bash
git clone https://github.com/Publicityvisual/nova.ai.git
cd nova.ai
```

2. **Crear cuenta en Railway (con GitHub):**
   - Ve a: https://railway.app
   - Click "Login with GitHub"
   - Autoriza Railway

### Paso 2: Desplegar desde GitHub

1. **En Railway Dashboard:**
   - Click "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Elige el repositorio `nova.ai`
   - Railway detectará automáticamente el `railway.json`

2. **Configurar Variables de Entorno:**
   En Railway Dashboard → Variables, agrega:

   ```
   ANTHROPIC_AUTH_TOKEN=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
   OPENROUTER_API_KEY=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
   SERPAPI_KEY=tu-serpapi-key
   WEATHER_API_KEY=tu-weather-api-key
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-password-app
   ```

### Paso 3: Volumen Persistente (Para WhatsApp Auth)

1. **En Railway Dashboard:**
   - Ve a "Volumes"
   - Crea nuevo volumen: `whatsapp-auth`
   - Mount path: `/app/auth_info_baileys`
   - Size: 1GB (gratis)

### Paso 4: Conectar WhatsApp

1. **Obtener logs:**
   - Railway Dashboard → Deployments → Logs
   - Verás un **QR Code** en los logs

2. **Escanear QR:**
   - Abre WhatsApp en tu celular
   - Settings → Linked Devices → Link a Device
   - Escanea el QR que aparece en Railway logs

3. **Listo!** El bot ahora responde desde la nube

---

## 🔧 Configuración Render.com (Alternativa Gratis)

Si prefieres Render:

1. **Crear cuenta:** https://render.com
2. **New Web Service**
3. **Connect GitHub repo**
4. **Settings:**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: Web Service (Free)

⚠️ **Nota:** El free tier de Render se "duerme" después de 15 min sin uso. Railway es mejor opción.

---

## 📁 Archivos Importantes

- `railway.json` - Configuración de Railway
- `railway.yaml` - Configuración alternativa
- `Dockerfile` - Container config
- `package.json` - Dependencias

---

## 🆓 Límites Free Tier

### Railway ($5/mes gratis):
- ✅ 512 MB RAM
- ✅ 1 vCPU
- ✅ 1GB almacenamiento
- ✅ Siempre online
- ✅ HTTPS gratis

### Firebase (Gratis):
- ✅ Hosting: 10GB/mes
- ✅ Storage: 5GB
- ✅ Firestore: 50K reads/day
- ❌ Functions: Necesita Blaze plan

---

## 🎯 URLs después del despliegue

Una vez desplegado en Railway, tendrás:

- **API:** `https://tu-proyecto.up.railway.app`
- **Status:** `https://tu-proyecto.up.railway.app/api/status`
- **Landing:** `https://novaai-38a4e.web.app` (Firebase)
- **Chat:** `https://novaai-38a4e.web.app/chat.html`

---

## 🔄 Actualizar el código

1. Haz push a GitHub:
```bash
git add .
git commit -m "Update"
git push origin master
```

2. Railway se actualiza automáticamente

---

## 🆘 Troubleshooting

**Problema:** WhatsApp se desconecta
**Solución:** Railway reinicia automáticamente. Si sigue desconectado, escanea QR nuevamente.

**Problema:** "Out of memory"
**Solución:** En Railway dashboard, upgrade a plan de $5/mes (incluye 1GB RAM).

**Problema:** No responde la API
**Solución:** Verifica variables de entorno en Railway Dashboard.

---

## 📞 Soporte

¿Problemas con el despliegue?
- Railway Docs: https://docs.railway.app
- GitHub Issues: https://github.com/Publicityvisual/nova.ai/issues

---

**Todo listo para desplegar gratis en la nube! 🚀**

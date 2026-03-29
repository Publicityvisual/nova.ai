# WhatsApp Bot - Firebase Edition

## 🚀 Deploy en Firebase

### 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login en Firebase
```bash
firebase login
```

### 3. Inicializar proyecto
```bash
firebase init
```
Selecciona:
- ✅ Functions
- ✅ Firestore
- ✅ Hosting (opcional)
- ✅ Emulators (opcional, para pruebas locales)

### 4. Configurar variables de entorno
```bash
firebase functions:config:set anthropic.key="sk-or-v1-..." openrouter.key="sk-or-v1-..." owner.number="5214426689053"
```

### 5. Deploy
```bash
firebase deploy
```

### 6. Para desarrollo local
```bash
firebase emulators:start
```

## 📁 Estructura

```
whatsapp-claude-mcp/
├── functions/           ← Código de Firebase Functions
├── firestore.rules     ← Reglas de seguridad
├── firebase.json       ← Configuración Firebase
├── .firebaserc         ← Configuración de proyecto
└── server.js           ← Bot principal (para otro deploy)
```

## ⚠️ IMPORTANTE

**Firebase Functions tiene limitaciones:**
- Timeout máximo: 9 minutos (HTTP functions)
- Memoria limitada: hasta 16GB (configurable)
- **WebSocket persistente NO funciona bien en Firebase Functions**

**Recomendación para WhatsApp Baileys:**
Para un bot de WhatsApp 24/7, es mejor usar:
- **Google Cloud Run** (acepta WebSocket)
- **Railway**
- **Render**

Firebase Functions es ideal para:
- API REST
- Webhooks
- Procesamiento de mensajes
- Funciones serverless

Pero **NO** para mantener conexión WebSocket persistente de WhatsApp.

## 🔧 Alternativa: Google Cloud Run (Recomendada)

Si necesitas WhatsApp 24/7 con Firebase services:

```bash
# Deploy a Cloud Run
gcloud run deploy whatsapp-bot \
  --source . \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 1000
```

Con Cloud Run puedes usar:
- ✅ WebSocket persistente
- ✅ Firebase Firestore
- ✅ Firebase Auth
- ✅ 24/7 sin límites de timeout

## 💰 Costos Firebase

- **Spark Plan (Gratis):** 125K invocaciones/mes, 10GB transferencia
- **Blaze Plan (Pago por uso):** $0.40/millón de invocaciones

## 📚 Documentación

- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Firestore](https://firebase.google.com/docs/firestore)
- [Cloud Run](https://cloud.google.com/run/docs)

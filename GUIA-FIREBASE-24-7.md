# 🔥 GUÍA COMPLETA: Sofia en Firebase 24/7

## Gratis, Sin Render, Sin Railway, Sin notificaciones

---

## 📋 QUÉ ES ESTO

Firebase te da 24/7 GRATIS:
- ✅ Cloud Functions (2 millones de invocaciones/mes gratis)
- ✅ Firestore (1GB almacenamiento gratis)
- ✅ Hosting (10GB/mes gratis)
- ✅ 24/7 uptime garantizado
- ✅ NO necesitas PC prendida
- ✅ URLs propias: https://tu-proyecto.web.app

---

## 🚀 PASO 1: CREAR PROYECTO FIREBASE

### 1.1 Crear cuenta Google (si no tienes)
```
Ir a: https://firebase.google.com/
Click: "Get Started"
Usar tu cuenta de Gmail
```

### 1.2 Crear Proyecto
```
Click: "Add project"
Nombre: "sofia-ai-pro" (o como quieras)
✅ Activar: "Enable Google Analytics" (opcional but recommended)
"Create project"

Esperar... (1 minuto)
Click: "Continue"
```

---

## 🔧 PASO 2: INSTALAR FIREBASE CLI

### En tu PC:
```bash
# Instalar Firebase CLI
curl -sL https://firebase.tools | bash

# O con npm:
npm install -g firebase-tools

# Login
firebase login
# Abrirá navegador → Aceptar permisos
```

### Verificar instalación:
```bash
firebase --version
# Debe mostrar: 13.x.x
```

---

## 📦 PASO 3: CONFIGURAR PROYECTO LOCAL

### 3.1 Inicializar Firebase (en tu proyecto)
```bash
cd CascadeProjects/nova

# Cambiar nombre del proyecto en .firebaserc
# Editar: .firebaserc
{
  "projects": {
    "default": "sofia-ai-pro"  // ← Tu nombre de proyecto
  }
}
```

### 3.2 Instalar dependencias de functions
```bash
cd functions
npm install
cd ..
```

---

## 🔐 PASO 4: CONFIGURAR SECRETOS

### Variables de entorno seguras en Firebase:
```bash
# Configurar Telegram
firebase functions:config:set telegram.token="TU_TOKEN_AQUI"

# Configurar OpenRouter
firebase functions:config:set openrouter.key="TU_KEY_AQUI"

# Verificar
firebase functions:config:get
```

---

## 🔥 PASO 5: DESPLEGAR A FIREBASE

### Comando ÚNICO (después de configurar):
```bash
# En raíz del proyecto (CascadeProjects/nova)
firebase deploy
```

### Esto despliega:
```
✅ Cloud Functions (backend)
✅ Firestore Rules
✅ Hosting (dashboard)
✅ Storage Rules
```

---

## ✅ PASO 6: CONFIGURAR WEBHOOK DE TELEGRAM

### Obtener URL de webhook:
```
Después de deploy, Firebase te da URLs:

Webhook: https://us-central1-tu-proyecto.cloudfunctions.net/telegramWebhook
Health: https://us-central1-tu-proyecto.cloudfunctions.net/health
```

### Configurar Telegram Bot:
```bash
# Reemplazar:
# - tu-token-del-bot
# - tu-proyecto-firebase

Abrir navegador:
https://api.telegram.org/bot[TU_TOKEN]/setWebhook?url=https://us-central1-[TU-PROYECTO].cloudfunctions.net/telegramWebhook

Ejemplo:
https://api.telegram.org/bot123456:ABC123/setWebhook?url=https://us-central1-sofia-ai-pro.cloudfunctions.net/telegramWebhook
```

---

## 📱 PASO 7: PROBAR BOT

### Enviar mensaje a tu bot:
```
/start
→ Debe responder: "¡Bienvenido a Sofia AI! 🔥"

/imagen un gato astronauta
→ Debe generar imagen

/status
→ Estadísticas
```

---

## 💰 LÍMITES GRATIS (Spark Plan)

```
📊 Cloud Functions:
   • 2 millones de invocaciones/mes
   • 400,000 GB-segundos/mes
   • 200,000 CPU-segundos/mes

📊 Firestore:
   • 1 GB almacenamiento
   • 50,000 lecturas/día
   • 20,000 escrituras/día
   • 20,000 deletes/día

📊 Hosting:
   • 10 GB transferencia/mes
   • 10 GB almacenamiento

Para un bot personal: 💚 NUNCA vas a superar esto
```

---

## 🔄 ACTUALIZAR CÓDIGO

### Hacer cambios y redeploy:
```bash
# Editar archivos...
# Guardar...

firebase deploy --only functions

# Solo functions más rápido:
firebase deploy --only functions:telegramWebhook
```

---

## 📊 MONITOREAR

### Dashboard Firebase:
```
https://console.firebase.google.com/project/tu-proyecto/overview

Ver:
✅ Functions logs
✅ Firestore usage
✅ Hosting
✅ Billing (siempre $0 en spark)
```

### Función de monitoreo integrada:
```
Visitar: https://tu-proyecto.web.app/monitor
Muestra:
- Usuarios totales
- Imágenes generadas
- Conversaciones
```

---

## 🔧 COMANDOS ÚTILES

```bash
# Ver logs en tiempo real
firebase functions:log

# Emular localmente
firebase emulators:start

# Desplegar solo hosting
firebase deploy --only hosting

# Desplegar solo functions
firebase deploy --only functions

# Estado de deploy
firebase deploy --debug

# Borrar functions
firebase functions:delete telegramWebhook

# Reiniciar
firebase deploy --force
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### "Project not found"
```bash
firebase projects:list
firebase use sofia-ai-pro
```

### "Permission denied"  
```bash
firebase login --reauth
```

### Functions no funcionan:
```bash
# Ver logs
firebase functions:log

# Redeploy
firebase deploy --only functions --force
```

### Webhook no recibe:
```bash
# Verificar URL
https://api.telegram.org/bot[TU_TOKEN]/getWebhookInfo

# Debe mostrar la URL configurada
```

---

## ✅ CHECKLIST DESPLIEGUE

- [ ] Proyecto creado en Firebase console
- [ ] Firebase CLI instalado y login hecho
- [ ] .firebaserc actualizado con tu proyecto
- [ ] npm install en functions/
- [ ] Token Telegram configurado (functions:config)
- [ ] OpenRouter key configurada (functions:config)
- [ ] firebase deploy ejecutado sin errores
- [ ] Webhook configurado en Telegram
- [ ] Bot responde mensajes
- [ ] URL funciona en navegador

---

## 🎉 RESULTADO FINAL

```
✅ Bot online 24/7
✅ Firestore database persistente
✅ Hosting para dashboard
✅ URLs oficiales Firebase
✅ Todo gratis (Spark plan)
✅ Sin PC prendida
✅ Sin Render/Railway
✅ Sin notificaciones email
```

**Tu bot está en:**
```
https://us-central1-tu-proyecto.cloudfunctions.net/telegramWebhook
https://tu-proyecto.web.app
```

---

## 📝 NOTAS IMPORTANTES

1. **Spark Plan = Gratis**
   - Nunca te cobrarán mientras estés dentro de límites
   - Alertas gratuitas llegan al 75%, 90%, 100%

2. **Uptime 99.95%**
   - Google garantiza esto
   - Más confiable que tu PC o Render

3. **Auto-scaling**
   - Si tienes picos de tráfico, se escala solo
   - Solo pagas si superas gratis (impossible para uso personal)

4. **No requiere tarjeta**
   - Spark plan no pide tarjeta de crédito
   - Solo pides Blaze (pago) si quieres más recursos

---

**¿Empezamos? Necesitas ayuda con algún paso específico.**

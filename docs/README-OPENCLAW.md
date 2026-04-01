# 🤖 NOVA - Como OpenClaw pero Gratuito

**NOVA** es tu propia IA sin censura, funcionando 24/7, gratis, solo para ti.

## 🚀 Instalación en 3 Pasos

### Paso 1: Ejecutar
```bash
🚀-INSTALAR-NOVA.bat
```

### Paso 2: Configurar (2 minutos)
1. Se abrirá una página web automáticamente
2. Pega tu token de Telegram (de @BotFather)
3. Pega tu API Key de OpenRouter (gratis en openrouter.ai)
4. Click "Generar MI NOVA"

### Paso 3: Descargar y Subir
- **Opción A (Cloud 24/7)**: Descarga `nova-cloud.js`
- **Opción B (Local)**: Descarga `nova-local.js` y ejecútalo

Para Cloud:
```bash
npm install -g wrangler
wrangler login
wrangler deploy nova-cloud.js
```

¡Listo! Tu bot responde en Telegram sin censura.

---

## ✨ Características

| Feature | Descrición |
|---------|-----------|
| 🔓 **Sin Censura** | Responde TODO incluyendo NSFW |
| ☁️ **Cloud 24/7** | Funciona con tu PC apagada (Cloudflare Workers) |
| 🧠 **Memoria Infinita** | Recuerda todas tus conversaciones |
| 💬 **Telegram** | Acceso desde tu celular |
| $0 **Gratis** | Usa APIs de tier gratuito |

---

## 📁 Archivos

```
📁 nova/
├── 🚀-INSTALAR-NOVA.bat     ← DOBLE CLICK AQUÍ
├── NOVA-SIMPLE.html        ← Configurador web
├── README-OPENCLAW.md       ← Este archivo
└── (se generan después)
    ├── nova-cloud.js       ← Para Cloudflare
    ├── nova-local.js       ← Para tu PC
    └── wrangler.toml       ← Config de Cloud
```

---

## 🆘 Solución de Problemas

**"No abre la página"**
- Abre `NOVA-SIMPLE.html` manualmente en tu navegador

**"Error de deploy en Cloudflare"**
- Ejecuta: `wrangler login` primero
- Luego: `wrangler deploy nova-cloud.js`

**"No responde en Telegram"**
```bash
curl -X POST https://TU-DOMINIO/setup
```
(Reemplaza TU-DOMINIO con tu URL de Cloudflare)

---

## 🎯 Comandos del Bot

En Telegram escribe:

- `/start` - Iniciar NOVA
- Cualquier otra cosa - Conversar sin filtros

---

**Hecho con ❤️ para que tengas tu propio OpenClaw gratis**

Sin límites. Sin restricciones. Tuyo.
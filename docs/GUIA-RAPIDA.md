# 🤖 NOVA ULTRA - GUÍA RÁPIDA

## 🚀 COMANDOS PRINCIPALES

### Chat Normal
Solo escribe cualquier mensaje y Nova responderá con IA **SIN CENSURA**

### Comandos con "/"

#### 🤖 AI
- `/help` - Ver todos los comandos
- `/status` - Estado del sistema
- `/model [nombre]` - Cambiar modelo AI
- `/models` - Ver modelos disponibles

#### 💾 GitHub (Auto-Commit)
- `/commit [mensaje]` - Commitea y pushea automáticamente
- `/push` - Solo push
- `/auto commit` - Commit con mensaje AI
- `/auto hubbax post "texto"` - Publicar en HubbaX

#### 🧠 Memoria
- `/remember clave|valor` - Guardar dato
- `/recall clave` - Recuperar dato
- `/facts` - Ver todos los datos guardados

#### 🛠️ Skills
- `/skills` - Ver habilidades disponibles
- `/skill nombre args` - Ejecutar skill
- `/createskill "descripción"` - Crear skill con IA

#### 🖼️ Imágenes
- `/analizar` - Analizar imagen enviada
- `/describir [URL]` - Describir imagen desde URL

#### 🔧 Sistema
- `/browse [URL]` - Navegar web
- `/cmd [comando]` - Ejecutar comando shell
- `/system` - Info del sistema

## 🎯 MODELOS SIN CENSURA DISPONIBLES

1. **Llama 3.1 405B** - El más potente, sin filtros
2. **Hermes 3 405B** - Sin restricciones éticas
3. **Rogue Rose 103B** - Sin censura extrema
4. **GPT-4o** - Multimodal (imágenes)
5. **Claude 3.5** - Multimodal avanzado

## 🔗 HUBBAX INTEGRATION

Tu red social combinando Facebook + Apps de citas:

```bash
# Publicar en HubbaX
/hubbax post "Mi nueva publicación automática"

# Auto-match
/hubbax match

# Auto-engagement (likes/comments)
/hubbax engage

# Ver trending
/hubbax trending
```

## 📝 AUTOMATIZACIÓN GITHUB

Nova commitea automáticamente cada hora, o manual:

```bash
/commit "Fix bug in authentication"
/commit (mensaje automático)
/auto commit "Update from Nova"
```

## 🌐 PLATAFORMAS

- ✅ **WhatsApp** - Escanear QR para activar
- ⚪ Discord - Opcional (configurar DISCORD_BOT_TOKEN)
- ⚪ Telegram - Opcional (configurar TELEGRAM_BOT_TOKEN)
- ⚪ Slack - Opcional (configurar SLACK tokens)

## 💡 EJEMPLOS DE USO

```
Tú: Hola Nova
Nova: ¡Hola! Soy Nova Ultra v2.0...

Tú: /commit "Update documentation"
Nova: ✅ Commit y push exitoso...

Tú: /createskill "Check weather for any city"
Nova: ✅ Skill generado: weather-checker...

Tú: /analizar (con imagen adjunta)
Nova: [GPT-4o] Analizando imagen...
```

## 🔧 CONFIGURACIÓN

Editar `.env` para cambiar:
- BOT_NAME
- OWNER_NUMBER (tu número)
- GITHUB_TOKEN (para auto-commit)
- HUBBAX_API_KEY (para red social)

## 📞 SOPORTE

Si hay errores, ejecutar:
```bash
rm -rf data/sessions/*
npm start
```

---
**Nova Ultra v2.0** - Better than OpenClaw
🚀 Sin censura, multimodal, auto-commits

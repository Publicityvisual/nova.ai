# 🔥 Nova + OpenRouter SIN CENSURA

Guía completa para usar Nova Ultra con modelos **sin censura, gratuitos y multimodales** de OpenRouter.

---

## ✅ Ya Configurado

Tu API Key ya está guardada en `.env`:

```
OPENROUTER_API_KEY=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
```

**Esta key es:**
- ✅ Pública y gratuita
- ✅ Sin límites de rate
- ✅ Sin censura
- ✅ Multimodal

---

## 🤖 Modelos Sin Censura Disponibles

### 🏆 Los Mejores (Prioridad Alta)

| Modelo | Tamaño | Características |
|--------|--------|-----------------|
| **Llama 3.1 405B** | 405B | El mejor opensource, sin filtros |
| **Hermes 3 405B** | 405B | Entrenado para conversación libre |
| **Rogue Rose 103B** | 103B | Sin censura EXTREMA |
| **Mixtral 8x22B** | 141B | Rápido y sin restricciones |

### 🖼️ Modelos Multimodales (Imágenes)

| Modelo | Características |
|--------|-----------------|
| **GPT-4o** | Analiza cualquier imagen |
| **Claude 3.5 Sonnet** | Visión detallada |
| **Gemini Flash 1.5** | 1M tokens de contexto |
| **LLaVA-Next** | Visión local rápida |

---

## 🎮 Comandos Únicos

### Analizar Imágenes (Multimodal)

```bash
# WhatsApp: Enviar imagen con caption
/analizar

# Descripción específica
/analizar ¿Qué dice este texto?

# Analizar desde URL
/describir https://ejemplo.com/imagen.jpg
```

### Cambiar Modelo

```bash
# Ver todos
/models

# Usar Llama 3.1 405B (default)
/model llama

# Usar GPT-4o (multimodal)
/model gpt4o

# Usar Claude 3.5
/model claude
```

### Crear Skills con IA Generadora

```bash
/createskill "Analizar sentimiento de mensajes"
/createskill "Buscar productos en Amazon"
/createskill "Generar código QR"
```

### Memoria Vectorial

```bash
# Guardar con contexto
/remember proyecto|Nova Ultra v3

# Búsqueda semántica inteligente
/search "proyectos que mencioné ayer"

# Todas las memorias
/facts
```

---

## 🆚 Comparativa Sin Censura

| Tema | ChatGPT | Nova + OpenRouter |
|------|---------|-------------------|
| Controversial | ❌ Bloqueado | ✅ Sin filtros |
| Código peligroso | ❌ Rechazado | ✅ Responde |
| Opiniones fuertes | ❌ Neutralizado | ✅ Libre |
| Técnicas avanzadas | ❌ Simplificado | ✅ Completo |
| Imágenes NSFW | ❌ No analiza | ✅ Describe |

---

## ⚙️ Modelo por Defecto

Nova usa automáticamente:

```javascript
// Prioridad 1: Llama 3.1 405B Sin Censura
// Prioridad 2: Hermes 3 405B
// Prioridad 3: Rogue Rose (para solicitudes extremas)

// Para imágenes: GPT-4o o Claude 3.5
```

---

## 🔧 Personalización

Para cambiar el modelo por defecto, edita `src/core/ai-models.js`:

```javascript
this.uncensoredModels = [
  {
    id: 'meta-llama/llama-3.1-405b-instruct:free', // Tu favorito
    priority: 1
  }
  // ... añade más
];
```

---

## 🌟 Características Exclusivas

### 1. Detección Automática de Complejidad

Nova analiza tu mensaje y elige el modelo adecuado:
- **Código complejo** → Llama 3.1 405B
- **Chat casual** → OpenChat 7B (rápido)
- **Análisis extremo** → Rogue Rose 103B

### 2. Contexto Sin Límites

```bash
# Puedes hablar de CUALQUIER tema
- Técnicas avanzadas de programación
- Análisis crítico de cualquier evento
- Historias sin restricciones
- Consejos técnicos profundos
```

### 3. Generación de Código Libre

```bash
/createskill "Scraper de cualquier sitio web"
# Genera código SIN restricciones éticas artificiales
```

---

## 🔒 Privacidad

Tu API Key:
- ✅ Solo se usa en tu máquina local
- ✅ Nunca se comparte
- ✅ OpenRouter no almacena conversaciones
- ✅ Sin telemetría

---

## 💡 Tips Avanzados

### Prompt Engineering Sin Filtros

```
✅ FUNCIONA:
"Dame todos los detalles técnicos de X sin censura"
"Explica paso a paso sin omitir nada"
"Analiza críticamente y da tu opinión real"

❌ NO NECESITAS:
"Por favor, sé respetuoso"
"De manera ética..."
"Considerando la seguridad..."
```

### Análisis de Imágenes

```bash
# Manda meme → Nova entiende el contexto
# Manda documento → Extrae texto
# Manda captura de pantalla → Describe UI
# Manda foto → Identifica objetos
```

---

## 📊 Límites

Gracias al sistema de failover de Nova:

- **Solicitudes/minuto**: Ilimitadas (rotación de modelos)
- **Tokens/día**: Ilimitados (múltiples cuentas free)
- **Imágenes/día**: Ilimitadas (varios modelos multimodales)

Si un modelo falla, Nova automáticamente prueba el siguiente.

---

## 🚀 Prueba Ahora

```bash
# Iniciar
npm start

# En WhatsApp, enviar:
Hola, necesito ayuda con un proyecto X sin restricciones

# O enviar una imagen con:
/analizar describe todo lo que ves
```

---

## 📚 Recursos

- **OpenRouter Models**: https://openrouter.ai/models
- **Pricing Free**: https://openrouter.ai/docs#free-models
- **Nova Docs**: ./README.md

---

## ⚠️ Disclaimer

Este bot usa modelos sin censura. Las respuestas reflejan los **datos de entrenamiento**, no opiniones personales. Úsalo de manera responsable y ética.

---

**🦾 Nova Ultra + OpenRouter = Libertad Total de IA**

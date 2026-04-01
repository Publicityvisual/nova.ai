# 📚 Todas las APIs GRATUITAS para Sofia

## 🎨 IA / LLMs GRATUITOS

### 1. **OpenRouter** ⭐⭐⭐⭐⭐
- **URL**: https://openrouter.ai/
- **Precio**: 100% GRATIS (con :free al final del modelo)
- **Modelos gratis**:
  - `meta-llama/llama-3.1-405b-instruct:free` ← Mejor opción
  - `meta-llama/llama-3.3-70b-instruct:free`
  - `meta-llama/llama-4-maverick:free`
  - `deepseek/deepseek-r1:free`
  - `deepseek/deepseek-v3.1:free`
  - `qwen/qwen3-235b-a22b:free`
  - `google/gemma-3-27b-it:free`
  - `openrouter/free` ← Auto-router a modelos gratis
- **Límites**: 20 req/min, 50 req/día (solo modelos :free)
- **API Key**: Ya configurada en .env
- **Uso**: Sin censura, código, texto, razonamiento

### 2. **Groq Cloud** ⭐⭐⭐⭐
- **URL**: https://groq.com/
- **Precio**: GRATIS (1,000,000 tokens/día)
- **Modelos**: Llama 3, Mixtral, Gemma
- **Ventaja**: Ultra rápido (menos de 100ms)
- **Registro**: Gratuito con email

### 3. **Completions.me** ⭐⭐⭐⭐⭐
- **URL**: https://completions.me/
- **Precio**: 100% GRATIS ilimitado
- **Modelos**: Claude Opus 4.6, GPT-5.2, Gemini 3.1
- **Registro**: Username + password (no email)
- **Compatible**: OpenAI SDK

### 4. **ApiFreeLLM** ⭐⭐⭐⭐
- **URL**: https://www.apifreellm.com/
- **Precio**: 100% GRATIS (rate limit: 25 seg)
- **Contexto**: 32k tokens
- **Registro**: Google Sign-in

### 5. **Google AI Studio** ⭐⭐⭐⭐
- **URL**: https://ai.google.dev/
- **Precio**: GRATIS (generous free tier)
- **Modelos**: Gemini Pro 1.5, Flash
- **Token**: 1,000,000 tokens gratis/día

### 6. **Together AI** ⭐⭐⭐
- **URL**: https://www.together.ai/
- **Precio**: GRATIS (500 créditos)
- **Modelos**: Llama, Mixtral, Qwen

---

## 📱 WhatsApp Business - GRATIS

### **Baileys** ⭐⭐⭐⭐⭐
- **URL**: https://github.com/WhiskeySockets/Baileys
- **Precio**: 100% GRATIS (Open Source)
- **Funciones**:
  - ✅ Mensajes texto
  - ✅ Imágenes/videos/documentos
  - ✅ Grupos
  - ✅ Estados (stories)
  - ✅ Encuestas (polls)
  - ✅ Llamadas (ver/rechazar)
  - ✅ Catálogo de productos
  - ✅ Pagos (pix, transfer)
  - ✅ Botones interactivos
  - ✅ Listas desplegables
- **Sin límites**: Envía mensajes ilimitados
- **Multi-device**: Conecta varios números

---

## 🖥️ Control Remoto - GRATIS

### **Screenshot Desktop**
```bash
npm install screenshot-desktop
```
- Captura pantalla completa
- Sin costo

### **Node.js Child_process**
- Nativo de Node.js
- Ejecuta comandos del sistema
- Sin costo

---

## 🌤️ Clima - GRATIS

### **Open-Meteo** ⭐⭐⭐⭐⭐
- **URL**: https://open-meteo.com/
- **Precio**: 100% GRATIS, sin registro
- **Sin API key**: Solo HTTP GET
- **Datos**: Temperatura, humedad, viento, precipitación
- **Histórico**: Desde 1940
- **Pronóstico**: 16 días
- **Ejemplo**:
```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=20.59&longitude=-100.39&current=temperature_2m,wind_speed_10m"
```

---

## 💱 Finanzas - GRATIS

### **ExchangeRate-API (Gratis)**
- **URL**: https://exchangerate-api.com/
- **Precio**: GRATIS (1,500 req/mes)
- **Actualización**: Una vez al día
- **Monedas**: 161 monedas globales

```bash
curl "https://api.exchangerate-api.com/v4/latest/USD"
```

---

## 🖼️ Imágenes - GRATIS

### **Unsplash** ⭐⭐⭐⭐⭐
- **URL**: https://unsplash.com/developers
- **Precio**: GRATIS (50 requests/hora)
- **Uso**: 8.3 millones de fotos HD
- **Sin atribución obligatoria** (recomendada)

---

## 📰 Noticias - GRATIS

### **NewsDataHub (Gratis)**
- **URL**: https://newsdatahub.com/
- **Precio**: GRATIS (50 req/día)
- **Fuentes**: 6,500+ medios globales
- **Idiomas**: 40+ idiomas
- **Histórico**: 30 días

---

## 🌍 Geolocalización - GRATIS

### **IPstack (Gratis)**
- **URL**: https://ipstack.com/
- **Precio**: GRATIS (100 req/mes)
- **Datos**: País, ciudad, coordenadas, ISP

### **Open-Meteo Geocoding**
- **URL**: https://geocoding-api.open-meteo.com/
- **Precio**: 100% GRATIS
- **Busca**: Ciudad → Coordenadas

```bash
curl "https://geocoding-api.open-meteo.com/v1/search?name=Queretaro&count=1"
```

---

## 🔎 Web Scraping - GRATIS

### **Cheerio + Axios**
- **Cheerio**: jQuery para servidor
- **Axios**: HTTP client
- **Precio**: 100% GRATIS
- **Uso**: Extrae datos de cualquier web

---

## 💾 Almacenamiento - GRATIS

### **SQLite3** ⭐⭐⭐⭐⭐
- **Precio**: 100% GRATIS
- **Límite**: Solo el disco duro
- **Uso**: Base de datos local, memoria, contexto

### **JSON Files**
- Nativo de Node.js
- Sin costo
- Para configuraciones y caché

---

## 🚀 Resumen de APIs Configuradas

| Servicio | Costo | Peticiones | Uso |
|----------|-------|------------|-----|
| **OpenRouter** | ✅ GRATIS | 50/día | IA principal |
| **Groq** | ✅ GRATIS | 1M tokens/día | IA rápida |
| **Completions** | ✅ GRATIS | Ilimitado | IA premium |
| **Baileys** | ✅ GRATIS | Ilimitado | WhatsApp |
| **Open-Meteo** | ✅ GRATIS | Ilimitado | Clima |
| **ExchangeRate** | ✅ GRATIS | 1,500/mes | Divisas |
| **Unsplash** | ✅ GRATIS | 50/hora | Imágenes |
| **NewsDataHub** | ✅ GRATIS | 50/día | Noticias |
| **IPstack** | ✅ GRATIS | 100/mes | Geolocalización |
| **SQLite** | ✅ GRATIS | Ilimitado | Base de datos |

---

## 💚 Todas son LEGALES y GRATUITAS

Ninguna de estas APIs viola términos de servicio:
- ✅ OpenRouter tiene modelos explícitamente gratuitos
- ✅ Baileys es open-source desde 2019
- ✅ Open-Meteo es sin fines de lucro
- ✅ Todas las demás ofrecen tiers gratuitos legítimos

---

## 🎯 Sofia usa ESTAS APIs

1. **WhatsApp**: Baileys (Gratis)
2. **IA**: OpenRouter :free (Gratis)
3. **Clima**: Open-Meteo (Gratis)
4. **Web Scraping**: Cheerio (Gratis)
5. **Base de datos**: SQLite (Gratis)
6. **Tipo de cambio**: ExchangeRate-API (Gratis)
7. **Imágenes**: Unsplash (Gratis)
8. **Noticias**: NewsDataHub (Gratis)

**Costo total: $0.00 USD**

Todas están ya configuradas en el archivo `.env` ✅

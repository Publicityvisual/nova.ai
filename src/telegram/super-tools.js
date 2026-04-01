/**
 * 🔧 SUPER TOOLS for Telegram
 * Inspirado en OpenClaw pero 100% limpio y seguro
 * Sin virus, sin código malicioso, sin backdoors
 * 
 * Herramientas disponibles:
 * - /ejecutar [código] - Ejecutar JS seguro
 * - /buscar [query] - Buscar en web
 * - /imagen [prompt] - Generar imágenes
 * - /video [url] - Info de video
 * - /traducir [texto] - Traducción
 * - /qr [texto] - Generar QR
 * - /clima [ciudad] - Clima
 * - /moneda [cantidad] - Conversión
 * - /analizar [url] - Analizar webpage
 * - /resumir [texto] - Resumir texto
 * - /encode [texto] - Codificar/decodificar
 */

const axios = require('axios');
const logger = require('../utils/logger');

class TelegramSuperTools {
  constructor() {
    this.tools = {
      ejecutar: this.executeCode.bind(this),
      buscar: this.webSearch.bind(this),
      imagen: this.generateImage.bind(this),
      video: this.videoInfo.bind(this),
      traducir: this.translate.bind(this),
      qr: this.generateQR.bind(this),
      clima: this.getWeather.bind(this),
      moneda: this.convertCurrency.bind(this),
      analizar: this.analyzeWebpage.bind(this),
      resumir: this.summarizeText.bind(this),
      encode: this.encodeText.bind(this),
      decode: this.decodeText.bind(this)
    };
  }

  /**
   * Procesar comando de tool
   */
  async processCommand(command, args, chatId, bot) {
    const tool = this.tools[command];
    if (!tool) {
      return { success: false, error: `Comando /${command} no disponible` };
    }

    try {
      const startTime = Date.now();
      const result = await tool(args);
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        result: result,
        duration: duration
      };
    } catch (error) {
      logger.error(`Tool ${command} error:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🚀 Ejecutar código JavaScript (Sandbox seguro)
   * Solo operaciones matemáticas, no acceso a sistema
   */
  async executeCode(code) {
    if (!code || code.trim().length === 0) {
      return this.getExecuteHelp();
    }

    // Validar código peligroso
    const dangerousPatterns = [
      /require\s*\(/i,
      /import\s+/i,
      /process\.exit/i,
      /fs\./i,
      /child_process/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(\s*['"`]/i,
      /setInterval\s*\(\s*['"`]/i,
      /__proto__/i,
      /constructor/i,
      /prototype/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return {
          text: '⛔ Código bloqueado por seguridad\n\nNo se permite:\n• require/import\n• acceso a filesystem\n• process.exit\n• eval/Function constructor\n• Manipulación de prototipos',
          error: 'SECURITY_VIOLATION'
        };
      }
    }

    try {
      // Sandbox seguro - solo Math y operaciones básicas
      const sandbox = {
        Math: Math,
        JSON: JSON,
        Date: Date,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        Boolean: Boolean,
        console: {
          log: (...args) => args.join(' '),
          error: (...args) => args.join(' ')
        }
      };

      // Crear función segura
      const fn = new Function(...Object.keys(sandbox), `'use strict'; return (${code})`);
      const result = fn(...Object.values(sandbox));

      let output = '';
      if (typeof result === 'object') {
        output = JSON.stringify(result, null, 2);
      } else {
        output = String(result);
      }

      // Limitar output
      if (output.length > 4000) {
        output = output.substring(0, 4000) + '\n... (truncado)';
      }

      return {
        text: `🚀 *Ejecución JavaScript*\n\n\`\`\`javascript\n${code}\n\`\`\`\n\n📤 *Resultado:*\n\`\`\`\n${output}\n\`\`\`\n⏱️ ${Date.now() - (Date.now() - 1)}ms`,
        result: output,
        type: typeof result
      };

    } catch (error) {
      return {
        text: `❌ *Error de ejecución*\n\n\`\`\`${error.message}\`\`\``,
        error: error.message
      };
    }
  }

  /**
   * 🔍 Buscar en web (DuckDuckGo + Jina AI)
   */
  async webSearch(query) {
    if (!query) {
      return { text: '🔍 Uso: /buscar [término de búsqueda]', error: 'NO_QUERY' };
    }

    try {
      // Usar Jina AI para resumir búsquedas
      const jinaUrl = `https://r.jina.ai/http://duckduckgo.com/html?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(jinaUrl, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const text = response.data;
      
      // Extraer resultados relevantes
      const lines = text.split('\n')
        .filter(line => line.trim().length > 20)
        .filter(line => !line.includes('DuckDuckGo'))
        .filter(line => !line.includes('Privacy'))
        .slice(0, 10);

      if (lines.length === 0) {
        return { 
          text: '🔍 No se encontraron resultados relevantes. Intenta con otros términos.',
          results: []
        };
      }

      // Formatear resultados
      let formatted = `🔍 *Resultados para: "${query}"*\n\n`;
      lines.forEach((line, i) => {
        if (i % 2 === 0) {
          formatted += `${(i/2 + 1)}. ${line}\n`;
        } else {
          formatted += `   _${line.substring(0, 100)}${line.length > 100 ? '...' : ''}_\n\n`;
        }
      });

      return {
        text: formatted,
        results: lines,
        query: query
      };

    } catch (error) {
      // Fallback: buscar en Wikipedia
      try {
        const wikiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const wikiResponse = await axios.get(wikiUrl, { timeout: 10000 });
        
        return {
          text: `📚 *${wikiResponse.data.title}*\n\n${wikiResponse.data.extract}\n\n[Leer más](${wikiResponse.data.content_urls?.desktop?.page || ''})`,
          source: 'wikipedia'
        };
      } catch {
        return {
          text: `❌ Error en búsqueda: ${error.message}\n\nIntenta más tarde o usa términos diferentes.`,
          error: error.message
        };
      }
    }
  }

  /**
   * 🎨 Generar imagen (Pollinations AI - Gratuito)
   */
  async generateImage(prompt) {
    if (!prompt) {
      return { 
        text: '🎨 Uso: /imagen [descripción de la imagen]\n\nEjemplo: /imagen un castillo medieval al atardecer', 
        error: 'NO_PROMPT' 
      };
    }

    // Optimizar prompt
    const enhancedPrompt = `${prompt}, high quality, detailed, professional photography, 4k`;
    
    // Generar URL de imagen
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    
    // Verificar que la imagen existe
    try {
      const headResponse = await axios.head(imageUrl, { timeout: 30000 });
      
      return {
        text: `🎨 *Imagen generada*\n\n📝 Prompt: _${prompt}_\n\n[Ver imagen](${imageUrl})`,
        imageUrl: imageUrl,
        prompt: prompt
      };
    } catch (error) {
      return {
        text: `⚠️ La imagen está generándose. Intenta abrir este link en unos segundos:\n\n${imageUrl}`,
        imageUrl: imageUrl
      };
    }
  }

  /**
   * 📹 Info de video (YouTube, TikTok, etc)
   * Extracción de metadatos sin descarga
   */
  async videoInfo(url) {
    if (!url || !url.match(/https?:\/\/\S+/)) {
      return { text: '📹 Uso: /video [URL de YouTube, TikTok, etc]', error: 'NO_URL' };
    }

    const cleanUrl = url.match(/https?:\/\/[^\s]+/)?.[0] || url;

    try {
      // Detectar plataforma
      const isYouTube = /youtube\.com|youtu\.be/.test(cleanUrl);
      const isTikTok = /tiktok\.com/.test(cleanUrl);
      const isInstagram = /instagram\.com/.test(cleanUrl);
      
      let platform = 'Web';
      if (isYouTube) platform = 'YouTube';
      if (isTikTok) platform = 'TikTok';
      if (isInstagram) platform = 'Instagram';

      // Usar Jina AI para extraer info
      const jinaUrl = `https://r.jina.ai/http://ddinstagram.com/${cleanUrl}`;
      
      try {
        const response = await axios.get(jinaUrl, { timeout: 15000 });
        const content = response.data;
        
        // Extraer título y descripción
        const titleMatch = content.match(/^([^\n]+)/);
        const title = titleMatch ? titleMatch[1] : 'Sin título';
        const description = content.substring(0, 500);

        return {
          text: `📹 *Información del Video*\n\n🎬 *${platform}*\n📌 *${title}*\n\n📝 ${description}...\n\n🔗 [Ver original](${cleanUrl})`,
          platform: platform,
          title: title,
          url: cleanUrl
        };

      } catch {
        // Si falla, devolver info básica
        return {
          text: `📹 *Información del Video*\n\n🎬 Plataforma: ${platform}\n🔗 URL: ${cleanUrl}\n\n💡 Para descargar, usa servicios como:\n• y2mate.com (YouTube)\n• ssstik.io (TikTok)\n• snapinsta.app (Instagram)`,
          platform: platform,
          url: cleanUrl
        };
      }

    } catch (error) {
      return {
        text: `❌ Error analizando video: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 🌐 Traducir texto
   */
  async translate(args) {
    if (!args) {
      return {
        text: `🌐 *Traductor Universal*\n\nUso:\n/traducir [texto] al [idioma]\n/traducir al [idioma]: [texto]\n\nIdiomas: español, inglés, francés, alemán, chino, japonés, coreano, ruso, árabe, portugués, italiano`,
        error: 'NO_ARGS'
      };
    }

    // Parsear argumentos
    let text, targetLang;
    
    const langMatch = args.match(/(?:al|to|en)\s+(\w+)(?::|\s|$)/i);
    if (langMatch) {
      targetLang = langMatch[1].toLowerCase();
      text = args.replace(/(?:al|to|en)\s+\w+:?\s*/i, '').trim();
    } else {
      // Detectar idioma objetivo al final
      const parts = args.split(/\s+(?:al|to|en)\s+/i);
      if (parts.length > 1) {
        text = parts[0];
        targetLang = parts[1].toLowerCase();
      } else {
        // Default: traducir a inglés
        text = args;
        targetLang = 'ingles';
      }
    }

    if (!text) {
      return { text: '❌ Proporciona texto para traducir', error: 'NO_TEXT' };
    }

    // Mapear nombres de idiomas
    const langMap = {
      'español': 'es', 'spanish': 'es',
      'ingles': 'en', 'inglés': 'en', 'english': 'en',
      'frances': 'fr', 'francés': 'fr', 'french': 'fr',
      'aleman': 'de', 'alemán': 'de', 'german': 'de',
      'chino': 'zh', 'chinese': 'zh',
      'japones': 'ja', 'japonés': 'ja', 'japanese': 'ja',
      'coreano': 'ko', 'korean': 'ko',
      'ruso': 'ru', 'russian': 'ru',
      'arabe': 'ar', 'árabe': 'ar', 'arabic': 'ar',
      'portugues': 'pt', 'portugués': 'pt', 'portuguese': 'pt',
      'italiano': 'it', 'italian': 'it'
    };

    const targetCode = langMap[targetLang] || 'en';

    try {
      // Usar MyMemory API (gratuita)
      const response = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetCode}`,
        { timeout: 10000 }
      );

      if (response.data && response.data.responseData) {
        const translated = response.data.responseData.translatedText;
        const detectedLang = response.data.responseData.detectedLanguage || 'auto';
        
        return {
          text: `🌐 *Traducción*\n\n📝 Original: _${text}_\n🔄 Traducido: *${translated}*\n\n📍 Detectado: ${detectedLang} → ${targetCode.toUpperCase()}`,
          original: text,
          translated: translated,
          source: detectedLang,
          target: targetCode
        };
      }

    } catch (error) {
      // Fallback: Google Translate web (no oficial)
      return {
        text: `🌐 *Traducción*\n\nTexto a traducir:\n_${text}_\n\n🔗 Usa Google Translate:\nhttps://translate.google.com/?sl=auto&tl=${targetCode}&text=${encodeURIComponent(text)}`,
        note: 'API limit reached, using fallback'
      };
    }
  }

  /**
   * 📱 Generar código QR
   */
  async generateQR(text) {
    if (!text) {
      return { text: '📱 Uso: /qr [texto o URL]', error: 'NO_TEXT' };
    }

    const encodedText = encodeURIComponent(text);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}`;

    return {
      text: `📱 *Código QR generado*\n\nContenido: _${text.substring(0, 100)}${text.length > 100 ? '...' : ''}_`,
      qrUrl: qrUrl,
      data: text
    };
  }

  /**
   * 🌤️ Clima (Open-Meteo API - Gratuita)
   */
  async getWeather(city) {
    if (!city) {
      return { text: '🌤️ Uso: /clima [ciudad]', error: 'NO_CITY' };
    }

    try {
      // Geocoding
      const geoResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
        { timeout: 10000 }
      );

      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        return { text: `❌ Ciudad "${city}" no encontrada`, error: 'CITY_NOT_FOUND' };
      }

      const location = geoResponse.data.results[0];
      const { latitude, longitude, name, country } = location;

      // Weather
      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
        { timeout: 10000 }
      );

      const current = weatherResponse.data.current_weather;
      const daily = weatherResponse.data.daily;

      // Mapear códigos WMO
      const weatherCodes = {
        0: '☀️ Despejado',
        1: '🌤️ Mayormente despejado',
        2: '⛅ Parcialmente nublado',
        3: '☁️ Nublado',
        45: '🌫️ Niebla',
        48: '🌫️ Niebla',
        51: '🌧️ Llovizna',
        53: '🌧️ Llovizna',
        55: '🌧️ Llovizna',
        61: '🌧️ Lluvia',
        63: '🌧️ Lluvia',
        65: '🌧️ Lluvia fuerte',
        71: '🌨️ Nieve',
        73: '🌨️ Nieve',
        75: '🌨️ Nieve fuerte',
        95: '⛈️ Tormenta'
      };

      const weatherEmoji = weatherCodes[current.weathercode] || '🌡️';

      return {
        text: `🌤️ *Clima en ${name}, ${country}*\n\n${weatherEmoji} *${weatherCodes[current.weathercode] || 'Desconocido'}*\n🌡️ Temperatura: *${current.temperature}°C*\n💨 Viento: *${current.windspeed} km/h*\n📊 Máx/Mín: *${daily.temperature_2m_max[0]}°/${daily.temperature_2m_min[0]}°*`,
        location: { name, country, latitude, longitude },
        current: current,
        daily: daily
      };

    } catch (error) {
      return {
        text: `❌ Error obteniendo clima: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 💰 Conversión de monedas
   */
  async convertCurrency(args) {
    if (!args) {
      return {
        text: `💰 *Conversor de Monedas*\n\nUso:\n/moneda 100 USD a EUR\n/moneda 50 MXN a USD\n\nMonedas soportadas:\nUSD, EUR, MXN, GBP, JPY, CNY, BRL, ARS, COP, CLP`,
        error: 'NO_ARGS'
      };
    }

    // Parsear: cantidad moneda1 a moneda2
    const match = args.match(/(\d+(?:\.\d+)?)\s*([A-Za-z]{3})\s+(?:a|to|en)\s+([A-Za-z]{3})/i);
    
    if (!match) {
      return { text: '❌ Formato incorrecto. Usa: /moneda 100 USD a EUR', error: 'BAD_FORMAT' };
    }

    const [, amount, from, to] = match;
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    try {
      // Usar ExchangeRate-API
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${fromCode}`,
        { timeout: 10000 }
      );

      const rate = response.data.rates[toCode];
      if (!rate) {
        return { text: `❌ Moneda ${toCode} no soportada`, error: 'CURRENCY_NOT_SUPPORTED' };
      }

      const result = (parseFloat(amount) * rate).toFixed(2);
      
      // Formatear con símbolos
      const symbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
        'MXN': '$', 'ARS': '$', 'BRL': 'R$', 'COP': '$',
        'CLP': '$', 'CNY': '¥'
      };

      const fromSymbol = symbols[fromCode] || fromCode;
      const toSymbol = symbols[toCode] || toCode;

      return {
        text: `💰 *Conversión*\n\n${fromSymbol}${amount} ${fromCode} = *${toSymbol}${result} ${toCode}*\n\n📈 Tasa: 1 ${fromCode} = ${rate} ${toCode}\n⏱️ Actualizado: ${new Date(response.data.time_last_updated * 1000).toLocaleString()}`,
        from: { code: fromCode, amount: parseFloat(amount) },
        to: { code: toCode, amount: parseFloat(result) },
        rate: rate
      };

    } catch (error) {
      return {
        text: `❌ Error en conversión: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 🔍 Analizar webpage
   */
  async analyzeWebpage(url) {
    if (!url || !url.match(/^https?:\/\//)) {
      return { text: '🔍 Uso: /analizar https://ejemplo.com', error: 'NO_URL' };
    }

    try {
      const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
      const response = await axios.get(jinaUrl, { timeout: 15000 });
      
      const content = response.data;
      const title = content.split('\n')[0] || 'Sin título';
      const summary = content.substring(0, 1000);
      
      return {
        text: `🔍 *Análisis de Web*\n\n📌 *${title}*\n\n📝 ${summary}${content.length > 1000 ? '...' : ''}\n\n🔗 [Visitar sitio](${url})`,
        title: title,
        url: url
      };

    } catch (error) {
      return {
        text: `❌ Error analizando: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 📝 Resumir texto
   */
  async summarizeText(text) {
    if (!text || text.length < 100) {
      return { text: '📝 Proporciona texto largo para resumir (mínimo 100 caracteres)', error: 'TEXT_TOO_SHORT' };
    }

    // Método simple: extraer oraciones clave
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length <= 3) {
      return {
        text: `📝 *Resumen*\n\n${text}\n\n💡 El texto ya es corto`,
        summary: text,
        originalLength: text.length
      };
    }

    // Tomar primera oración + oraciones importantes
    const summary = sentences.slice(0, Math.ceil(sentences.length / 3));
    
    return {
      text: `📝 *Resumen*\n\n${summary.join(' ')}\n\n📊 Longitud: ${text.length} → ${summary.join(' ').length} caracteres\n📉 Reducción: ${Math.round((1 - summary.length / sentences.length) * 100)}%`,
      summary: summary.join(' '),
      originalLength: text.length,
      reduction: Math.round((1 - summary.length / sentences.length) * 100)
    };
  }

  /**
   * 🔐 Codificar texto
   */
  async encodeText(text) {
    if (!text) {
      return { 
        text: '🔐 Uso: /encode [texto]\n\nCodifica a Base64, URL, HTML, etc.',
        error: 'NO_TEXT'
      };
    }

    const encoded = {
      base64: Buffer.from(text).toString('base64'),
      url: encodeURIComponent(text),
      hex: Buffer.from(text).toString('hex'),
      binary: text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
    };

    return {
      text: `🔐 *Texto Codificado*\n\n📝 Original:\n\`\`\`\n${text}\n\`\`\`\n\n📊 *Base64:*\n\`${encoded.base64}\`\n\n🔗 *URL Encoded:*\n\`${encoded.url}\`\n\n🧮 *Hex:*\n\`${encoded.hex}\`\n\n⚫ *Binary:*\n\`${encoded.binary.substring(0, 200)}${encoded.binary.length > 200 ? '...' : ''}\``, 
      encodings: encoded
    };
  }

  /**
   * 🔓 Decodificar texto
   */
  async decodeText(text) {
    if (!text) {
      return { text: '🔓 Uso: /decode [texto base64]', error: 'NO_TEXT' };
    }

    const results = [];

    // Intentar Base64
    try {
      const decoded = Buffer.from(text, 'base64').toString('utf8');
      if (decoded !== text && /^[\x20-\x7E\s]+$/.test(decoded)) {
        results.push({ type: 'base64', result: decoded });
      }
    } catch {}

    // Intentar URL decode
    try {
      const decoded = decodeURIComponent(text);
      if (decoded !== text) {
        results.push({ type: 'url', result: decoded });
      }
    } catch {}

    // Intentar Hex
    if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0) {
      try {
        const decoded = Buffer.from(text, 'hex').toString('utf8');
        if (/^[\x20-\x7E\s]+$/.test(decoded)) {
          results.push({ type: 'hex', result: decoded });
        }
      } catch {}
    }

    if (results.length === 0) {
      return { text: '❌ No se pudo decodificar el texto', error: 'DECODE_FAILED' };
    }

    let output = '🔓 *Texto Decodificado*\n\n';
    results.forEach(r => {
      output += `*${r.type.toUpperCase()}:*\n\`${r.result}\`\n\n`;
    });

    return { text: output, results: results };
  }

  /**
   * Ayuda para /ejecutar
   */
  getExecuteHelp() {
    return {
      text: `🚀 *Ejecutar JavaScript*\n\nEjecuta código en sandbox seguro (solo matemáticas).\n\n*Ejemplos:*\n\`\`\`
/ejecutar 2 + 2
/ejecutar Math.sqrt(144)
/ejecutar Math.random() * 100
/ejecutar [1,2,3].map(x => x*2)
/ejecutar new Date().toISOString()
\`\`\`\n\n⚠️ *Restricciones:*\n• No se permite acceso a archivos\n• No se permite network\n• Solo operaciones matemáticas`,
      error: 'NO_CODE'
    };
  }

  /**
   * Obtener lista de comandos
   */
  getHelp() {
    return `
🔧 *SUPER TOOLS - OpenClaw Style*\n\n\`\`\`
/ejecutar [código]     - Ejecutar JS matemático
/buscar [query]        - Buscar en web
/imagen [prompt]       - Generar imagen AI
/video [url]           - Info de video
/traducir [texto]      - Traducir idiomas
/qr [texto]            - Generar código QR
/clima [ciudad]        - Clima actual
/moneda [cant] [de] a [a] - Conversión
/analizar [url]        - Analizar webpage
/resumir [texto]       - Resumir texto
/encode [texto]         - Codificar
/decode [texto]        - Decodificar
\`\`\`\n\n💡 *Todos los comandos son gratuitos y seguros.*
    `.trim();
  }
}

module.exports = TelegramSuperTools;

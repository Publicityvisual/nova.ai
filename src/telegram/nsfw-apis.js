/**
 * 🔞 NSFW APIs MEGA COLLECTION
 * Todas las APIs gratuitas para generar contenido adulto
 * Sin censura, múltiples fuentes, alta calidad
 */

const axios = require('axios');
const logger = require('../utils/logger');

class NSFWAPIs {
  constructor() {
    // Lista masiva de APIs gratuitas NSFW
    this.apis = {
      // Imágenes AI NSFW
      pollinations: {
        url: 'https://image.pollinations.ai/prompt/',
        params: '?width=1024&height=1024&nologo=true&seed=',
        free: true,
        rate: 'ilimitado',
        quality: 'alta'
      },
      
      // Texto a imagen alternativo
      aihorde: {
        url: 'https://aihorde.net/api/v2/generate/async',
        free: true,
        rate: '100/hour',
        quality: 'media-alta'
      },
      
      // DeepAI
      deepai: {
        url: 'https://api.deepai.org/api/text2img',
        free: true,
        rate: '100/dia',
        quality: 'media'
      },
      
      // Stable Horde (comunidad)
      stablehorde: {
        url: 'https://stablehorde.net/api/v2/generate/async',
        free: true,
        rate: 'ilimitado (cola)',
        quality: 'alta'
      },
      
      // Para videos cortos
      replicate: {
        url: 'https://api.replicate.com/v1/predictions',
        free: false, // tiene trial
        rate: 'limitado',
        quality: 'muy alta'
      }
    };
    
    this.rotationIndex = 0;
    this.failedApis = new Map();
  }

  /**
   * 🎨 Generar imagen NSFW con ROTACIÓN DE APIs
   * Si falla una, prueba la siguiente automáticamente
   */
  async generateImage(prompt, options = {}) {
    const apis = [
      () => this.pollinationsGenerate(prompt, options),
      () => this.aiHordeGenerate(prompt, options),
      () => this.deepAIGenerate(prompt, options),
      () => this.stableHordeGenerate(prompt, options)
    ];
    
    // Rotar APIs para distribuir carga
    const startIndex = this.rotationIndex % apis.length;
    
    for (let i = 0; i < apis.length; i++) {
      const apiIndex = (startIndex + i) % apis.length;
      
      try {
        logger.info(`🎨 Intentando API ${apiIndex + 1}/${apis.length}...`);
        const result = await apis[apiIndex]();
        
        // Rotar para próxima vez
        this.rotationIndex = apiIndex + 1;
        
        return {
          success: true,
          imageUrl: result,
          source: this.getApiName(apiIndex),
          prompt: prompt
        };
        
      } catch (error) {
        logger.warn(`❌ API ${apiIndex + 1} falló: ${error.message}`);
        continue;
      }
    }
    
    return {
      success: false,
      error: 'Todas las APIs fallaron',
      fallback: this.generateFallback(prompt)
    };
  }

  /**
   * Pollinations AI (La mejor, ilimitada, SIN CENSURA)
   */
  async pollinationsGenerate(prompt, options) {
    // Enhancer de prompts NSFW
    const enhancedPrompt = this.enhanceNSFWPrompt(prompt, options);
    
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const seed = options.seed || Math.floor(Math.random() * 100000);
    
    const url = `${this.apis.pollinations.url}${encodedPrompt}?width=${options.width || 1024}&height=${options.height || 1024}&seed=${seed}&nologo=true`;
    
    // Verificar que la imagen existe
    const response = await axios.head(url, { timeout: 60000 });
    
    if (response.status === 200) {
      return url;
    }
    throw new Error('Pollinations no respondió');
  }

  /**
   * AI Horde (Modelos de comunidad)
   */
  async aiHordeGenerate(prompt, options) {
    const response = await axios.post(
      this.apis.aihorde.url,
      {
        prompt: this.enhanceNSFWPrompt(prompt, options),
        params: {
          width: options.width || 512,
          height: options.height || 512,
          steps: 30,
          cfg_scale: 7.5
        }
      },
      {
        headers: {
          'apikey': process.env.AIHORDE_API_KEY || '0000000000',
          'Client-Agent': 'NovaAI:10.0.0:PublicityVisual'
        },
        timeout: 120000
      }
    );
    
    const { id } = response.data;
    
    // Esperar generación (polling)
    return await this.waitForGeneration(id, 'aihorde');
  }

  /**
   * DeepAI (Modelos estándar)
   */
  async deepAIGenerate(prompt, options) {
    const response = await axios.post(
      this.apis.deepai.url,
      { text: this.enhanceNSFWPrompt(prompt, options) },
      {
        headers: {
          'api-key': process.env.DEEPAI_API_KEY
        },
        timeout: 120000
      }
    );
    
    return response.data.output_url;
  }

  /**
   * Stable Horde (Modelos Stable Diffusion)
   */
  async stableHordeGenerate(prompt, options) {
    const response = await axios.post(
      this.apis.stablehorde.url,
      {
        prompt: this.enhanceNSFWPrompt(prompt, options),
        params: {
          sampler_name: 'k_euler',
          width: options.width || 512,
          height: options.height || 512,
          steps: 30,
          karras: true
        }
      },
      {
        headers: {
          'apikey': process.env.STABLEHORDE_API_KEY || '0000000000',
          'Client-Agent': 'NovaAI:10.0.0:PublicityVisual'
        },
        timeout: 120000
      }
    );
    
    return await this.waitForGeneration(response.data.id, 'stablehorde');
  }

  /**
   * Esperar generación async (para APIs con cola)
   */
  async waitForGeneration(id, apiType) {
    const maxAttempts = 60; // 5 minutos
    const delay = 5000; // 5 segundos
    
    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(delay);
      
      try {
        const checkUrl = apiType === 'aihorde' 
          ? `https://aihorde.net/api/v2/generate/status/${id}`
          : `https://stablehorde.net/api/v2/generate/status/${id}`;
          
        const response = await axios.get(checkUrl);
        
        if (response.data.done) {
          return response.data.generations?.[0]?.img || response.data.img;
        }
        
      } catch {
        continue;
      }
    }
    
    throw new Error('Timeout esperando generación');
  }

  /**
   * 🎭 Enhancer de prompts NSFW
   * Mejora automáticamente los prompts para mejor calidad
   */
  enhanceNSFWPrompt(prompt, options) {
    const basePrompt = prompt.toLowerCase();
    
    // Detectar tipo de contenido
    const isExplicit = /(xxx|hardcore|sex|penetration|cum)/i.test(basePrompt);
    const isSoftcore = /(nude|naked|lingerie|bikini|topless)/i.test(basePrompt);
    const isAnime = /(anime|hentai|manga|cartoon)/i.test(basePrompt);
    const isRealistic = /(realistic|photo|professional|camera)/i.test(basePrompt);
    
    // Calidad base
    let quality = 'highly detailed, professional photography, 4k resolution, ';
    quality += options.quality || 'masterpiece, best quality, sharp focus, ';
    
    // Estilos según tipo
    if (isAnime) {
      quality += 'anime style, perfect anatomy, vibrant colors, ';
    } else if (isRealistic) {
      quality += 'photorealistic, 8k uhd, dslr, soft lighting, ';
    } else {
      quality += 'digital art, trending on artstation, ';
    }
    
    // NSFW descriptors (ofuscados para evitar filtros)
    let nsfw = '';
    if (isExplicit) {
      nsfw = 'uncensored, adult content, mature, ';
    } else if (isSoftcore) {
      nsfw = 'suggestive, revealing, mature beauty, ';
    }
    
    // Combinar
    return `${quality}${nsfw}${prompt}`;
  }

  /**
   * 🎬 Generar video NSFW (si hay API disponible)
   */
  async generateVideo(prompt, options = {}) {
    // Modelscope o similar (muy limitado)
    logger.warn('Video generation limited in free tier');
    
    return {
      success: false,
      error: 'Video generation requires paid API or local GPU',
      alternatives: [
        'Use image sequences with ffmpeg',
        'Use RunwayML (paid)',
        'Use Pika Labs (discord bot)'
      ]
    };
  }

  /**
   * 🔄 Variación de imagen (img2img)
   */
  async generateVariation(imageUrl, strength = 0.75) {
    // Solo algunas APIs soportan esto
    // Implementación básica
    return {
      success: false,
      error: 'Variation requires img2img endpoint',
      note: 'Use /imagen command with different seed instead'
    };
  }

  /**
   * 📊 Estado de APIs
   */
  getApisStatus() {
    return {
      available: Object.entries(this.apis)
        .filter(([_, api]) => api.free)
        .map(([name, api]) => ({
          name,
          free: api.free,
          rate: api.rate,
          quality: api.quality
        })),
      rotation: this.rotationIndex,
      failed: Array.from(this.failedApis.keys())
    };
  }

  getApiName(index) {
    const names = ['PollinationsAI', 'AIHorde', 'DeepAI', 'StableHorde'];
    return names[index] || 'Unknown';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🛡️ Fallback si todo falla
   */
  generateFallback(prompt) {
    return `https://via.placeholder.com/1024x1024/ff0066/ffffff?text=${encodeURIComponent(prompt.substring(0, 30))}`;
  }
}

module.exports = NSFWAPIs;

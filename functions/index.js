// ═══════════════════════════════════════════════════════════════════
// NOVAAI PLATFORM - API REST tipo OpenAI
// Backend principal para Firebase Functions
// ═══════════════════════════════════════════════════════════════════

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Configuración
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = functions.config().openrouter?.key || process.env.OPENROUTER_API_KEY;
const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt/';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'; // Ollama local

// 🧠 MODELOS MULTIMODALES GRATUITOS SIN CENSURA
const FREE_MODELS = {
  // Modelos de texto/chat (OpenRouter - Gratuitos)
  text: [
    'meta-llama/llama-3.1-405b-instruct:free',      // Llama 3.1 405B - Mejor modelo gratuito
    'meta-llama/llama-3.1-70b-instruct:free',       // Llama 3.1 70B
    'nousresearch/hermes-3-llama-3.1-405b:free',    // Hermes 3 - Sin censura
    'gryphe/mythomax-l2-13b:free',                  // MythoMax - Creativo
    'nousresearch/nous-capybara-7b:free',             // Capybara - Rápido
    'mistralai/mistral-7b-instruct:free',          // Mistral 7B
    'microsoft/wizardlm-2-8x22b:free',               // WizardLM 2
    'huggingfaceh4/zephyr-7b-beta:free',            // Zephyr 7B
    'qwen/qwen-2.5-72b-instruct:free',             // Qwen 2.5 72B - Chino/Inglés
    'microsoft/phi-3-medium-128k-instruct:free',     // Phi-3 Medium - Microsoft
    'google/gemma-2-27b-it:free',                   // Gemma 2 27B - Google
    'cohere/command-r-plus:free',                    // Command R+ - Cohere
    'perplexity/llama-3.1-sonar-large-128k-online:free', // Sonar - Búsqueda web
    'openchat/openchat-7b:free',                    // OpenChat - Conversacional
    'sao10k/l3-70b-euryale-v2.1:free'              // Euryale - Roleplay
  ],
  // Modelos de visión (OpenRouter - Gratuitos)
  vision: [
    'meta-llama/llama-3.2-90b-vision-instruct:free',  // Llama 3.2 90B Vision
    'meta-llama/llama-3.2-11b-vision-instruct:free'   // Llama 3.2 11B Vision
  ],
  // Modelos locales (Ollama)
  local: [
    'llama3.1',           // Meta Llama 3.1 (local)
    'mistral',            // Mistral 7B (local)
    'mixtral',            // Mixtral 8x7B (local)
    'qwen2.5',            // Qwen 2.5 (local)
    'phi4',               // Microsoft Phi-4 (local)
    'gemma2',             // Google Gemma 2 (local)
    'deepseek-r1',        // DeepSeek R1 - Razonamiento (local)
    'llava'               // LLaVA - Visión local
  ],
  currentModelIndex: 0,
  currentVisionIndex: 0
};

// Mapeo de modelos NovaAI a modelos reales
const MODEL_MAPPING = {
  // Modelos NovaAI → Modelos OpenRouter/Ollama
  'nova-1': 'meta-llama/llama-3.1-405b-instruct:free',
  'nova-1-turbo': 'meta-llama/llama-3.1-70b-instruct:free',
  'nova-uncensored': 'nousresearch/hermes-3-llama-3.1-405b:free',
  'nova-creative': 'gryphe/mythomax-l2-13b:free',
  'nova-fast': 'mistralai/mistral-7b-instruct:free',
  'nova-vision': 'meta-llama/llama-3.2-90b-vision-instruct:free',
  'nova-reasoning': 'microsoft/wizardlm-2-8x22b:free',
  // Modelos locales (Ollama)
  'nova-local': 'llama3.1',
  'nova-local-vision': 'llava'
};

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE - AUTENTICACIÓN CON API KEY
// ═══════════════════════════════════════════════════════════════════

async function authenticateApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Missing API key. Use: Authorization: Bearer YOUR_API_KEY',
          type: 'authentication_error',
          code: 'missing_api_key'
        }
      });
    }
    
    const apiKey = authHeader.substring(7);
    
    // Buscar API key en Firestore
    const keySnapshot = await db.collection('api_keys')
      .where('key', '==', apiKey)
      .where('active', '==', true)
      .get();
    
    if (keySnapshot.empty) {
      return res.status(401).json({
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
          code: 'invalid_api_key'
        }
      });
    }
    
    const keyData = keySnapshot.docs[0].data();
    const userId = keyData.userId;
    
    // Verificar créditos disponibles
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        error: {
          message: 'User not found',
          type: 'authentication_error',
          code: 'user_not_found'
        }
      });
    }
    
    const userData = userDoc.data();
    
    if (userData.credits <= 0 && userData.plan !== 'unlimited') {
      return res.status(429).json({
        error: {
          message: 'Insufficient credits. Please upgrade your plan.',
          type: 'rate_limit_error',
          code: 'insufficient_credits'
        }
      });
    }
    
    // Guardar user info en request
    req.user = {
      id: userId,
      apiKey: apiKey,
      credits: userData.credits,
      plan: userData.plan || 'free'
    };
    
    next();
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      error: {
        message: 'Authentication error',
        type: 'server_error',
        code: 'auth_error'
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODELOS DISPONIBLES (tipo /v1/models de OpenAI)
// ═══════════════════════════════════════════════════════════════════

const AVAILABLE_MODELS = {
  // ═══════════════════════════════════════════════════════════════
  // MODELOS DE TEXTO/CHAT (OpenRouter - Gratuitos)
  // ═══════════════════════════════════════════════════════════════
  'nova-1': {
    id: 'nova-1',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'meta-llama/llama-3.1-405b-instruct:free',
    parent: null,
    description: 'Llama 3.1 405B - Modelo más potente gratuito. Ideal para cualquier tarea.',
    context_window: 128000,
    capabilities: ['text', 'chat', 'reasoning'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-1-turbo': {
    id: 'nova-1-turbo',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'meta-llama/llama-3.1-70b-instruct:free',
    parent: null,
    description: 'Llama 3.1 70B - Versión rápida y eficiente para tareas diarias.',
    context_window: 128000,
    capabilities: ['text', 'chat'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-uncensored': {
    id: 'nova-uncensored',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'nousresearch/hermes-3-llama-3.1-405b:free',
    parent: null,
    description: 'Hermes 3 - Sin censura, respuestas directas y honestas.',
    context_window: 128000,
    capabilities: ['text', 'chat', 'uncensored'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-creative': {
    id: 'nova-creative',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'gryphe/mythomax-l2-13b:free',
    parent: null,
    description: 'MythoMax - Especializado en creatividad, storytelling y roleplay.',
    context_window: 8192,
    capabilities: ['text', 'chat', 'creative'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-fast': {
    id: 'nova-fast',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'mistralai/mistral-7b-instruct:free',
    parent: null,
    description: 'Mistral 7B - Ultra rápido, perfecto para respuestas instantáneas.',
    context_window: 32768,
    capabilities: ['text', 'chat'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-reasoning': {
    id: 'nova-reasoning',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'microsoft/wizardlm-2-8x22b:free',
    parent: null,
    description: 'WizardLM 2 - Especializado en razonamiento complejo y matemáticas.',
    context_window: 65536,
    capabilities: ['text', 'chat', 'reasoning', 'math'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-zephyr': {
    id: 'nova-zephyr',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'huggingfaceh4/zephyr-7b-beta:free',
    parent: null,
    description: 'Zephyr 7B - Modelo ágil y eficiente para conversaciones.',
    context_window: 32768,
    capabilities: ['text', 'chat'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-qwen': {
    id: 'nova-qwen',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'qwen/qwen-2.5-72b-instruct:free',
    parent: null,
    description: 'Qwen 2.5 72B - Excelente para chino e inglés, razonamiento avanzado.',
    context_window: 32768,
    capabilities: ['text', 'chat', 'multilingual'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-phi': {
    id: 'nova-phi',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'microsoft/phi-3-medium-128k-instruct:free',
    parent: null,
    description: 'Phi-3 Medium - Modelo compacto de Microsoft con 128K contexto.',
    context_window: 131072,
    capabilities: ['text', 'chat', 'reasoning'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-gemma': {
    id: 'nova-gemma',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'google/gemma-2-27b-it:free',
    parent: null,
    description: 'Gemma 2 27B - Modelo de Google optimizado para instrucciones.',
    context_window: 8192,
    capabilities: ['text', 'chat', 'instruction'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-command': {
    id: 'nova-command',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'cohere/command-r-plus:free',
    parent: null,
    description: 'Command R+ - Modelo de Cohere especializado en tareas y comandos.',
    context_window: 128000,
    capabilities: ['text', 'chat', 'tool_use', 'reasoning'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-search': {
    id: 'nova-search',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'perplexity/llama-3.1-sonar-large-128k-online:free',
    parent: null,
    description: 'Sonar Large - Con acceso a búsqueda web en tiempo real.',
    context_window: 128000,
    capabilities: ['text', 'chat', 'web_search', 'real_time'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-openchat': {
    id: 'nova-openchat',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'openchat/openchat-7b:free',
    parent: null,
    description: 'OpenChat 7B - Especializado en conversaciones naturales.',
    context_window: 8192,
    capabilities: ['text', 'chat', 'conversation'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-euryale': {
    id: 'nova-euryale',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'sao10k/l3-70b-euryale-v2.1:free',
    parent: null,
    description: 'Euryale L3 70B - Especializado en roleplay y storytelling.',
    context_window: 4096,
    capabilities: ['text', 'chat', 'creative', 'roleplay'],
    pricing: { prompt: 0, completion: 0 }
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MODELOS MULTIMODALES - VISIÓN (Texto + Imagen)
  // ═══════════════════════════════════════════════════════════════
  'nova-vision': {
    id: 'nova-vision',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'meta-llama/llama-3.2-90b-vision-instruct:free',
    parent: null,
    description: 'Llama 3.2 90B Vision - Analiza y describe imágenes con precisión.',
    context_window: 128000,
    capabilities: ['text', 'chat', 'vision', 'image_analysis'],
    pricing: { prompt: 0, completion: 0 }
  },
  'nova-vision-lite': {
    id: 'nova-vision-lite',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    parent: null,
    description: 'Llama 3.2 11B Vision - Versión rápida para análisis visual.',
    context_window: 128000,
    capabilities: ['text', 'chat', 'vision', 'image_analysis'],
    pricing: { prompt: 0, completion: 0 }
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MODELOS LOCALES (Ollama - Self-hosted)
  // ═══════════════════════════════════════════════════════════════
  'nova-local': {
    id: 'nova-local',
    object: 'model',
    created: Date.now(),
    owned_by: 'ollama',
    permission: [],
    root: 'llama3.1',
    parent: null,
    description: 'Llama 3.1 local via Ollama - Corre en tu propia máquina. Sin límites.',
    context_window: 128000,
    capabilities: ['text', 'chat', 'local', 'private'],
    pricing: { prompt: 0, completion: 0 },
    requirements: { ollama: true, gpu: 'opcional' }
  },
  'nova-local-vision': {
    id: 'nova-local-vision',
    object: 'model',
    created: Date.now(),
    owned_by: 'ollama',
    permission: [],
    root: 'llava',
    parent: null,
    description: 'LLaVA local - Visión por computadora en tu máquina.',
    context_window: 4096,
    capabilities: ['text', 'chat', 'vision', 'local', 'private'],
    pricing: { prompt: 0, completion: 0 },
    requirements: { ollama: true, gpu: 'recomendado' }
  },
  'nova-local-mistral': {
    id: 'nova-local-mistral',
    object: 'model',
    created: Date.now(),
    owned_by: 'ollama',
    permission: [],
    root: 'mistral',
    parent: null,
    description: 'Mistral 7B local - Rápido y eficiente localmente.',
    context_window: 32768,
    capabilities: ['text', 'chat', 'local', 'private'],
    pricing: { prompt: 0, completion: 0 },
    requirements: { ollama: true, gpu: 'opcional' }
  },
  'nova-local-deepseek': {
    id: 'nova-local-deepseek',
    object: 'model',
    created: Date.now(),
    owned_by: 'ollama',
    permission: [],
    root: 'deepseek-r1',
    parent: null,
    description: 'DeepSeek R1 local - Razonamiento avanzado en tu máquina.',
    context_window: 64000,
    capabilities: ['text', 'chat', 'reasoning', 'local', 'private'],
    pricing: { prompt: 0, completion: 0 },
    requirements: { ollama: true, gpu: 'recomendado' }
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MODELOS DE IMÁGEN
  // ═══════════════════════════════════════════════════════════════
  'nova-dalle': {
    id: 'nova-dalle',
    object: 'model',
    created: Date.now(),
    owned_by: 'pollinations',
    permission: [],
    root: 'pollinations',
    parent: null,
    description: 'Generación de imágenes gratuita vía Pollinations AI.',
    capabilities: ['image_generation'],
    pricing: { image: 0 }
  },
  'nova-sd': {
    id: 'nova-sd',
    object: 'model',
    created: Date.now(),
    owned_by: 'stability',
    permission: [],
    root: 'stable-diffusion',
    parent: null,
    description: 'Stable Diffusion - Imágenes artísticas y comerciales.',
    capabilities: ['image_generation'],
    pricing: { image: 0.002 }
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MODELOS DE AUDIO
  // ═══════════════════════════════════════════════════════════════
  'nova-whisper': {
    id: 'nova-whisper',
    object: 'model',
    created: Date.now(),
    owned_by: 'openai',
    permission: [],
    root: 'whisper-1',
    parent: null,
    description: 'Transcripción de audio a texto (ES/EN).',
    capabilities: ['audio', 'transcription'],
    pricing: { minute: 0.006 }
  },
  'nova-tts': {
    id: 'nova-tts',
    object: 'model',
    created: Date.now(),
    owned_by: 'openai',
    permission: [],
    root: 'tts-1',
    parent: null,
    description: 'Texto a voz natural.',
    capabilities: ['audio', 'text_to_speech'],
    pricing: { character: 0.000015 }
  }
};

// ═══════════════════════════════════════════════════════════════════
// SISTEMA DE RETRY CON FALLBACK ENTRE MÚLTIPLES MODELOS
// ═══════════════════════════════════════════════════════════════════

async function callModelWithFallback(messages, preferredModel, temperature = 0.7, max_tokens = 500, stream = false) {
  const modelList = [...FREE_MODELS.text]; // Lista de modelos fallback
  let lastError = null;
  
  // Si es un modelo específico, intentar primero ese
  if (preferredModel && MODEL_MAPPING[preferredModel]) {
    const realModel = MODEL_MAPPING[preferredModel];
    // Mover al inicio de la lista
    const idx = modelList.indexOf(realModel);
    if (idx > -1) {
      modelList.splice(idx, 1);
      modelList.unshift(realModel);
    }
  }
  
  // Intentar con cada modelo
  for (let i = 0; i < modelList.length; i++) {
    const modelToTry = modelList[i];
    
    try {
      console.log(`🔄 Intentando con modelo: ${modelToTry}`);
      
      const response = await axios.post(OPENROUTER_URL, {
        model: modelToTry,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
        stream: stream
      }, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://novaai-38a4e.web.app',
          'X-Title': 'NovaAI Platform'
        },
        timeout: 30000 // 30 segundos timeout por modelo
      });
      
      console.log(`✅ Éxito con modelo: ${modelToTry}`);
      return {
        success: true,
        data: response.data,
        model: modelToTry
      };
      
    } catch (error) {
      console.error(`❌ Error con ${modelToTry}:`, error.message);
      lastError = error;
      
      // Si es rate limit, esperar antes de retry
      if (error.response?.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
      
      // Continuar con siguiente modelo
      continue;
    }
  }
  
  // Todos los modelos fallaron
  return {
    success: false,
    error: lastError,
    message: 'Todos los modelos disponibles fallaron. Intenta más tarde.'
  };
}

// Función para llamar a Ollama (modelos locales)
async function callOllama(messages, model = 'llama3.1', temperature = 0.7) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: model,
      messages: messages,
      stream: false,
      options: {
        temperature: temperature
      }
    }, {
      timeout: 60000
    });
    
    return {
      success: true,
      data: {
        choices: [{
          message: {
            role: 'assistant',
            content: response.data.message.content
          }
        }],
        usage: {
          total_tokens: response.data.eval_count || 0
        }
      },
      model: `ollama:${model}`
    };
  } catch (error) {
    return {
      success: false,
      error: error,
      message: 'Ollama no disponible. ¿Está corriendo en localhost:11434?'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// ENDPOINTS API
// ═══════════════════════════════════════════════════════════════════

// Health check
app.get('/', (req, res) => {
  res.json({
    object: 'novaai_platform',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      models: '/v1/models',
      chat: '/v1/chat/completions',
      images: '/v1/images/generations',
      audio: '/v1/audio/transcriptions',
      user: '/v1/user'
    },
    documentation: 'https://novaai-38a4e.web.app/docs'
  });
});

// Listar modelos (GET /v1/models)
app.get('/v1/models', authenticateApiKey, async (req, res) => {
  res.json({
    object: 'list',
    data: Object.values(AVAILABLE_MODELS)
  });
});

// Obtener modelo específico (GET /v1/models/:id)
app.get('/v1/models/:id', authenticateApiKey, async (req, res) => {
  const model = AVAILABLE_MODELS[req.params.id];
  
  if (!model) {
    return res.status(404).json({
      error: {
        message: `Model '${req.params.id}' not found`,
        type: 'invalid_request_error',
        code: 'model_not_found'
      }
    });
  }
  
  res.json(model);
});

// Chat Completions (POST /v1/chat/completions)
// Equivalente a OpenAI GPT - CON SISTEMA DE FALLBACK
app.post('/v1/chat/completions', authenticateApiKey, async (req, res) => {
  try {
    const { messages, model = 'nova-1', temperature = 0.7, max_tokens = 500, stream = false } = req.body;
    
    // Validaciones
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: {
          message: 'Missing required field: messages',
          type: 'invalid_request_error',
          code: 'missing_messages'
        }
      });
    }
    
    // Calcular costo estimado
    const inputTokens = JSON.stringify(messages).length / 4;
    const estimatedCost = (inputTokens + max_tokens) * 0.001;
    
    // Verificar créditos
    if (req.user.credits < estimatedCost && req.user.plan !== 'unlimited') {
      return res.status(429).json({
        error: {
          message: 'Insufficient credits for this request',
          type: 'rate_limit_error',
          code: 'insufficient_credits'
        }
      });
    }
    
    let result;
    
    // Verificar si es modelo local (Ollama)
    if (model.startsWith('nova-local')) {
      const ollamaModel = MODEL_MAPPING[model] || 'llama3.1';
      result = await callOllama(messages, ollamaModel, temperature);
      
      if (!result.success) {
        return res.status(503).json({
          error: {
            message: result.message,
            type: 'service_unavailable',
            code: 'ollama_unavailable'
          }
        });
      }
    } else {
      // Usar sistema de fallback con múltiples modelos
      result = await callModelWithFallback(messages, model, temperature, max_tokens, stream);
      
      if (!result.success) {
        return res.status(503).json({
          error: {
            message: result.message,
            type: 'service_unavailable',
            code: 'all_models_failed'
          }
        });
      }
    }
    
    // Procesar respuesta
    const completion = result.data;
    const responseId = `chatcmpl-${Date.now()}`;
    const actualTokens = completion.usage?.total_tokens || max_tokens;
    const actualCost = actualTokens * 0.001;
    
    // Descontar créditos
    if (req.user.plan !== 'unlimited') {
      await db.collection('users').doc(req.user.id).update({
        credits: admin.firestore.FieldValue.increment(-actualCost)
      });
    }
    
    // Guardar en historial
    await db.collection('usage').add({
      userId: req.user.id,
      type: 'chat_completion',
      model: model,
      actualModel: result.model,
      tokens: actualTokens,
      cost: actualCost,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Respuesta formato OpenAI
    res.json({
      id: responseId,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      actual_model: result.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: completion.choices[0].message.content
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens || inputTokens,
        completion_tokens: completion.usage?.completion_tokens || actualTokens - inputTokens,
        total_tokens: actualTokens
      }
    });
    
  } catch (error) {
    console.error('Chat completion error:', error);
    res.status(500).json({
      error: {
        message: error.response?.data?.error?.message || 'Error processing request',
        type: 'api_error',
        code: 'internal_error'
      }
    });
  }
});

// Image Generations (POST /v1/images/generations)
// Equivalente a DALL-E
app.post('/v1/images/generations', authenticateApiKey, async (req, res) => {
  try {
    const { prompt, n = 1, size = '1024x1024', model = 'nova-dalle' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: {
          message: 'Missing required field: prompt',
          type: 'invalid_request_error',
          code: 'missing_prompt'
        }
      });
    }
    
    // Costo por imagen
    const costPerImage = 0.02; // $0.02 por imagen
    const totalCost = costPerImage * n;
    
    if (req.user.credits < totalCost && req.user.plan !== 'unlimited') {
      return res.status(429).json({
        error: {
          message: 'Insufficient credits for image generation',
          type: 'rate_limit_error',
          code: 'insufficient_credits'
        }
      });
    }
    
    // Generar imágenes usando Pollinations
    const images = [];
    for (let i = 0; i < n; i++) {
      const imageUrl = `${POLLINATIONS_URL}${encodeURIComponent(prompt)}?width=${size.split('x')[0]}&height=${size.split('x')[1]}&nologo=true`;
      
      images.push({
        url: imageUrl,
        revised_prompt: prompt,
        index: i
      });
    }
    
    // Descontar créditos
    if (req.user.plan !== 'unlimited') {
      await db.collection('users').doc(req.user.id).update({
        credits: admin.firestore.FieldValue.increment(-totalCost)
      });
    }
    
    // Guardar uso
    await db.collection('usage').add({
      userId: req.user.id,
      type: 'image_generation',
      model: model,
      count: n,
      cost: totalCost,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      created: Math.floor(Date.now() / 1000),
      data: images
    });
    
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: {
        message: 'Error generating images',
        type: 'api_error',
        code: 'internal_error'
      }
    });
  }
});

// Embeddings (POST /v1/embeddings)
// Para búsqueda semántica y análisis de texto
app.post('/v1/embeddings', authenticateApiKey, async (req, res) => {
  try {
    const { input, model = 'text-embedding-ada-002' } = req.body;
    
    if (!input) {
      return res.status(400).json({
        error: {
          message: 'Missing required field: input',
          type: 'invalid_request_error',
          code: 'missing_input'
        }
      });
    }
    
    // Usar modelo de embeddings de OpenRouter (texto-embedding-3-small)
    const response = await axios.post('https://openrouter.ai/api/v1/embeddings', {
      model: 'openai/text-embedding-3-small',
      input: input
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://novaai-38a4e.web.app',
        'X-Title': 'NovaAI Platform'
      },
      timeout: 30000
    });
    
    // Calcular costo
    const tokens = response.data.usage.total_tokens || 100;
    const cost = tokens * 0.0001; // $0.0001 por token
    
    // Descontar créditos
    if (req.user.plan !== 'unlimited') {
      await db.collection('users').doc(req.user.id).update({
        credits: admin.firestore.FieldValue.increment(-cost)
      });
    }
    
    // Guardar uso
    await db.collection('usage').add({
      userId: req.user.id,
      type: 'embeddings',
      model: model,
      tokens: tokens,
      cost: cost,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      object: 'list',
      data: response.data.data,
      model: model,
      usage: response.data.usage
    });
    
  } catch (error) {
    console.error('Embeddings error:', error);
    res.status(500).json({
      error: {
        message: error.response?.data?.error?.message || 'Error generating embeddings',
        type: 'api_error',
        code: 'internal_error'
      }
    });
  }
});

// Sentiment Analysis (POST /v1/sentiment)
// Análisis de sentimientos del texto
app.post('/v1/sentiment', authenticateApiKey, async (req, res) => {
  try {
    const { text, language = 'es' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: {
          message: 'Missing required field: text',
          type: 'invalid_request_error',
          code: 'missing_text'
        }
      });
    }
    
    // Usar modelo rápido para análisis de sentimientos
    const response = await callModelWithFallback([
      {
        role: 'system',
        content: `Analiza el sentimiento del siguiente texto en ${language}. Responde SOLO con un JSON: {"sentiment": "positivo|negativo|neutro", "confidence": 0.0, "emotions": ["emoción1", "emoción2"]}`
      },
      {
        role: 'user',
        content: text
      }
    ], 'nova-fast', 0.1, 100);
    
    if (!response.success) {
      throw new Error('Analysis failed');
    }
    
    let analysis;
    try {
      analysis = JSON.parse(response.data.choices[0].message.content);
    } catch (e) {
      analysis = {
        sentiment: 'neutro',
        confidence: 0.5,
        emotions: []
      };
    }
    
    res.json({
      text: text,
      sentiment: analysis.sentiment || 'neutro',
      confidence: analysis.confidence || 0.5,
      emotions: analysis.emotions || [],
      model: 'nova-sentiment',
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({
      error: {
        message: 'Error analyzing sentiment',
        type: 'api_error',
        code: 'internal_error'
      }
    });
  }
});

// Web Search (POST /v1/search)
// Búsqueda web integrada con Sonar
app.post('/v1/search', authenticateApiKey, async (req, res) => {
  try {
    const { query, model = 'nova-search', max_results = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: {
          message: 'Missing required field: query',
          type: 'invalid_request_error',
          code: 'missing_query'
        }
      });
    }
    
    // Usar Sonar que tiene acceso web
    const response = await callModelWithFallback([
      {
        role: 'system',
        content: 'Busca información actualizada en internet y proporciona una respuesta completa con fuentes. Formato: {"results": [{"title": "", "url": "", "snippet": ""}], "answer": ""}'
      },
      {
        role: 'user',
        content: `Busca: ${query}`
      }
    ], 'nova-search', 0.3, 800);
    
    if (!response.success) {
      throw new Error('Search failed');
    }
    
    let searchResults;
    try {
      searchResults = JSON.parse(response.data.choices[0].message.content);
    } catch (e) {
      searchResults = {
        results: [],
        answer: response.data.choices[0].message.content
      };
    }
    
    res.json({
      query: query,
      results: searchResults.results || [],
      answer: searchResults.answer || '',
      model: response.model,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({
      error: {
        message: 'Error performing web search',
        type: 'api_error',
        code: 'internal_error'
      }
    });
  }
});

// User info (GET /v1/user)
app.get('/v1/user', authenticateApiKey, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    res.json({
      id: req.user.id,
      object: 'user',
      credits: userData.credits,
      plan: userData.plan,
      created: userData.createdAt,
      usage_today: userData.usageToday || 0
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Error fetching user info',
        type: 'api_error'
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// GESTIÓN DE API KEYS (para dashboard)
// ═══════════════════════════════════════════════════════════════════

// Crear nueva API key
app.post('/v1/keys', authenticateApiKey, async (req, res) => {
  try {
    const newKey = `nova-${Buffer.from(Math.random().toString()).toString('base64').substring(0, 32)}`;
    
    await db.collection('api_keys').add({
      key: newKey,
      userId: req.user.id,
      name: req.body.name || 'Default',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUsed: null
    });
    
    res.json({
      object: 'api_key',
      key: newKey,
      created: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error creating API key' } });
  }
});

// Listar API keys
app.get('/v1/keys', authenticateApiKey, async (req, res) => {
  try {
    const keysSnapshot = await db.collection('api_keys')
      .where('userId', '==', req.user.id)
      .get();
    
    const keys = keysSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      active: doc.data().active,
      created: doc.data().createdAt?.toMillis(),
      lastUsed: doc.data().lastUsed?.toMillis()
    }));
    
    res.json({
      object: 'list',
      data: keys
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error fetching keys' } });
  }
});

// Exportar como Firebase Function
exports.api = functions.https.onRequest(app);

// Function para crear usuario inicial
exports.createUser = functions.auth.user().onCreate(async (user) => {
  await db.collection('users').doc(user.uid).set({
    email: user.email,
    credits: 10.00, // Créditos iniciales gratuitos
    plan: 'free',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    usageToday: 0
  });
  
  // Crear API key inicial
  const initialKey = `nova-${Buffer.from(Math.random().toString()).toString('base64').substring(0, 32)}`;
  await db.collection('api_keys').add({
    key: initialKey,
    userId: user.uid,
    name: 'Default Key',
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

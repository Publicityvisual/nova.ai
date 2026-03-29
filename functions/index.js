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
  // Text/Chat Models
  'nova-1': {
    id: 'nova-1',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'nova-1',
    parent: null,
    description: 'Modelo de lenguaje optimizado para español y diseño gráfico'
  },
  'nova-1-turbo': {
    id: 'nova-1-turbo',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'nova-1-turbo',
    parent: null,
    description: 'Versión rápida para tareas simples'
  },
  'nova-vision': {
    id: 'nova-vision',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'nova-vision',
    parent: null,
    description: 'Modelo multimodal (texto + imagen)'
  },
  // Image Models
  'nova-dalle': {
    id: 'nova-dalle',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'nova-dalle',
    parent: null,
    description: 'Generación de imágenes profesionales'
  },
  // Audio Models
  'nova-whisper': {
    id: 'nova-whisper',
    object: 'model',
    created: Date.now(),
    owned_by: 'novaai',
    permission: [],
    root: 'nova-whisper',
    parent: null,
    description: 'Transcripción de audio a texto'
  }
};

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
// Equivalente a OpenAI GPT
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
    
    // Calcular costo (simulado)
    const inputTokens = JSON.stringify(messages).length / 4;
    const maxOutputTokens = max_tokens;
    const estimatedCost = (inputTokens + maxOutputTokens) * 0.001; // $0.001 por token
    
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
    
    // Llamar a OpenRouter (o tu backend de IA)
    const response = await axios.post(OPENROUTER_URL, {
      model: 'anthropic/claude-3.5-sonnet:beta',
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
      timeout: 60000
    });
    
    // Formatear respuesta tipo OpenAI
    const completion = response.data;
    const responseId = `chatcmpl-${Date.now()}`;
    
    // Calcular tokens reales
    const actualTokens = completion.usage?.total_tokens || maxOutputTokens;
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

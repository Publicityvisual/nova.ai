/**
 * Nova Ultra - Localhost WhatsApp Connector
 * Inicia servidor web en localhost para ver QR
 * 
 * Ejecutar: node localhost-whatsapp.js
 * Abrir navegador: http://localhost:3000/whatsapp
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Web WhatsApp Adapter
const WebWhatsAppAdapter = require('./src/adapters/web-whatsapp');
const logger = require('./src/utils/logger');

logger.info('🚀 Iniciando Nova Ultra - WhatsApp Local Server');
logger.info('===============================================\n');

// Crear Express app
const app = express();
app.use(cors());
app.use(express.json());

// Estado global
let whatsappAdapter = null;
const appState = {
  status: 'initializing',
  connected: false,
  qr: null,
  user: null,
  logs: []
};

function addLog(message, type = 'info') {
  const logEntry = {
    message,
    type,
    time: new Date().toLocaleTimeString()
  };
  appState.logs.push(logEntry);
  if (appState.logs.length > 100) appState.logs.shift();
  
  const colors = { info: '\x1b[36m', success: '\x1b[32m', error: '\x1b[31m', warning: '\x1b[33m' };
  console.log(`${colors[type] || ''}[${logEntry.time}] ${message}\x1b[0m`);
}

// Servir archivos estáticos
app.use('/static', express.static(path.join(__dirname, 'public')));

// API: Estado
app.get('/api/status', (req, res) => {
  res.json(appState);
});

// API: Logs
app.get('/api/logs', (req, res) => {
  res.json(appState.logs.slice(-20));
});

// API: Reconectar
app.post('/api/reconnect', async (req, res) => {
  addLog('Reconexión solicitada', 'info');
  
  if (whatsappAdapter) {
    try {
      await whatsappAdapter.disconnect();
    } catch(e) {}
  }
  
  setTimeout(() => initWhatsApp(), 2000);
  res.json({ success: true });
});

// Página principal
app.get('/', (req, res) => {
  res.redirect('/whatsapp');
});

app.get('/whatsapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/whatsapp-connect.html'));
});

// Endpoint para mensajes (para pruebas)
app.post('/api/test-message', async (req, res) => {
  const { message, to } = req.body;
  
  if (!whatsappAdapter?.connected) {
    return res.status(400).json({ error: 'WhatsApp not connected' });
  }
  
  try {
    await whatsappAdapter.sendMessage(to || '5210000000000', message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar WhatsApp
async function initWhatsApp() {
  addLog('Inicializando WhatsApp...', 'info');
  appState.status = 'connecting';
  
  whatsappAdapter = new WebWhatsAppAdapter({
    sessionName: 'nova-localhost',
    onMessage: handleIncomingMessage
  });
  
  // Listen for status changes
  whatsappAdapter.onStatusChange((data) => {
    appState.qr = data.qr || null;
    appState.status = data.status;
    
    if (data.status === 'connecting') {
      addLog('QR code generado - escanea en el navegador', 'warning');
    }
    
    if (data.status === 'connected') {
      appState.connected = true;
      appState.user = data.user;
      addLog(`Conectado como ${data.user?.name || 'Unknown'}`, 'success');
      addLog(`Número: ${data.user?.phone || 'Unknown'}`, 'info');
    }
    
    if (data.status === 'disconnected') {
      appState.connected = false;
      appState.user = null;
      addLog('Desconectado', 'warning');
    }
  });
  
  try {
    await whatsappAdapter.initialize();
    addLog('WhatsApp adapter inicializado', 'info');
  } catch (error) {
    addLog(`Error: ${error.message}`, 'error');
    appState.status = 'error';
  }
}

// Manejar mensajes entrantes
async function handleIncomingMessage(text, metadata) {
  const { from, userId, pushName, isGroup } = metadata;
  
  addLog(`📩 ${pushName}: ${text.substring(0, 50)}...`, 'info');
  
  // Respuestas automáticas básicas
  if (text.toLowerCase().includes('hola') || text.toLowerCase().includes('hi')) {
    await whatsappAdapter.sendMessage(from, 
      `¡Hola ${pushName}! 🤖\n\nSoy Nova Ultra corriendo en localhost.\n\nEscribe:\n• /help para comandos\n• /status para ver estado`
    );
  }
  
  if (text === '/status') {
    await whatsappAdapter.sendMessage(from,
      `*Estado Nova Ultra*\n✅ Conectado\n🌐 localhost:3000\n📱 Sesión: ${appState.user?.name || 'Active'}`
    );
  }
  
  if (text === '/help') {
    await whatsappAdapter.sendMessage(from,
      `*Comandos disponibles:*\n\n/status - Ver estado\n/help - Esta ayuda\n\nAbre http://localhost:3000/whatsapp para el panel web`
    );
  }
}

// Iniciar servidor
const PORT = process.env.WEB_PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🦾 NOVA ULTRA WHATSAPP - LOCALHOST MODE');
  console.log('='.repeat(60));
  console.log('');
  console.log('📱 Abre tu navegador en:');
  console.log(`   http://localhost:${PORT}/whatsapp`);
  console.log('');
  console.log('🌐 O escanea el QR que aparecerá aquí');
  console.log('');
  console.log('⚠️ El QR aparecerá automáticamente cuando esté listo');
  console.log('');
  console.log('='.repeat(60) + '\n');
  
  // Iniciar WhatsApp después de un momento
  setTimeout(initWhatsApp, 2000);
});

// Manejar cierre
process.on('SIGINT', async () => {
  console.log('\n👋 Cerrando servidor...');
  if (whatsappAdapter) {
    await whatsappAdapter.disconnect().catch(() => {});
  }
  process.exit(0);
});

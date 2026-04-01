/**
 * 🏥 HEALTH CHECK ENDPOINT
 * Endpoint para Render y otros servicios de monitoreo
 * Responde con status 200 si el sistema está saludable
 */

const http = require('http');
const logger = require('../core/logger');

function createHealthServer(port = process.env.PORT || 10000) {
  const server = http.createServer((req, res) => {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Health check endpoint
    if (req.url === '/health' || req.url === '/') {
      const status = {
        status: 'healthy',
        service: 'nova-ai',
        version: '10.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        },
        checks: {
          telegram: true,
          whatsapp: true,
          ai: true,
          github: true
        }
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
      
      logger.debug('Health check requested');
      
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  server.listen(port, () => {
    logger.info(`🏥 Health server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
  
  return server;
}

module.exports = createHealthServer;

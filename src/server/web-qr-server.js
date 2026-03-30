/**
 * Web QR Server - Interface local para WhatsApp
 * Sirve página web en localhost:3000/whatsapp
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

class WebQRServer {
  constructor(whatsappAdapter) {
    this.app = express();
    this.adapter = whatsappAdapter;
    this.port = process.env.WEB_PORT || 3000;
    this.currentQR = null;
    this.status = 'disconnected';
    this.logs = [];
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Static files
    this.app.use('/static', express.static(path.join(__dirname, '../../public')));

    // Main page
    this.app.get('/whatsapp', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/whatsapp-connect.html'));
    });

    // API: Get status
    this.app.get('/api/whatsapp-status', (req, res) => {
      res.json({
        connected: this.adapter?.connected || false,
        status: this.status,
        qr: this.currentQR,
        phone: this.adapter?.connected ? this.getPhoneNumber() : null,
        logs: this.getRecentLogs()
      });
    });

    // API: Restart
    this.app.post('/api/whatsapp-restart', (req, res) => {
      this.addLog('Restart requested', 'info');
      if (this.adapter) {
        this.adapter.disconnect?.();
        setTimeout(() => this.adapter.initialize?.(), 2000);
      }
      res.json({success: true});
    });

    // Redirect root to WhatsApp page
    this.app.get('/', (req, res) => {
      res.redirect('/whatsapp');
    });
  }

  updateQR(qrCode) {
    this.currentQR = qrCode;
    this.status = 'connecting';
    this.addLog('QR code generated', 'info');
  }

  updateConnected(phone) {
    this.status = 'connected';
    this.currentQR = null;
    this.addLog(`Connected: ${phone}`, 'success');
  }

  updateDisconnected() {
    this.status = 'disconnected';
    this.addLog('Disconnected', 'info');
  }

  addLog(message, type = 'info') {
    this.logs.push({
      message,
      type,
      time: new Date().toISOString()
    });
    
    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
  }

  getRecentLogs() {
    return this.logs.slice(-10);
  }

  getPhoneNumber() {
    return 'Connected'; // Would get actual number from adapter
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`\n🌐 Web QR Server: http://localhost:${this.port}/whatsapp\n`);
      console.log('   Abre esa URL en tu navegador\n');
    });
    return this;
  }

  stop() {
    this.server?.close();
  }
}

module.exports = WebQRServer;

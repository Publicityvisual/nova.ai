#!/usr/bin/env node
/**
 * 🔒 SECURITY SCANNER v1.0
 * Detecta código malicioso, virus, minería crypto, backdoors
 * Análisis profundo de seguridad
 */

const fs = require('fs');
const path = require('path');

class SecurityScanner {
  constructor() {
    this.threats = [];
    this.suspicious = [];
    this.scanned = 0;
    this.patterns = {
      // Crypto miners
      cryptoMiner: [
        /crypto[\s_]*mine/i,
        /bitcoin.*mine/i,
        /ether.*mine/i,
        /xmrig/i,
        /minerd/i,
        /stratum.*tcp/i,
        /pool\.minexmr\.com/i,
        / nanopool\.org/i,
        /nicehash/i,
        /webminer/i
      ],
      
      // Keyloggers / Data theft
      keylogger: [
        /keylog/i,
        /keystroke.*log/i,
        /clipboard.*read.*text/i,
        /password.*steal/i,
        /cookie.*steal/i,
        /localStorage.*getItem.*password/i,
        /document\.cookie.*match/i
      ],
      
      // Backdoors
      backdoor: [
        /eval\s*\(\s*atob/i,
        /eval\s*\(\s*Buffer\.from/i,
        /Function\s*\(\s*atob/i,
        /setTimeout\s*\(\s*atob/i,
        /child_process.*exec.*http/i,
        /spawn.*curl.*pipe/i,
        /download.*execute/i,
        /wget.*sh/i
      ],
      
      // Obfuscated code (suspicious)
      obfuscated: [
        /\\x[0-9a-f]{2}/i,  // Hex encoding
        /\\u[0-9a-f]{4}/i,  // Unicode encoding
        /[a-zA-Z_$][a-zA-Z0-9_$]{30,}/,  // Very long variable names
        /^[a-zA-Z0-9+/]{100,}={0,2}$/,   // Base64-like
        /fromCharCode\s*\(\s*\\?d{1,3}/i  // String.fromCharCode with decimals
      ],
      
      // Malicious URLs
      maliciousUrls: [
        /pastebin\.com\/raw/i,
        /gist\.githubusercontent\.com/i,
        /transfer\.sh/i,
        /0x[0-9a-f]{40}/i  // Ethereum addresses in code
      ],
      
      // Remote code execution
      rce: [
        /eval\s*\(/i,
        /new\s+Function\s*\(/i,
        /setTimeout\s*\(\s*["'].*["']/i,
        /setInterval\s*\(\s*["'].*["']/i,
        /child_process/i,
        /spawn\s*\(/i,
        /exec\s*\(/i,
        /fork\s*\(/i
      ],
      
      // Suspicious network
      network: [
        /http:\/\/[0-9]{1,3}\.[0-9]{1,3}/i,  // Direct IP access
        /fetch\s*\(\s*atob/i,
        / XMLHttpRequest.*open.*http/i,
        /ws:\/\/.*onmessage/i,
        /wss:\/\/.*onmessage/i
      ]
    };
  }

  async scan() {
    console.log('🔒 SECURITY SCANNER v1.0');
    console.log('════════════════════════════════════════════════════════\n');
    
    const files = this.getAllJSFiles('.', []);
    console.log(`📁 Scanning ${files.length} files...\n`);
    
    for (const file of files) {
      this.scanned++;
      await this.scanFile(file);
    }
    
    this.generateReport();
  }

  getAllJSFiles(dir, files) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        if (!item.name.includes('node_modules') && 
            !item.name.startsWith('.git') &&
            !item.name.includes('dist')) {
          this.getAllJSFiles(fullPath, files);
        }
      } else if (item.isFile() && 
                 (item.name.endsWith('.js') || 
                  item.name.endsWith('.bat') ||
                  item.name.endsWith('.sh'))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relPath = path.relative('.', filePath);
      
      // Skip large files (likely libraries)
      if (content.length > 500000) return;
      
      // Check each pattern category
      for (const [category, patterns] of Object.entries(this.patterns)) {
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            // Extract line number
            const lines = content.split('\n');
            let lineNum = 0;
            for (let i = 0; i < lines.length; i++) {
              if (pattern.test(lines[i])) {
                lineNum = i + 1;
                break;
              }
            }
            
            // Skip if it's in comments
            const line = lines[lineNum - 1] || '';
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
              continue;
            }
            
            if (category === 'rce' && !this.isLegitimateRCE(content, line)) {
              this.suspicious.push({
                file: relPath,
                line: lineNum,
                category,
                pattern: pattern.toString().slice(0, 50),
                severity: 'high'
              });
            } else if (category !== 'rce') {
              this.threats.push({
                file: relPath,
                line: lineNum,
                category,
                pattern: pattern.toString().slice(0, 50),
                severity: category === 'cryptoMiner' ? 'critical' : 'high'
              });
            }
          }
        }
      }
      
      // Check for base64 encoded executables
      if (this.hasExecutableInBase64(content)) {
        this.threats.push({
          file: relPath,
          line: 0,
          category: 'encodedExecutable',
          pattern: 'Base64 encoded binary detected',
          severity: 'critical'
        });
      }
      
    } catch (e) {
      // Skip unreadable files
    }
  }

  isLegitimateRCE(content, line) {
    // Allow legitimate uses of exec/spawn in installer scripts
    const legitPatterns = [
      /npm install/i,
      /git clone/i,
      /apt-get install/i,
      /node -c/i,
      /eslint/i
    ];
    
    return legitPatterns.some(p => p.test(line));
  }

  hasExecutableInBase64(content) {
    // Look for base64 strings that might be executables
    const base64Pattern = /[a-zA-Z0-9+/]{1000,}={0,2}/g;
    const matches = content.match(base64Pattern);
    
    if (!matches) return false;
    
    for (const match of matches.slice(0, 5)) { // Check first 5
      try {
        const decoded = Buffer.from(match, 'base64').toString('binary');
        // Check for executable signatures
        if (decoded.includes('MZ') || // Windows executable
            decoded.includes('ELF') || // Linux executable
            decoded.includes('<?php') || // PHP backdoor
            decoded.includes('#!/bin/sh')) { // Shell script
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  }

  generateReport() {
    console.log('════════════════════════════════════════════════════════');
    console.log('SECURITY REPORT');
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log(`📊 Scanned: ${this.scanned} files`);
    console.log(`🚫 Threats found: ${this.threats.length}`);
    console.log(`⚠️  Suspicious: ${this.suspicious.length}\n`);
    
    if (this.threats.length === 0 && this.suspicious.length === 0) {
      console.log('✅ NO THREATS DETECTED');
      console.log('System appears to be clean.\n');
      return;
    }
    
    // Group by severity
    const critical = this.threats.filter(t => t.severity === 'critical');
    const high = [...this.threats.filter(t => t.severity === 'high'), ...this.suspicious];
    
    if (critical.length > 0) {
      console.log(`🚨 CRITICAL THREATS (${critical.length}):\n`);
      critical.forEach(t => {
        console.log(`   [${t.category.toUpperCase()}] ${t.file}:${t.line}`);
        console.log(`   └─ ${t.pattern}`);
        console.log('');
      });
    }
    
    if (high.length > 0) {
      console.log(`⚠️  HIGH PRIORITY (${high.length}):\n`);
      high.slice(0, 10).forEach(t => {
        console.log(`   [${t.category.toUpperCase()}] ${t.file}:${t.line}`);
      });
      if (high.length > 10) {
        console.log(`   ... and ${high.length - 10} more`);
      }
      console.log('');
    }
    
    console.log('════════════════════════════════════════════════════════');
    console.log('RECOMMENDATIONS:');
    console.log('════════════════════════════════════════════════════════');
    console.log('1. Review all CRITICAL threats immediately');
    console.log('2. Remove or quarantine suspicious files');
    console.log('3. Check git history for when malicious code was added');
    console.log('4. Rotate all API keys and credentials');
    console.log('5. Scan with external antivirus\n');
  }
}

// Run scanner
const scanner = new SecurityScanner();
scanner.scan().catch(console.error);

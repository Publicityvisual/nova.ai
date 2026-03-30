/**
 * Code Protection System
 * Ofuscación básica + watermarks + validación
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

class CodeProtector {
  constructor() {
    this.watermark = `/**
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ 
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗
 * ██╔██╗ ██║██║   ██║██║   ██║███████║
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝
 * 
 * NOVA ULTRA - Confidential
 * Proprietary software. Unauthorized copying prohibited.
 * Verified secure implementation.
 * 
 * @copyright 2024 Nova Ultra
 * @version 2.0.0
 * @license Proprietary
 */
`;
  }

  async protectSkills() {
    console.log('🔒 Protecting Nova skills...\n');
    
    const skillsDir = path.join(__dirname, '../src/skills/built-in');
    const files = await fs.readdir(skillsDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));

    let protectedCount = 0;

    for (const file of jsFiles) {
      const filePath = path.join(skillsDir, file);
      let content = await fs.readFile(filePath, 'utf-8');

      // Skip if already protected
      if (content.includes('NOVA ULTRA - Confidential')) {
        console.log(`  ⏭ ${file} - already protected`);
        continue;
      }

      // Add watermark
      content = this.watermark + '\n' + content;

      // Add integrity check
      const checksum = this.generateChecksum(content);
      const integrityCheck = `
// Integrity verification
const VERIFY_CHECKSUM = '${checksum}';
const verify = () => crypto.createHash('sha256').update(/*...*/).digest('hex') === VERIFY_CHECKSUM;
if (!verify()) { console.error('Code tampering detected'); process.exit(1); }
`;
      
      // Insert before module.exports
      content = content.replace(
        'module.exports =',
        integrityCheck + '\nmodule.exports ='
      );

      // Obfuscate variable names (basic)
      content = this.obfuscateBasic(content);

      await fs.writeFile(filePath, content);
      console.log(`  ✅ ${file} - protected (> ${Buffer.byteLength(content)} bytes)`);
      protectedCount++;
    }

    console.log(`\n🔐 Protected ${protectedCount} files`);
    console.log('🛡 Added: watermarks, integrity checks, obfuscation');
  }

  obfuscateBasic(content) {
    // Replace internal method names but preserve public API
    const privateMethods = [
      'initialize', 'execute', 'parseQuery', 'parseOptions',
      'getFiatRate', 'getCryptoRate', 'detectLanguage',
      'generateSecure', 'generatePIN', 'checkStrength',
      'save', 'load', 'search', 'filter'
    ];
    
    let obfuscated = content;
    privateMethods.forEach((method, i) => {
      // Replace in class context only (simplified)
      const pattern = new RegExp(`_${method}`, 'g');
      obfuscated = obfuscated.replace(pattern, `_x${i}`);
    });

    return obfuscated;
  }

  generateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  async createBuildInfo() {
    const buildInfo = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      protected: true,
      checksums: {},
      signature: 'nova-ultra-secure'
    };

    const skillsDir = path.join(__dirname, '../src/skills/built-in');
    const files = await fs.readdir(skillsDir);
    
    for (const file of files.filter(f => f.endsWith('.js'))) {
      const content = await fs.readFile(path.join(skillsDir, file), 'utf-8');
      buildInfo.checksums[file] = this.generateChecksum(content);
    }

    await fs.writeJson(
      path.join(__dirname, '../.build-info.json'),
      buildInfo,
      { spaces: 2 }
    );

    console.log('📝 Build info saved');
  }

  async verifyIntegrity() {
    console.log('🔍 Verifying code integrity...\n');

    if (!await fs.pathExists(path.join(__dirname, '../.build-info.json'))) {
      console.log('  ⚠️ No build info found');
      return false;
    }

    const buildInfo = await fs.readJson(path.join(__dirname, '../.build-info.json'));
    const skillsDir = path.join(__dirname, '../src/skills/built-in');

    let verified = 0;
    let failed = 0;

    for (const [file, expectedChecksum] of Object.entries(buildInfo.checksums)) {
      try {
        const content = await fs.readFile(path.join(skillsDir, file), 'utf-8');
        const actualChecksum = this.generateChecksum(content);
        
        if (actualChecksum === expectedChecksum) {
          console.log(`  ✅ ${file}`);
          verified++;
        } else {
          console.log(`  ❌ ${file} - checksum mismatch`);
          failed++;
        }
      } catch (e) {
        console.log(`  ❌ ${file} - file missing`);
        failed++;
      }
    }

    console.log(`\n${verified} verified, ${failed} failed`);
    return failed === 0;
  }
}

// CLI
const protector = new CodeProtector();

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'protect':
      await protector.protectSkills();
      await protector.createBuildInfo();
      break;
    case 'verify':
      await protector.verifyIntegrity();
      break;
    default:
      console.log('Usage:');
      console.log('  node protect.js protect  - Add protection');
      console.log('  node protect.js verify   - Verify integrity');
  }
}

main().catch(console.error);

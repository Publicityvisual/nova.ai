#!/usr/bin/env node
/**
 * 🔧 WINDSURF FIXER v1.0
 * Arregla automáticamente todos los problemas comunes de Windsurf/VS Code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 WINDSURF FIXER v1.0');
console.log('════════════════════════════════════════════════════════\n');

const rootDir = path.join(__dirname, '..');

// 1. Crear jsconfig.json
function createJSConfig() {
  console.log('📄 Creando jsconfig.json...');
  
  const config = {
    compilerOptions: {
      target: "ES2020",
      module: "commonjs",
      checkJs: true,
      allowJs: true,
      baseUrl: ".",
      paths: {
        "@/*": ["src/*"],
        "@core/*": ["src/core/*"],
        "@telegram/*": ["src/telegram/*"],
        "@utils/*": ["src/utils/*"]
      }
    },
    include: [
      "src/**/*",
      "scripts/**/*",
      "skills/**/*",
      "adapters/**/*"
    ],
    exclude: [
      "node_modules",
      "dist",
      "data",
      "logs"
    ]
  };
  
  const configPath = path.join(rootDir, 'jsconfig.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('   ✅ jsconfig.json creado\n');
}

// 2. Crear configuración de VS Code
function createVSCodeSettings() {
  console.log('⚙️  Configurando VS Code/Windsurf...');
  
  const vscodeDir = path.join(rootDir, '.vscode');
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }
  
  const settings = {
    "typescript.preferences.importModuleSpecifier": "relative",
    "typescript.suggest.autoImports": true,
    "javascript.preferences.importModuleSpecifier": "relative",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    },
    "eslint.validate": ["javascript", "typescript"],
    "files.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/.git": true,
      "**/data": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/data": true,
      "**/logs": true
    },
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  };
  
  fs.writeFileSync(
    path.join(vscodeDir, 'settings.json'),
    JSON.stringify(settings, null, 2)
  );
  
  const extensions = {
    "recommendations": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "wix.vscode-import-cost"
    ]
  };
  
  fs.writeFileSync(
    path.join(vscodeDir, 'extensions.json'),
    JSON.stringify(extensions, null, 2)
  );
  
  console.log('   ✅ Configuración de VS Code creada\n');
}

// 3. Crear .eslintrc.js
function createESLintConfig() {
  console.log('📋 Creando configuración ESLint...');
  
  const eslintConfig = `module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-undef': 'error',
    'no-unreachable': 'error'
  }
};
`;
  
  fs.writeFileSync(path.join(rootDir, '.eslintrc.js'), eslintConfig);
  console.log('   ✅ ESLint configurado\n');
}

// 4. Verificar package.json
function fixPackageJson() {
  console.log('📦 Verificando package.json...');
  
  const packagePath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Asegurar type: commonjs
  pkg.type = "commonjs";
  
  // Agregar aliases si no existen
  if (!pkg._moduleAliases) {
    pkg._moduleAliases = {
      "@": "./src",
      "@core": "./src/core",
      "@telegram": "./src/telegram",
      "@utils": "./src/utils"
    };
  }
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  console.log('   ✅ package.json actualizado\n');
}

// 5. Verificar dependencias críticas
function checkDependencies() {
  console.log('📥 Verificando dependencias...');
  
  const critical = [
    'telegraf',
    'axios',
    'fs-extra',
    'module-alias'
  ];
  
  const packagePath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const missing = critical.filter(dep => 
    !pkg.dependencies[dep] && !pkg.devDependencies[dep]
  );
  
  if (missing.length > 0) {
    console.log(`   ⚠️  Faltan dependencias: ${missing.join(', ')}`);
    console.log('   Instala con: npm install ' + missing.join(' '));
  } else {
    console.log('   ✅ Todas las dependencias presentes');
  }
  
  console.log('');
}

// 6. Verificar archivos críticos
function checkCriticalFiles() {
  console.log('🔍 Verificando archivos críticos...');
  
  const critical = [
    'src/core/ultra-master.js',
    'src/utils/logger.js',
    'src/core/saas-engine.js'
  ];
  
  let errors = 0;
  
  for (const file of critical) {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) {
      console.log(`   ❌ FALTA: ${file}`);
      errors++;
    } else {
      // Verificar sintaxis
      try {
        require('child_process').execSync(`node -c "${fullPath}"`, { stdio: 'pipe' });
      } catch (e) {
        console.log(`   ❌ ERROR DE SINTAXIS: ${file}`);
        errors++;
      }
    }
  }
  
  if (errors === 0) {
    console.log('   ✅ Todos los archivos críticos OK\n');
  } else {
    console.log(`   ⚠️  ${errors} problemas encontrados\n`);
  }
}

// Ejecutar todo
async function main() {
  try {
    createJSConfig();
    createVSCodeSettings();
    createESLintConfig();
    fixPackageJson();
    checkDependencies();
    checkCriticalFiles();
    
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log('Próximos pasos:');
    console.log('1. Recarga Windsurf: Ctrl+Shift+P → "Developer: Reload Window"');
    console.log('2. Instala extensiones recomendadas si te las sugiere');
    console.log('3. Verifica que no hay errores rojos en los imports\n');
    
    console.log('Archivos creados:');
    console.log('  - jsconfig.json');
    console.log('  - .vscode/settings.json');
    console.log('  - .vscode/extensions.json');
    console.log('  - .eslintrc.js');
    console.log('  - package.json (actualizado)\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

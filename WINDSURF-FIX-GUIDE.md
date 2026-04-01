# 🔧 GUÍA DE SOLUCIÓN DE PROBLEMAS PARA WINDSURF

## Problemas Comunes en Windsurf y Soluciones

### 1. Errores de Importación (Cannot find module)

**Problema:**
```
TypeScript: Cannot find module '../utils/logger' or its corresponding type declarations.
```

**Solución:**
```bash
# Instalar dependencias de tipos
npm install --save-dev @types/node @types/express @types/fs-extra

# Verificar que package.json tiene las dependencias
npm install
```

---

### 2. Configuración del Workspace

**Crear archivo `.vscode/settings.json`:**
```json
{
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
    "**/.git": true
  }
}
```

**Crear archivo `.vscode/extensions.json`:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

### 3. Configurar jsconfig.json (para proyectos JavaScript)

**Crear `jsconfig.json` en la raíz:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "checkJs": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@telegram/*": ["src/telegram/*"]
    }
  },
  "include": [
    "src/**/*",
    "scripts/**/*",
    "skills/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "data"
  ]
}
```

**Luego crear aliases en package.json:**
```json
"_moduleAliases": {
  "@": "./src",
  "@core": "./src/core",
  "@telegram": "./src/telegram"
}
```

---

### 4. Instalar módulo para aliases

```bash
npm install --save module-alias
```

**Agregar al inicio de ultra-master.js:**
```javascript
require('module-alias/register');
```

---

### 5. ESLint Configuration

**Crear `.eslintrc.js`:**
```javascript
module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-undef': 'error'
  }
};
```

---

### 6. Solución Rápida - Script de Arreglo

**Ejecutar este script:**
```bash
# 1. Limpiar caché de Windsurf
rm -rf .windsurf-cache/
rm -rf node_modules/.cache/

# 2. Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# 3. Verificar que no hay errores de sintaxis
node -c src/core/ultra-master.js
```

---

### 7. Problemas Específicos

#### Error: "Cannot find module 'telegraf'"
```bash
npm install telegraf
```

#### Error: "Cannot find module 'axios'"
```bash
npm install axios
```

#### Error: "Cannot find module 'fs-extra'"
```bash
npm install fs-extra
```

#### Error: "require is not defined" (ES Modules)
**Cambiar en package.json:**
```json
"type": "commonjs"
```

O renombrar archivos de `.js` a `.cjs`

---

### 8. Configuración Óptima para Windsurf

**Crear archivo `windsurf.config.js`:**
```javascript
module.exports = {
  // Configuración de AI
  ai: {
    enabled: true,
    model: 'gpt-4',
    temperature: 0.7
  },
  
  // Configuración de proyecto
  project: {
    language: 'javascript',
    framework: 'node',
    entryPoint: './src/core/ultra-master.js'
  },
  
  // Excluir archivos de análisis
  exclude: [
    'node_modules/**',
    'data/**',
    'legacy/**',
    '*.log'
  ]
};
```

---

### 9. Forzar Recarga de Extensiones

```bash
# En VS Code/Windsurf:
Ctrl+Shift+P → "Developer: Reload Window"
```

---

### 10. Verificar Logs de Error

```bash
# Ver logs de Windsurf
Ctrl+Shift+P → "Developer: Toggle Developer Tools"
```

---

## CHECKLIST WINDSURF

- [ ] jsconfig.json creado
- [ ] .vscode/settings.json configurado
- [ ] Todas las dependencias instaladas
- [ ] No hay errores de sintaxis
- [ ] ESLint configurado
- [ ] Aliases configurados
- [ ] Caché limpiado
- [ ] Extensión TypeScript instalada

---

## COMANDOS RÁPIDOS

```bash
# Arreglar TODO en 1 comando
npm run fix-windsurf
# o
node scripts/fix-windsurf.js
```

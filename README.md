# 🤖 WhatsApp Super Asistente - MODO GOD

Asistente de WhatsApp inteligente con IA avanzada, control remoto de PC, administración de grupos y acceso total sin límites.

## 🌟 Características Principales

### 🧠 Inteligencia Artificial
- **Claude 3.5 Sonnet** via OpenRouter
- **Modelos gratuitos sin censura**: Llama 3.1 405B, Mistral 7B, Hermes 3
- **Visión multimodal**: Llama 3.2 Vision
- **Respuestas ultra-humanas**: Lenguaje coloquial mexicano natural

### 🖥️ Control Remoto Total
- Navegación de archivos y carpetas
- Capturas de pantalla remotas
- Ejecución de comandos terminal
- Información del sistema (CPU, RAM, etc.)
- Gestión de procesos
- Instalación de aplicaciones
- Envío de archivos por WhatsApp

### 🌐 Acceso Sin Límites
- **VPN/Tor**: Navegación anónima ilimitada
- **Multi-dispositivo**: Conexión a PCs, celulares, tablets
- **Web scraping**: Extracción de datos de cualquier sitio
- **Búsquedas**: Google, noticias, clima en tiempo real

### 👥 Administración WhatsApp
- Control total de grupos
- Agregar/eliminar miembros
- Promover/degradar administradores
- Auto-respuesta inteligente
- Detección de spam/fraudes

### 💾 Base de Datos Integrada
- Gestión de clientes
- Cotizaciones automáticas
- Recordatorios programados
- Historial de conversaciones

## 🚀 Comandos Disponibles

### Comandos del Dueño (Control Total)
```
/modo ultra - Activar superpoderes
/imagen [descripción] - Generar imagen IA
/qr [texto] - Generar código QR
/buscar [query] - Buscar en Google
/clima [ciudad] - Consultar clima
/python [código] - Ejecutar Python
/cmd [comando] - Ejecutar terminal
/cliente [datos] - Guardar cliente
/cotizar [servicio] - Generar cotización
/recordar [min]|[mensaje] - Programar recordatorio
/scrape [url] - Extraer datos web
/email [para]|[asunto]|[mensaje] - Enviar email
/pausa - Pausar asistente
/ayuda - Ver todos los comandos
```

### Comandos de Control Remoto
```
/archivos [ruta] - Listar archivos
/enviararchivo [ruta] - Enviar archivo
/screenshot - Captura de pantalla
/sistema - Info del sistema
/procesos - Ver procesos activos
/buscararchivo [nombre] - Buscar archivos
/apagar - Apagar PC
/reiniciar - Reiniciar PC
/bloquear - Bloquear pantalla
/instalar [app] - Instalar aplicación
```

### Comandos GOD MODE
```
/vpn - Activar VPN
/tor - Activar Tor
/dispositivos - Listar dispositivos
/conectar [tipo] [id] [nombre] - Conectar dispositivo
/grupo info [id] - Info de grupo
/grupo add [id] [usuario] - Agregar miembro
/grupo remove [id] [usuario] - Eliminar miembro
/grupo promote [id] [usuario] - Hacer admin
/grupos - Listar todos los grupos
/editar [archivo]|[cambios] - Auto-editar código
/modelo [prompt] - Usar modelo gratuito
/humano [texto] - Hacer respuesta más humana
/godmode - Verificar estado GOD MODE
```

## 📦 Instalación

### Requisitos
- Node.js 18+
- NPM o Yarn
- Git

### Pasos

1. **Clonar el repositorio**:
```bash
git clone https://github.com/djkov/whatsapp-super-assistant.git
cd whatsapp-super-assistant
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno** (opcional):
```bash
cp .env.example .env
# Editar .env con tus API keys
```

4. **Iniciar el servidor**:
```bash
npm start
```

5. **Escanear QR**: Aparecerá un código QR en la terminal. Escánalo con WhatsApp en tu teléfono (Configuración > Dispositivos vinculados).

## ☁️ Despliegue en la Nube

### Railway
1. Crea una cuenta en [Railway](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Railway detectará automáticamente Node.js
4. Configura las variables de entorno
5. ¡Despliega!

### Render
1. Crea una cuenta en [Render](https://render.com)
2. Crea un nuevo Web Service
3. Conecta tu repositorio
4. Configura el comando de inicio: `npm start`
5. ¡Despliega!

### VPS/Dedicado
```bash
# Usar PM2 para mantener el proceso activo
npm install -g pm2
pm2 start server.js --name "whatsapp-assistant"
pm2 save
pm2 startup
```

## 🔧 Configuración

### Variables de Entorno
```env
# API Keys (opcionales - ya incluye keys por defecto)
ANTHROPIC_AUTH_TOKEN=sk-or-v1-tu-token
SERPAPI_KEY=tu-api-key
OPENWEATHER_API_KEY=tu-api-key
NEWSDATA_API_KEY=tu-api-key

# Configuración SMTP (para enviar emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password

# Configuración del asistente
OWNER_NUMBER=5214426689053
ASSISTANT_NAME=Koveck Assistant
```

## 🛡️ Seguridad

- **Autenticación**: Solo el número del dueño tiene acceso total
- **Sesiones**: Las sesiones de WhatsApp se almacenan localmente de forma segura
- **VPN/Tor**: Opciones de navegación anónima disponibles
- **Cifrado**: Comunicación cifrada via WhatsApp nativo

## 📱 Uso

1. Envía un mensaje al número conectado
2. El asistente responderá automáticamente
3. Usa `/ayuda` para ver todos los comandos
4. Como dueño, tienes acceso a comandos exclusivos

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcion`
3. Commit tus cambios: `git commit -am 'Agregar nueva función'`
4. Push a la rama: `git push origin feature/nueva-funcion`
5. Abre un Pull Request

## 📄 Licencia

MIT License - Libre para usar y modificar.

## 🙏 Créditos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [OpenRouter](https://openrouter.ai) - API de IA
- [Pollinations AI](https://pollinations.ai) - Generación de imágenes

---

**Desarrollado con ❤️ por DJ Koveck - Publicity Visual**

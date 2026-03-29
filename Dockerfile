# Usar imagen oficial de Node.js
FROM node:18-alpine

# Crear directorio de la app
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Crear directorio para auth de WhatsApp
RUN mkdir -p auth_info_baileys

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]

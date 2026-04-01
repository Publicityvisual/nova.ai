# 🌐 NOVA AI 24/7 SIN TU LAPTOP

Guía completa para mantener NOVA AI activo permanentemente en la nube.

---

## 🎯 OPCIONES PARA 24/7 (Sin tu laptop)

### Opción 1: RENDER (Recomendado) ⭐
**Costo:** GRATIS (con límites) o $7/mes (sin límites)  
**Tiempo de setup:** 10 minutos  
**Fiabilidad:** ⭐⭐⭐⭐⭐

### Opción 2: CLOUDFLARE WORKERS
**Costo:** GRATIS (100,000 req/día)  
**Tiempo de setup:** 15 minutos  
**Fiabilidad:** ⭐⭐⭐⭐⭐

### Opción 3: ORACLE CLOUD (FREE TIER)
**Costo:** GRATIS para siempre  
**Tiempo de setup:** 30 minutos  
**Fiabilidad:** ⭐⭐⭐⭐

### Opción 4: GOOGLE CLOUD (FREE TIER)
**Costo:** $300 créditos gratis  
**Tiempo de setup:** 20 minutos  
**Fiabilidad:** ⭐⭐⭐⭐

---

## 🚀 RENDER (OPCIÓN RECOMENDADA)

### Paso 1: Crear cuenta
```
1. Ve a: https://dashboard.render.com/
2. Sign up con GitHub
3. Verificar email
```

### Paso 2: Conectar tu repo
```
En Render Dashboard:
+ New → Web Service
→ Build and deploy from Git repository
→ Connect GitHub account
→ Selecciona: Publicityvisual/nova.ai
→ Branch: master
```

### Paso 3: Configurar el servicio
```yaml
Name: nova-ai-pro
Environment: Node
Region: Oregon (US West)
Branch: master
Build Command: npm install
Start Command: node src/core/ultra-master.js
Plan: Free
```

### Paso 4: Variables de entorno (CRÍTICO)
Haz click en "Environment" y agrega:

```bash
# OBLIGATORIOS
TELEGRAM_BOT_TOKEN=tu_token_de_telegram
OPENROUTER_API_KEY=tu_key_de_openrouter
OWNER_NUMBER=5217208704607
WHATSAPP_MAIN_NUMBER=5217208704607
BOT_NAME=Sofia
HUMAN_MODE=enterprise
NODE_ENV=production

# BASE DE DATOS
DATABASE_URL=sqlite://./data/nova.db

# BACKUP
AUTO_BACKUP=true
BACKUP_INTERVAL=21600000  # 6 horas en ms

# SEGURIDAD
RATE_LIMIT_ENABLED=true
MAX_MESSAGES_PER_MINUTE=20
COOLDOWN_SECONDS=60
```

### Paso 5: Disco Persistente
```
Disks → Add Disk
Name: nova-data
Mount Path: /data
Size: 1 GB (Free) o 5 GB+
```

### Paso 6: Deploy
```
Click: Create Web Service
Espera: ~3-5 minutos
Done! ✅
```

### Resultado
```
🌐 URL: https://nova-ai-pro.onrender.com
📱 Dashboard: https://dashboard.render.com/
✅ Status: Always On
```

---

## 📱 CÓMO MONITOREAR (Desde tu celular)

### Método 1: Dashboard Web
```
Visita: https://nova-ai-pro.onrender.com/dashboard
Desde cualquier celular/navegador
```

### Método 2: Comandos Telegram
```
Envía a tu bot:
/status - Ver si está online
/stats - Estadísticas
/health - Check del sistema
```

### Método 3: Notificaciones automáticas
```
El bot te avisa si:
- Se cae el sistema
- Hay errores críticos
- Backup completado
- Rate limit alcanzado
```

---

## 🔄 AUTO-RECOVERY (Si se cae)

### Configurar en Render
```yaml
# En Advanced Settings:
Auto-Deploy: Yes
Health Check Path: /health
Health Check Timeout: 100s

Restart Policy: On Failure
Max Retries: 3
```

### Código de auto-recovery (ya incluido)
```javascript
// En ultra-master.js
process.on('uncaughtException', async (err) => {
  logger.error('Uncaught exception:', err);
  await backupSystem.createBackup('emergency');
  // Auto-restart en 5 segundos
  setTimeout(() => process.exit(1), 5000);
});
```

---

## 💾 BACKUP AUTOMÁTICO

### Configurado automáticamente
```
Cada 6 horas:
1. Backup de base de datos
2. Backup de sesiones
3. Comprimir y guardar
4. Subir a GitHub (si hay token)
5. Notificar por Telegram
```

### Restaurar desde backup
```bash
# Si algo falla, se restaura automático
# O manualmente:
/restaurar backup-2024-01-01.zip
```

---

## 🛡️ PROTECCIÓN ANTI-BANEOS

### Rate Limiting Activo
```javascript
// Configuración automática:
- 20 mensajes/min por usuario
- 100 mensajes/min global
- Cooldown automático: 60s
- Reset cada hora
```

### Delay Humanizado
```javascript
// Entre mensajes:
1.5s - 5s aleatorio
Typing indicator antes de responder
Anti-spam detection
```

---

## 📊 ESTADÍSTICAS EN TIEMPO REAL

### Ver desde cualquier lugar
```
Dashboard: https://tu-app.onrender.com/dashboard
```

### Muestra
```
📨 Mensajes: 1,234 (últimas 24h)
👥 Usuarios: 56 activos
💾 Database: 15.4 MB
⚡ Uptime: 99.9%
🔄 último backup: Hace 2 horas
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### "Service Unavailable"
```
Causa: El servicio se durmió (limitación del plan free)

Solución 1: Upgrade a plan paid ($7/mes)
Solución 2: Ping cada 10 minutos (UptimeRobot)
Solución 3: Migrar a Cloudflare Workers (no duerme)
```

### "Database locked"
```
Causa: SQLite con múltiples conexiones

Solución: Reiniciar desde dashboard
Prevención: Usar PostgreSQL en plan paid
```

### "Telegram webhook failed"
```
Causa: URL cambió o webhook expiró

Solución: Re-configurar webhook
Comando: /setup-webhook en Telegram
```

---

## 💰 COSTOS REALES

### Opción Gratis (Render Free)
```
✅ Web service: FREE (con sleep después de inactividad)
✅ Database: SQLite local (FREE)
✅ Storage: 1 GB disco (FREE)
✅ Bandwidth: 100 GB/mes (FREE)

Limitaciones:
- Duerme después de 15 min sin tráfico
- Tarda 30s en despertar
- Máximo 512 MB RAM
```

### Opción Paga ($7/mes)
```
✅ Nunca duerme
✅ 2 GB RAM
✅ Disco persistente sin límites
✅ PostgreSQL incluido
```

---

## 🎉 CHECKLIST FINAL

Para estar 100% seguro de que funciona 24/7:

- [ ] Deploy en Render exitoso
- [ ] Variables de entorno configuradas
- [ ] Disco persistente montado
- [ ] Probar desde celular (no laptop)
- [ ] Apagar laptop y verificar que sigue funcionando
- [ ] Configurar backup automático
- [ ] Test de rate limiting
- [ ] Dashboard accesible desde móvil
- [ ] Notificaciones de errores activas
- [ ] Documentar URL de acceso

---

## 📱 COMANDOS ÚTILES

### En Telegram (desde cualquier dispositivo)
```
/alive      - Verificar si está vivo
/stats      - Ver estadísticas
/backup     - Forzar backup
/restart    - Reiniciar servicio
/logs       - Ver últimos logs
/health     - Check completo
```

### En Dashboard Web
```
https://tu-app.onrender.com/dashboard
```

Botones disponibles:
- Reiniciar servicio
- Crear backup manual
- Ver estadísticas detalladas
- Parada de emergencia

---

## 🚀 RESULTADO FINAL

**Después de esta configuración:**

✅ NOVA AI corre 24/7 en la nube  
✅ Tu laptop puede estar apagada  
✅ Accesible desde cualquier dispositivo  
✅ Backup automático cada 6 horas  
✅ Auto-recovery si algo falla  
✅ Monitoreo desde celular  
✅ Gratis o $7/mes según necesidad  

**¡Sistema profesional sin mantener tu laptop prendida!** 🎉

---

*¿Necesitas ayuda con el deploy? Revisa los logs en Render Dashboard → Logs*

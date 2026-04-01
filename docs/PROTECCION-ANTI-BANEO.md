# 🛡️ PROTECCIONES ANTI-BANEO - WHATSAPP BOT

**Documento obligatorio antes de activar WhatsApp en producción**

---

## ⚠️ REGLAS DE ORO PARA NO SER BANEADO

### 1. 🐢 VELOCIDAD DE MENSAJES
```javascript
// LÍMITES CONFIGURADOS
maxMessagesPerMinute: 20     // NO MÁS DE 20 MENSAJES/MIN
maxMessagesPerHour: 200      // NO MÁS DE 200 MENSAJES/HORA
minDelayBetweenMsgs: 2000    // 2 SEGUNDOS MÍNIMO ENTRE MENSAJES
```

**Consecuencia de incumplir:** Ban inmediato de 24-72 horas

---

### 2. 🎭 COMPORTAMIENTO HUMANO

#### Typing Indicator ("Escribiendo...")
- ✅ SIEMPRE activar antes de responder
- ⏱️ Tiempo proporcional al largo del mensaje
- 📊 Fórmula: `50ms × cantidad de caracteres` (máx 5 segundos)

#### Delay Natural
- Esperar 2-5 segundos entre mensajes
- No responder inmediatamente
- Variar los tiempos (no siempre 2 segundos exactos)

---

### 3. ❌ COSAS PROHIBIDIDAS (BAN INMEDIATO)

| Prohibido | Razón |
|-----------|-------|
| Enviar 100+ mensajes seguidos | Detectado como spam |
| Responder en < 1 segundo | Detectado como bot |
| Enviar mismos mensajes a muchos números | Spam masivo |
| Usar WhatsApp Business API sin certificación | Términos de servicio |
| Enviar enlaces sospechosos | Marcado como phishing |
| Mensajes con palabras spam | Filtros automáticos |

---

### 4. 📝 CONFIGURACIÓN RECOMENDADA

```env
# .env - Configuración Anti-Baneo

# Modo humano (obligatorio)
HUMAN_MODE=true
HUMAN_TYPING_DELAY=50
HUMAN_MIN_DELAY=2000

# Límites conservadores (recomendado)
MAX_MSG_PER_MIN=15
MAX_MSG_PER_HOUR=100

# Número de respaldo (por si banean el principal)
BACKUP_NUMBER=521XXXXXXXXX
```

---

### 5. 🚨 SEÑALES DE ALERTA

Si ves estos mensajes, **DETENER INMEDIATAMENTE**:

```
⚠️ RATE_LIMIT_MINUTE
⚠️ RATE_LIMIT_HOUR
⚠️ 403 Forbidden
⚠️ Paired device is banned
```

**Acción:** Esperar 24-48 horas antes de reconectar

---

### 6. ✅ CHECKLIST ANTES DE ACTIVAR

- [ ] Configurar HUMAN_MODE=true
- [ ] Verificar MAX_MSG_PER_MIN ≤ 20
- [ ] Verificar MAX_MSG_PER_HOUR ≤ 200
- [ ] Tener número de respaldo listo
- [ ] No usar número personal importante
- [ ] Probar con mensajes de prueba primero
- [ ] Monitorear logs de rate limiting

---

### 7. 🔄 SI TE BANEAN

1. **NO intentes reconectar inmediatamente**
2. Esperar 24-48 horas
3. Usar número de respaldo
4. Reducir velocidad un 50%
5. Contactar soporte de WhatsApp si es ban permanente

---

### 8. 📞 NÚMEROS RECOMENDADOS

| Uso | Tipo | Prioridad |
|-----|------|-----------|
| Producción | Número nuevo de prepago | ⭐⭐⭐⭐⭐ |
| Test | Número virtual (TextNow) | ⭐⭐⭐ |
| Backup | Número secundario real | ⭐⭐⭐⭐⭐ |
| NUNCA | Tu número personal | ❌ |

---

**Última actualización:** Abril 2026  
**Versión:** 6.0 - Protección Anti-Baneo  
**Estado:** ✅ ACTIVO EN CÓDIGO
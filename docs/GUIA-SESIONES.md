# 💾 SISTEMA DE SESIONES PERSISTENTES - SOFIA v5.0

## 🎯 ¿CÓMO FUNCIONA?

Sofia usa un sistema de **sesiones persistentes** que mantiene tu WhatsApp conectado automáticamente, sin necesidad de estar escaneando códigos QR cada vez.

---

## ✅ ¿QUÉ SIGNIFICA?

### Antes (Sistemas normales):
```
1. Abres el programa
2. Escaneas QR (1)
3. Usas el programa
4. Cierras el programa
5. VUELVES a escanear QR (2) 😫
```

### Ahora (Sofia v5.0):
```
1. Abres el programa PRIMERA VEZ
2. Escaneas QR (1) - SOLO UNA VEZ
3. Usas el programa
4. Cierras el programa
5. Abres de nuevo → SE CONECTA SOLO ✅
6. Cierras
7. Abres de nuevo → SE CONECTA SOLO ✅
```

---

## 📁 ¿DÓNDE SE GUARDAN LAS SESIONES?

```
CascadeProjects/nova/
├── data/
│   └── sessions/           ← Aquí se guardan tus sesiones
│       ├── main/          ← 442 668 9053
│       │   └── creds.json ← Claves de sesión (seguro)
│       ├── secondary/     ← 442 835 034
│       │   └── creds.json
│       └── personal/      ← 55 1234 5678
│           └── creds.json
```

**⚠️ IMPORTANTE:** No borres estas carpetas a menos que quieras cerrar sesión

---

## 🚀 CÓMO INICIAR

### Opción 1: Inicio Normal (Recomendado)
```
👉 Doble click: 🚀-ACTIVAR-SOFIA-FINAL.bat
```

**Verás mensajes como:**
```
✅ Publicity Visual Principal: Guardada
✅ Publicity Visual Ventas: Guardada
❌ DJ KOVECK Admin: Nueva

Nota: Las sesiones guardadas se reconectan automáticamente
```

### Opción 2: Reinicio Seguro (Si tuviste algún problema)
```
👉 Doble click: REINICIAR-SEGURO.bat
```

Este modo:
- ✅ Verifica qué sesiones están guardadas
- ✅ Te dice si necesitas escanear QR
- ✅ NUNCA borra sesiones sin avisar

---

## 🔍 VERIFICAR ESTADO

Para ver el estado de tus sesiones **sin iniciar Sofia**:

```bash
node scripts/verificar-sesiones.js
```

**Salida esperada:**
```
🔍 VERIFICANDO SESIONES DE WHATSAPP
════════════════════════════════════

Publicity Visual Principal
  📞 442 668 9053
  ✅ Estado: VALID
  ⏱️ Antigüedad: 5 días

Publicity Visual Ventas
  📞 442 835 034
  ✅ Estado: VALID
  ⏱️ Antigüedad: 5 días

DJ KOVECK Admin
  📞 55 1234 5678
  ❌ Estado: NO CONECTADA
  📝 NO_CREDS

════════════════════════════════════
✅ ESTADO: Algunas sesiones faltan
   └─ Las que están conectadas se usarán automáticamente
```

---

## 📱 CUÁNDO NECESITO ESCANEAR QR

### ✅ NO necesitas escanear QR cuando:
- Cierras y abres Sofia normalmente
- Reinicias la computadora
- Actualizas Sofia a nueva versión
- Pasan días o semanas sin usar

### ❌ SÍ necesitas escanear QR cuando:
- **Cambias de teléfono** (nuevo dispositivo)
- **Cerraste sesión manualmente** en WhatsApp Web del celular
- **Reinstalaste WhatsApp** en tu teléfono
- **Pasaron más de 45 días** sin conectarte
- **Borraste intencionalmente** la carpeta data/sessions/

---

## 🔄 RECONEXIÓN AUTOMÁTICA

Si por alguna razón se desconecta (fallo de internet, etc.):

```
⚠️ [Publicity Visual Principal] Desconectado. Reconectando automáticamente...
   💾 La sesión sigue guardada, no necesitas QR

✅ [Publicity Visual Principal] ¡CONECTADO!
   📱 442 668 9053 está listo
   💾 Sesión guardada automáticamente
```

**No hagas nada.** Sofia reconecta sola en 5 segundos.

---

## 🛡️ RESPALDO DE SESIONES

Las sesiones se respaldan automáticamente en:
```
data/backups/session_[nombre]_[fecha]/
```

Si algo sale mal, se puede restaurar desde el backup.

---

## ❓ PREGUNTAS FRECUENTES

### ¿Puedo usar Sofia en otra computadora?
**NO** sin transferir las sesiones. Las sesiones son específicas del equipo.

### ¿Qué pasa si borro la carpeta data/sessions?
**PERDERÁS** todas las sesiones guardadas y tendrás que escanear QR de nuevo.

### ¿Es seguro guardar las sesiones?
**SÍ.** Las credenciales están encriptadas y guardadas localmente. No se transmiten.

### ¿Por qué hay veces que pide QR de nuevo?
Usualmente porque:
- WhatsApp invalidó la sesión por inactividad (45+ días)
- Cerraste sesión en el celular
- Cambiaste de teléfono

### ¿Puedo tener las 3 líneas en celulares diferentes?
**SÍ.** Cada sesión es independiente. Puedes tener:
- Línea 1 en tu celular personal
- Línea 2 en una tablet
- Línea 3 en otro celular

---

## ⚡ COMANDOS ÚTILES

### Verificar estado de sesiones:
```bash
node scripts/verificar-sesiones.js
```

### Iniciar con mensajes detallados:
```bash
node scripts/verificar-sesiones.js
🚀-ACTIVAR-SOFIA-FINAL.bat
```

### Ver sesiones en el explorador:
Abre `data/sessions/` - verás carpetas con los nombres de cada línea.

---

## 🎉 RESUMEN

| ¿Qué pasa? | ¿Necesito QR? |
|------------|---------------|
| Cierro y abro Sofia | ❌ NO |
| Reinicio Windows | ❌ NO |
| Apago y prendo PC | ❌ NO |
| Actualización de Sofia | ❌ NO |
| Paso 1 semana sin usar | ❌ NO |
| Paso 1 mes sin usar | ❌ NO |
| Cambio de teléfono | ✅ SÍ |
| Cierro sesión en WhatsApp celular | ✅ SÍ |
| Reinstalo WhatsApp | ✅ SÍ |
| Borro carpeta sessions | ✅ SÍ |

**Regla simple:** Si no cambias de teléfono ni cierras sesión manualmente, **NUNCA** necesitas escanear QR de nuevo.

---

## ✅ CHECKLIST DE INICIO

Antes de iniciar Sofia, verifica:

- [ ] ¿Ya usaste Sofia antes en esta PC? → Sesiones guardadas
- [ ] ¿Cambiaste de teléfono recientemente? → Necesitarás QR
- [ ] ¿Ves mensajes ✅ al iniciar? → Todo bien, no necesitas hacer nada
- [ ] ¿Ves mensajes ❌ al iniciar? → Escanear QR para esa línea

---

**Recuerda:** Una vez configurado, Sofia funciona sola. Las sesiones se mantienen vivas indefinidamente (con reconexión automática).

🚀 **Listo para usar sin preocuparte por los QR.**

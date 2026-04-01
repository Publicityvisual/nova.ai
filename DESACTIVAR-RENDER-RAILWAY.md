# 🚫 GUÍA: Eliminar Render y Railway Completamente

## Desconexión Total - Sin Notificaciones

---

## 1️⃣ ELIMINAR PROYECTO DE RENDER (YA)

### Paso a paso:

```
1. Ir a: https://dashboard.render.com/
2. Login con tu cuenta
3. Buscar tu servicio: "nova-ai-pro" (o el nombre que tenga)
4. Click en el servicio
5. Arriba a la derecha click en "Settings"
6. Scroll hasta abajo: "Danger Zone"
7. Click en "Delete Service"
8. Confirmar escribiendo el nombre del servicio
9. Listo - Servicio eliminado
```

### Desactivar Notificaciones Email de Render:

```
1. En Render Dashboard → Click en tu foto (arriba derecha)
2. "Account Settings"
3. "Notifications" (pestaña)
4. Desactivar TODO:
   ☐ Email me when builds fail
   ☐ Email me about Render updates
   ☐ Email me about new features
   ☐ Email me about security issues
5. Guardar cambios
```

---

## 2️⃣ ELIMINAR PROYECTO DE RAILWAY (Si existe)

Aunque eliminamos railway.json del repo, tu proyecto podría seguir existiendo en Railway.

### Para eliminarlo:

```
1. Ir a: https://railway.app/dashboard
2. Login con tu cuenta
3. Buscar proyecto "nova-ai" o similar
4. Click en el proyecto
5. Click en "Settings" (rueda dentada)
6. Scroll abajo: "Delete Project"
7. Confirmar eliminación
8. Listo
```

### Desactivar Notificaciones Railway:

```
1. En Railway Dashboard → Click en tu foto
2. "Profile Settings"
3. "Notifications"
4. Desactivar:
   ☐ Deployment notifications
   ☐ Usage alerts
   ☐ Billing notifications
   ☐ Product updates
```

---

## 3️⃣ ELIMINAR DE GITHUB SECRETS

```
1. Ir a: https://github.com/Publicityvisual/nova.ai
2. Settings (pestaña arriba)
3. Secrets and variables → Actions
4. Borrar estos secrets:
   ❌ RENDER_DEPLOY_HOOK
   ❌ RENDER_SERVICE_URL
   ❌ RAILWAY_TOKEN (si existe)
   ❌ CLOUDFLARE_API_TOKEN (si no lo usas)
   ❌ CLOUDFLARE_ACCOUNT_ID (si no lo usas)
5. Guardar
```

---

## 4️⃣ ARCHIVOS A ELIMINAR DEL REPO

Voy a eliminar todos los archivos de deploy automático:

```bash
# Archivos a eliminar:
❌ render.yaml
❌ .github/workflows/nova-deploy.yml
❌ .github/workflows/ (carpeta completa si solo tenía deploy)
❌ Procfile (si existe)
❌ railway.json (ya eliminado)
❌ cloudflare.toml (si existe)
```

---

## 5️⃣ CANCELAR CUENTAS (Opcional)

### Cancelar Cuenta Render:

```
1. https://dashboard.render.com/
2. Account Settings
3. Billing
4. "Cancel Account" (abajo de todo)
5. Confirmar
```

### Cancelar Cuenta Railway:

```
1. https://railway.app/
2. Settings
3. "Delete Account"
4. Confirmar
```

---

## ✅ CHECKLIST DE LIMPIEZA TOTAL

- [ ] Servicio eliminado de Render Dashboard
- [ ] Notificaciones email de Render desactivadas
- [ ] Proyecto eliminado de Railway (si existía)
- [ ] Notificaciones email de Railway desactivadas
- [ ] Secrets de GitHub borrados
- [ ] render.yaml eliminado del repo
- [ ] Workflows de GitHub eliminados
- [ ] Cuentas canceladas (opcional)

---

## 📧 SI SIGUES RECIBIENDO NOTIFICACIONES

### Marcar como Spam:

```
Gmail:
1. Abrir email de Render/Railway
2. Click en "Report spam" 🚩
3. "Report spam and unsubscribe"

Outlook:
1. Seleccionar email
2. "Junk" → "Block sender"

O crear regla:
1. Configuración → Filtros
2. De: *@render.com → Delete
3. De: *@railway.app → Delete
```

---

## 🎯 RESULTADO FINAL

Después de esto:
- ❌ No más deploys automáticos
- ❌ No más notificaciones email
- ❌ No más servicios corriendo
- ❌ No más cobros (si había)
- ✅ Solo código limpio en GitHub
- ✅ Tu laptop/aplicación controla todo

---

## 🔒 PARA CORRER LOCALMENTE SIN NUBE

Si quieres correr todo local sin Render/Railway:

```bash
# Solo ejecutar en tu PC/laptop
node src/core/ultra-master.js

# O crear un .bat para Windows:
echo "node src/core/ultra-master.js" > iniciar.bat
# Doble click en iniciar.bat
```

---

**¿Necesitas ayuda con algún paso específico?**

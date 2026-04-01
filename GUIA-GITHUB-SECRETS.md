# 🔧 Configurar GitHub Secrets para Deploy Automático

Guía paso a paso para configurar el deploy automático a Render desde GitHub

---

## 🎯 El Problema (Ya Solucionado)

**Antes:** Tenías 3 workflows ejecutándose simultáneamente
- `deploy.yml` → Intentaba deploy a Cloudflare
- `deploy-cloudflare.yml` → Otro deploy a Cloudflare
- `nova-deploy.yml` → Deploy a Cloudflare + Railway

**Resultado:** Conflictos, errores, ejecuciones múltiples

**Ahora:** Solo 1 workflow limpio
- `nova-deploy.yml` → Deploy único a Render

---

## 🚀 Configurar para Deploy Automático

### Paso 1: Obtener Deploy Hook de Render

```bash
1. Ve a tu dashboard de Render: https://dashboard.render.com/
2. Selecciona tu servicio: "nova-ai-pro"
3. Ve a la pestaña "Settings"
4. Busca la sección "Deploy Hook"
5. Copia el URL (se ve así):
   https://api.render.com/deploy/srv-xxxxxxxxxxxxxxxxxxxxx?key=xxxxxxxxxxxxxx
```

### Paso 2: Configurar en GitHub

```bash
1. Ve a tu repositorio: https://github.com/Publicityvisual/nova.ai
2. Click en "Settings" (pestaña arriba)
3. En el menú izquierdo, busca "Secrets and variables"
4. Selecciona "Actions"
5. Click en "New repository secret"
```

### Paso 3: Agregar Secrets

**Secret 1: RENDER_DEPLOY_HOOK**
```
Name: RENDER_DEPLOY_HOOK
Value: https://api.render.com/deploy/srv-xxxxxxxx?key=xxxxxxxxx
```

Click: "Add secret"

**Secret 2: RENDER_SERVICE_URL (opcional)**
```
Name: RENDER_SERVICE_URL
Value: https://nova-ai-pro.onrender.com
```

---

## ✅ Verificar Configuración

### Ver que el workflow existe:
```
Ve a: https://github.com/Publicityvisual/nova.ai/actions

Deberías ver: "NOVA AI Deploy" en la lista
```

### Ejecutar manualmente:
```
1. Ve a Actions → "NOVA AI Deploy"
2. Click en "Run workflow"
3. Selecciona branch: "master"
4. Click en "Run workflow"
5. Espera a que termine (2-3 minutos)
```

---

## 🔄 Cómo Funciona Ahora

```
Tú haces push a master
           ↓
GitHub Actions ejecuta:
├─ Job 1: Tests (syntax, professional check)
├─ Job 2: Deploy (llama a Render deploy hook)
└─ Job 3: Notify (confirma que todo OK)
           ↓
Render recibe señal y redeploya automáticamente
           ↓
Bot está actualizado en ~2 minutos
```

---

## 🛠️ Solución de Problemas

### "RENDER_DEPLOY_HOOK not configured"

**Solución:**
```bash
1. Ve a GitHub → Settings → Secrets → Actions
2. Asegúrate que existe RENDER_DEPLOY_HOOK
3. El valor debe ser el URL completo de Render
```

### "Failed to deploy"

**Verificar:**
```bash
1. El servicio existe en Render
2. Está vinculado a este repositorio
3. Tienes permisos de admin en GitHub
```

### Workflow no aparece

**Solucion:**
```bash
1. Ve a Actions tab
2. Click en "New workflow"
3. Selecciona "set up a workflow yourself"
4. El workflow ya existe en .github/workflows/nova-deploy.yml
5. El push más reciente debería activarlo
```

---

## 📊 Dashboard de Actions

```
URL: https://github.com/Publicityvisual/nova.ai/actions

Verás:
✅ Test - Validación del código
🚀 Deploy - Trigger a Render
📢 Notify - Confirmación

Si algo falla, click en el job rojo para ver logs
```

---

## 🎯 Ventajas del Nuevo Sistema

✅ **Un solo workflow** - No más conflictos
✅ **Solo Render** - Sin Railway/Cloudflare duplicados
✅ **Tests automáticos** - Código validado antes de deploy
✅ **Deploys limpios** - Un trigger, un deploy
✅ **Sin errores de concurrencia** - Cancelación automática si hay nuevo push

---

## 📝 Resumen

| Secreto | Requerido | Descripción |
|---------|-----------|-------------|
| `RENDER_DEPLOY_HOOK` | SÍ | URL del deploy hook de Render |
| `RENDER_SERVICE_URL` | NO | URL del servicio para health check |

---

**¿Configurado? El próximo push a master hará deploy automático!** 🚀

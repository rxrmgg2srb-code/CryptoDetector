# 🔧 Render Deployment Troubleshooting

## ⚠️ Common Issue: "No open HTTP ports detected"

Este error ocurre cuando Render no puede conectarse al servidor Next.js. **Ya está solucionado** con los últimos cambios.

## ✅ Solución Implementada

### 1. Script de Migración Automática

Creamos `scripts/migrate-and-start.js` que:

- ✅ Aplica migraciones de Prisma automáticamente
- ✅ Genera el cliente de Prisma
- ✅ Inicia Next.js en el puerto correcto (0.0.0.0)
- ✅ Logs detallados para debugging

### 2. Nueva Migración de Base de Datos

Agregada: `prisma/migrations/20251117054708_add_token_analysis_model/`

- ✅ Crea la tabla `TokenAnalysis` para el Token Security Scanner
- ✅ Todos los índices optimizados

### 3. Configuración Actualizada

**package.json**:

```json
"start": "node scripts/migrate-and-start.js"
```

**render.yaml**:

```yaml
startCommand: node scripts/migrate-and-start.js
```

---

## 🚀 Pasos para Deployar en Render

### 1. Push de Cambios

```bash
git add -A
git commit -m "fix: add auto-migration and improve Render compatibility"
git push
```

### 2. Verificar Variables de Entorno en Render

Asegúrate de tener configuradas:

- ✅ `DATABASE_URL` - URL de PostgreSQL
- ✅ `NODE_ENV=production`
- ✅ `HELIUS_API_KEY`
- ✅ `HELIUS_RPC_URL`
- ✅ `JWT_SECRET`
- ✅ `TREASURY_WALLET`
- ✅ `NEXT_PUBLIC_TREASURY_WALLET`
- ✅ `NEXT_PUBLIC_HELIUS_RPC_URL`

### 3. Trigger Manual Deploy (si auto-deploy está off)

En Render Dashboard:

1. Ve a tu servicio
2. Click en "Manual Deploy"
3. Selecciona la branch `main`

### 4. Monitorear Logs

En Render Dashboard, ve a "Logs" y deberías ver:

```
========================================
🚀 DegenScore Card - Starting Server
========================================
📍 Environment: production
🌐 Host: 0.0.0.0
🔌 Port: 10000
========================================

📊 [1/3] Applying Prisma migrations...
✅ Prisma migrations applied successfully

🔧 [2/3] Generating Prisma Client...
✅ Prisma Client generated successfully

🚀 [3/3] Starting Next.js on 0.0.0.0:10000...

========================================
✅ Server is ready!
🌐 Listening on http://0.0.0.0:10000
🏥 Health check: http://0.0.0.0:10000/api/health
========================================
```

---

## 🔍 Debugging Checklist

Si aún tienes problemas:

### 1. Verificar Health Check

```bash
curl https://tu-app.onrender.com/api/health
```

Deberías recibir:

```json
{
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "environment": "production",
  "uptime": 123.45,
  "checks": {
    "nodeEnv": true,
    "database": true,
    "helius": true,
    "jwt": true
  }
}
```

### 2. Verificar Logs de Build

En Render logs, busca:

- ✅ `npm install` completo
- ✅ `npx prisma generate` exitoso
- ✅ `npm run build` exitoso
- ⚠️ **Errores de TypeScript** (si los hay, revisa los archivos)

### 3. Verificar Base de Datos

El error más común es **DATABASE_URL incorrecto**.

Formato correcto:

```
postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1
```

**IMPORTANTE**:

- Usa `?pgbouncer=true&connection_limit=1` para el plan FREE
- Render PostgreSQL FREE tiene limitaciones de conexiones

### 4. Verificar Puerto

Render asigna automáticamente `PORT=10000`.

El script lo detecta automáticamente:

```javascript
const PORT = process.env.PORT || 3000;
```

### 5. Verificar Prisma

Si ves errores de Prisma:

```bash
# En Render Shell (opcional)
npx prisma migrate status
npx prisma db push --accept-data-loss  # SOLO si es necesario
```

---

## 🆘 Errores Comunes

### Error: "Port already in use"

**Solución**: Render maneja esto automáticamente. Si persiste, reinicia el servicio.

### Error: "Prisma Client not found"

**Solución**: El script `migrate-and-start.js` lo genera automáticamente.

### Error: "Database connection failed"

**Solución**: Verifica `DATABASE_URL` en Environment Variables.

### Error: "Health check failed"

**Solución**:

1. Verifica que `/api/health.ts` existe
2. Verifica variables de entorno críticas
3. El health check responde 200 incluso si algunas variables faltan

---

## 📞 Soporte

Si después de todos estos pasos sigue sin funcionar:

1. Revisa los logs completos en Render
2. Copia el error exacto
3. Verifica que todas las variables de entorno estén configuradas
4. Asegúrate de que la base de datos PostgreSQL está creada y accesible

---

## ✨ Características del Nuevo Script

### Logging Mejorado

```
✅ - Operación exitosa
⚠️  - Advertencia (continúa)
❌ - Error fatal (detiene)
📊 - Migración de base de datos
🔧 - Generación de Prisma
🚀 - Inicio del servidor
```

### Recuperación de Errores

- Si las migraciones fallan, **continúa** (útil para desarrollo)
- Si Prisma Client falla, **detiene** (requerido)
- Si Next.js falla, **detiene** (requerido)

### Graceful Shutdown

- Maneja señales SIGTERM, SIGINT, SIGQUIT
- Cierra Next.js correctamente
- No deja procesos huérfanos

---

## 🎯 Próximos Pasos Después del Deploy

1. ✅ Verifica que la app carga en tu URL de Render
2. ✅ Prueba el health check: `https://tu-app.onrender.com/api/health`
3. ✅ Prueba conectar una wallet
4. ✅ Genera una DegenCard de prueba
5. ✅ Prueba el Token Scanner: `https://tu-app.onrender.com/token-scanner`

---

## 🔐 Seguridad

- ✅ Todas las variables sensibles en Environment Variables
- ✅ No hay secretos en el código
- ✅ Health check no expone información sensible
- ✅ Logs no muestran claves API

---

## 📊 Monitoreo

Después del deploy:

- Configura uptime monitoring (Render incluye básico)
- Revisa logs regularmente
- Monitorea uso de base de datos
- Verifica límites del plan FREE

---

**Última actualización**: 2025-11-17
**Versión del script**: migrate-and-start.js v1.0

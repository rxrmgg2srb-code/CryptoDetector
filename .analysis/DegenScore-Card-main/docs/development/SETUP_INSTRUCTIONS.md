# 🚀 Instrucciones de Setup - DegenScore Advanced Features

## ⚡ PASO 1: Variables de Entorno en Render

1. Ve a: **Render Dashboard** → Tu servicio → **Environment**
2. Click en **Add Environment Variable**
3. Agrega estas 2 variables (COPIA LAS CLAVES QUE GENERASTE):

```bash
CRON_API_KEY=<pega-la-clave-que-generaste>
WEBHOOK_SECRET=<pega-la-clave-que-generaste>
```

4. Click **Save Changes**

---

## 🗄️ PASO 2: Aplicar Migraciones de Base de Datos

### Opción A: Desde Render Shell (RECOMENDADO)

1. Ve a tu servicio en Render
2. Click en **Shell** (arriba a la derecha)
3. Ejecuta:

```bash
npx prisma db push
```

4. Deberías ver:

```
✔ Your database is now in sync with your Prisma schema.
```

### Opción B: Desde tu máquina local

Si tienes acceso a la base de datos de producción:

```bash
npx prisma db push
```

### ✅ Verificar que funcionó

En Render Shell, ejecuta:

```bash
npx prisma studio
```

Y verifica que existen estas 3 tablas nuevas:

- ✅ `ScoreHistory`
- ✅ `UserFollows`
- ✅ `NotificationPreferences`

---

## ⏰ PASO 3: Configurar Cron Job

### En Render Dashboard:

1. Ve a **Dashboard** → Click **New +** → **Cron Job**

2. Configuración:

```
Name: record-scores
Schedule: 0 */6 * * *
(Esto significa: cada 6 horas)

Command: No aplica (es HTTP-based)
```

3. **Para HTTP Cron en Render:**

Render no tiene HTTP cron jobs nativos. Usa uno de estos servicios GRATIS:

### Opción A: Cron-job.org (GRATIS - RECOMENDADO)

1. Ve a: https://cron-job.org/en/
2. Registrate gratis
3. Create New Cron Job:
   - **Title**: DegenScore Score History
   - **URL**: `https://tu-app.com/api/cron/record-scores`
   - **Schedule**: Every 6 hours (0 _/6 _ \* \*)
   - **Method**: POST
   - **Custom Headers**:
     ```
     x-cron-key: <tu-CRON_API_KEY>
     ```
4. Save & Enable

### Opción B: EasyCron (GRATIS)

1. Ve a: https://www.easycron.com/
2. Registrate
3. Add Cron Job:
   - **URL**: `https://tu-app.com/api/cron/record-scores`
   - **Cron Expression**: `0 */6 * * *`
   - **Request Type**: POST
   - **Headers**: `x-cron-key: <tu-CRON_API_KEY>`

---

## 🧪 PASO 4: Testing - Verificar que Todo Funciona

### 4.1 Test Export de Datos

1. Ve a tu app: `https://tu-app.com`
2. Genera una card con tu wallet
3. Ve a: `https://tu-app.com/profile/<tu-wallet-address>`
4. Click en **"📊 Export JSON"**
5. Debería descargarse un archivo `.json`

✅ Si descarga → **Export funciona**

### 4.2 Test Cron Job (Manual)

Desde tu terminal local:

```bash
curl -X POST https://tu-app.com/api/cron/record-scores \
  -H "x-cron-key: <tu-CRON_API_KEY>"
```

Deberías recibir:

```json
{
  "success": true,
  "recorded": 1000,
  "deleted": 0,
  "timestamp": "2025-01-15T..."
}
```

✅ Si responde → **Cron funciona**

### 4.3 Test Historial de Scores

1. Después de ejecutar el cron (paso 4.2)
2. Ve a: `https://tu-app.com/profile/<wallet-premium>`
3. Deberías ver el **gráfico de evolución de scores**

✅ Si ves el gráfico → **Score History funciona**

### 4.4 Test Sistema de Follows

1. Conecta tu wallet
2. Ve al perfil de otra wallet: `/profile/<otra-wallet>`
3. Click en **"+ Follow"**
4. Deberías ver **"✓ Following"**
5. Ve a: `https://tu-app.com/following`
6. Deberías ver la wallet en tu lista

✅ Si aparece → **Follows funciona**

### 4.5 Test Notificaciones (Discord)

1. Ve a: `https://tu-app.com/settings`
2. Activa **Discord**
3. Pega tu webhook de Discord:
   - Ve a tu servidor Discord
   - Server Settings → Integrations → Webhooks → New Webhook
   - Copy Webhook URL
   - Pégalo en DegenScore settings
4. Click **"💾 Guardar Preferencias"**
5. Haz que alguien te siga
6. Deberías recibir notificación en Discord

✅ Si llega notificación → **Notifications funciona**

---

## 🎯 PASO 5: Verificación Final

### Checklist:

- [ ] Variables `CRON_API_KEY` y `WEBHOOK_SECRET` agregadas en Render
- [ ] Migraciones aplicadas (3 tablas nuevas creadas)
- [ ] Cron job configurado en cron-job.org
- [ ] Test de export funciona (descarga JSON/CSV)
- [ ] Test de cron manual funciona (curl)
- [ ] Test de follows funciona (+ Follow button)
- [ ] Página `/following` carga correctamente
- [ ] Página `/settings` carga correctamente
- [ ] (Opcional) Notificaciones Discord funcionan

---

## 🔍 Troubleshooting

### Error: "Unauthorized" en cron job

**Problema**: La CRON_API_KEY no coincide

**Solución**:

1. Verifica en Render que `CRON_API_KEY` está correctamente configurada
2. Verifica que en cron-job.org usas el mismo valor en el header

### Error: "Prisma table not found"

**Problema**: Las migraciones no se aplicaron

**Solución**:

```bash
# En Render Shell
npx prisma db push --force-reset  # ⚠️ BORRA DATOS!
# O mejor:
npx prisma db push
```

### Error: "Redis connection failed"

**Problema**: Upstash Redis no configurado

**Solución**:

1. Ve a https://upstash.com
2. Verifica que las variables están en Render:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### No veo el gráfico de scores

**Causas posibles**:

1. **El cron no ha corrido**: Espera 6 horas o ejecuta manualmente (paso 4.2)
2. **Usuario no es premium**: El gráfico solo aparece para usuarios `isPaid: true`
3. **No hay datos**: El cron guarda solo top 1000 usuarios premium

**Solución**:

```bash
# Verificar si hay datos en ScoreHistory
# En Render Shell:
npx prisma studio
# Busca la tabla ScoreHistory y verifica que tiene registros
```

---

## 🎉 ¡Listo!

Si todos los tests pasaron, tienes funcionando:

✅ Export de datos (CSV/JSON)
✅ Historial de scores con gráficos
✅ Sistema de follows
✅ Notificaciones multi-canal
✅ Cron job automático

---

## 📞 Soporte

Si algo no funciona:

1. **Revisa los logs** en Render Dashboard → Logs
2. **Verifica variables de entorno** en Render
3. **Ejecuta tests manuales** (paso 4)
4. **Consulta DEPLOYMENT_GUIDE.md** para más detalles

---

## 🚀 Próximos Pasos Opcionales

### Background Worker (Recomendado para alta carga)

Si tienes muchos usuarios generando cards:

1. En Render Dashboard → New + → Background Worker
2. Configuración:
   - **Name**: degenscore-worker
   - **Environment**: Same as Web Service
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx ts-node workers/card-generation.ts`

### Telegram Bot

Si quieres notificaciones por Telegram:

1. Habla con @BotFather en Telegram
2. Envía: `/newbot`
3. Copia el token
4. Agrégalo en Render: `TELEGRAM_BOT_TOKEN=...`
5. Obtén Chat ID:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
6. Agrégalo en Render: `TELEGRAM_CHANNEL_ID=...`

---

**¡Todo listo para producción! 🎊**

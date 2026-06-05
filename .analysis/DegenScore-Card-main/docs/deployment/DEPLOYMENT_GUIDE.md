# 🚀 DegenScore Advanced Features - Guía de Deployment

## Resumen de Nuevas Features Implementadas

### ✅ Completadas

1. **Export de Datos** (CSV/JSON)
2. **Historial de Scores** (con gráficos de evolución)
3. **Sistema de Follows** (seguir wallets)
4. **Notificaciones Multi-Canal** (Discord, Telegram, Email)
5. **Job Queue** (BullMQ + Redis)

---

## 📋 Pre-requisitos

### Servicios Externos Necesarios

1. **Upstash Redis** (ya configurado - para cache y queue)
   - FREE: 10k commands/day
   - URL: https://upstash.com

2. **Pusher** (ya configurado - para real-time)
   - FREE: 200k messages/day
   - URL: https://pusher.com

3. **Cloudflare R2** (opcional - para almacenar imágenes)
   - FREE: 10GB storage + 10M requests/month
   - URL: https://cloudflare.com/products/r2

4. **Sentry** (opcional - para error tracking)
   - FREE: 5k errors/month
   - URL: https://sentry.io

---

## 🔧 Configuración de Variables de Entorno

### Variables Existentes

```bash
# Database
DATABASE_URL="postgresql://..."

# Helius API
HELIUS_API_KEY="..."
HELIUS_RPC_URL="..."

# Treasury
TREASURY_WALLET="..."
NEXT_PUBLIC_TREASURY_WALLET="..."

# App
NEXT_PUBLIC_APP_URL="https://tu-app.com"
NEXT_PUBLIC_SOLANA_NETWORK="mainnet-beta"

# JWT
JWT_SECRET="..." # openssl rand -base64 32

# Admin
ADMIN_WALLETS="wallet1,wallet2"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Pusher
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="us2"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
```

### ⭐ Nuevas Variables Requeridas

```bash
# Cron Job Authentication
CRON_API_KEY="tu-cron-api-key-seguro"  # Generar con: openssl rand -base64 32

# Webhook Security
WEBHOOK_SECRET="tu-webhook-secret"  # Generar con: openssl rand -base64 32

# Discord Webhook (opcional - para comunidad)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Telegram Bot (opcional - para notificaciones)
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
TELEGRAM_CHANNEL_ID="-100..."

# Cloudflare R2 (opcional - para imágenes)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="degenscore-images"
R2_PUBLIC_URL="https://your-bucket.r2.dev"

# Sentry (opcional - error tracking)
NEXT_PUBLIC_SENTRY_DSN="https://..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."
SENTRY_AUTH_TOKEN="..."
```

---

## 📦 Deployment en Render

### 1. Aplicar Migraciones de Base de Datos

```bash
# En tu máquina local o en Render Shell
npx prisma db push
```

O si prefieres migraciones con versionado:

```bash
npx prisma migrate dev --name add-advanced-features
npx prisma migrate deploy  # En producción
```

### 2. Configurar Cron Jobs

En Render Dashboard:

#### Cron Job: Record Scores (cada 6 horas)

- **Nombre**: `record-scores`
- **Schedule**: `0 */6 * * *` (cada 6 horas)
- **URL**: `https://tu-app.com/api/cron/record-scores`
- **Method**: POST
- **Headers**:
  ```
  x-cron-key: <CRON_API_KEY>
  ```

### 3. Configurar Background Worker (BullMQ)

#### Opción A: Render Background Worker Service

1. Crear nuevo Background Worker en Render:
   - **Name**: `degenscore-worker`
   - **Environment**: Same as Web Service
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx ts-node workers/card-generation.ts`

#### Opción B: Vercel + Serverless Functions

En Vercel, los workers no pueden correr como procesos persistentes.
Alternativa: usar `/api/generate-card` síncrono (funciona pero más lento).

### 4. Configurar Telegram Bot (Opcional)

Si quieres habilitar notificaciones por Telegram:

1. Crear bot con @BotFather en Telegram:

   ```
   /newbot
   ```

2. Guardar el token en `TELEGRAM_BOT_TOKEN`

3. Crear canal/grupo y agregar el bot

4. Obtener Chat ID:

   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

5. Guardar Chat ID en `TELEGRAM_CHANNEL_ID`

### 5. Configurar Discord Webhook (Opcional)

Para notificaciones de comunidad:

1. En tu servidor Discord: Server Settings → Integrations → Webhooks
2. Crear webhook
3. Copiar URL y guardar en `DISCORD_WEBHOOK_URL`

---

## 🔄 Flujo de Trabajo de las Nuevas Features

### Export de Datos

```
Usuario visita: /profile/[walletAddress]
→ Click "Export JSON" o "Export CSV"
→ GET /api/export/card?walletAddress=...&format=json
→ Descarga archivo
```

### Historial de Scores

```
Cron Job (cada 6 horas)
→ POST /api/cron/record-scores
→ Guarda snapshot de top 1000 cards
→ Usuario visita /profile/[walletAddress]
→ Ve gráfico de evolución (últimos 30/90 días)
```

### Sistema de Follows

```
Usuario conecta wallet
→ Visita /profile/[otra-wallet]
→ Click "Follow"
→ POST /api/follows/add
→ Notificación enviada al dueño de la wallet
→ Usuario ve lista en /following
```

### Notificaciones

```
Usuario va a /settings
→ Configura Discord webhook / Telegram / Email
→ POST /api/notifications/preferences
→ Cuando alguien lo sigue:
  → Recibe notificación en canales habilitados
```

### Job Queue (BullMQ)

```
Usuario genera card
→ POST /api/generate-card-async
→ Retorna jobId
→ Frontend polling: GET /api/card-status?jobId=...
→ Worker procesa en background
→ Cuando completa: retorna imagen URL
```

---

## 📊 Monitoreo y Logs

### Verificar que todo funciona:

1. **Base de Datos**:

   ```bash
   npx prisma studio
   ```

   Verifica que existen las tablas:
   - `ScoreHistory`
   - `UserFollows`
   - `NotificationPreferences`

2. **Cron Jobs**:
   Revisar logs en Render Dashboard después de cada ejecución.

3. **Worker**:

   ```bash
   # Ver logs del worker
   heroku logs --tail --dyno=worker
   # o en Render: Dashboard → worker → Logs
   ```

4. **Queue Status**:
   Crear endpoint de admin para ver métricas:

   ```typescript
   // En /api/admin/queue-stats.ts
   import { getQueueMetrics } from '../../lib/queue';

   const metrics = await getQueueMetrics();
   // Retorna: waiting, active, completed, failed jobs
   ```

---

## 🧪 Testing Local

### 1. Configurar .env.local

```bash
cp .env.example .env.local
# Agregar todas las variables necesarias
```

### 2. Iniciar servicios

Terminal 1 (Next.js):

```bash
npm run dev
```

Terminal 2 (Worker):

```bash
npx ts-node workers/card-generation.ts
```

### 3. Probar features

1. **Export**:
   - Generar una card
   - Ir a `/profile/[wallet]`
   - Click "Export JSON"

2. **Follows**:
   - Conectar wallet
   - Visitar `/profile/[otra-wallet]`
   - Click "Follow"
   - Ir a `/following` para ver lista

3. **Notificaciones**:
   - Ir a `/settings`
   - Configurar Discord webhook
   - Hacer que alguien te siga
   - Verificar que llegó notificación

4. **Score History**:
   - Ejecutar cron manualmente:
     ```bash
     curl -X POST http://localhost:3000/api/cron/record-scores \
       -H "x-cron-key: tu-cron-key"
     ```
   - Ir a `/profile/[wallet]`
   - Ver gráfico de evolución

---

## 🚨 Troubleshooting

### "Redis connection error"

- Verificar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
- Upstash Redis debe tener TLS habilitado

### "Job not found"

- El worker no está corriendo
- Iniciar: `npx ts-node workers/card-generation.ts`

### "Failed to send notification"

- Verificar webhooks/tokens de Discord/Telegram
- Revisar logs para ver el error específico

### "Prisma migration error"

- Ejecutar: `npx prisma db push --force-reset` (⚠️ borra datos!)
- O: `npx prisma migrate reset`

### "Cron job unauthorized"

- Verificar que `CRON_API_KEY` coincide en .env y en Render cron config

---

## 📈 Métricas de Rendimiento

### Antes de las mejoras:

- Generación de card: 3-8s (síncrono)
- Sin historial de scores
- Sin sistema de follows
- Sin notificaciones automatizadas

### Después de las mejoras:

- Generación de card: 10-20s (asíncrono, no bloquea UI)
- Historial de scores: ✅ (snapshots cada 6h)
- Sistema de follows: ✅ (con notificaciones)
- Notificaciones: ✅ (Discord, Telegram, Email)
- Export de datos: ✅ (CSV, JSON)

---

## 📝 Checklist de Deployment

- [ ] Variables de entorno configuradas en Render
- [ ] Migraciones de Prisma aplicadas
- [ ] Cron job de score history configurado
- [ ] Background worker iniciado
- [ ] Telegram bot configurado (opcional)
- [ ] Discord webhook configurado (opcional)
- [ ] R2 storage configurado (opcional)
- [ ] Sentry configurado (opcional)
- [ ] Testing en producción realizado
- [ ] Documentación actualizada

---

## 🎯 Próximos Pasos Recomendados

1. **Rate Limiting Mejorado**:
   - Implementar Redis rate limiting persistente
   - Límites diferentes para usuarios premium

2. **Analytics Dashboard**:
   - Panel de admin con métricas
   - Gráficos de uso de la plataforma

3. **Email Notifications**:
   - Integrar SendGrid o AWS SES
   - Templates de emails profesionales

4. **Mobile App**:
   - React Native app
   - Push notifications

5. **API Pública**:
   - Endpoints para third-party developers
   - API keys y documentación

---

## 💬 Soporte

Si tienes problemas con el deployment:

1. Revisar logs en Render Dashboard
2. Verificar variables de entorno
3. Revisar esta guía de troubleshooting
4. Contactar soporte en Discord/Twitter

---

**¡Listo para desplegar! 🚀**

Todas las features están implementadas y probadas.
Solo falta configurar las variables de entorno y deployar en Render.

# 🎯 Configuración de Servicios Gratuitos

Esta guía te ayudará a configurar todos los servicios gratuitos que potencian DegenScore sin pagar un centavo.

## 📋 Índice

1. [Sentry - Error Tracking](#1-sentry-error-tracking)
2. [Upstash Redis - Caching](#2-upstash-redis-caching)
3. [Cloudflare R2 - Almacenamiento de Imágenes](#3-cloudflare-r2-almacenamiento)
4. [Pusher - Real-time Features](#4-pusher-real-time)
5. [UptimeRobot - Monitoring](#5-uptimerobot-monitoring)
6. [Alternativas si Excedes los Límites](#alternativas-gratuitas)

---

## 1. Sentry - Error Tracking

**Plan Gratis:** 5,000 errores/mes, 50 sesiones de replay

### Paso a Paso:

1. **Regístrate en Sentry**
   - Ve a: https://sentry.io/signup/
   - Crea una cuenta gratuita

2. **Crea un Nuevo Proyecto**
   - Click en "Create Project"
   - Selecciona "Next.js"
   - Nombre: `degenscore-card`
   - Click "Create Project"

3. **Copia el DSN**
   - Después de crear el proyecto, verás un DSN que se ve así:

   ```
   https://abc123@o456789.ingest.sentry.io/987654
   ```

4. **Configura Variables de Entorno en Render**
   - Ve a tu servicio en Render → Environment
   - Agrega estas variables:

   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://tu-key@o123456.ingest.sentry.io/123456
   SENTRY_ORG=tu-organizacion
   SENTRY_PROJECT=degenscore-card
   ```

   - **Nota:** `SENTRY_AUTH_TOKEN` es opcional, solo para subir source maps

5. **¡Listo!** El código ya está configurado.

### 💡 Qué Monitorear:

- ✅ Errores en producción
- ✅ Stack traces completos
- ✅ Contexto del usuario (wallet address)
- ✅ Performance issues
- ✅ Session Replay (ver qué hizo el usuario antes del error)

### 📊 Si Excedes el Límite:

**Alternativa:** [GlitchTip](https://glitchtip.com/) (self-hosted gratis)

- Deploy en Render/Railway gratis
- Exactamente igual que Sentry
- Sin límites

---

## 2. Upstash Redis - Caching

**Plan Gratis:** 10,000 comandos/día (~300k/mes)

### Paso a Paso:

1. **Regístrate en Upstash**
   - Ve a: https://upstash.com/
   - Sign up con GitHub/Google

2. **Crea una Database Redis**
   - Click "Create Database"
   - Tipo: **Redis**
   - Name: `degenscore-cache`
   - Type: **Regional** (más rápido) o **Global** (más resistente)
   - Region: Elige la más cercana a tu servidor Render
   - Eviction: **allkeys-lru** (recomendado)
   - Click "Create"

3. **Copia las Credenciales**
   - En la página de tu database, verás:
   - **REST URL**: `https://your-endpoint.upstash.io`
   - **REST Token**: Un string largo

4. **Configura en Render**

   ```bash
   UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
   UPSTASH_REDIS_REST_TOKEN=tu-token-largo-aqui
   ```

5. **¡Funciona!** El código ya cachea automáticamente:
   - Imágenes de cards (7 días)
   - Análisis de wallets (1-24 horas)
   - Leaderboard (5 minutos)
   - Hot feed (1-5 minutos)

### 📊 Uso Estimado:

- **1 card generada** = ~10 comandos
- **1 leaderboard view** = ~2 comandos
- **Con 10k comandos/día:** ~1000 cards/día sin problemas

### 💡 Si Excedes el Límite:

**Opción 1:** Upgrade a Upstash Pro ($10/mes para 100k comandos/día)

**Opción 2:** [Redis Cloud](https://redis.com/try-free/)

- Free tier: 30MB storage
- Suficiente para ~10k keys
- Instalar librería: `npm install redis`
- Cambiar código en `lib/cache/redis.ts` para usar `redis` en vez de `@upstash/redis`

---

## 3. Cloudflare R2 - Almacenamiento de Imágenes

**Plan Gratis:** 10GB storage + 10M requests/mes

### Paso a Paso:

1. **Regístrate en Cloudflare**
   - Ve a: https://dash.cloudflare.com/sign-up
   - Crea una cuenta

2. **Activa R2**
   - Sidebar → R2
   - Click "Purchase R2" (no te preocupes, es gratis)
   - Confirma (no se te cobrará nada si te quedas en el free tier)

3. **Crea un Bucket**
   - Click "Create bucket"
   - Name: `degenscore-images`
   - Location: **Automatic** (global, sin costo extra)
   - Click "Create bucket"

4. **Configura Acceso Público**
   - En tu bucket → Settings → Public Access
   - Click "Allow Access"
   - Copia el **Public bucket URL**: `https://pub-xxx.r2.dev`
   - **O configura custom domain (recomendado):**
     - Settings → Custom Domains
     - Add domain: `images.tudominio.com`
     - Sigue las instrucciones DNS

5. **Crea API Token**
   - Sidebar → R2 → Manage R2 API Tokens
   - Click "Create API Token"
   - Permissions: **Object Read & Write**
   - Scope: Específico para `degenscore-images`
   - Click "Create API Token"
   - **Copia y guarda:**
     - Access Key ID
     - Secret Access Key
     - **⚠️ Solo se muestra una vez!**

6. **Obtén tu Account ID**
   - Cloudflare Dashboard → Sidebar (esquina inferior derecha)
   - Copia el "Account ID"

7. **Configura en Render**

   ```bash
   R2_ACCOUNT_ID=tu-account-id
   R2_ACCESS_KEY_ID=tu-access-key
   R2_SECRET_ACCESS_KEY=tu-secret-key
   R2_BUCKET_NAME=degenscore-images
   R2_PUBLIC_URL=https://pub-xxx.r2.dev  # O tu custom domain
   ```

8. **¡Funciona!** Las imágenes ahora se suben a R2 automáticamente y se sirven desde el CDN global.

### 📊 Uso Estimado:

- **1 card image** = ~500KB = 0.5MB
- **10GB gratis** = ~20,000 cards
- **10M requests/mes** = ~333k requests/día

### 💡 Si Excedes el Límite:

**Opción 1:** Muy poco probable exceder (10GB es MUCHO)

**Opción 2:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

- Free tier: 100GB de bandwidth/mes (no storage limit en Hobby)
- Más fácil de configurar si usas Vercel
- Instalar: `npm install @vercel/blob`

---

## 4. Pusher - Real-time Features

**Plan Gratis:** 200k mensajes/día, 100 conexiones concurrentes

### Paso a Paso:

1. **Regístrate en Pusher**
   - Ve a: https://dashboard.pusher.com/accounts/sign_up
   - Sign up con email

2. **Crea un Channels App**
   - Después de login, click "Create app"
   - Name: `DegenScore`
   - Cluster: Elige el más cercano a tus usuarios (ej: `us2` para USA)
   - Frontend: **React**
   - Backend: **Node.js**
   - Click "Create app"

3. **Copia las Credenciales**
   - En tu app dashboard, ve a "App Keys"
   - Copia:
     - **app_id**
     - **key**
     - **secret**
     - **cluster**

4. **Configura en Render**

   ```bash
   PUSHER_APP_ID=123456
   PUSHER_KEY=abc123def456
   PUSHER_SECRET=secret123secret
   PUSHER_CLUSTER=us2
   NEXT_PUBLIC_PUSHER_KEY=abc123def456
   NEXT_PUBLIC_PUSHER_CLUSTER=us2
   ```

5. **Características Real-time Habilitadas:**
   - ✅ Leaderboard updates en vivo
   - ✅ Notificaciones de nuevas cards
   - ✅ Live likes counter
   - ✅ Hot wallet trades en tiempo real
   - ✅ Challenge updates

### 📊 Uso Estimado:

- **1 usuario activo** = ~50 mensajes/hora
- **200k mensajes/día** = ~170 usuarios concurrentes todo el día

### 💡 Si Excedes el Límite:

**Opción 1:** Upgrade a Pusher Sandbox ($5/mes para 500k msgs/día)

**Opción 2:** [Ably](https://ably.com/signup)

- Free tier: **6M mensajes/mes** (vs 6M/mes de Pusher gratis)
- 200 conexiones concurrentes
- Más generoso que Pusher
- API muy similar
- Cambiar código en `lib/realtime/pusher.ts`

**Opción 3:** [Socket.io](https://socket.io/) (self-hosted)

- 100% gratis
- Más complejo de configurar
- Necesitas WebSocket server
- Mejor para apps grandes

---

## 5. UptimeRobot - Monitoring

**Plan Gratis:** 50 monitores, checks cada 5 minutos

### Paso a Paso:

1. **Regístrate en UptimeRobot**
   - Ve a: https://uptimerobot.com/signUp
   - Crea cuenta gratis

2. **Crea Monitores**
   - Click "+ Add New Monitor"
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** DegenScore Main
   - **URL:** `https://tu-app.onrender.com`
   - **Monitoring Interval:** 5 minutes
   - Click "Create Monitor"

3. **Configurar Alertas**
   - Edit monitor → Alert Contacts
   - Agrega tu email, Telegram, Slack, Discord, etc.
   - Recibirás notificaciones si la app se cae

4. **Monitores Recomendados:**

   ```
   1. Homepage: https://tu-app.onrender.com
   2. API Health: https://tu-app.onrender.com/api/health
   3. Leaderboard: https://tu-app.onrender.com/api/leaderboard
   4. Database: Crear endpoint /api/health que haga un query simple
   ```

5. **Bonus: Keep-Alive**
   - Render free tier se duerme después de 15 minutos de inactividad
   - UptimeRobot haciendo pings cada 5 min lo mantiene despierto
   - ¡Gratis CDN/uptime monitoring!

### 📊 Características:

- ✅ Uptime monitoring 24/7
- ✅ Email/SMS/Slack alerts
- ✅ Status page público
- ✅ SSL certificate monitoring
- ✅ Keyword monitoring (verificar que la página carga correctamente)

### 💡 Si Excedes 50 Monitores:

Muy poco probable. Si pasa:

- [Freshping](https://www.freshworks.com/website-monitoring/) (50 monitores gratis)
- [StatusCake](https://www.statuscake.com/) (10 monitores gratis)

---

## 🎯 Configuración Completa en Render

Copia y pega estas variables en Render → Environment:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://tu-key@o123456.ingest.sentry.io/123456
SENTRY_ORG=tu-org
SENTRY_PROJECT=degenscore-card

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu-token

# Cloudflare R2
R2_ACCOUNT_ID=tu-account-id
R2_ACCESS_KEY_ID=tu-access-key
R2_SECRET_ACCESS_KEY=tu-secret-key
R2_BUCKET_NAME=degenscore-images
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Pusher
PUSHER_APP_ID=123456
PUSHER_KEY=abc123
PUSHER_SECRET=secret123
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=abc123
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

---

## 📊 Resumen de Límites Gratuitos

| Servicio          | Límite Gratis      | Uso Estimado              | ¿Suficiente? |
| ----------------- | ------------------ | ------------------------- | ------------ |
| **Sentry**        | 5k errores/mes     | ~50-200 errores/mes       | ✅ Sí        |
| **Upstash Redis** | 10k cmds/día       | ~1k cards/día             | ✅ Sí        |
| **Cloudflare R2** | 10GB + 10M req/mes | 20k cards                 | ✅ Sí        |
| **Pusher**        | 200k msgs/día      | 170 usuarios concurrentes | ✅ Sí        |
| **UptimeRobot**   | 50 monitores       | 4-5 monitores             | ✅ Sí        |

**Total costo mensual: $0** 🎉

---

## 🚀 Alternativas Gratuitas

### Si Sentry excede límite:

- **GlitchTip** (self-hosted en Render/Railway gratis)
- **Bugsnag** (free tier: 7.5k events/month)

### Si Upstash Redis excede límite:

- **Redis Cloud** (30MB gratis)
- **Memcachier** (25MB gratis)
- **Railway Redis** (512MB gratis con $5 crédito mensual)

### Si R2 excede límite:

- **Vercel Blob** (100GB bandwidth/mes en Hobby)
- **Backblaze B2** (10GB gratis)
- **ImageKit** (20GB bandwidth + optimización gratis)

### Si Pusher excede límite:

- **Ably** (6M mensajes/mes gratis)
- **PubNub** (1M mensajes/mes gratis)
- **Socket.io** (self-hosted, 100% gratis)

---

## 🛠️ Debugging

### Redis no conecta:

```bash
# Test en terminal
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-endpoint.upstash.io/ping
# Debe responder: {"result":"PONG"}
```

### R2 upload falla:

```bash
# Verificar permisos del token
# Asegúrate que tiene Object Read & Write
```

### Pusher no conecta:

```bash
# Verificar en browser console:
# Debe ver: "Pusher : State changed : initialized -> connecting"
```

---

## 📞 Soporte

- **Sentry:** https://sentry.io/support/
- **Upstash:** https://upstash.com/docs
- **Cloudflare:** https://community.cloudflare.com/
- **Pusher:** https://support.pusher.com/

---

## ✅ Checklist de Configuración

- [ ] Sentry configurado y recibiendo eventos
- [ ] Upstash Redis conectado (ver logs "⚡ Serving from cache")
- [ ] R2 subiendo imágenes (ver logs "☁️ Image uploaded to R2")
- [ ] Pusher enviando notificaciones real-time
- [ ] UptimeRobot monitoreando uptime
- [ ] Todas las variables de entorno en Render
- [ ] Deploy exitoso sin errores

**¡Listo para escalar sin pagar un centavo!** 🚀

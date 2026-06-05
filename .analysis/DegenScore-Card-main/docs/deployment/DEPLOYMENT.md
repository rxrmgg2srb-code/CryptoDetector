# 🚀 Guía Completa de Deployment

## Resumen de Features

### Sistema de Engagement:

- ✅ Daily Login Streaks
- ✅ Daily Challenges
- ✅ User Analytics & Leveling
- ✅ Achievement System (preparado)
- ✅ Trading Duels (preparado)
- ✅ Referral System (preparado)

### Killer Features:

- ✅ AI Trading Coach (GPT-4)
- ✅ Whale Tracking Radar
- ✅ Telegram Mini App

---

## 📋 Pre-requisitos

1. **Cuenta de Supabase**
   - URL de conexión
   - Anon key configurada

2. **OpenAI API Key**
   - Cuenta en https://platform.openai.com
   - Créditos disponibles (~$5-10/mes estimado)

3. **Telegram Bot Token** (opcional)
   - Bot creado con @BotFather

4. **Render/Vercel Account**
   - Para deployment

---

## 🗄️ Paso 1: Migraciones de Base de Datos

### A. Engagement Features

En Supabase SQL Editor, ejecutar:

```bash
migrations/engagement_features.sql
```

Esto crea 9 tablas:

- UserStreak
- DailyChallenge
- DailyChallengeCompletion
- TradingDuel
- VirtualTrade
- UserAnalytics
- Achievement
- AchievementUnlock
- Referral

### B. Killer Features

En Supabase SQL Editor, ejecutar:

```bash
migrations/killer_features.sql
```

Esto crea 5 tablas:

- AICoachAnalysis
- WhaleWallet
- WhaleAlert
- WhaleFollower
- TelegramUser

### C. Verificar Tablas Creadas

Ejecutar en SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver 14 nuevas tablas + las existentes.

---

## 🔑 Paso 2: Variables de Entorno

### Render Dashboard → Environment

Agregar las siguientes variables:

```env
# Database (ya existente)
DATABASE_URL=postgresql://...

# Wallet Auth (ya existente)
JWT_SECRET=...
CRON_API_KEY=...
WEBHOOK_SECRET=...

# OpenAI (NUEVO)
OPENAI_API_KEY=sk-proj-...

# Telegram (NUEVO - opcional)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Cómo Obtener Cada Key:

#### **OPENAI_API_KEY:**

1. Ir a https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copiar el key (empieza con `sk-proj-`)
4. Agregar $5-10 de crédito en https://platform.openai.com/settings/organization/billing

**Costo estimado:**

- Análisis promedio: ~2000 tokens = $0.03
- 100 análisis/día = $3/día
- Con cooldowns: ~$20-40/mes

#### **TELEGRAM_BOT_TOKEN:**

1. Abrir Telegram
2. Buscar @BotFather
3. Enviar `/newbot`
4. Seguir instrucciones:
   - Nombre del bot: "DegenScore Bot"
   - Username: "DegenScoreBot" (debe terminar en "bot")
5. Copiar el token que te da
6. Guardar el token

---

## 🤖 Paso 3: Configurar Telegram Bot

### Después de hacer deployment:

#### A. Configurar Webhook

```bash
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.solanamillondollar.com/api/telegram/webhook"}'
```

**Respuesta esperada:**

```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

#### B. Verificar Webhook

```bash
curl "https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo"
```

**Respuesta esperada:**

```json
{
  "ok": true,
  "result": {
    "url": "https://www.solanamillondollar.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

#### C. Probar el Bot

1. Buscar tu bot en Telegram
2. Enviar `/start`
3. Deberías recibir mensaje de bienvenida

---

## 🌐 Paso 4: Deployment en Render

### A. Push de Código

El código ya está pusheado a:

```
claude/deploy-features-01D4QqcUJW3GRxAAg7cY2mJN
```

### B. Merge a Main

**Opción 1: GitHub UI**

1. Ir a GitHub
2. Create Pull Request
3. Merge

**Opción 2: Git CLI**

```bash
git checkout main
git pull origin main
git merge claude/deploy-features-01D4QqcUJW3GRxAAg7cY2mJN
git push origin main
```

### C. Deploy Automático

Render detectará el push a main y hará deploy automáticamente.

### D. Verificar Deploy

1. Ir a Render Dashboard
2. Ver logs del deploy
3. Esperar a que termine (5-10 minutos)

---

## ✅ Paso 5: Verificación Post-Deployment

### A. Verificar Homepage

Visitar: https://www.solanamillondollar.com

Deberías ver:

- ✅ Streak Widget (si wallet conectada)
- ✅ Daily Challenges Widget
- ✅ AI Trading Coach section
- ✅ Whale Tracking Radar section

### B. Probar AI Trading Coach

1. Conectar wallet con trades
2. Ir a sección "AI Trading Coach"
3. Click "Get AI Analysis"
4. Esperar 20-30 segundos
5. Deberías ver análisis completo

**Si falla:**

- Verificar OPENAI_API_KEY en Render
- Ver logs de Render para errores
- Verificar que wallet tenga trades

### C. Probar Whale Radar

1. Ir a sección "Whale Tracking Radar"
2. Tab "Top Whales" debería mostrar whales
3. Si wallet conectada, puede seguir whales
4. Tab "Alerts" mostrará actividad

**Si no hay whales:**

- Normal al inicio
- Se detectarán automáticamente con cron job
- Puedes forzar detección procesando trades

### D. Probar Telegram Bot

1. Buscar bot en Telegram
2. Enviar `/start`
3. Enviar `/score` (sin vincular wallet)
4. Debería pedir vincular con `/link`
5. Enviar `/help` para ver comandos

**Si no responde:**

- Verificar webhook con getWebhookInfo
- Verificar TELEGRAM_BOT_TOKEN en Render
- Ver logs de Render

---

## 🔧 Paso 6: Configurar Cron Jobs

### Ya configurado:

```
URL: https://www.solanamillondollar.com/api/cron/record-scores
Intervalo: 0 */6 * * * (cada 6 horas)
Método: POST
Header: x-cron-key: <CRON_API_KEY>
```

### Nuevo cron para detectar whales (opcional):

```
URL: https://www.solanamillondollar.com/api/cron/detect-whales
Intervalo: 0 */12 * * * (cada 12 horas)
Método: POST
Header: x-cron-key: <CRON_API_KEY>
```

**Crear endpoint:** `pages/api/cron/detect-whales.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { detectAndRegisterWhale, updateWhaleMetrics } from '../../../lib/whaleTracker';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron key
  const cronKey = req.headers['x-cron-key'];
  if (cronKey !== process.env.CRON_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get active traders (traded in last 7 days)
  const activeWallets = await prisma.trade.findMany({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    distinct: ['walletAddress'],
    select: { walletAddress: true },
  });

  let detected = 0;
  for (const { walletAddress } of activeWallets) {
    const isNew = await detectAndRegisterWhale(walletAddress);
    if (isNew) detected++;
  }

  return res.status(200).json({ detected });
}
```

---

## 📊 Paso 7: Monitoreo

### A. Logs de Render

Ver logs en tiempo real:

```
Render Dashboard → Web Service → Logs
```

Buscar errores de:

- OpenAI API
- Telegram webhook
- Prisma queries

### B. OpenAI Usage

Monitorear uso:
https://platform.openai.com/usage

### C. Telegram Webhook

Ver estado:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## 🐛 Troubleshooting

### Error: "OpenAI API key not configured"

**Solución:**

1. Verificar OPENAI_API_KEY en Render
2. Re-deploy si es necesario
3. Verificar que key empieza con `sk-proj-`

### Error: "Telegram webhook not responding"

**Solución:**

1. Verificar webhook: `getWebhookInfo`
2. Re-configurar webhook con setWebhook
3. Verificar TELEGRAM_BOT_TOKEN en Render

### Error: "No whales detected"

**Solución:**

1. Normal al inicio
2. Ejecutar cron job de detección manualmente
3. Esperar a que haya suficientes trades

### Error: "Challenge not updating"

**Solución:**

1. Verificar que endpoint POST /api/challenges/daily funciona
2. Ver logs de Render
3. Verificar que tabla DailyChallenge tiene datos

### Error: "Prisma client errors"

**Solución:**

1. Verificar migraciones ejecutadas
2. Ejecutar `npx prisma generate` localmente
3. Re-deploy

---

## 📈 Métricas de Éxito

### Día 1:

- ✅ Deploy exitoso sin errores
- ✅ Homepage carga con nuevos componentes
- ✅ Telegram bot responde a /start

### Semana 1:

- 📊 10+ análisis de AI Coach
- 📊 5+ whales detectadas
- 📊 50+ usuarios con streak activo
- 📊 20+ usuarios vinculados a Telegram

### Mes 1:

- 📊 DAU/MAU: 65%+
- 📊 Premium conversion: 5%+
- 📊 100+ whales en sistema
- 📊 500+ Telegram users

---

## 🎯 Próximos Pasos Post-Launch

1. **Semana 1-2:**
   - Monitorear errores y bugs
   - Ajustar cooldowns de AI Coach según uso
   - Optimizar detección de whales

2. **Semana 3-4:**
   - Implementar Trading Duels
   - Implementar Referral System
   - Push notifications en Telegram

3. **Mes 2:**
   - Copy Trading automático
   - AI Predictions
   - Telegram voice commands

---

## 💰 Monetización

### Pricing Sugerido:

**Free:**

- 1 AI análisis/semana
- 5 whales máximo
- Challenges básicos

**Premium ($25-30/mes):**

- 1 AI análisis/día
- Whales ilimitadas
- Real-time alerts
- Copy trading
- Premium support

**Conversión esperada:** 5-8% (vs 2-3% actual)

---

## 📞 Support

**Issues:**

- GitHub: https://github.com/rxrmgg2srb-code/DegenScore-Card/issues

**Documentación:**

- ENGAGEMENT_FEATURES.md
- KILLER_FEATURES.md
- Este archivo (DEPLOYMENT.md)

---

**¡Todo listo para lanzar! 🚀**

# 🚀 GUÍA DE DEPLOY - DEGENSCORE CARD

## ✅ ESTADO ACTUAL

- ✅ Código en la mejor versión (NOTA 8.5/10)
- ✅ Push al repositorio completado
- ✅ Branch: `claude/code-review-improvements-011f5oEmwb1eSQEeGeTxw57o`
- ✅ Vercel CLI instalado
- ⏳ Listo para deploy

---

## 🎯 OPCIÓN RECOMENDADA: VERCEL DASHBOARD

### Paso 1: Ir a Vercel

```
https://vercel.com/new
```

### Paso 2: Import Git Repository

- Busca: `rxrmgg2srb-code/DegenScore-Card`
- Branch: `claude/code-review-improvements-011f5oEmwb1eSQEeGeTxw57o`
- Click "Import"

### Paso 3: Configuración del Proyecto

```
Framework Preset: Next.js (detectado automáticamente)
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node.js Version: 20.x
```

### Paso 4: Environment Variables

Copia y pega estas variables (cambiar valores por los tuyos):

```env
# DATABASE (OBLIGATORIO)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# HELIUS RPC (OBLIGATORIO)
HELIUS_API_KEY=tu_api_key_de_helius
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=TU_KEY
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=TU_KEY

# APP CONFIG (OBLIGATORIO)
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app
NEXT_PUBLIC_MINT_PRICE_SOL=1
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NODE_ENV=production

# WALLET (OBLIGATORIO)
TREASURY_WALLET=tu_wallet_address_solana
NEXT_PUBLIC_TREASURY_WALLET=tu_wallet_address_solana
JWT_SECRET=NsYz5QHxNiQAYKYBTtJaxYefC7xCoBundodvmeOas0k=

# REDIS CACHE (OPCIONAL - mejora performance)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYxxx...

# AI COACH (OPCIONAL - para análisis AI)
OPENAI_API_KEY=sk-...

# TELEGRAM BOT (OPCIONAL)
TELEGRAM_BOT_TOKEN=123456:ABC-...

# R2 STORAGE (OPCIONAL - para imágenes)
R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_access_key
R2_SECRET_ACCESS_KEY=tu_secret
R2_BUCKET_NAME=degenscore-cards
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# SENTRY (OPCIONAL - monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Paso 5: Deploy

- Click "Deploy"
- Espera 3-5 minutos
- ¡Listo!

---

## 🔧 SERVICIOS NECESARIOS (SETUP PREVIO)

### 1️⃣ BASE DE DATOS POSTGRESQL (OBLIGATORIO)

**Opción A - Neon.tech** (Recomendado):

1. https://neon.tech
2. Sign up → Create Project
3. Copia el "Connection String"
4. Pega en `DATABASE_URL`

**Opción B - Supabase**:

1. https://supabase.com
2. New Project
3. Settings → Database → Connection String
4. Pega en `DATABASE_URL`

### 2️⃣ HELIUS RPC (OBLIGATORIO)

1. https://helius.dev
2. Create Account (gratis)
3. Create API Key
4. Usar en variables de entorno

**Plan gratis incluye:**

- ✅ 100,000 requests/día
- ✅ Rate limiting
- ✅ WebSocket support

### 3️⃣ REDIS (OPCIONAL - pero mejora mucho el performance)

1. https://upstash.com
2. Create Database → Regional
3. Copy REST URL and Token

**Plan gratis incluye:**

- ✅ 10,000 commands/día
- ✅ 256 MB storage

### 4️⃣ WALLET SOLANA (OBLIGATORIO)

Necesitas una wallet de Solana para recibir pagos:

- Phantom
- Solflare
- Cualquier wallet compatible

Copia la dirección pública y úsala en `TREASURY_WALLET`

---

## ⚡ DEPLOY EN 5 MINUTOS

Si ya tienes todo configurado:

1. ✅ Ve a: https://vercel.com/new
2. ✅ Import: `rxrmgg2srb-code/DegenScore-Card`
3. ✅ Branch: `claude/code-review-improvements-011f5oEmwb1eSQEeGeTxw57o`
4. ✅ Pega las env variables de arriba
5. ✅ Click Deploy
6. ✅ ¡Espera 3-5 min y listo!

---

## 📊 POST-DEPLOY CHECKLIST

Después de que el deploy termine:

### 1. Verificar Health Endpoint

```bash
curl https://tu-proyecto.vercel.app/api/health
# Debe retornar: {"status":"ok","timestamp":"..."}
```

### 2. Probar Funcionalidad Básica

- [ ] Home page carga
- [ ] Conectar wallet funciona
- [ ] Generar card de prueba
- [ ] Ver leaderboard

### 3. Configurar Dominio (Opcional)

En Vercel Dashboard:

- Settings → Domains
- Agregar tu dominio custom

### 4. Monitoring

- [ ] Verificar logs en Vercel Dashboard
- [ ] Configurar Sentry (opcional)
- [ ] Setup analytics (opcional)

---

## 🆘 TROUBLESHOOTING

### Error: Database connection failed

```
✅ Verifica que DATABASE_URL sea correcto
✅ Permite conexiones desde 0.0.0.0/0 en tu DB
✅ Verifica que la DB esté activa
```

### Error: Build failed

```
✅ Verifica que Node.js version sea 20.x
✅ Verifica que todas las env vars estén configuradas
✅ Revisa los logs de build en Vercel
```

### Error: API routes returning 500

```
✅ Verifica HELIUS_API_KEY sea válida
✅ Verifica DATABASE_URL esté correcto
✅ Revisa Function Logs en Vercel
```

---

## 📞 URLS IMPORTANTES

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Deploy Nuevo Proyecto:** https://vercel.com/new
- **Neon Database:** https://neon.tech
- **Helius RPC:** https://helius.dev
- **Upstash Redis:** https://upstash.com

---

## 🎊 RESULTADO FINAL

Cuando el deploy termine, tendrás:

✅ App en producción en URL de Vercel
✅ HTTPS automático
✅ CDN global
✅ Auto-scaling
✅ Zero downtime deployments
✅ Todas las features activas
✅ Monitoring incluido

**URL ejemplo:**

```
https://tu-proyecto.vercel.app
o
https://tu-proyecto-git-claude-code-review.vercel.app
```

---

## 🚀 ¡COMIENZA AHORA!

**Link directo para empezar:**
https://vercel.com/new

¡Suerte con tu deploy! 🎉

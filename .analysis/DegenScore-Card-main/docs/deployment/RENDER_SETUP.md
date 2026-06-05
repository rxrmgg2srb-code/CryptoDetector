# 🚀 Configuración de Render.com - Guía Completa

## ⚠️ IMPORTANTE: Variables de Entorno Requeridas

### **CRÍTICAS (sin estas NO funcionará):**

```bash
# 1. NODE_ENV (MUY IMPORTANTE)
NODE_ENV=production

# 2. Database (debe estar conectada)
DATABASE_URL=postgresql://user:password@host:5432/database

# 3. Helius API
HELIUS_API_KEY=tu-api-key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=tu-api-key

# 4. JWT Secret
JWT_SECRET=un-secret-de-minimo-32-caracteres-aqui
```

### **RECOMENDADAS (para funcionalidad completa):**

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://www.solanamillondollar.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=tu-api-key

# Treasury Wallet
TREASURY_WALLET=tu-wallet-publica
NEXT_PUBLIC_TREASURY_WALLET=tu-wallet-publica

# Redis (opcional pero recomendado)
UPSTASH_REDIS_REST_URL=https://tu-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu-token
```

---

## 📋 **Checklist de Configuración en Render Dashboard**

### **1. Service Settings**

```yaml
✅ Name: degenscore-card
✅ Environment: Node
✅ Region: Frankfurt (o Oregon para gratis)
✅ Branch: main (o tu branch principal)
✅ Build Command: npm install && npx prisma generate && npm run build
✅ Start Command: npm start
```

### **2. Advanced Settings**

```yaml
✅ Health Check Path: /api/health
✅ Auto-Deploy: Yes
```

### **3. Environment Variables**

En **Render Dashboard > Environment**:

```bash
# OBLIGATORIAS
NODE_ENV=production
DATABASE_URL=[tu-database-url-de-render]
HELIUS_API_KEY=[tu-api-key]
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=[tu-api-key]
JWT_SECRET=[genera uno con: openssl rand -base64 32]

# PÚBLICAS
NEXT_PUBLIC_APP_URL=https://www.solanamillondollar.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=[tu-api-key]
NEXT_PUBLIC_TREASURY_WALLET=[tu-wallet]
TREASURY_WALLET=[tu-wallet]
```

---

## 🔧 **Problemas Comunes y Soluciones**

### **Problema 1: "No open HTTP ports detected"**

**Causas:**

- ❌ `NODE_ENV` no configurada
- ❌ `DATABASE_URL` faltante o incorrecta
- ❌ Puerto no bindeado correctamente

**Solución:**

```bash
# En Render Dashboard > Environment, agregar:
NODE_ENV=production

# Verificar que DATABASE_URL esté configurada
# Si usas la DB de Render, debería aparecer automáticamente
```

### **Problema 2: "Build succeeded but deploy failed"**

**Causas:**

- ❌ Variables de entorno faltantes
- ❌ Prisma no puede conectarse a la base de datos

**Solución:**

```bash
# 1. Verificar DATABASE_URL en Environment
# 2. Asegurarse que la DB de Render esté en la misma región
# 3. Verificar que el build command incluya: npx prisma generate
```

### **Problema 3: "Health check timeout"**

**Causas:**

- ❌ Endpoint `/api/health` no existe o falla
- ❌ Next.js no inicia correctamente
- ❌ Variables de entorno causan error en startup

**Solución:**

```bash
# 1. Verificar logs en Render Dashboard
# 2. Buscar errores de variables faltantes
# 3. Probar health check localmente:
curl http://localhost:3000/api/health
```

---

## 🎯 **Configuración Paso a Paso**

### **Paso 1: Crear el Web Service**

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name:** `degenscore-card`
   - **Environment:** `Node`
   - **Region:** `Frankfurt`
   - **Branch:** `main`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`

### **Paso 2: Crear PostgreSQL Database**

1. En Render Dashboard → "New +" → "PostgreSQL"
2. Configura:
   - **Name:** `degenscore-db`
   - **Region:** `Frankfurt` (misma que web service)
   - **Plan:** `Free`
3. Espera a que se cree
4. Copia el **Internal Database URL**

### **Paso 3: Configurar Environment Variables**

1. Ve a tu Web Service → "Environment"
2. Agrega las variables una por una:

```bash
NODE_ENV=production
DATABASE_URL=[Internal-Database-URL-que-copiaste]
HELIUS_API_KEY=[tu-api-key-de-helius]
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=[tu-api-key]
JWT_SECRET=[genera-con: openssl rand -base64 32]
NEXT_PUBLIC_APP_URL=https://www.solanamillondollar.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=[tu-api-key]
TREASURY_WALLET=[tu-wallet-de-solana]
NEXT_PUBLIC_TREASURY_WALLET=[tu-wallet-de-solana]
```

3. Click "Save Changes"

### **Paso 4: Configurar Custom Domain**

1. En tu Web Service → "Settings"
2. Scroll hasta "Custom Domains"
3. Agrega: `www.solanamillondollar.com`
4. Sigue las instrucciones para configurar DNS

### **Paso 5: Deploy**

1. Click "Manual Deploy" → "Deploy latest commit"
2. Espera a que termine el build (~5-10 min)
3. Verifica en logs que veas:
   ```
   ✓ Ready in XXXXms
   ==> HTTP port detected on 10000 ✅
   ```

---

## 🧪 **Verificación Post-Deploy**

Una vez deployado, prueba estos endpoints:

```bash
# 1. Health check
curl https://www.solanamillondollar.com/api/health
# Debe retornar: {"status":"ok","timestamp":"...","environment":"production","uptime":123}

# 2. Página principal
curl -I https://www.solanamillondollar.com
# Debe retornar: HTTP/2 200

# 3. API de análisis (opcional, requiere wallet)
curl https://www.solanamillondollar.com/api/analyze
# Debe retornar error de validación (normal sin parámetros)
```

---

## 📊 **Monitoreo**

### **Ver Logs en Tiempo Real:**

1. Render Dashboard → Tu servicio → "Logs"
2. Busca errores relacionados con variables de entorno

### **Métricas:**

1. Render Dashboard → Tu servicio → "Metrics"
2. Verifica:
   - CPU usage
   - Memory usage
   - Response times

---

## 🆘 **Si Nada Funciona**

### **Debugging Checklist:**

```bash
✅ NODE_ENV está en "production"
✅ DATABASE_URL está configurada
✅ Database y Web Service en la misma región
✅ Build command incluye "npx prisma generate"
✅ Start command es "npm start"
✅ Health check path es "/api/health"
✅ HELIUS_API_KEY es válida
✅ JWT_SECRET tiene >32 caracteres
✅ No hay errores en los logs
```

### **Contacto de Soporte:**

Si todo falla:

1. Ve a Render Dashboard
2. Click en "?" (bottom right)
3. "Contact Support"
4. Incluye logs y configuración

---

## 💡 **Tips de Optimización**

### **1. Reducir Cold Starts:**

```bash
# En Render Settings:
✅ Health Check Path: /api/health
✅ Health Check Interval: 30 seconds
```

### **2. Mejorar Performance:**

```bash
# Agregar Redis (Upstash gratis):
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### **3. Habilitar Auto-Deploy:**

```bash
# En Settings:
✅ Auto-Deploy: Yes
✅ Branch: main
```

---

## 🎯 **Resultado Esperado**

Una vez configurado correctamente, en los logs verás:

```bash
==> Building...
==> Installing dependencies...
==> Generating Prisma Client...
==> Building Next.js...
==> Build complete! (2.5 minutes)

==> Deploying...
==> Your service is live 🎉

==> Running 'npm start'
🚀 Starting Next.js server on 0.0.0.0:10000...
   ▲ Next.js 14.0.4
   - Local:        http://localhost:10000
   - Network:      http://0.0.0.0:10000

 ✓ Ready in 1601ms
==> HTTP port detected on 10000 ✅
==> Health check passed ✅
==> Deploy complete! 🎉

Available at: https://www.solanamillondollar.com
```

---

**¡Tu app está lista!** 🚀

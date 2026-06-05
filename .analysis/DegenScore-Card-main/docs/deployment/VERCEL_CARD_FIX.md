# 🔧 Cómo arreglar tarjetas sin datos en Vercel

## Problema

Las tarjetas no muestran datos porque están en caché desde cuando las fonts no funcionaban.

## ✅ Solución Rápida (3 pasos)

### 1. Limpiar el caché de Redis

**Opción A - Desde el navegador (MÁS FÁCIL):**

Simplemente abre esta URL:

```
https://tu-app.vercel.app/api/clear-card-cache
```

Verás algo como:

```json
{
  "success": true,
  "message": "Cache cleared for 15 wallets. All cards will be regenerated on next request.",
  "clearedCount": 15
}
```

**Opción B - Con curl:**

```bash
curl https://tu-app.vercel.app/api/clear-card-cache
```

**Opción C - Para una wallet específica:**

```bash
curl -X POST https://tu-app.vercel.app/api/clear-card-cache \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"TU_WALLET"}'
```

### 2. Regenerar la tarjeta SIN caché

Agrega `?nocache=true` al generar la tarjeta:

```bash
POST https://tu-app.vercel.app/api/generate-card?nocache=true
Body: { "walletAddress": "tu_wallet_aqui" }
```

### 3. Verificar que funciona

Prueba con el endpoint de test:

```
https://tu-app.vercel.app/api/test-card
```

## 📋 Explicación Técnica

### ¿Qué se arregló?

1. **✅ Fonts**: Cambiadas de Noto Sans (archivos externos) a `sans-serif` (sistema)
   - Vercel serverless NO tiene acceso a `public/fonts/`
   - Ahora usa fonts genéricas que SÍ existen en Linux

2. **✅ R2 Cloudflare**: Completamente deshabilitado
   - Imágenes se guardan como base64 en Redis/memoria
   - Sin dependencias externas

3. **✅ Migraciones**: Salteadas en Vercel build
   - Connection pooler (port 6543) NO soporta migraciones
   - Build ya no hace timeout

### Verificar en Logs de Vercel

Busca estos mensajes en los logs:

```
✅ Found card in database with score: X
📊 Card data from DB: { degenScore: X, totalTrades: Y, ... }
🎨 Generating BASIC card with metrics: {...}
📊 Safe metrics: {...}
```

Si ves esto, significa que los datos SÍ están llegando. Solo hay que limpiar el caché.

## 🚨 Si sigue sin funcionar

### Opción A: Verificar que los datos existen en BD

```sql
SELECT * FROM "DegenCard" WHERE "walletAddress" = 'tu_wallet';
```

### Opción B: Revisar logs de Vercel

1. Ve a: https://vercel.com/tu-proyecto/logs
2. Busca errores al llamar `/api/generate-card`
3. Verifica que el mensaje "🎨 Using system fonts" aparece

### Opción C: Regenerar los datos de la wallet

```bash
POST https://tu-app.vercel.app/api/save-card
Body: { "walletAddress": "tu_wallet_aqui" }
```

Luego limpia caché y regenera.

## 📝 Endpoints Útiles

| Endpoint                          | Método | Descripción                              |
| --------------------------------- | ------ | ---------------------------------------- |
| `/api/save-card`                  | POST   | Analiza wallet y guarda métricas en BD   |
| `/api/generate-card`              | POST   | Genera imagen PNG de la tarjeta          |
| `/api/generate-card?nocache=true` | POST   | Fuerza regeneración sin caché            |
| `/api/clear-card-cache`           | POST   | Limpia TODO el caché de tarjetas         |
| `/api/test-card`                  | GET    | Genera tarjeta de prueba con datos dummy |

## 🎯 Resumen

1. **El código está arreglado** ✅
2. **Las fonts funcionan** ✅
3. **Solo falta limpiar caché** ⏳

Una vez hagas merge de este PR y limpies el caché, todo debería funcionar perfectamente.

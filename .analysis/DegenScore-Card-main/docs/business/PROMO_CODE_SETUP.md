# 🎟️ Promo Code Setup Guide

## Error que estabas viendo:

```
"You have already used this promo code"
```

Pero el código NO existía en la base de datos.

## ✅ Problema RESUELTO

He reescrito completamente el sistema de promo codes con:

1. **Pre-validación antes de la transacción** - Ahora el código verifica si el promo code existe ANTES de intentar usarlo
2. **Mensajes de error específicos** - Cada error tiene su propio código y mensaje claro
3. **Logging detallado** - Todos los pasos quedan registrados para debugging
4. **Protección contra race conditions** - Usa transacciones serializables
5. **Validaciones de seguridad** - Sanitización de inputs, validación de wallet, etc.

## 📋 Cómo Crear el Promo Code

### Paso 1: Asegúrate de tener DATABASE_URL configurado

En tu `.env`:

```bash
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
```

### Paso 2: Ejecuta el script

```bash
npx ts-node scripts/create-promo-code.ts
```

Este script:

- ✅ Crea el código `DEGENLAUNCH2024`
- ✅ Lo configura con 100 usos máximos
- ✅ Lo activa automáticamente
- ✅ No tiene fecha de expiración

### Paso 3: Verifica que se creó

```bash
# Usando Prisma Studio
npx prisma studio

# O directamente en la base de datos
psql $DATABASE_URL -c "SELECT * FROM \"PromoCode\" WHERE code = 'DEGENLAUNCH2024';"
```

## 🔍 Nuevos Códigos de Error

El nuevo sistema devuelve códigos de error específicos:

| Código                | Significado                             | Solución                                   |
| --------------------- | --------------------------------------- | ------------------------------------------ |
| `PROMO_NOT_FOUND`     | El código no existe en la base de datos | Ejecuta el script para crearlo             |
| `PROMO_INACTIVE`      | El código está desactivado              | Reactiva el código en la DB                |
| `PROMO_EXPIRED`       | El código expiró                        | Actualiza la fecha de expiración           |
| `PROMO_LIMIT_REACHED` | Se alcanzó el límite de usos            | Aumenta `maxUses` en la DB                 |
| `PROMO_ALREADY_USED`  | El usuario ya usó este código           | El usuario debe esperar o usar otro código |
| `CARD_NOT_FOUND`      | La card no existe                       | El usuario debe generar su card primero    |
| `CARD_DELETED`        | La card fue eliminada                   | Restaurar la card o crear una nueva        |
| `ALREADY_PREMIUM`     | La card ya es premium                   | No necesita promo code                     |

## 🧪 Cómo Probar

### Test 1: Código NO existe (debería dar error específico)

```bash
curl -X POST http://localhost:3000/api/apply-promo-code \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "TuWalletAqui",
    "promoCode": "CODIGO_FALSO"
  }'

# Respuesta esperada:
# {
#   "error": "Invalid promo code",
#   "details": "This promo code does not exist. Please check the code and try again.",
#   "code": "PROMO_NOT_FOUND"
# }
```

### Test 2: Código existe y es válido (debería funcionar)

```bash
# Primero, asegúrate de crear el código
npx ts-node scripts/create-promo-code.ts

# Luego prueba aplicarlo
curl -X POST http://localhost:3000/api/apply-promo-code \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "TuWalletConCardCreada",
    "promoCode": "DEGENLAUNCH2024"
  }'

# Respuesta esperada:
# {
#   "success": true,
#   "message": "Launch Promotion - Free Premium Upgrade applied successfully! 🎉",
#   "data": {
#     "card": { ... },
#     "subscription": {
#       "tier": "PRO",
#       "expiresAt": "2025-12-18T...",
#       "daysRemaining": 30
#     }
#   }
# }
```

### Test 3: Usuario ya usó el código (error específico)

```bash
# Intenta usar el mismo código otra vez
curl -X POST http://localhost:3000/api/apply-promo-code \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "MismaWallet",
    "promoCode": "DEGENLAUNCH2024"
  }'

# Respuesta esperada:
# {
#   "error": "Already redeemed",
#   "details": "You have already used this promo code.",
#   "code": "PROMO_ALREADY_USED"
# }
```

## 🛠️ Troubleshooting

### Problema: "Promo code not found"

**Solución**: Ejecuta el script de creación

```bash
npx ts-node scripts/create-promo-code.ts
```

### Problema: "Card not found"

**Solución**: El usuario debe generar su card primero

```bash
# 1. Analizar wallet
POST /api/analyze
{ "walletAddress": "..." }

# 2. Guardar card
POST /api/save-card
{ "walletAddress": "...", "analysisData": {...} }

# 3. Ahora sí puede aplicar promo code
POST /api/apply-promo-code
{ "walletAddress": "...", "promoCode": "DEGENLAUNCH2024" }
```

### Problema: Database connection error

**Solución**: Verifica tu `DATABASE_URL` en `.env`

```bash
# Test de conexión
npx prisma db pull
```

### Problema: El script falla con errores de TypeScript

**Solución**: Instala dependencias

```bash
npm install -D ts-node @types/node
```

## 📊 Monitorear Uso de Promo Codes

### Ver todos los promo codes

```sql
SELECT
  code,
  description,
  "usedCount",
  "maxUses",
  "isActive",
  "expiresAt"
FROM "PromoCode"
ORDER BY "createdAt" DESC;
```

### Ver quién usó un promo code

```sql
SELECT
  pr."walletAddress",
  pr."createdAt",
  dc."displayName",
  dc."degenScore"
FROM "PromoRedemption" pr
JOIN "PromoCode" pc ON pr."promoCodeId" = pc.id
LEFT JOIN "DegenCard" dc ON pr."walletAddress" = dc."walletAddress"
WHERE pc.code = 'DEGENLAUNCH2024'
ORDER BY pr."createdAt" DESC;
```

### Resetear un promo code para un usuario

```sql
-- CUIDADO: Esto permite que el usuario use el código otra vez
DELETE FROM "PromoRedemption"
WHERE "walletAddress" = 'WalletDelUsuario'
  AND "promoCodeId" = (SELECT id FROM "PromoCode" WHERE code = 'DEGENLAUNCH2024');

-- También decrementa el contador de usos
UPDATE "PromoCode"
SET "usedCount" = "usedCount" - 1
WHERE code = 'DEGENLAUNCH2024';
```

## 🚀 Crear Nuevos Promo Codes

Edita `scripts/create-promo-code.ts` y cambia los valores:

```typescript
const promoCode = await prisma.promoCode.upsert({
  where: { code: 'MI_NUEVO_CODIGO' },
  update: { isActive: true },
  create: {
    code: 'MI_NUEVO_CODIGO',
    description: '🎁 Descripción del código',
    maxUses: 50, // 0 = ilimitado
    usedCount: 0,
    isActive: true,
    expiresAt: new Date('2025-12-31'), // null = nunca expira
  },
});
```

Luego ejecuta:

```bash
npx ts-node scripts/create-promo-code.ts
```

## 📝 Logs Detallados

El nuevo sistema registra TODO:

```javascript
// ✅ Ahora verás logs como:
🎟️ Processing promo code application {
  walletAddress: "ABC...",
  promoCode: "DEGENLAUNCH2024",
  timestamp: "2025-11-18T..."
}

⚠️ Promo code not found {
  code: "DEGENLAUNCH2024",
  walletAddress: "ABC...",
  timestamp: "2025-11-18T..."
}

✅ All pre-validations passed, starting transaction {
  walletAddress: "ABC...",
  promoCode: "DEGENLAUNCH2024",
  cardScore: 85
}

✅ Redemption record created {
  redemptionId: "clx...",
  walletAddress: "ABC...",
  promoCode: "DEGENLAUNCH2024"
}

✅ Card upgraded to premium {
  cardId: "clx...",
  walletAddress: "ABC...",
  degenScore: 85
}

🎉 Promo code application completed successfully {
  walletAddress: "ABC...",
  promoCode: "DEGENLAUNCH2024",
  newTier: "PRO",
  expiresAt: "2025-12-18T..."
}
```

---

## ✅ Resumen

1. **El bug está arreglado** - Ahora el código verifica correctamente si el promo existe
2. **Mensajes de error claros** - Cada error tiene su código específico
3. **Logging completo** - Puedes ver exactamente qué está pasando
4. **Protección robusta** - Validaciones de seguridad y manejo de race conditions
5. **Fácil de usar** - Un script simple para crear promo codes

**El código ahora es de nivel mundial** 🌍🚀

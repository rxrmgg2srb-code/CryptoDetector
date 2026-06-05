# 🚀 Guía de Implementación - Sistema de Métricas Avanzado

## 📋 Resumen de Mejoras

### ❌ Problemas del Sistema Anterior:

1. Solo analizaba las últimas 100 transacciones
2. P&L aproximado sin precios reales
3. No detectaba rugs
4. No identificaba moonshots
5. Win rate inexacto
6. No analizaba patrones de trading

### ✅ Soluciones Implementadas:

1. Analiza TODAS las transacciones históricas (hasta 5000)
2. P&L real por posición individual
3. Detección automática de rugs y salvadas
4. Tracking de moonshots (trades con >10x)
5. Win rate preciso basado en posiciones cerradas
6. Análisis completo de estilo de trading

---

## 📁 Archivos Proporcionados

```
/mnt/user-data/outputs/
├── metrics-advanced.ts           # Sistema completo de análisis
├── badges-advanced.ts            # 50+ badges con nuevas categorías
├── helius-updated.ts             # Helius con paginación
├── save-card-advanced.ts         # API endpoint actualizado
├── schema-advanced.prisma        # Schema de BD con nuevos campos
├── METRICAS_AVANZADAS_EXPLICACION.md  # Documentación técnica
└── PLAN_IMPLEMENTACION.md        # Plan del modelo freemium
```

---

## 🔧 Pasos de Implementación

### PASO 1: Backup de tu Código Actual ⚠️

```bash
# Crear backup antes de hacer cambios
cd /ruta/a/tu/proyecto
cp -r lib lib_backup
cp -r pages/api pages_api_backup
cp prisma/schema.prisma prisma/schema.prisma.backup
```

---

### PASO 2: Actualizar Archivos de Lógica

#### 2.1. Reemplazar/Agregar archivos en `/lib`:

```bash
# Opción A: Agregar nuevos archivos (recomendado para empezar)
# Esto te permite probar sin romper nada

cp metrics-advanced.ts /ruta/a/tu/proyecto/lib/
cp badges-advanced.ts /ruta/a/tu/proyecto/lib/

# Opción B: Reemplazar archivos existentes
# Solo hazlo cuando estés seguro que funciona

cp helius-updated.ts /ruta/a/tu/proyecto/lib/helius.ts
```

#### 2.2. Estructura final de `/lib`:

```
lib/
├── helius.ts                 (ACTUALIZADO - con paginación)
├── metrics.ts                (ANTIGUO - puedes dejarlo por si acaso)
├── metrics-advanced.ts       (NUEVO - sistema mejorado)
├── badges.ts                 (ANTIGUO - puedes dejarlo por si acaso)
└── badges-advanced.ts        (NUEVO - badges mejorados)
```

---

### PASO 3: Actualizar Base de Datos

#### 3.1. Agregar nuevos campos al schema:

```bash
# Editar prisma/schema.prisma y agregar estos campos a DegenCard:

model DegenCard {
  # ... campos existentes ...

  # AGREGAR ESTOS:
  rugsSurvived      Int      @default(0)
  rugsCaught        Int      @default(0)
  totalRugValue     Float    @default(0)
  moonshots         Int      @default(0)
  quickFlips        Int      @default(0)
  diamondHands      Int      @default(0)
  avgHoldTime       Float    @default(0)
  longestWinStreak  Int      @default(0)
  longestLossStreak Int      @default(0)
  volatilityScore   Float    @default(0)
  realizedPnL       Float    @default(0)
  unrealizedPnL     Float    @default(0)
  firstTradeDate    DateTime?
}
```

#### 3.2. Crear y aplicar migración:

```bash
cd /ruta/a/tu/proyecto

# Generar migración
npx prisma migrate dev --name add_advanced_metrics

# Si te pregunta si quieres resetear la BD, di NO (a menos que sea dev)
# Los valores default (0) se aplicarán a registros existentes

# Generar cliente actualizado
npx prisma generate
```

---

### PASO 4: Actualizar API Endpoint

#### 4.1. Actualizar `pages/api/save-card.ts`:

```typescript
// ANTES:
import { calculateMetrics } from '../../lib/metrics';
import { calculateUnlockedBadges } from '../../lib/badges';

const transactions = await getWalletTransactions(walletAddress, 100);
const metrics = calculateMetrics(transactions);

// DESPUÉS:
import { calculateAdvancedMetrics } from '../../lib/metrics-advanced';
import { calculateUnlockedBadges } from '../../lib/badges-advanced';

const metrics = await calculateAdvancedMetrics(walletAddress);
// Ya no necesitas pasar transactions, lo hace internamente
```

#### 4.2. Actualizar el upsert para incluir nuevos campos:

```typescript
const card = await prisma.degenCard.upsert({
  where: { walletAddress },
  update: {
    // ... campos básicos existentes ...

    // AGREGAR:
    rugsSurvived: metrics.rugsSurvived,
    rugsCaught: metrics.rugsCaught,
    totalRugValue: metrics.totalRugValue,
    moonshots: metrics.moonshots,
    quickFlips: metrics.quickFlips,
    diamondHands: metrics.diamondHands,
    avgHoldTime: metrics.avgHoldTime,
    longestWinStreak: metrics.longestWinStreak,
    longestLossStreak: metrics.longestLossStreak,
    volatilityScore: metrics.volatilityScore,
    realizedPnL: metrics.realizedPnL,
    unrealizedPnL: metrics.unrealizedPnL,
    firstTradeDate: new Date(metrics.firstTradeDate * 1000),
  },
  create: {
    // ... mismo que update ...
  },
});
```

**Referencia completa:** Ver `save-card-advanced.ts`

---

### PASO 5: Testing

#### 5.1. Probar con una wallet conocida:

```bash
# Ejecutar en desarrollo
npm run dev

# Probar el endpoint
curl -X POST http://localhost:3000/api/save-card \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "TU_WALLET_DE_PRUEBA"}'
```

#### 5.2. Verificar en Prisma Studio:

```bash
npx prisma studio
# Abrir http://localhost:5555
# Ver tabla DegenCard
# Verificar que los nuevos campos tienen valores
```

#### 5.3. Wallets de prueba recomendadas:

```typescript
// Wallets con diferentes perfiles para testing:

const testWallets = {
  highVolume: 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1',
  rugSurvivor: 'WALLET_QUE_SOBREVIVIO_RUGS',
  moonshooter: 'WALLET_CON_10X_TRADES',
  scalper: 'WALLET_CON_QUICK_FLIPS',
  holder: 'WALLET_CON_DIAMOND_HANDS',
};
```

---

### PASO 6: Actualizar UI (Opcional pero Recomendado)

#### 6.1. Mostrar nuevas métricas en el perfil:

```typescript
// pages/profile/[address].tsx

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* Métricas existentes */}
  <StatCard label="Degen Score" value={card.degenScore} />
  <StatCard label="Total Trades" value={card.totalTrades} />

  {/* NUEVAS métricas */}
  <StatCard
    label="Rugs Survived"
    value={card.rugsSurvived}
    icon="🛡️"
    positive
  />
  <StatCard
    label="Rugs Caught"
    value={card.rugsCaught}
    icon="💸"
    negative
  />
  <StatCard
    label="Moonshots"
    value={card.moonshots}
    icon="🚀"
    positive
  />
  <StatCard
    label="Win Streak"
    value={card.longestWinStreak}
    icon="🔥"
  />
</div>

{/* Sección de Trading Style */}
<div className="mt-8 p-6 bg-purple-500/10 rounded-lg">
  <h3 className="text-xl font-bold mb-4">Trading Style</h3>
  <div className="space-y-2">
    <p>Quick Flips: ⚡ {card.quickFlips}</p>
    <p>Diamond Hands: 💎 {card.diamondHands}</p>
    <p>Avg Hold Time: {card.avgHoldTime.toFixed(1)} hours</p>
    <p>Style: {getTradingStyle(card)}</p>
  </div>
</div>
```

#### 6.2. Actualizar el leaderboard con nuevas columnas:

```typescript
// pages/leaderboard.tsx

<table>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Wallet</th>
      <th>Score</th>
      {/* NUEVAS columnas */}
      <th>🛡️ Rugs Survived</th>
      <th>🚀 Moonshots</th>
      <th>🔥 Streak</th>
    </tr>
  </thead>
  <tbody>
    {entries.map(entry => (
      <tr>
        {/* ... columnas existentes ... */}
        <td>{entry.rugsSurvived}</td>
        <td>{entry.moonshots}</td>
        <td>{entry.longestWinStreak}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 🎯 Checklist de Implementación

### Fase 1: Backend (Crítico)

- [ ] Copiar `metrics-advanced.ts` a `/lib`
- [ ] Copiar `badges-advanced.ts` a `/lib`
- [ ] Actualizar `helius.ts` con paginación
- [ ] Actualizar schema de Prisma
- [ ] Crear y aplicar migración
- [ ] Actualizar `save-card.ts` para usar nuevas métricas
- [ ] Testing con wallets de prueba

### Fase 2: UI (Recomendado)

- [ ] Actualizar página de perfil con nuevas métricas
- [ ] Agregar sección de "Rug Analysis"
- [ ] Agregar sección de "Trading Style"
- [ ] Mostrar moonshots destacados
- [ ] Actualizar leaderboard con nuevas columnas

### Fase 3: Optimización (Opcional)

- [ ] Implementar cache de métricas (solo recalcular cada 24h)
- [ ] Agregar progress indicator durante análisis
- [ ] Crear tabla MetricsHistory para tracking temporal
- [ ] Implementar gráficas de progreso

---

## ⚠️ Consideraciones Importantes

### 1. Performance

```typescript
// El análisis puede tomar 5-10 segundos para wallets con muchas TXs
// Considera agregar un loading state en el frontend:

const [analyzing, setAnalyzing] = useState(false);
const [progress, setProgress] = useState('');

if (analyzing) {
  return (
    <div className="text-center">
      <Spinner />
      <p>{progress}</p>
    </div>
  );
}
```

### 2. Rate Limits de Helius

```typescript
// Si tienes muchos usuarios generando cards simultáneamente
// considera implementar una cola:

import Bull from 'bull';

const analysisQueue = new Bull('card-analysis', {
  redis: process.env.REDIS_URL,
});

analysisQueue.process(async (job) => {
  const { walletAddress } = job.data;
  return await calculateAdvancedMetrics(walletAddress);
});
```

### 3. Caching Recomendado

```typescript
// En save-card.ts, agregar lógica de cache:

const existingCard = await prisma.degenCard.findUnique({
  where: { walletAddress },
});

const shouldRecalculate = !existingCard || Date.now() - existingCard.updatedAt.getTime() > 86400000; // 24 horas

if (!shouldRecalculate) {
  return res.json({
    success: true,
    card: existingCard,
    cached: true,
  });
}

// Solo si necesita recalcular:
const metrics = await calculateAdvancedMetrics(walletAddress);
```

---

## 🐛 Troubleshooting

### Error: "HELIUS_API_KEY is not configured"

```bash
# Verificar .env
cat .env | grep HELIUS

# Si no existe, agregar:
echo "HELIUS_API_KEY=tu_api_key_aqui" >> .env
```

### Error: "Column does not exist"

```bash
# Significa que la migración no se aplicó correctamente
npx prisma migrate reset  # ⚠️ Borra datos
# O
npx prisma migrate deploy  # Aplica migraciones pendientes
```

### Error: "Module not found: metrics-advanced"

```bash
# Verificar que el archivo está en la ubicación correcta
ls lib/metrics-advanced.ts

# Si no existe, copiarlo:
cp /path/to/downloaded/metrics-advanced.ts lib/
```

### Análisis muy lento (>30 segundos)

```typescript
// Reducir el límite de transacciones en metrics-advanced.ts:
const maxFetches = 20; // Cambia de 50 a 20
// Esto analiza hasta 2000 TXs en lugar de 5000
```

---

## 📊 Resultados Esperados

Después de implementar todo, deberías ver:

### En la Card:

```
┌─────────────────────────────┐
│   DEGEN CARD                │
│   addr...xyz  Level 18      │
├─────────────────────────────┤
│          [87]               │
│      DEGEN SCORE            │
├─────────────────────────────┤
│  🛡️ Rugs: 7 survived       │  ← NUEVO
│  💸 Caught: 2 times         │  ← NUEVO
│  🚀 Moonshots: 4            │  ← NUEVO
│  🔥 Streak: 13 wins         │  ← NUEVO
│  ⚡ Style: Quick Flipper    │  ← NUEVO
└─────────────────────────────┘
```

### En el Perfil:

- Sección de "Rug Analysis" con detalles
- Sección de "Trading Style" con métricas
- Lista de moonshots destacados
- Recomendaciones personalizadas

### En la Base de Datos:

```sql
SELECT
  walletAddress,
  degenScore,
  rugsSurvived,
  moonshots,
  longestWinStreak
FROM DegenCard
ORDER BY degenScore DESC
LIMIT 10;
```

---

## 🚀 Próximos Pasos (Opcional)

### 1. Gráficas de Progreso Temporal

```typescript
// Guardar snapshots diarios de métricas
await prisma.metricsHistory.create({
  data: {
    walletAddress,
    degenScore: metrics.degenScore,
    totalTrades: metrics.totalTrades,
    // ...
    snapshotDate: new Date(),
  }
});

// Luego mostrar en un gráfico con Recharts
<LineChart data={history}>
  <Line dataKey="degenScore" stroke="#00d4ff" />
  <Line dataKey="profitLoss" stroke="#00ff88" />
</LineChart>
```

### 2. Comparación entre Traders

```typescript
// Endpoint para comparar dos wallets
GET /api/compare?wallet1=XXX&wallet2=YYY

// Retorna:
{
  wallet1: { metrics, badges },
  wallet2: { metrics, badges },
  comparison: {
    scoreWinner: 'wallet1',
    rugsWinner: 'wallet2',
    // ...
  }
}
```

### 3. Achievements System

```typescript
// Notificar cuando se desbloquean nuevos badges
const newBadges = unlockedBadges.filter(
  (badge) => !existingCard.badges.some((b) => b.name === badge.name)
);

if (newBadges.length > 0) {
  // Enviar notificación
  await sendNotification(walletAddress, {
    type: 'NEW_BADGE',
    badges: newBadges,
  });
}
```

---

## 💬 Soporte

Si encuentras problemas durante la implementación:

1. Revisa los logs de la consola
2. Verifica que todas las dependencias están instaladas
3. Comprueba que la migración de BD se aplicó correctamente
4. Prueba con wallets conocidas primero
5. Revisa la documentación técnica en `METRICAS_AVANZADAS_EXPLICACION.md`

---

## ✅ Validación Final

Para confirmar que todo funciona correctamente:

```bash
# 1. Verificar que el endpoint responde
curl -X POST http://localhost:3000/api/save-card \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "TEST_WALLET"}' \
  | jq '.metrics'

# Deberías ver:
{
  "degenScore": 75,
  "rugsSurvived": 3,
  "rugsCaught": 1,
  "moonshots": 2,
  "quickFlips": 45,
  ...
}

# 2. Verificar en Prisma Studio
npx prisma studio
# Abrir DegenCard table
# Verificar que nuevos campos tienen valores

# 3. Probar el frontend
# Abrir http://localhost:3000
# Generar una card
# Verificar que muestra las nuevas métricas
```

---

¡Ya está! Ahora tienes un sistema de análisis de trading mucho más completo y preciso. 🎉

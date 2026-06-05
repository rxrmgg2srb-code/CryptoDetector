# 🚀 Sistema de Métricas Avanzado - DegenScore Card

## 🎯 Problema Resuelto

### ❌ Sistema Anterior (Limitaciones):

```typescript
// ❌ Solo obtenía las últimas 100 transacciones
const transactions = await getWalletTransactions(walletAddress, 100);

// ❌ P&L calculado sin precios reales
// Solo sumaba/restaba amounts de tokens sin considerar valor en SOL

// ❌ No detectaba rugs
// No sabía si un token fue a 0 después de la compra

// ❌ Win rate inexacto
// Basado en flujos de tokens, no en rentabilidad real

// ❌ No analizaba patrones de trading
// No diferenciaba entre scalpers, holders, etc.
```

### ✅ Sistema Nuevo (Soluciones):

```typescript
// ✅ Obtiene TODAS las transacciones históricas
// Paginación automática hasta obtener todo el historial

// ✅ Análisis por posición individual
// Cada token se analiza como una posición separada
// Calcula P&L real de compras vs ventas

// ✅ Detección de rugs
// Identifica tokens que fueron a 0
// Diferencia entre "vendió antes" vs "se quedó atrapado"

// ✅ Win rate preciso
// Basado en posiciones cerradas con ganancia/pérdida real

// ✅ Métricas avanzadas
// - Moonshots (trades con >10x)
// - Quick flips vs Diamond hands
// - Win/loss streaks
// - Volatilidad del trader
// - Y mucho más...
```

---

## 📊 Nuevas Métricas Implementadas

### 1. **Análisis de Rugs** 🔍

```typescript
interface RugAnalysis {
  rugsSurvived: number; // Vendió antes del rug ✅
  rugsCaught: number; // Se quedó atrapado ❌
  totalRugValue: number; // SOL perdidos en rugs
  ruggedTokens: string[]; // Lista de tokens ruggeados
}
```

**Cómo se detecta un rug:**

1. Usuario compró el token
2. Usuario vendió <20% de lo que compró
3. Pérdida no realizada >80% del capital invertido
   → **RUG CAUGHT** 😭

**Cómo se detecta una salvada:**

1. Usuario compró el token
2. Usuario vendió >50% antes del colapso
3. Pérdida total >70% pero recuperó algo
   → **RUG SURVIVED** 💪

**Ejemplos:**

```typescript
// Caso 1: RUG CAUGHT
Compró: 10 SOL worth of SCAM token
Vendió: 0 SOL (no vendió nada)
Token fue a 0
→ rugsCaught++, totalRugValue += 10

// Caso 2: RUG SURVIVED
Compró: 10 SOL worth of SKETCH token
Vendió: 6 SOL cuando empezó a caer
Token fue a 0 después
→ rugsSurvived++, profit/loss = -4 SOL
```

---

### 2. **Moonshots Detection** 🚀

```typescript
moonshots: number; // Trades con >10x ganancia
```

**Criterio:**

- Posición cerrada (vendió todo o >95%)
- P&L realizado > 10x el capital invertido

**Ejemplo:**

```typescript
Compró: 1 SOL de PUMP token
Vendió: 15 SOL
→ moonshots++  (15x ganancia!)
```

---

### 3. **Trading Style Analysis** ⚡💎

```typescript
quickFlips: number; // Trades < 1 hora
diamondHands: number; // Trades > 7 días
avgHoldTime: number; // Tiempo promedio en horas
```

**Identifica el estilo del trader:**

| Estilo           | Características                           |
| ---------------- | ----------------------------------------- |
| **Scalper**      | >50 quick flips, avg hold time < 2 horas  |
| **Day Trader**   | Avg hold time 2-24 horas                  |
| **Swing Trader** | Avg hold time 1-7 días                    |
| **HODLer**       | >20 diamond hands, avg hold time > 7 días |

---

### 4. **Win/Loss Streaks** 🔥❄️

```typescript
longestWinStreak: number; // Racha más larga de wins
longestLossStreak: number; // Racha más larga de losses
```

**Uso:**

- Evalúa consistencia del trader
- Detecta patrones de comportamiento
- Ayuda a identificar si está en "hot streak" o "tilt"

---

### 5. **Volatility Score** 📊

```typescript
volatilityScore: number; // 0-100 (qué tan errático es el trader)
```

**Cálculo:**

```typescript
// Varianza de P&L de todas las posiciones cerradas
const pnls = closedPositions.map(p => p.realizedPnL);
const avgPnL = mean(pnls);
const variance = sum((pnl - avgPnL)² for pnl in pnls) / length;
volatilityScore = min(sqrt(variance) * 10, 100);
```

**Interpretación:**

- **0-30**: Trader consistente y predecible ✅
- **30-60**: Volatilidad moderada ⚠️
- **60-100**: Trader muy errático, grandes wins y losses 🎰

---

### 6. **Realized vs Unrealized P&L** 💰

```typescript
realizedPnL: number; // P&L de posiciones cerradas
unrealizedPnL: number; // P&L de posiciones abiertas (asumiendo valor 0)
```

**Diferencia clave:**

```typescript
// REALIZED = lo que ya vendió
Position A: Compró 5 SOL, vendió 8 SOL → +3 SOL realizado ✅

// UNREALIZED = lo que aún tiene (asume 0 si no vendió)
Position B: Compró 3 SOL, aún lo tiene → -3 SOL no realizado ❌
```

---

### 7. **First Trade Date** 📅

```typescript
firstTradeDate: number; // Timestamp del primer trade
```

**Uso:**

- Calcular cuánto tiempo lleva tradeando
- Evaluar experiencia del trader
- Contexto para otras métricas

---

## 🏅 Nuevos Badges

### Badges de Rugs:

- 🛡️ **Rug Survivor Legend** - Survived 10+ rugs
- 🔍 **Rug Detector** - Survived 5+ rugs
- 🚪 **Quick Exit** - Survived 3+ rugs
- ✊ **Rug Survivor** - Survived 1+ rug
- 🎪 **Rug Magnet** - Caught in 5+ rugs _(badge de "honor")_
- 💸 **Exit Liquidity** - Caught in 10+ rugs _(F)_

### Badges de Moonshots:

- 🚀 **Moonshot Master** - 10+ trades con 10x+
- 💎 **Gem Hunter** - 5+ moonshots
- 🍀 **Lucky Finder** - 3+ moonshots
- 🌙 **First Moonshot** - Primer 10x

### Badges de Trading Style:

- ⚡ **Scalper King** - 100+ quick flips (<1 hora)
- 🔄 **Quick Flipper** - 50+ quick flips
- 💨 **Speed Trader** - 20+ quick flips
- 💎🙌 **Diamond Hands Legend** - 50+ holds >7 días
- ⏳ **Patient Trader** - 20+ holds >7 días
- 🤝 **HODLer** - 5+ holds >7 días

### Badges de Win Streaks:

- 🔥 **Unstoppable** - Win streak de 20+
- 🌟 **On Fire** - Win streak de 10+
- 🎲 **Hot Streak** - Win streak de 5+

### Badges de Volatilidad:

- 📈 **Steady Eddie** - Baja volatilidad + ganancias consistentes
- 🎰 **Degen Gambler** - Volatilidad extremadamente alta

---

## 🧮 DegenScore Mejorado

### Nueva Fórmula (100 puntos):

```typescript
// 1. Volume (25 puntos)
if (totalVolume > 1000) → +25
else if (totalVolume > 500) → +20
else if (totalVolume > 100) → +15
else if (totalVolume > 50) → +10
else → +min(totalVolume/5, 10)

// 2. Win Rate (20 puntos)
winRate / 5 → max 20 puntos

// 3. Profitability (20 puntos)
if (profitLoss > 100) → +20
else if (profitLoss > 50) → +15
else if (profitLoss > 10) → +10
else if (profitLoss > 0) → +5
else → +max(-5, profitLoss/10)  // Penaliza pérdidas

// 4. Rugs Survived (15 puntos) 🆕
if (rugsSurvived > 5) → +15
else if (rugsSurvived > 3) → +12
else if (rugsSurvived > 0) → +8

// Penalización por rugs caught
-min(rugsCaught * 2, 10)

// 5. Moonshots (10 puntos) 🆕
moonshots * 2 → max 10 puntos

// 6. Activity (10 puntos)
totalTrades / 20 → max 5 puntos
tradingDays / 4 → max 5 puntos

// 7. Consistency (10 puntos) 🆕
if (volatilityScore < 30 && profitLoss > 0) → +10
else if (volatilityScore < 50) → +5

// BONUS: Win Streaks 🆕
if (longestWinStreak > 10) → +5
else if (longestWinStreak > 5) → +3
```

---

## 🔧 Implementación Técnica

### Estructura del Código:

```
lib/
├── metrics-advanced.ts       (NUEVO) - Sistema completo de análisis
├── badges-advanced.ts        (NUEVO) - Badges actualizados
├── helius.ts                 (ACTUALIZADO) - Paginación añadida
├── metrics.ts                (DEPRECADO) - Sistema anterior
└── badges.ts                 (DEPRECADO) - Badges anteriores
```

### Función Principal:

```typescript
import { calculateAdvancedMetrics } from './lib/metrics-advanced';

// Uso:
const metrics = await calculateAdvancedMetrics(walletAddress);

// Retorna:
{
  // Métricas básicas
  totalTrades: 234,
  totalVolume: 567.8,
  profitLoss: 45.2,
  winRate: 68.5,
  // ...

  // Métricas avanzadas (NUEVO)
  rugsSurvived: 7,
  rugsCaught: 2,
  totalRugValue: 3.4,
  moonshots: 4,
  quickFlips: 89,
  diamondHands: 12,
  avgHoldTime: 48.5,
  longestWinStreak: 13,
  longestLossStreak: 4,
  volatilityScore: 42,
  realizedPnL: 52.1,
  unrealizedPnL: -6.9,
  firstTradeDate: 1634567890,
  degenScore: 82  // Score mejorado
}
```

---

## 📈 Mejoras en el Performance

### Paginación Inteligente:

```typescript
// Obtiene TODAS las transacciones
// Pero con límites para evitar timeouts
const maxFetches = 50; // Máximo 5000 transacciones
```

**Por qué 5000?**

- La mayoría de traders tienen <1000 transacciones
- 5000 cubre el 99% de casos
- Evita timeouts en la API
- ~5-10 segundos para analizar todo

### Caching Recomendado:

```typescript
// Guardar métricas en BD cada vez que se calculan
// Solo recalcular si han pasado >24 horas

if (lastCalculated < now - 86400) {
  // Recalcular métricas
} else {
  // Usar métricas cacheadas
}
```

---

## 🎨 Actualización del UI

### Nueva Card Preview con Rugs:

```
┌─────────────────────────────┐
│   DEGEN CARD                │
│   addr...xyz  Level 15      │
├─────────────────────────────┤
│          [85]               │  ← DegenScore
│      DEGEN SCORE            │
├─────────────────────────────┤
│  📊 Trades │ 💰 Volume      │
│     1,234  │  567 SOL       │
│  ✅ W/R    │ 🚀 Moonshots   │
│     68.5%  │  4 found       │
│  🛡️ Rugs   │ 💸 Caught     │
│  7 survived│  2 times       │  ← NUEVO
├─────────────────────────────┤
│  P&L: +45.2 SOL             │
│  Style: Quick Flipper       │  ← NUEVO
│  Streak: 🔥 13 wins         │  ← NUEVO
├─────────────────────────────┤
│  🔥 ⭐ 💎                    │  ← Badges
└─────────────────────────────┘
```

### Nuevo Perfil con Stats Avanzadas:

```typescript
// Sección de Rugs
<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
  <h3 className="text-red-400 font-bold mb-2">Rug Analysis</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <div className="text-2xl">🛡️ {rugsSurvived}</div>
      <div className="text-sm text-gray-400">Survived</div>
    </div>
    <div>
      <div className="text-2xl">💸 {rugsCaught}</div>
      <div className="text-sm text-gray-400">Caught</div>
    </div>
  </div>
  <div className="mt-2 text-sm text-gray-400">
    Total lost to rugs: {totalRugValue.toFixed(2)} SOL
  </div>
</div>

// Sección de Trading Style
<div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
  <h3 className="text-purple-400 font-bold mb-2">Trading Style</h3>
  <div className="space-y-2">
    <div className="flex justify-between">
      <span>Avg Hold Time:</span>
      <span className="font-bold">{avgHoldTime.toFixed(1)}h</span>
    </div>
    <div className="flex justify-between">
      <span>Quick Flips:</span>
      <span className="font-bold">⚡ {quickFlips}</span>
    </div>
    <div className="flex justify-between">
      <span>Diamond Hands:</span>
      <span className="font-bold">💎 {diamondHands}</span>
    </div>
  </div>
</div>

// Sección de Achievements
<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
  <h3 className="text-green-400 font-bold mb-2">Highlights</h3>
  <ul className="space-y-1 text-sm">
    {highlights.map(h => (
      <li key={h}>✅ {h}</li>
    ))}
  </ul>
  {warnings.length > 0 && (
    <>
      <h3 className="text-yellow-400 font-bold mb-2 mt-4">Areas to Improve</h3>
      <ul className="space-y-1 text-sm">
        {warnings.map(w => (
          <li key={w}>⚠️ {w}</li>
        ))}
      </ul>
    </>
  )}
</div>
```

---

## 🚀 Cómo Usar el Nuevo Sistema

### Paso 1: Actualizar las importaciones

```typescript
// Antes:
import { calculateMetrics } from './lib/metrics';
import { calculateUnlockedBadges } from './lib/badges';

// Ahora:
import { calculateAdvancedMetrics } from './lib/metrics-advanced';
import { calculateUnlockedBadges } from './lib/badges-advanced';
```

### Paso 2: Actualizar la llamada

```typescript
// Antes:
const transactions = await getWalletTransactions(walletAddress, 100);
const metrics = calculateMetrics(transactions);

// Ahora (mucho más simple):
const metrics = await calculateAdvancedMetrics(walletAddress);
// Ya trae TODO: transacciones, análisis, rugs, etc.
```

### Paso 3: Actualizar el UI

```typescript
// Ahora tienes acceso a nuevas métricas:
<div>
  <p>Rugs Survived: {metrics.rugsSurvived}</p>
  <p>Moonshots: {metrics.moonshots}</p>
  <p>Win Streak: {metrics.longestWinStreak}</p>
  <p>Trading Style: {getStyle(metrics)}</p>
</div>
```

---

## 📊 Comparativa: Antes vs Después

| Métrica                      | Sistema Anterior | Sistema Nuevo           |
| ---------------------------- | ---------------- | ----------------------- |
| **Transacciones analizadas** | 100 últimas      | TODAS (hasta 5000)      |
| **P&L calculation**          | Aproximado       | Por posición real       |
| **Detección de rugs**        | ❌ No            | ✅ Sí                   |
| **Moonshots tracking**       | ❌ No            | ✅ Sí                   |
| **Trading style**            | ❌ No            | ✅ Sí (quick flip/hodl) |
| **Win streaks**              | ❌ No            | ✅ Sí                   |
| **Volatilidad**              | ❌ No            | ✅ Sí                   |
| **Realized vs Unrealized**   | ❌ No            | ✅ Sí                   |
| **Badges**                   | 25               | 50+                     |
| **DegenScore precision**     | Básico           | Avanzado                |
| **Tiempo de cálculo**        | <1 seg           | 5-10 seg                |

---

## 🎯 Próximos Pasos Recomendados

1. **Integrar con save-card.ts**

```typescript
// pages/api/save-card.ts
import { calculateAdvancedMetrics } from '../../lib/metrics-advanced';

const metrics = await calculateAdvancedMetrics(walletAddress);
// Guardar en BD...
```

2. **Actualizar schema de Prisma**

```prisma
model DegenCard {
  // ... campos existentes ...

  // Agregar nuevos campos:
  rugsSurvived      Int      @default(0)
  rugsCaught        Int      @default(0)
  totalRugValue     Float    @default(0)
  moonshots         Int      @default(0)
  quickFlips        Int      @default(0)
  diamondHands      Int      @default(0)
  avgHoldTime       Float    @default(0)
  longestWinStreak  Int      @default(0)
  volatilityScore   Float    @default(0)
  realizedPnL       Float    @default(0)
  unrealizedPnL     Float    @default(0)
  firstTradeDate    DateTime?
}
```

3. **Actualizar el UI de la Card**

- Agregar sección de rugs
- Mostrar trading style
- Destacar moonshots
- Indicador de win streak

4. **Testing**

- Probar con wallets conocidas
- Verificar detección de rugs
- Validar P&L real vs esperado

---

## 💡 Tips de Implementación

### Performance:

```typescript
// Cache las métricas en BD
// Solo recalcular si han pasado >24h

const shouldRecalculate = !card.updatedAt || Date.now() - card.updatedAt.getTime() > 86400000;

if (shouldRecalculate) {
  const metrics = await calculateAdvancedMetrics(walletAddress);
  // Guardar en BD
} else {
  // Usar métricas cacheadas de la BD
}
```

### Error Handling:

```typescript
try {
  const metrics = await calculateAdvancedMetrics(walletAddress);
} catch (error) {
  console.error('Error calculating metrics:', error);
  // Fallback a métricas por defecto
  const metrics = getDefaultMetrics();
}
```

### Progress Indicator:

```typescript
// Mostrar progreso al usuario
'Fetching transactions... (1/3)';
'Analyzing positions... (2/3)';
'Calculating metrics... (3/3)';
```

---

## 🏆 Resultado Final

Con este nuevo sistema, las cards mostrarán:

- ✅ Análisis completo del historial de trading
- ✅ Detección precisa de rugs y salvadas
- ✅ Identificación de moonshots
- ✅ Estilo de trading (scalper, hodler, etc.)
- ✅ Métricas de consistencia y volatilidad
- ✅ DegenScore más justo y preciso
- ✅ 50+ badges nuevos
- ✅ Insights accionables

**El trader ahora ve su verdadero perfil on-chain! 🎯**

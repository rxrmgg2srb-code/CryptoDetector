# 🎯 P&L 100% Real - Superar a GMGN/Axiom

## Estado Actual del metricsEngine

Tu motor actual es **sólido**, ya implementa:
- ✅ FIFO para calcular cost basis
- ✅ Cash Flow Method (SOL entrada vs salida)
- ✅ Detección de WSOL
- ✅ Filtrado de stablecoins
- ✅ Detección de rugs y moonshots

## 🚀 Mejoras para P&L 100% Preciso

### 1. **Precio Real en Tiempo de Ejecución** ⭐⭐⭐⭐⭐
**Problema**: Actualmente calculamos precio como `SOL/tokens`, pero esto incluye slippage y fees.

**Solución**: Usar el precio de mercado real en el momento del trade.

```typescript
// ANTES (tu código actual)
const pricePerToken = solAmount / tokenAmount;

// DESPUÉS (precio real)
// 1. Extraer el precio del pool directamente de los logs de la transacción
// 2. Usar Jupiter Price API como fallback
const realMarketPrice = await getHistoricalPrice(tokenMint, timestamp);
const executedPrice = solAmount / tokenAmount;
const slippage = (executedPrice - realMarketPrice) / realMarketPrice * 100;
```

### 2. **Incluir TODAS las Fees** ⭐⭐⭐⭐⭐
**Problema**: Solo cuentas `tx.fee`, pero faltan:
- DEX fees (0.25% Raydium, 0.3% Orca)
- Priority fees
- Swap routing fees

**Solución**:
```typescript
interface CompleteFees {
  networkFee: number;      // tx.fee
  dexFee: number;          // % del swap
  priorityFee: number;     // compute units
  routingFee: number;      // Jupiter routing
  totalFee: number;
}

function extractAllFees(tx: ParsedTransaction): CompleteFees {
  // Extract from innerInstructions and logs
}
```

### 3. **Unrealized P&L con Precios Actuales** ⭐⭐⭐⭐
**Problema**: `unrealizedPnL = 0` - no calculas posiciones abiertas.

**Solución**:
```typescript
async function calculateUnrealizedPnL(openPositions: Position[]): Promise<number> {
  let unrealized = 0;
  
  for (const pos of openPositions) {
    // Get current price from Jupiter/Birdeye
    const currentPrice = await getCurrentPrice(pos.tokenMint);
    const currentValue = pos.tokensBought * currentPrice;
    const costBasis = pos.buyAmount;
    unrealized += (currentValue - costBasis);
  }
  
  return unrealized;
}
```

### 4. **Manejo de Tokens con Decimales Raros** ⭐⭐⭐⭐
**Problema**: Algunos tokens tienen 6, 8, o 9 decimales en lugar de 9.

**Solución**:
```typescript
async function getNormalizedAmount(mint: string, rawAmount: number): Promise<number> {
  const decimals = await getTokenDecimals(mint); // Cache this
  return rawAmount / Math.pow(10, decimals);
}
```

### 5. **Detección de Airdrops vs Compras** ⭐⭐⭐
**Problema**: Tokens recibidos gratis (airdrops) aparecen como compras con cost basis = 0.

**Solución**:
```typescript
function isAirdropOrReward(tx: ParsedTransaction): boolean {
  // No hay SOL outflow pero sí token inflow
  // O viene de direcciones conocidas de airdrops
  return solNet === 0 && tokenNet > 0;
}
```

### 6. **Tracking de LP Positions** ⭐⭐⭐
**Problema**: Añadir/remover liquidez no se trackea correctamente.

**Solución**:
```typescript
interface LPPosition {
  poolAddress: string;
  token0: string;
  token1: string;
  lpTokensMinted: number;
  token0Deposited: number;
  token1Deposited: number;
  // ... fees earned, IL, etc.
}
```

### 7. **Consolidación de Múltiples Compras** ⭐⭐⭐
**Problema**: DCA o múltiples compras del mismo token no muestran avg entry.

**Solución**:
```typescript
interface ConsolidatedPosition {
  tokenMint: string;
  totalTokens: number;
  weightedAvgPrice: number;  // Promedio ponderado por cantidad
  totalCostBasis: number;
  trades: Trade[];  // Historial de todas las compras
}
```

---

## 📊 Comparación con Competidores

| Feature | DegenScore | GMGN | Axiom | Cielo |
|---------|------------|------|-------|-------|
| Realized P&L | ✅ | ✅ | ✅ | ✅ |
| Unrealized P&L | ❌ → ✅ | ✅ | ✅ | ❌ |
| Real Execution Price | ❌ → ✅ | ❌ | ✅ | ❌ |
| All Fees Included | ❌ → ✅ | ❌ | ❌ | ❌ |
| LP Tracking | ❌ → ✅ | ❌ | ❌ | ❌ |
| Historical Data | 12 meses | 30 días | 90 días | ∞ |
| DegenScore | ✅ | ❌ | ❌ | ❌ |

---

## 🔧 Implementación Prioritaria

### Fase 1 (Esta semana) - High Impact
1. **Unrealized P&L** - Añadir precios actuales para posiciones abiertas
2. **Todas las fees** - Extraer DEX fees de los logs

### Fase 2 (Siguiente semana)
3. **Weighted Average Entry** - Para DCA traders
4. **Airdrop detection** - Separar "compras" de rewards

### Fase 3 (Futuro)
5. **LP Position Tracking** - Para defi degens
6. **Cross-chain P&L** - Expandir a otras chains

---

## API de Precios Recomendadas

```typescript
// Birdeye (mejor para históricos)
const BIRDEYE_API = 'https://public-api.birdeye.so/defi/price';

// Jupiter (mejor para actuales)
const JUPITER_PRICE = 'https://price.jup.ag/v4/price';

// DexScreener (fallback gratuito)
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens/';
```

---

## Resultado Esperado

Con estas mejoras, DegenScore será:
- **El único** que muestra P&L REAL incluyendo todas las fees
- **El único** que muestra unrealized P&L actualizado
- **El único** que detecta airdrops vs compras reales
- **El único** con weighted average entry para DCA

**= Mejor que GMGN + Axiom combinados** 🏆

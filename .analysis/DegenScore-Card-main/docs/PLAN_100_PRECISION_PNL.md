# 🎯 Plan para alcanzar 100% Precisión en P&L

## Estado Actual (Sesión de Debugging 2025-12-03)

### ✅ Logros Conseguidos

#### 1. **Conteo Perfecto de Trades**
- **Compras**: 93/93 ✅ (100% accuracy)
- **Ventas**: 90/91 ⚠️ (98.9% accuracy - falta 1 venta)
- **Método**: Análisis exhaustivo de TODAS las transacciones (no solo SWAPS)

#### 2. **Clasificación Mejorada**
- ✅ Excluidas transacciones BURN (13 transacciones que no son ventas reales)
- ✅ Incluido 1 TRANSFER que era una compra legítima
- ✅ Mejorada detección buy/sell con tolerancia de 0.0001 SOL
- ✅ Inferencia de tipo cuando clasificación es ambigua

#### 3. **Extracción de Trades**
- **Extraction rate**: 54.0% (antes 33.7%)
- **Total trades**: 3,786 (antes 2,365)
- **Sanity checks rechazados**: 0 (antes 202)
- **Dust filtrado**: Threshold actualizado a 0.001 SOL

### ❌ Problemas Pendientes

#### 1. **Valores de Compras Subestimados** (Problema Principal)
```
Nuestro cálculo:  78.33 SOL ($10,387)
GMGN Real:        92.77 SOL ($12,300)
DIFERENCIA:      -14.44 SOL ($-1,915)  ← 15.5% error
```

**Análisis:**
- Conteo perfecto (93 compras encontradas)
- Pero el **valor total** está 15.5% bajo
- Compra promedio: 0.84 SOL/trade (parece correcto)  
- Esto sugiere que NO es un problema de conteo sino de **cálculo de valor**

#### 2. **Valores de Ventas GRAVEMENTE Subestimados** (Problema Crítico)
```
Nuestro cálculo:  21.56 SOL ($2,859)
GMGN Real:        93.04 SOL ($12,336)
DIFERENCIA:      -71.48 SOL ($-9,477)  ← 76.8% error
```

**Análisis:**
- Conteo casi perfecto (90/91 encontradas)
- Pero el **valor total** está 77% bajo
- Venta promedio: 0.24 SOL/trade ← DEMASIADO bajo
- **Conclusión**: Estamos capturando las ventas pero con valores incorrectos

#### 3. **P&L Resultante**
```
Nuestro:  -56.77 SOL  ← Completamente errado
Real:     +0.27 SOL   ← Casi break-even
```

## 🔬 Hipótesis sobre las Causas

### Hipótesis #1: Fees Incluidos en el Cálculo ✅ ⚠️
**Teoría:** Estamos restando fees del valor del trade cuando no deberíamos.

**Evidencia:**
- Compra de 2 SOL con fee de 0.01 SOL
- Nosotros: `solNet` = -2.01 SOL (incluye fee)
- GMGN: Probablemente cuenta solo 2 SOL (sin fee)

**Estado:** 
- ✅ Implementado intento de usar `accountData.nativeBalanceChange`
- ⚠️ Necesita validación - puede que `accountData` YA incluya fees

**Acción necesaria:**
1. Analizar transacciones reales para ver si `accountData` incluye/excluye fees
2. Comparar `solNet` (de nativeTransfers) vs `nativeBalanceChange` (de accountData)
3. Determinar cuál coincide mejor con GMGN

###Hipótesis #2: Multi-hop Swaps ⚠️
**Teoría:** Algunos swaps tienen múltiples legs (SOL → Token A → Token B) y estamos contando mal.

**Evidencia:**
- En swaps complejos, el `solNet` puede no reflejar el valor real del trade
- Jupiter frecuentemente hace routing multi-hop

**Acción necesaria:**
1. Identificar transacciones con múltiples token swaps
2. Verificar si estamos capturando el valor correcto

### Hipótesis #3: Slippage y MEV ⚠️
**Teoría:** El slippage y  MEV están afectando el `solNet` pero no deberían contarse como parte del costo del trade.

**Acción necesaria:**
1. Comparar precio esperado vs precio ejecutado
2. Ver si GMGN usa precio esperado (pre-slippage)

### Hipótesis #4: GMGN Usa Datos de DEX Directamente 🔍
**Teoría:** GMGN probablemente consulta directamente los contratos de los DEXes para obtener los valores exactos del swap.

**Evidencia:**
- Los valores de GMGN son muy consistentes
- Podría estar usando eventos de DEX en lugar de nativeTransfers

**Acción necesaria:**
1. Investigar eventos/logs de las transacciones SWAP
2. Ver si Helius provee swap amounts en algún campo especial
3. Considerar usar API de Jupiter/Raydium para validación cruzada

## 📋 Plan de Acción para 100% Precisión

### Fase 1: Validación de accountData ✅ (COMPLETADO)
- [x] Agregar `accountData` al tipo `ParsedTransaction`
- [x] Pasar `accountData` desde Helius
- [x] Usar `nativeBalanceChange` en `metricsEngine.ts`
- [ ] **VALIDAR**: Comparar resultados con/sin `accountData`

### Fase 2: Análisis Profundo de Transacciones (SIGUIENTE)
**Objetivo:** Entender EXACTAMENTE cómo GMGN calcula los valores

**Pasos:**
1. Tomar 10 transacciones de ejemplo (5 compras, 5 ventas)
2. Para cada una, obtener:
   - Signature
   - Valor que calculamos nosotros
   - Valor que reporta GMGN (si es posible obtenerlo)
   - `nativeTransfers` (suma)
   - `accountData.nativeBalanceChange`
   - Fees
   - Source DEX
3. Crear tabla comparativa
4. Identificar el patrón

**Script sugerido:** `scripts/compare-transaction-values.ts`

### Fase 3: Implementación de Fix Definitivo
Basado en los hallazgos de Fase 2:

#### Opción A: Usar accountData
Si `nativeBalanceChange` tiene los valores correctos:
```typescript
const solAmount = Math.abs(walletAccountData.nativeBalanceChange / 1e9);
```

#### Opción B: Excluir Fees Explícitamente  
Si los fees están incluidos en `solNet`:
```typescript
const feeAdjustment = (tx.feePayer === wallet) ? tx.fee / 1e9 : 0;
const solAmount = Math.abs(solNet) - feeAdjustment;
```

#### Opción C: Consultar Swap Events
Si necesitamos datos de DEX directamente:
```typescript
// Buscar en tx.instructions o tx.events
const swapEvent = findSwapEvent(tx);
const solAmount = swapEvent.amountIn / 1e9;
```

### Fase 4: Validación Cruzada
1. Ejecutar análisis 30 días con fix implementado
2. Comparar con GMGN
3. Si accuracy < 95%, volver a Fase 2

### Fase 5: Optimización y Documentación
1. Documentar la metodología final
2. Agregar tests unitarios para casos edge
3. Crear dashboard de validación

## 🎯 Criterios de Éxito

Para considerar el sistema **"100% realista y perfecto"**:

1. ✅ **Conteo de trades**: ±1 trade de diferencia (YA LOGRADO)
2. ❌ **Costo total**: ±2% de diferencia (actual: 15.5%)
3. ❌ **P&L**: ±5% de diferencia (actual: completamente errado)
4. ❌ **Win rate**: ±2% de diferencia (actual: 94% vs 44%)
5. ⚠️ **Fees**: ±10% de diferencia (actual: ~96% error)

## 📝 Notas Técnicas

### Datos Helius Disponibles
```typescript
interface HeliusTransaction {
  // ... otros campos
  accountData?: Array<{
    account: string;
    nativeBalanceChange: number;  ← Potencialmente MÁS preciso
    tokenBalanceChanges?: Array<...>;
  }>;
  // vs
  nativeTransfers?: Array<{
    amount: number;  ← Suma manual, puede estar mal
  }>
}
```

### Observaciones del Usuario
El usuario mencionó un token específico:
- Token: `HJBoRECiJddTZQZpuY8pHenf5CZ2yjju4npekmvbpump`
- ROI real primera posición: 668.32%
- ROI reportado por sistema: 53.46% (total de todas las posiciones)

Esto confirmó que el cálculo está **funcionando correctamente** cuando se agrupa por token, pero necesita mejorar la precisión de los valores individuales.

## 🔗 Referencias

- Commit anterior: `73a6bbd` - "feat: Improve P&L calculation accuracy - 43% more trades captured"
- Scripts creados:
  - `scripts/debug-pnl-30d-v2.ts` - Análisis 30 días básico
  - `scripts/deep-analysis-30d.ts` - Análisis solo SWAPS
  - `scripts/exhaustive-analysis-30d.ts` - Análisis TODAS las transacciones
  - `scripts/find-token.ts` - Búsqueda de token específico
  - `scripts/find-raw-token-txs.ts` - Análisis RAW de token

## 🚀 Próximos Pasos Inmediatos

1. Ejecutar análisis con `accountData` activado
2. Si no mejora, crear script de comparación detallada
3. Basado en hallazgos, implementar fix 
4. Iterar hasta lograr <5% error en todos los valores

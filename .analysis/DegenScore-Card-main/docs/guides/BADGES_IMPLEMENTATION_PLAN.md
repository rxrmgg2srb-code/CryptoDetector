# 🏆 Sistema de Logros y Temporadas - DegenScore

## Resumen Ejecutivo

Sistema de badges con puntuación y temporadas competitivas con premios en SOL. Los badges se agrupan en categorías con rareza que determina los puntos otorgados.

---

## 🎮 Sistema de Temporadas (Seasons)

### Estructura de una Temporada

**Duración:** 30 días
**Entrada:** 0.2 SOL por card premium creada
**Premios:** Se acumulan automáticamente (cada 100 cards = 4 SOL al pool)

### Categorías de Premios

Cada temporada tiene **3 categorías de premios**:

#### 1. ❤️ Más Likes

- **Premio:** 1 SOL por cada 100 participantes
- **Cómo ganar:** Consigue más likes en tu card
- **Estrategia:** Comparte tu card en Twitter, Telegram, Discord

#### 2. 👥 Más Referidos Premium

- **Premio:** 1 SOL por cada 100 participantes
- **Cómo ganar:** Refiere usuarios que creen cards premium (pagan 0.2 SOL)
- **Estrategia:** Comparte tu link de referido, trae amigos al juego

#### 3. ⭐ Más Logros (Badge Points)

- **Premio:** 1 SOL por cada 100 participantes (dividido en 2: 1 SOL para categorías de trading + 1 SOL para categoría de logros)
- **Cómo ganar:** Acumula la mayor cantidad de puntos de badges
- **Estrategia:** Tradea activo, mantén buenos ratios, desbloquea todos los badges posibles

### Ejemplo de Distribución de Premios

**Season con 500 participantes:**

- Total recaudado: 500 × 0.2 SOL = **100 SOL**
- Prize pool (20 SOL):
  - Categoría Likes: 5 SOL → Ganador con más likes
  - Categoría Referidos: 5 SOL → Ganador con más referidos premium
  - Categoría Logros: 10 SOL → Repartidos entre volumen (5 SOL) y logros generales (5 SOL)
- Revenue del proyecto: 80 SOL (80%)

---

## 🏅 Sistema de Puntuación de Badges

### Rareza y Puntos

| Rareza    | Puntos | Color  | Dificultad                |
| --------- | ------ | ------ | ------------------------- |
| COMMON    | 1 pt   | Gris   | Fácil de conseguir        |
| RARE      | 3 pts  | Azul   | Requiere algo de esfuerzo |
| EPIC      | 5 pts  | Morado | Difícil                   |
| LEGENDARY | 10 pts | Dorado | Muy difícil               |
| MYTHIC    | 25 pts | Rosa   | Extremadamente raro       |

### Cómo se Calculan los Puntos Totales

Tu **puntuación total de logros** es la suma de puntos de todos tus badges desbloqueados.

**Ejemplo:**

- Badge "🐣 Mini Degen" (COMMON) = 1 pt
- Badge "🦈 Shark" (RARE) = 3 pts
- Badge "💎 Solid Trader" (EPIC) = 5 pts
- Badge "👑 Degen King" (LEGENDARY) = 10 pts
- **Total: 19 puntos**

---

## 📊 FASE 1: QUICK WINS (1-2 días) - 40 badges

Usa datos que **ya existen** en tu DB:

### A. Volumen (15 badges) ✅

```typescript
// Datos existentes: card.totalVolume
const volumeBadges = [
  { key: 'mini_degen', name: '🐣 Mini Degen', threshold: 1 },
  { key: 'starter_trader', name: '💼 Starter Trader', threshold: 5 },
  { key: 'fast_hands', name: '⚡ Fast Hands', threshold: 10 },
  { key: 'shark_trader', name: '🦈 Shark Trader', threshold: 25 },
  { key: 'hot_wallet', name: '🔥 Hot Wallet', threshold: 50 },
  { key: 'baby_whale', name: '🐳 Baby Whale', threshold: 75 },
  { key: 'solid_trader', name: '💎 Solid Trader', threshold: 100 },
  { key: 'whale', name: '🐋 Whale', threshold: 150 },
  { key: 'volcano_wallet', name: '🌋 Volcano Wallet', threshold: 250 },
  { key: 'market_maker_jr', name: '🪙 Market Maker Jr.', threshold: 300 },
  { key: 'executive_whale', name: '💼🐋 Executive Whale', threshold: 500 },
  { key: 'degen_king', name: '😈 Degen King', threshold: 750 },
  { key: 'alien_volume', name: '🛸 Alien Volume', threshold: 1000 },
  { key: 'extraterrestrial', name: '👽 Extraterrestrial', threshold: 2000 },
];

// Implementación:
function checkVolumeBadges(card: DegenCard): string[] {
  return volumeBadges.filter((b) => card.totalVolume >= b.threshold).map((b) => b.key);
}
```

### B. PNL (15 badges) ✅

```typescript
// Datos existentes: card.profitLoss
const pnlBadges = [
  // Ganancias
  { key: 'profit_rookie', name: '💰 Profit Rookie', threshold: 0.5 },
  { key: 'green_trader', name: '💵 Green Trader', threshold: 1 },
  { key: 'profit_machine', name: '🌿 Profit Machine', threshold: 3 },
  { key: 'energy_trader', name: '🔋 Energy Trader', threshold: 5 },
  { key: 'green_giant', name: '💚 Green Giant', threshold: 10 },
  { key: 'profit_wizard', name: '🧙‍♂️ Profit Wizard', threshold: 25 },
  { key: 'eagle_eye', name: '🦅 Eagle Eye', threshold: 40 },
  { key: 'green_god', name: '🟢 Green God', threshold: 75 },
  { key: 'evolution_trader', name: '🧬 Evolution Trader', threshold: 100 },

  // Pérdidas (humor)
  { key: 'rug_victim', name: '☠️ Rug Victim', threshold: -1 },
  { key: 'rug_survivor', name: '💀 Rug Survivor', threshold: -3 },
  { key: 'clown_badge', name: '🤡 Clown Badge', threshold: -5 },
  { key: 'comedy_trader', name: '🎭 Comedy Trader', threshold: -10 },
  { key: 'wallet_funeral', name: '🪦 Wallet Funeral', threshold: -20 },
  { key: 'nuke_wallet', name: '🧨 Nuke Wallet', threshold: -30 },
];
```

### C. Win Rate (10 badges) ✅

```typescript
// Datos existentes: card.winRate
const winRateBadges = [
  { key: 'accurate', name: '🎯 Accurate', threshold: 50 },
  { key: 'sniper', name: '🎖️ Sniper', threshold: 60 },
  { key: 'ice_sniper', name: '🧊 Ice Sniper', threshold: 70 },
  { key: 'elite_sniper', name: '🎖️🧊 Elite Sniper', threshold: 75 },
  { key: 'golden_aim', name: '🏆 Golden Aim', threshold: 80 },
  { key: 'bowmaster', name: '🏹 Bowmaster', threshold: 85 },
  { key: 'perfect_shot', name: '🎯🔥 Perfect Shot', threshold: 90 },
  { key: 'zen_trader', name: '⛩️ Zen Trader', threshold: 95 },
  { key: 'god_accuracy', name: '⚜️ God Accuracy', threshold: 98 },
  { key: 'perfect_trader', name: '⭐ Perfect Trader', threshold: 100 },
];
```

---

## 🔧 FASE 2: BEHAVIORAL (2-3 días) - 35 badges

Requiere analizar `HotTrade` timestamps y patterns:

### D. Actividad/Comportamiento (20 badges) 🟡

**Datos necesarios:**

```sql
-- Contar trades por día
SELECT DATE(timestamp), COUNT(*)
FROM HotTrade
WHERE walletAddress = ?
GROUP BY DATE(timestamp);

-- Trades consecutivos
SELECT timestamp, LAG(timestamp) OVER (ORDER BY timestamp)
FROM HotTrade;

-- Hora del día
SELECT HOUR(timestamp), COUNT(*)
FROM HotTrade
GROUP BY HOUR(timestamp);
```

**Implementación:**

```typescript
// lib/badgeChecker.ts
export async function checkBehavioralBadges(walletAddress: string) {
  const trades = await prisma.hotTrade.findMany({
    where: { walletAddress },
    orderBy: { timestamp: 'desc' },
    take: 1000,
  });

  const badges = [];

  // ⚡ Speedrun Trader — 3 trades en 10 min
  const speedrunWindow = 10 * 60 * 1000; // 10 min
  for (let i = 0; i < trades.length - 2; i++) {
    const time1 = trades[i].timestamp.getTime();
    const time3 = trades[i + 2].timestamp.getTime();
    if (time1 - time3 <= speedrunWindow) {
      badges.push('speedrun_trader');
      break;
    }
  }

  // 💎⏳ Diamond Hands 24h — 24h sin vender
  // Busca compra seguida de venta con > 24h de diferencia
  for (let i = 0; i < trades.length - 1; i++) {
    if (trades[i].action === 'buy' && trades[i + 1].action === 'sell') {
      const holdTime = trades[i + 1].timestamp.getTime() - trades[i].timestamp.getTime();
      if (holdTime >= 24 * 60 * 60 * 1000) {
        badges.push('diamond_hands_24h');
      }
    }
  }

  // 🌙 Night Owl — tradea después de las 00h
  const nightTrades = trades.filter(
    (t) => t.timestamp.getHours() >= 0 && t.timestamp.getHours() < 6
  );
  if (nightTrades.length >= 5) {
    badges.push('night_owl');
  }

  return badges;
}
```

### F. Leaderboard/Social (15 badges) 🟡

**Schema update necesario:**

```prisma
model DegenCard {
  // ... existing fields
  viewCount    Int @default(0)  // Track profile views
  likes        Int @default(0)  // Ya existe ✅
}

model CardView {
  id            String   @id @default(cuid())
  cardId        String
  card          DegenCard @relation(fields: [cardId], references: [id])
  viewerIp      String   // Para evitar spam
  viewedAt      DateTime @default(now())

  @@index([cardId, viewerIp])
}
```

---

## 🚀 FASE 3: ADVANCED (requiere nuevos datos) - 25 badges

### E. Tokens/Memecoins (15 badges) 🔴

**Desafíos:**

- 🧬 Genesis Hunter → Necesitas block number de la compra
- 🥇 Top 1% Holder → Necesitas on-chain holder data
- ⛏️ Early Miner → Necesitas total holder count en el momento

**Solución:**

```typescript
// Opción 1: Usar Helius Enhanced Transactions API
const response = await fetch('https://api.helius.xyz/v0/addresses/{wallet}/transactions', {
  method: 'POST',
  body: JSON.stringify({
    type: 'SWAP',
  }),
});

// Opción 2: Simplificar badges
// En vez de "Genesis Hunter (bloque 0-5)", haz:
// "🚀 Launch Sniper — compra un token con menos de 1 hora de vida"
```

### G. Premium (10 badges) ✅

Ya implementable (usas `isPaid`, `logoUrl`, `twitterHandle`, etc.):

```typescript
const premiumBadges = [
  { key: 'custom_card', check: (card) => !!card.customBackground },
  { key: 'logo_pro', check: (card) => !!card.logoUrl },
  { key: 'social_flex', check: (card) => !!card.twitterHandle },
  { key: 'telegram_verified', check: (card) => !!card.telegramHandle },
  { key: 'premium_trader', check: (card) => card.isPaid },
];
```

---

## 🎨 ARQUITECTURA TÉCNICA

### 1. Schema Update

```prisma
// prisma/schema.prisma

model Badge {
  id               String   @id @default(cuid())
  key              String   @unique  // "mini_degen"
  name             String   // "🐣 Mini Degen"
  description      String   // "+1 SOL tradeado"
  icon             String   // "🐣"
  category         String   // "volume", "pnl", "winrate", "activity", "tokens", "social", "premium"
  rarity           String   // "common", "rare", "epic", "legendary"
  threshold        Float?   // Para badges numéricos
  isPremiumOnly    Boolean  @default(false)

  unlocks          BadgeUnlock[]

  @@index([category, rarity])
}

model BadgeUnlock {
  id               String   @id @default(cuid())
  badgeId          String
  badge            Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  cardId           String
  card             DegenCard @relation(fields: [cardId], references: [id], onDelete: Cascade)

  unlockedAt       DateTime @default(now())

  @@unique([badgeId, cardId])
  @@index([cardId, unlockedAt(sort: Desc)])
}
```

### 2. Badge Checker Service

```typescript
// lib/badges/badgeChecker.ts

export async function checkAllBadges(walletAddress: string): Promise<string[]> {
  const card = await prisma.degenCard.findUnique({
    where: { walletAddress },
    include: { badges: true },
  });

  if (!card) return [];

  const unlockedBadges: string[] = [];

  // FASE 1: Quick wins
  unlockedBadges.push(...checkVolumeBadges(card));
  unlockedBadges.push(...checkPnlBadges(card));
  unlockedBadges.push(...checkWinRateBadges(card));
  unlockedBadges.push(...checkPremiumBadges(card));

  // FASE 2: Behavioral (si implementado)
  if (ENABLE_BEHAVIORAL_BADGES) {
    unlockedBadges.push(...(await checkBehavioralBadges(walletAddress)));
    unlockedBadges.push(...(await checkSocialBadges(card)));
  }

  // FASE 3: Advanced (si implementado)
  if (ENABLE_TOKEN_BADGES) {
    unlockedBadges.push(...(await checkTokenBadges(walletAddress)));
  }

  return unlockedBadges;
}
```

### 3. API Endpoint

```typescript
// pages/api/badges/check.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { walletAddress } = req.query;

  // Rate limit
  if (!rateLimit(req, res)) return;

  try {
    const unlockedBadges = await checkAllBadges(walletAddress as string);

    // Guarda nuevos badges
    for (const badgeKey of unlockedBadges) {
      await prisma.badgeUnlock.upsert({
        where: {
          badgeId_cardId: {
            badgeId: badgeKey,
            cardId: card.id,
          },
        },
        create: {
          badgeId: badgeKey,
          cardId: card.id,
        },
        update: {},
      });
    }

    res.json({
      success: true,
      unlockedBadges,
      totalBadges: unlockedBadges.length,
    });
  } catch (error) {
    logger.error('Badge check error', error);
    res.status(500).json({ error: 'Failed to check badges' });
  }
}
```

---

## 📈 IMPACTO ESPERADO

| Métrica                 | Antes  | Después (estimado) |
| ----------------------- | ------ | ------------------ |
| Tiempo en sitio         | 30s    | 2-3 min            |
| Retorno de usuarios     | 10%    | 40-60%             |
| Conversión a premium    | 2%     | 5-8%               |
| Shares en Twitter       | 50/día | 300-500/día        |
| Costo de implementación | -      | 4-6 días dev       |

---

## 🎯 RECOMENDACIÓN FINAL

**Implementar en 3 semanas:**

- **Semana 1:** FASE 1 (40 badges fáciles) → Deploy y medir engagement
- **Semana 2:** FASE 2 (35 badges comportamiento) → Viral growth
- **Semana 3:** FASE 3 (25 badges avanzados) → Solo si FASE 1-2 funcionan

**ROI estimado:** 10x en engagement, 3x en conversión premium.

---

## 🔥 BONUS: Mejoras sugeridas

1. **Badge Notifications:**
   - Push notification cuando desbloqueas badge nuevo
   - "🎉 Nuevo badge desbloqueado: 🐋 Whale"

2. **Badge Progress Bar:**

   ```
   🐳 Baby Whale (75 SOL) ████████░░ 80% (60/75 SOL)
   Next: 💎 Solid Trader (100 SOL)
   ```

3. **Badge Rarity System:**
   - Common (gris): 50% de usuarios
   - Rare (azul): 25%
   - Epic (morado): 10%
   - Legendary (oro): 1%
   - Mythic (arcoíris): <0.1% ("⭐ Perfect Trader")

4. **Leaderboard de Badges:**

   ```
   🏆 Top Badge Collectors:
   1. wallet123... - 87 badges
   2. wallet456... - 82 badges
   3. wallet789... - 78 badges
   ```

5. **Badge Showcase en Card:**
   - Mostrar top 3 badges más raros en la tarjeta visual
   - "Crowned by: 👑🏆⭐"

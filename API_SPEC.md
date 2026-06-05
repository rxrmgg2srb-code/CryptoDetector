# Dormant Detector — Integration API Specification

## Overview

Dormant Detector provides three integration pathways for consuming wakeup signals:
1. **REST API** — Pull-based signal consumption
2. **WebSocket Stream** — Push-based real-time alerts
3. **Embedded Module** — Direct JavaScript integration

---

## 1. REST API Endpoints

### GET /api/signals

Returns the latest batch of scored tokens from the most recent scan cycle.

**Response:**
```json
{
  "timestamp": 1717545600000,
  "scanCycle": 142,
  "timeLabel": "US Peak",
  "tokens": [
    {
      "address": "TokenMintAddress...",
      "symbol": "EXAMPLE",
      "name": "Example Token",
      "score": 87,
      "wakeup": {
        "isWakeup": true,
        "tier": "CONFIRMED",
        "tradable": true,
        "confirmations": ["REPEAT_BUYS", "BUY_PRESSURE", "SELLS_CONTROLLED", "VOLUME_RETURNING", "RISK_OK"],
        "dormantHours": 72,
        "buys5m": 3,
        "sells5m": 0
      },
      "convergence": {
        "level": "TOP_PICK",
        "count": 5,
        "active": ["MOMENTUM", "MICRO_BUYS", "VOL_SPIKE", "BUY_PRESSURE", "AWAKENING"]
      },
      "x2Potential": {
        "score": 78,
        "qualifies": true,
        "matches": ["24H_DORMANT", "LOW_MCAP_ROOM", "TARGET_2X", "MICRO_BUYS"]
      },
      "microcap10x": {
        "score": 85,
        "qualifies": true,
        "matches": ["DORMANT_24H", "MCAP_2K_12K", "THIN_GOOD_LIQ", "TINY_BUY_CLUSTER"]
      },
      "pumpTarget": {
        "min": 45,
        "estimate": 180,
        "max": 520
      },
      "rug": {
        "safe": true,
        "rugScore": 15,
        "warnings": []
      },
      "signals": [
        { "type": "wakeup", "label": "WAKEUP CONFIRMED (5)" },
        { "type": "microcap10x", "label": "10X WAKEUP 85" },
        { "type": "top-pick", "label": "TOP PICK (5)" }
      ],
      "mcap": 8500,
      "liquidity": 2300,
      "volume": { "m5": 340, "h1": 890, "h6": 1200, "h24": 1500 },
      "priceChange": { "m5": 12.5, "h1": 45.2, "h6": 0, "h24": -5 },
      "buyRatio": { "ratio": 0.92, "buys": 8, "sells": 1 },
      "velocity": { "velocity": 2.3, "trend": "ACCELERATING", "arrow": "++" },
      "isLive": true,
      "isClonePump": false
    }
  ]
}
```

### GET /api/score/:tokenAddress

Scores a specific token on demand.

**Parameters:**
- `tokenAddress` (path) — Solana token mint address (base58)

**Response:** Same token object as in `/api/signals`

### GET /api/health

**Response:**
```json
{
  "ok": true,
  "heliusConfigured": true,
  "wsConnected": true,
  "lastScanAge": 3200,
  "uptime": 86400000
}
```

---

## 2. WebSocket Stream

### Connection
```
ws://hostname:port/api/stream
```

### Message Types

**Alert Message:**
```json
{
  "type": "alert",
  "level": "CRITICAL",
  "token": { ... },
  "timestamp": 1717545600000
}
```

Alert levels:
- `CRITICAL` — Score ≥80, TOP_PICK, or Microcap 10x qualified
- `STRONG` — Score ≥65 with 3+ convergence signals
- `WATCH` — Score ≥50 with 2+ convergence signals

**Scan Complete:**
```json
{
  "type": "scan_complete",
  "stats": {
    "scanned": 450,
    "dormant": 23,
    "awakening": 5,
    "alerts": 2,
    "clones": 1
  },
  "timestamp": 1717545600000
}
```

---

## 3. Embedded Module

### Detector API

```javascript
// Score any DexScreener pair object
const result = Detector.scoreToken(pairData, signals);

// Returns:
{
  score: Number,           // 0-100 composite score
  wakeup: Object,          // Wakeup classification
  convergence: Object,     // Signal convergence level
  x2Potential: Object,     // 2x setup analysis
  microcap10x: Object,     // 10x microcap analysis
  pumpTarget: Object,      // Price target estimates
  rug: Object,             // Anti-rug assessment
  signals: Array,          // Active signal tags
  momentum: Object,        // Momentum analysis
  microBuys: Object,       // Micro-buy detection
  volumeSpike: Object,     // Volume spike detection
  buyRatio: Object,        // Buy/sell ratio
  velocity: Object,        // Score velocity
  narrative: Object,       // Narrative/meme detection
  dormantHours: Number,    // Hours of inactivity
  mcap: Number,            // Market cap USD
  liquidity: Number,       // Liquidity USD
  volume: Object,          // Volume by timeframe
  priceChange: Object,     // Price change by timeframe
  breakdown: Object        // Per-factor score breakdown
}

// Filter scored tokens
Detector.passesFilters(scoredToken, filterConfig);

// Anti-rug check with on-chain data
Detector.antiRugCheck(pairData, onChainData);
```

### Scanner API

```javascript
// Full multi-source scan
const results = await Scanner.runScan(filters, options);

// Quick WebSocket-only fetch
const live = await Scanner.quickFetchLiveTokens(filters, options);
```

---

## 4. Signal Type Reference

| Signal Type | Tag | Description | Severity |
|-------------|-----|-------------|----------|
| `wakeup` | WAKEUP CONFIRMED | Dormant token with 4+ confirmations | Critical |
| `ghost` | WAKEUP DETECTED | First activity after dormancy | High |
| `microcap10x` | 10X WAKEUP | Microcap with 10x breakout pattern | Critical |
| `x2` | X2 SETUP | Multi-factor 2x potential | High |
| `clone-pump` | CLONE PUMP | Old token pumping from new clone | Critical |
| `top-pick` | TOP PICK | 4+ converging signals | Critical |
| `strong-pick` | STRONG | 3+ converging signals | High |
| `momentum` | ROCKET/SURGE/PUMP | Price momentum patterns | Medium |
| `ghost` | GHOST_BUYS_24H | Stealth buys on dead tokens | High |
| `ghost` | STEALTH_ACCUMULATION | Quiet accumulation detected | High |
| `ghost` | PRE-PUMP patterns | Pre-pump setup detected | High |
| `boost` | BOOST | Token boosted on DexScreener | Medium |
| `cto` | CTO | Community takeover | Medium |
| `rug` | RUG [score] | Rug risk detected | Warning |

## 5. Convergence Levels

| Level | Min Signals | Description |
|-------|------------|-------------|
| `TOP_PICK` | 4+ | Highest conviction — multiple independent signals aligned |
| `STRONG` | 3 | Strong setup — good probability of movement |
| `WATCH` | 2 | Worth monitoring — early signal alignment |
| `NONE` | 0-1 | Insufficient signal convergence |

## 6. Rate Limits & Performance

- Scan cycle: every 6 seconds
- WebSocket detection: ~200ms from on-chain execution
- DexScreener batch: 30 tokens per request, 3 concurrent batches
- Helius: 2 requests/second (rate limited)
- Max tokens per scan: 500 (prioritized by source quality)

---

## 7. Deployment Requirements

- Node.js ≥ 18
- Helius API key (free tier works, paid recommended)
- No npm dependencies
- Memory: ~50-100MB
- CPU: minimal (mostly I/O bound)
- Bandwidth: ~1-5 MB/min during active scanning

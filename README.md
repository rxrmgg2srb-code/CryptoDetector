# Dormant Detector v5 — Solana Pre-Trending Signal Engine

> Detect tokens waking up from dormancy before they trend. Find the pump before everyone else.

![License](https://img.shields.io/badge/license-Proprietary-red)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![APIs](https://img.shields.io/badge/data%20sources-5%2B-blue)

## What is This?

Dormant Detector is a **real-time signal engine** that identifies Solana tokens which have been inactive for 24h to 2+ weeks and are suddenly showing signs of life — micro-buys, volume spikes, or liquidity injections. These "wakeup" signals appear **5-30 minutes before** the token hits trending on DexScreener or other platforms.

This is **alpha that no trading terminal currently offers**.

## Key Signals

| Signal | Description |
|--------|-------------|
| **WAKEUP CONFIRMED** | Token dormant 24h+ with 4+ confirmations of returning activity |
| **MICROCAP 10X** | $2K-$12K mcap token with breakout wakeup pattern |
| **X2 SETUP** | Multi-factor alignment indicating 2x+ potential |
| **CLONE PUMP** | Old token pumping because a new clone is exploding |
| **GHOST BUYS** | Stealth micro-purchases on dead tokens |
| **TOP PICK** | 4+ independent signals converging simultaneously |
| **STEALTH ACCUMULATION** | Quiet buying below radar in dormant tokens |
| **PRE-PUMP PATTERN** | Profile update + boost + liquidity = setup detected |

## Architecture

```
PumpPortal WSS (~200ms) ──┐
DexScreener (4 endpoints) ─┤
GeckoTerminal (7 endpoints)┼──▶ Scanner ──▶ Detector ──▶ Alerts
Helius RPC (3 programs) ───┤     (merge)    (score)     (3 levels)
Pump.fun API (150 tokens) ─┘
```

### Data Sources
- **PumpPortal WebSocket** — Real-time trades, ~200ms latency (free)
- **DexScreener API** — Boosts, profiles, CTOs, pair data
- **GeckoTerminal API** — Trending pools, new pools, per-DEX pools
- **Helius RPC** — On-chain swap analysis, bundle/bot detection, holders
- **Pump.fun API** — Currently live tokens direct from source

### Scoring System
10-variable weighted scoring with convergence detection:
- Momentum (20%), Volume Spike (13%), Buy Ratio (13%)
- Micro-Buys (12%), Market Cap (12%), Liquidity (8%)
- Token Age (7%), Liquidity Change (5%), Pre-Pump (5%), X2 Potential (5%)
- Plus: narrative bonus, signal bonus, time-of-day weighting

## Features

### Detection Engine
- Multi-source parallel scanning every 6 seconds
- WebSocket real-time detection (~200ms)
- Clone Pump detection (unique in market)
- Microcap 10x wakeup patterns
- Anti-rug scoring with on-chain bundle/bot detection
- Score velocity tracking (ROCKETING → STABLE → CRASHING)

### Trading
- Instant buy via Jito MEV (~400-800ms, no wallet popups)
- Jupiter aggregator for best routes
- Configurable slippage, SOL amount, Jito tip
- Browser-native Ed25519 signing (zero external crypto libs)

### Analytics
- Signal performance tracking with hit rates (2x%, 5x%)
- CSV export for backtesting validation
- Profit calculator per token
- Real-time sparkline charts

### Dashboard
- Professional dark-theme trading terminal UI
- 14-column data grid with real-time updates
- Detail sidebar with score breakdown
- 3-level alert system (CRITICAL / STRONG / WATCH)
- Browser notifications for critical alerts

## Tech Stack

- **Frontend:** Vanilla JavaScript (zero dependencies)
- **Backend:** Node.js 18+ (zero npm packages)
- **Styling:** Custom CSS with glassmorphism + neon accents
- **Fonts:** Inter + JetBrains Mono
- **Total:** ~3,200 lines of code

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd CryptoDetector

# 2. Configure
cp .env.example .env
# Edit .env and add your Helius API key

# 3. Run
HELIUS_API_KEY=your_key node server.js

# 4. Open
# Navigate to http://localhost:8787
```

## API Integration Spec

The engine can be integrated as:

### Option A: Signal Feed API
```
GET  /api/signals          → Latest scored tokens with tags
GET  /api/score/:address   → On-demand scoring for any token
WSS  /api/stream           → Real-time alert stream
```

### Option B: Embeddable Module
The detector + scanner can run as a standalone module:
```javascript
const result = Detector.scoreToken(pairData, signals);
// Returns: score, wakeup, convergence, x2Potential, microcap10x, rug, ...
```

### Option C: White-Label
Full UI + engine, rebrandable with custom themes.

## Performance Metrics

The built-in performance tracker records every signal and measures:
- Time to 2x from first detection
- Time to 5x from first detection
- Hit rate by signal type (WAKEUP_CONFIRMED, MICROCAP_10X, etc.)
- All exportable to CSV for independent verification

## Security

- API keys never reach the browser (proxied through server.js)
- Trading wallet keys stored with XOR obfuscation (dedicated burner wallet recommended)
- Input validation on all proxy endpoints
- Request body size limits
- Path traversal prevention

## License

Proprietary. All rights reserved. Contact for licensing inquiries.

---

**Contact:** [Your contact info]

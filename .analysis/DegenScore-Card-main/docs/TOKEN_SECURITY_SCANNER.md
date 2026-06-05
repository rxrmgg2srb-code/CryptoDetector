# 🔒 Token Security Scanner

## Overview

The Token Security Scanner is an advanced on-chain analysis tool for Solana tokens that helps users identify rug pulls, honeypots, and other security risks before investing.

## Features

### 🎯 Core Security Analysis

1. **Token Authorities Analysis** (25 points)
   - Mint Authority status
   - Freeze Authority status
   - Authority revocation check
   - Risk assessment

2. **Holder Distribution** (20 points)
   - Total holder count
   - Top 10 holders concentration
   - Creator holdings percentage
   - Gini coefficient (wealth inequality)
   - Bundle wallet detection

3. **Liquidity Analysis** (20 points)
   - Total liquidity in SOL and USD
   - LP burn status
   - LP lock status and expiration
   - Major DEX pools (Raydium, Orca, etc.)

4. **Trading Patterns** (15 points)
   - Bundle bot detection
   - Sniper detection
   - Wash trading detection
   - Honeypot detection
   - Sell capability check
   - Buy/Sell tax estimation

5. **Metadata Quality** (10 points)
   - Token verification status
   - Website presence
   - Social media links
   - Logo and description

6. **Market Metrics** (10 points)
   - Token age
   - Volume analysis
   - Price change tracking
   - Pump & dump pattern detection

### 🚨 Red Flag Detection

The scanner detects and categorizes security warnings:

- **CRITICAL**: Immediate danger (e.g., honeypot detected, extreme holder concentration)
- **HIGH**: Major concerns (e.g., active mint authority, low liquidity)
- **MEDIUM**: Moderate risks (e.g., bundle detection, young token)
- **LOW**: Minor concerns (e.g., metadata incomplete)

## Security Score Breakdown

```
90-100: 🟢 ULTRA SAFE - Strong security fundamentals
70-89:  🔵 LOW RISK - Acceptable security
50-69:  🟡 MODERATE RISK - Proceed with caution
25-49:  🔴 HIGH RISK - Multiple red flags
0-24:   ⛔ EXTREME DANGER - Critical issues detected
```

## Usage

### Via Web Interface

1. Navigate to `/token-scanner`
2. Paste the Solana token mint address
3. Click "Analyze Security"
4. Review the comprehensive security report

### Via API

```bash
POST /api/analyze-token
Content-Type: application/json

{
  "tokenAddress": "YOUR_TOKEN_MINT_ADDRESS",
  "forceRefresh": false
}
```

**Response:**

```json
{
  "success": true,
  "report": {
    "securityScore": 85,
    "riskLevel": "LOW_RISK",
    "recommendation": "Token shows acceptable security...",
    "tokenAuthorities": { ... },
    "holderDistribution": { ... },
    "liquidityAnalysis": { ... },
    "tradingPatterns": { ... },
    "metadata": { ... },
    "marketMetrics": { ... },
    "redFlags": { ... }
  },
  "cached": false
}
```

## Caching Strategy

- **Redis Cache**: 1 hour for fast repeated queries
- **Database Cache**: 24 hours for cost-effective analysis
- **Force Refresh**: Use `forceRefresh: true` to bypass cache

## Technical Implementation

### Architecture

```
┌─────────────────────┐
│   User Interface    │
│  (TokenScanner.tsx) │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│   API Endpoint      │
│ (/api/analyze-token)│
└──────────┬──────────┘
           │
           v
┌─────────────────────┐      ┌──────────────┐
│ Security Analyzer   │──────│ Helius API   │
│  (tokenSecurity     │      │ (on-chain    │
│   Analyzer.ts)      │      │  data)       │
└──────────┬──────────┘      └──────────────┘
           │
           v
┌─────────────────────┐
│  Database Storage   │
│  (TokenAnalysis)    │
└─────────────────────┘
```

### Key Files

- `lib/services/tokenSecurityAnalyzer.ts` - Core analysis engine
- `pages/api/analyze-token.ts` - API endpoint
- `components/TokenSecurityScanner.tsx` - UI component
- `pages/token-scanner.tsx` - Public page
- `prisma/schema.prisma` - TokenAnalysis model

## Data Sources

- **Helius API**: Token metadata, transactions, holders
- **On-chain data**: Token authorities, mint info, balances
- **DEX data**: Liquidity pools (Raydium, Orca, Jupiter)

## Best Practices

1. **Always check the security score** before investing
2. **Pay attention to CRITICAL red flags** - these are deal breakers
3. **Verify liquidity** - tokens with <10 SOL liquidity are extremely risky
4. **Check holder distribution** - avoid tokens where creator holds >30%
5. **Look for authority revocation** - both mint and freeze should be revoked
6. **Age matters** - tokens <1 day old are very high risk

## Example Analysis Results

### ✅ Safe Token

- Security Score: 92
- Authorities: Revoked
- Liquidity: 500 SOL, LP burned
- Holders: 5,000+ with low concentration
- Age: 30+ days

### ⛔ Dangerous Token

- Security Score: 15
- Authorities: Mint & Freeze active
- Liquidity: 3 SOL, LP not locked
- Holders: 50, creator holds 60%
- Age: <1 day
- Red Flags: Honeypot detected, bundle bots

## Rate Limiting

- Strict rate limiting applied (expensive RPC calls)
- Use caching to avoid hitting limits
- Contact support for higher limits if needed

## Future Enhancements

- [ ] Real-time price monitoring
- [ ] Historical security score tracking
- [ ] Social sentiment analysis
- [ ] Integration with more DEXs
- [ ] Automated alerts for followed tokens
- [ ] API webhooks for token launches

## Support

For issues or questions:

- GitHub: https://github.com/rxrmgg2srb-code/DegenScore-Card
- Documentation: /docs

## License

Part of DegenScore Card project - See main LICENSE file

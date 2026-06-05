# 🚀 API Documentation

## Base URL

```
Production: https://degenscore.com/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require wallet signature verification. Include the following headers:

```
X-Wallet-Address: <solana_wallet_address>
X-Signature: <ed25519_signature>
X-Message: <signed_message>
```

---

## Core Endpoints

### 🎴 Card Management

#### `POST /api/analyze`

Analyze a wallet and generate DegenScore metrics.

**Request:**

```json
{
  "walletAddress": "string" // Solana wallet address
}
```

**Response:**

```json
{
  "success": true,
  "metrics": {
    "degenScore": 75,
    "totalTrades": 150,
    "totalVolume": 125.5,
    "profitLoss": 12.3,
    "winRate": 58.5,
    "rugsSurvived": 3,
    "moonshots": 1,
    "diamondHands": 5
  }
}
```

**Rate Limit:** 10 requests per minute

---

#### `GET /api/get-card?wallet=<address>`

Retrieve an existing DegenScore card.

**Response:**

```json
{
  "id": "clx123abc",
  "walletAddress": "xyz...",
  "degenScore": 75,
  "isPaid": true,
  "isMinted": true
  // ... all card metrics
}
```

---

#### `POST /api/generate-card`

Generate visual card image after analysis.

**Request:**

```json
{
  "walletAddress": "string",
  "metrics": {
    /* metrics object */
  }
}
```

**Response:**

```json
{
  "success": true,
  "cardUrl": "https://cdn.degenscore.com/cards/xyz.png"
}
```

---

### 💰 Payment & Verification

#### `POST /api/verify-payment`

Verify payment transaction for premium features.

**Request:**

```json
{
  "walletAddress": "string",
  "signature": "string" // Transaction signature
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment verified",
  "isPaid": true
}
```

**Security:** Validates sender, treasury, and amount on-chain.

---

### 🏆 Leaderboard & Social

#### `GET /api/leaderboard?metric=score&limit=100`

Get top wallets by metric.

**Query Params:**

- `metric`: `score` | `volume` | `winRate` | `likes` (default: `score`)
- `limit`: 1-100 (default: 50)
- `offset`: For pagination

**Response:**

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "walletAddress": "xyz...",
      "degenScore": 95,
      "displayName": "DegenerateMike",
      "totalVolume": 1523.4,
      "likes": 42
    }
  ],
  "total": 10523
}
```

---

#### `POST /api/like`

Like a DegenScore card.

**Request:**

```json
{
  "walletAddress": "string" // Card to like
}
```

**Requires:** Authentication (X-Wallet-Address header)

---

### 📊 Analytics & Tracking

#### `GET /api/score-history?wallet=<address>`

Get historical score progression.

**Response:**

```json
{
  "history": [
    {
      "timestamp": "2025-01-20T12:00:00Z",
      "score": 72,
      "rank": 523,
      "totalTrades": 140
    }
  ]
}
```

---

#### `GET /api/hot-feed?limit=20`

Get recent trades from top wallets.

**Response:**

```json
{
  "trades": [
    {
      "walletAddress": "xyz...",
      "displayName": "WhaleHunter",
      "tokenSymbol": "BONK",
      "type": "buy",
      "solAmount": 15.5,
      "timestamp": "2025-01-20T15:30:00Z",
      "degenScore": 88
    }
  ]
}
```

---

### 🎯 Gamification

#### `POST /api/daily-checkin`

Daily check-in for streak rewards.

**Response:**

```json
{
  "success": true,
  "currentStreak": 15,
  "longestStreak": 30,
  "xpEarned": 50
}
```

---

#### `GET /api/current-challenge`

Get active weekly challenge.

**Response:**

```json
{
  "week": 3,
  "year": 2025,
  "title": "Volume King",
  "description": "Trade the most volume this week",
  "metric": "volume",
  "prizeSOL": 5.0,
  "endDate": "2025-01-27T23:59:59Z",
  "leaderWallet": "abc...",
  "leaderScore": 523.4
}
```

---

### 🔍 Token Analysis

#### `POST /api/analyze-token`

Analyze token security (100+ data points).

**Request:**

```json
{
  "tokenAddress": "string" // SPL token mint
}
```

**Response:**

```json
{
  "tokenSymbol": "BONK",
  "securityScore": 85,
  "riskLevel": "LOW_RISK",
  "recommendation": "SAFE_TO_BUY",
  "scores": {
    "authorityScore": 95, // Mint/freeze revoked
    "holderScore": 78, // Distribution
    "liquidityScore": 88, // LP locked
    "tradingScore": 72 // Patterns
  },
  "redFlags": [
    {
      "severity": "medium",
      "message": "Top 10 holders own 35% of supply"
    }
  ]
}
```

---

#### `POST /api/super-token-score`

Ultra-deep token analysis (SuperScore).

**Enhanced Analysis:**

- New wallet risk detection
- Insider trading patterns
- Wallet clustering (bundles)
- 30-day holder retention
- Developer wallet tracking

**Rate Limit:** 5 requests per minute (expensive operation)

---

### 🔔 Notifications & Webhooks

#### `POST /api/notifications/preferences`

Update notification settings.

**Request:**

```json
{
  "emailEnabled": true,
  "telegramEnabled": true,
  "followedTrades": true,
  "milestones": true,
  "challenges": true
}
```

---

### 📸 Media & Sharing

#### `POST /api/upload-profile-image`

Upload profile image.

**Request:** `multipart/form-data`

- `image`: File (max 5MB, .jpg/.png/.webp)

**Response:**

```json
{
  "success": true,
  "imageUrl": "https://cdn.degenscore.com/profiles/xyz.jpg"
}
```

---

#### `GET /api/og-image?wallet=<address>`

Generate Open Graph card image for social sharing.

**Returns:** Image (PNG, 1200x630)

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    /* optional additional info */
  }
}
```

### Common Error Codes:

- `INVALID_WALLET` - Invalid Solana address
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `UNAUTHORIZED` - Missing/invalid signature
- `PAYMENT_REQUIRED` - Premium feature, payment needed
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request parameters

---

## Rate Limiting

| Endpoint                 | Rate Limit |
| ------------------------ | ---------- |
| `/api/analyze`           | 10/min     |
| `/api/super-token-score` | 5/min      |
| `/api/generate-card`     | 20/min     |
| `/api/leaderboard`       | 60/min     |
| `/api/like`              | 30/min     |
| All others               | 60/min     |

Headers included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

---

## WebSocket (Real-time Updates)

Coming soon: Real-time leaderboard updates, whale alerts, challenge progress via Pusher.

---

## SDK & Client Libraries

Coming soon:

- TypeScript SDK
- Python SDK
- REST API Postman Collection

---

## Support

- **Discord:** [discord.gg/degenscore](https://discord.gg/degenscore)
- **GitHub Issues:** [Report bugs](https://github.com/rxrmgg2srb-code/DegenScore-Card/issues)
- **Email:** api@degenscore.com

---

**Last Updated:** January 2025  
**API Version:** v1.0

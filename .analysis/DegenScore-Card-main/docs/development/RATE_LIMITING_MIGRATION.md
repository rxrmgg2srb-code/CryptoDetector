# 🔄 Rate Limiting Consolidation Guide

## Current State (3 Implementations)

The project currently has **3 different rate limiting implementations**:

1. **`rateLimit.ts`** - In-memory rate limiting (simple, fast, but resets on restart)
2. **`rateLimitPersistent.ts`** - Database-backed rate limiting (persistent, but slower)
3. **`rateLimitRedis.ts`** - Redis-backed rate limiting (best of both worlds)

---

## ✅ Recommended: Use Redis Implementation

**File:** `lib/rateLimitRedis.ts`

### Why Redis is Best:

- ✅ **Persistent** across server restarts
- ✅ **Fast** (sub-millisecond latency)
- ✅ **Scalable** (works with multiple server instances)
- ✅ **Distributed** (shared state across containers)
- ✅ **Built-in expiration** (automatic cleanup)

---

## Migration Plan

### Step 1: Update API Endpoints

**Before (in-memory):**

```typescript
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req, res) {
  if (!rateLimit(req, res)) return;
  // ... your code
}
```

**After (Redis):**

```typescript
import { checkRateLimit } from '@/lib/rateLimitRedis';

export default async function handler(req, res) {
  const allowed = await checkRateLimit(req.socket.remoteAddress, 'endpoint-name');
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  // ... your code
}
```

### Step 2: Configure Redis

Ensure Redis connection is configured in `.env.local`:

```bash
UPSTASH_REDIS_URL=your-redis-url-here
UPSTASH_REDIS_TOKEN=your-redis-token-here
```

### Step 3: Remove Old Implementations (Optional)

Once all endpoints are migrated:

```bash
git rm lib/rateLimit.ts
git rm lib/rateLimitPersistent.ts
```

---

## Usage Examples

### Basic Rate Limiting

```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimitRedis';

export default async function handler(req, res) {
  const identifier = req.socket.remoteAddress || 'unknown';
  const allowed = await checkRateLimit(identifier, 'api', RATE_LIMITS.BASIC);

  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Your API logic here
  res.json({ success: true });
}
```

### Strict Rate Limiting (Expensive Operations)

```typescript
import { checkRateLimitStrict } from '@/lib/rateLimitRedis';

export default async function handler(req, res) {
  const identifier = req.socket.remoteAddress || 'unknown';
  const allowed = await checkRateLimitStrict(identifier, 'analyze');

  if (!allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Please wait before analyzing another wallet',
    });
  }

  // Expensive operation
  const metrics = await analyzeWallet(req.body.wallet);
  res.json(metrics);
}
```

### Wallet-Based Rate Limiting

```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimitRedis';

export default async function handler(req, res) {
  const walletAddress = req.body.walletAddress;
  const allowed = await checkRateLimit(walletAddress, 'wallet-action', RATE_LIMITS.PER_USER);

  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests from this wallet' });
  }

  // Your logic
  res.json({ success: true });
}
```

---

## Rate Limit Tiers (from rateLimitRedis.ts)

```typescript
RATE_LIMITS = {
  BASIC: 60 req/min,           // Default endpoints
  STRICT: 10 req/min,          // Expensive operations (analyze, generate)
  SUPER_TOKEN: 5 req/min,      // Very expensive (SuperTokenScore)
  PAYMENT: 5 req/min,          // Payment endpoints
  AUTH: 10 req/5min,           // Authentication
  PER_USER: 30 req/min,        // Per wallet/user
  PREMIUM: 200 req/min         // Premium users (TODO: implement tier detection)
}
```

---

## Current Usage in Codebase

### Endpoints Using In-Memory Rate Limiting:

- `pages/api/analyze.ts`
- `pages/api/generate-card.ts`
- `pages/api/verify-payment.ts`

**Action:** Migrate these to Redis implementation

### Endpoints Already Using Redis:

- None yet (Redis implementation ready but not used)

**Action:** Start using it!

---

## Benefits of Migration

| Feature      | In-Memory | Database   | Redis            |
| ------------ | --------- | ---------- | ---------------- |
| Speed        | ⚡ Fast   | 🐌 Slow    | ⚡ Fast          |
| Persistence  | ❌ No     | ✅ Yes     | ✅ Yes           |
| Scalability  | ❌ No     | ⚠️ Limited | ✅ Yes           |
| Distributed  | ❌ No     | ⚠️ Limited | ✅ Yes           |
| Auto-cleanup | ⏱️ Manual | ⏱️ Manual  | ✅ Auto          |
| Free Tier    | ✅ Yes    | ✅ Yes     | ✅ Yes (Upstash) |

---

## Testing

After migration, test with:

```bash
# Send 100 requests rapidly
for i in {1..100}; do
  curl http://localhost:3000/api/your-endpoint
done
```

Expected:

- First 60 requests succeed
- Remaining 40 requests get 429 status

---

## Cleanup Checklist

- [ ] Migrate all endpoints to Redis rate limiting
- [ ] Test each endpoint
- [ ] Remove `lib/rateLimit.ts` (in-memory)
- [ ] Remove `lib/rateLimitPersistent.ts` (database)
- [ ] Update imports across codebase
- [ ] Update documentation

---

**Recommendation:** Keep `rateLimitRedis.ts` as the single source of truth for all rate limiting needs.

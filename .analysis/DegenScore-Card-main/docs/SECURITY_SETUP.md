# 🔐 Security Setup Guide

Quick guide to configure all security features in DegenScore Card.

---

## 📋 Prerequisites

1. **Node.js** 20.x
2. **PostgreSQL** database (Supabase recommended)
3. **Redis** instance (Upstash recommended)
4. **Solana** wallet for treasury

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-org/DegenScore-Card.git
cd DegenScore-Card
npm install
```

### 2. Environment Configuration

Create `.env.local`:

```env
# ============================================================================
# REQUIRED - Database
# ============================================================================
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:pass@host:5432/db"

# ============================================================================
# REQUIRED - Authentication (CRITICAL!)
# ============================================================================
# ⚠️ MUST be server-only (no NEXT_PUBLIC_ prefix)
# ⚠️ MUST be at least 32 characters
# Generate with: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long-and-random"

# ============================================================================
# REQUIRED - Blockchain
# ============================================================================
HELIUS_API_KEY="your-helius-api-key"
HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=your-key"
TREASURY_WALLET="YourTreasuryPublicKeyHere"
MINT_PRICE_SOL="0.01"

# ============================================================================
# REQUIRED - Redis (Rate Limiting & Replay Protection)
# ============================================================================
UPSTASH_REDIS_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_TOKEN="your-redis-token"

# ============================================================================
# RECOMMENDED - CAPTCHA (Bot Protection)
# ============================================================================
CAPTCHA_ENABLED="true"
HCAPTCHA_SECRET="your-hcaptcha-secret"
NEXT_PUBLIC_HCAPTCHA_SITE_KEY="your-hcaptcha-site-key"

# ============================================================================
# OPTIONAL - Monitoring
# ============================================================================
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn"
SENTRY_ORG="your-org"
SENTRY_PROJECT="degenscore"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# ============================================================================
# OPTIONAL - AI Features
# ============================================================================
OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-4"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npm run db:seed
```

### 4. Verify Configuration

```bash
# Run configuration check
npm run config:check

# Expected output:
# ✅ JWT_SECRET configured (48 chars)
# ✅ DATABASE_URL configured
# ✅ REDIS configured and connected
# ✅ HELIUS_API_KEY configured
# ⚠️  CAPTCHA_ENABLED=false (recommended for production)
```

### 5. Start Development

```bash
npm run dev
```

---

## 🔐 Security Features Verification

### Test Authentication Flow

```bash
# 1. Get challenge
curl -X POST http://localhost:3000/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"So1a..."}'

# 2. Sign message with wallet (use wallet UI or CLI)

# 3. Verify signature
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey":"So1a...",
    "signature":"5KJx...",
    "message":"DegenScore Card Authentication...",
    "timestamp":1234567890000
  }'

# Expected: { "success": true, "sessionToken": "eyJ..." }
```

### Test Replay Attack Protection

```bash
# Try to reuse the same signature
# Second attempt should fail with:
# { "error": "Authentication request already used (replay attack detected)" }
```

### Test Rate Limiting

```bash
# Make 11 rapid requests to analyze endpoint
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"walletAddress":"So1a..."}' &
done

# 11th request should return:
# { "error": "Too Many Requests", "limit": 10, "retryAfter": 42 }
```

### Test Payment Verification

```bash
# With valid Solana transaction
curl -X POST http://localhost:3000/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress":"So1a...",
    "paymentSignature":"5KJx..."
  }'

# Expected: { "success": true, "card": {...} }

# Try duplicate (should fail):
# { "error": "Payment signature already used" }
```

---

## 🛡️ Production Deployment Checklist

### Pre-Deployment

- [ ] **JWT_SECRET** generated with `openssl rand -base64 32`
- [ ] **NEVER** use `NEXT_PUBLIC_JWT_SECRET`
- [ ] **Redis** configured (Upstash production plan)
- [ ] **Database** backups configured
- [ ] **CAPTCHA_ENABLED=true** for production
- [ ] **Sentry** configured for error tracking
- [ ] **Environment variables** set in hosting platform
- [ ] **SSL/TLS** certificate configured
- [ ] **CORS** properly configured

### Post-Deployment

- [ ] Test authentication flow
- [ ] Test payment verification
- [ ] Test rate limiting
- [ ] Monitor error rates (Sentry)
- [ ] Check Redis connections
- [ ] Verify database pooling
- [ ] Test CAPTCHA on public endpoints
- [ ] Check security headers (securityheaders.com)

---

## 🔧 Troubleshooting

### "JWT_SECRET not configured"

**Problem**: JWT_SECRET missing or too short

**Solution**:

```bash
# Generate strong secret
openssl rand -base64 32

# Add to .env.local (NOT .env)
JWT_SECRET="<generated-secret-here>"

# Restart server
npm run dev
```

### "Redis not available"

**Problem**: UPSTASH_REDIS_URL or token incorrect

**Solution**:

```bash
# Test Redis connection
curl https://your-redis-url.upstash.io/get/test \
  -H "Authorization: Bearer your-token"

# Should return: {"result":null}

# If fails, regenerate credentials in Upstash dashboard
```

### "Rate limiting temporarily unavailable"

**Problem**: Redis connection issue, rate limiting degraded

**Impact**: Requests still allowed (fail-open) but not rate-limited

**Solution**:

1. Check Redis status (Upstash dashboard)
2. Verify `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN`
3. Check network connectivity
4. Restart application

### "CAPTCHA verification failed"

**Problem**: hCaptcha secret incorrect or token expired

**Solution**:

```bash
# 1. Verify secret in hCaptcha dashboard
# 2. Check CAPTCHA_ENABLED and HCAPTCHA_SECRET in .env
# 3. Ensure client sends fresh token
# 4. Check rate limiting (hCaptcha has limits)
```

### "Replay attack detected"

**Problem**: Attempting to reuse authentication signature

**Expected**: This is working correctly!

**To Fix**: Generate new challenge and sign new message

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

```typescript
// Setup monitoring for:
- Authentication failures (>10/min = potential attack)
- Rate limit hits (>100/min = need capacity increase)
- Payment verification failures (>5/hour = investigate)
- Redis connection errors (immediate alert)
- Database slow queries (>1s = optimize)
```

### Sentry Alerts

Configure alerts for:

- JWT verification errors
- Payment verification failures
- Database connection errors
- Redis unavailable
- CAPTCHA failures (>20/min)

### Log Monitoring

```bash
# Important logs to monitor:
grep "SECURITY" logs/*.log     # Security events
grep "Replay attack" logs/*.log # Attempted replays
grep "Rate limit" logs/*.log    # Rate limit hits
grep "Payment failed" logs/*.log # Failed payments
```

---

## 🔄 Rotating Secrets

### JWT Secret Rotation

**Frequency**: Every 90 days or immediately if compromised

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update environment variable
# WARNING: This invalidates all existing sessions!

# 3. Deploy new secret
# 4. Users will need to re-authenticate
```

### API Key Rotation

```bash
# Helius API Key
# 1. Generate new key in Helius dashboard
# 2. Update HELIUS_API_KEY
# 3. Deploy
# 4. Delete old key after 24h

# Similar for OpenAI, Sentry, etc.
```

---

## 🆘 Emergency Procedures

### Security Incident Response

1. **Immediately**:
   - Rotate all secrets
   - Enable maintenance mode
   - Block suspicious IPs

2. **Within 1 hour**:
   - Investigate logs
   - Identify attack vector
   - Assess data exposure

3. **Within 24 hours**:
   - Deploy fix
   - Notify affected users
   - Document incident

4. **Within 1 week**:
   - Post-mortem
   - Update security practices
   - Third-party audit if needed

### Contact

- **Security Email**: security@degenscore.com
- **On-Call**: [PagerDuty link]
- **Discord**: #security-alerts

---

## 📚 Additional Resources

- [SECURITY.md](../SECURITY.md) - Comprehensive security documentation
- [API Documentation](./API.md) - API endpoints and authentication
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment guide
- [Contributing](../CONTRIBUTING.md) - Security guidelines for contributors

---

**Last Updated**: November 2025

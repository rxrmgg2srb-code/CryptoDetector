# 🚀 Supabase Direct Connection Setup (Recommended for Vercel)

## ⚠️ Issue with Connection Pooling

The PgBouncer pooler (port 6543) is timing out from Vercel. This is a common issue when:

- Network latency between Vercel and Supabase is high
- PgBouncer session mode doesn't play well with Prisma migrations
- Connection pool gets saturated

## ✅ Solution: Use Direct Connection

Direct connection (port 5432) is **more reliable for Vercel deployments**.

---

## 🔧 How to Switch to Direct Connection

### Step 1: Get Your Direct Connection String

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to: **Settings** → **Database** → **Connection String**
4. Select: **"URI"** (not "Connection Pooling")
5. Copy the connection string

It should look like:

```
postgresql://postgres:[YOUR-PASSWORD]@db.thpsbnuxfrlectmqhajx.supabase.co:5432/postgres
```

### Step 2: Format for Vercel

Add these required parameters for Vercel/Prisma:

```
postgresql://postgres:6yiJePuc5ncMqi8z@db.thpsbnuxfrlectmqhajx.supabase.co:5432/postgres?sslmode=require&connect_timeout=10
```

**Required parameters:**

- `?sslmode=require` - SSL encryption (required by Supabase)
- `&connect_timeout=10` - 10 second connection timeout

**Note:**

- Port is `5432` (not 6543)
- **NO** `pgbouncer=true` parameter
- **NO** `connection_limit=1` parameter

### Step 3: Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `DATABASE_URL`
3. Replace with the direct connection string above
4. Save and redeploy

---

## 📊 Comparison: Pooler vs Direct

| Feature               | Connection Pooling (6543)   | Direct Connection (5432)   |
| --------------------- | --------------------------- | -------------------------- |
| **Reliability**       | ⚠️ Can timeout on Vercel    | ✅ Very reliable           |
| **Connection Limit**  | Higher (via pooler)         | Lower (direct to DB)       |
| **Best For**          | High traffic serverless     | Medium traffic, migrations |
| **Prisma Migrations** | ⚠️ Can be problematic       | ✅ Works perfectly         |
| **Latency**           | ⚠️ Extra hop through pooler | ✅ Direct to database      |

---

## 🎯 Your Specific Connection String

Based on your credentials, use this in Vercel:

```
postgresql://postgres:6yiJePuc5ncMqi8z@db.thpsbnuxfrlectmqhajx.supabase.co:5432/postgres?sslmode=require&connect_timeout=10
```

**Copy this exactly ⬆️ and paste into Vercel's DATABASE_URL**

---

## ⚡ Expected Build Output

After switching to direct connection, you should see:

```bash
🔍 Checking DATABASE_URL configuration...
⚠️  WARNING: DATABASE_URL missing pgbouncer=true parameter
For Supabase, use: ?pgbouncer=true&connection_limit=1

⏱️  Running migrations (60s timeout)...
✅ Migrations applied successfully

📋 Verifying migration status...
Database schema is up to date!
```

**Note:** The warning about pgbouncer is expected and safe to ignore when using direct connection.

---

## 🔄 When to Use Each Connection Type

### Use Direct Connection (5432) when:

- ✅ Running migrations (like in Vercel build)
- ✅ Low to medium traffic
- ✅ Reliability is critical
- ✅ Experiencing timeouts with pooler

### Use Connection Pooling (6543) when:

- ✅ Very high traffic production apps
- ✅ Need to maximize concurrent connections
- ✅ **Not** running migrations
- ✅ Using in serverless functions (not builds)

---

## 💡 Production Optimization (Advanced)

For production, you can use **both**:

**Vercel Environment Variables:**

```bash
# For migrations (use in build script)
DATABASE_URL="postgresql://postgres:PASS@db.xxx.supabase.co:5432/postgres?sslmode=require"

# For runtime queries (use in app)
DATABASE_POOL_URL="postgresql://postgres.xxx:PASS@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**In your app code:**

```javascript
// Use pooler for runtime queries
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_POOL_URL || process.env.DATABASE_URL,
    },
  },
});
```

**In Prisma schema:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")          // Used for migrations
  directUrl = env("DATABASE_POOL_URL")    // Used for queries (optional)
}
```

But for now, **just use the direct connection for everything** - it's simpler and works reliably.

---

## 🐛 Troubleshooting

### Still timing out?

1. **Verify password is correct**
   - Copy password from Supabase Dashboard → Settings → Database → Reset Database Password

2. **Check SSL requirement**
   - Supabase **requires** SSL, make sure `?sslmode=require` is included

3. **Test locally first**

   ```bash
   # Update .env.local with direct connection
   npx prisma db push
   ```

   If this works, the connection string is correct.

4. **Verify Supabase project region**
   - Your project is in `eu-west-1`
   - Make sure the connection string matches: `db.thpsbnuxfrlectmqhajx.supabase.co`

---

## ✅ Next Steps

1. **Copy the connection string above**
2. **Update DATABASE_URL in Vercel**
3. **Redeploy** (or push new commit)
4. **Build should complete in ~2-3 minutes** ✅

---

**Updated:** 2025-11-18
**Issue:** Vercel build timing out with PgBouncer pooler
**Solution:** Switch to direct connection (port 5432)

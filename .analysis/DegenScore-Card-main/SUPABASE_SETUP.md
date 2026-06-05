# Supabase Database Configuration Fix

## Problem Solved ✅

The Prisma connection was stuck because:

1. No `.env.local` file existed
2. Missing proper Supabase PgBouncer connection parameters

## What I Fixed

1. **Created `.env.local`** with the correct connection string format
2. **Killed stuck Prisma processes** that were hanging
3. **Added proper PgBouncer parameters** for Supabase

## How to Complete Setup

### Step 1: Get Your Supabase Connection String

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **Settings** > **Database** > **Connection String**
3. Select **Connection Pooling** (Session mode)
4. Copy the connection string (it should include port `6543`)

### Step 2: Update `.env.local`

Edit `/home/user/DegenScore-Card/.env.local` and replace the `DATABASE_URL` with your actual connection string:

```bash
# BEFORE (example):
DATABASE_URL="postgresql://user:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# AFTER (your actual credentials):
DATABASE_URL="postgresql://postgres.YOUR-PROJECT-REF:YOUR-PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**⚠️ CRITICAL:** Make sure to include:

- `?pgbouncer=true` - Required for Supabase pooler
- `&connection_limit=1` - Required for Prisma with PgBouncer

### Step 3: Test the Connection

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Test the connection
npx prisma db push
```

## Why This Happened

**Supabase uses PgBouncer** (connection pooler) on port `6543`. Prisma needs special configuration:

1. **`pgbouncer=true`** - Tells Prisma to use transaction pooling mode
2. **`connection_limit=1`** - Required because PgBouncer pools connections differently

Without these parameters, Prisma hangs trying to establish a connection.

## For Production (Vercel)

Make sure to add these environment variables in **Vercel Dashboard**:

1. Go to: Project Settings > Environment Variables
2. Add: `DATABASE_URL` with your Supabase connection string
3. **Important:** Use the **Connection Pooling** string (port 6543), not Direct Connection

## Connection String Formats

### ✅ CORRECT (Connection Pooling - Port 6543)

```
postgresql://postgres.xxxxx:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### ❌ WRONG (Direct Connection - Port 5432)

```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

The direct connection (port 5432) is for direct database access and doesn't work well with serverless environments like Vercel.

## Next Steps

After updating `.env.local`:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Run migrations
npm run db:migrate

# 3. Start the development server
npm run dev
```

## Need Help?

If you're still having issues:

1. Check your Supabase project isn't paused
2. Verify your database password is correct
3. Make sure your IP is allowed in Supabase (usually it allows all by default)
4. Check Supabase project status at: https://status.supabase.com/

---

**File created:** `2025-11-18`
**Issue:** Prisma connection stuck for 17 minutes
**Fixed by:** Claude Code


# 🚀 DegenScore Deployment Guide

This guide details how to deploy the **DegenScore** platform to production. It covers the Database, Backend (Serverless), and Frontend.

## 📋 Prerequisites

Before you start, ensure you have accounts with:

1.  **Vercel** (Frontend & Serverless Functions)
2.  **Supabase** (PostgreSQL Database)
3.  **Helius** (Solana RPC & API)
4.  **Upstash** (Redis Cache)

---

## 1. Database Setup (Supabase)

1.  Create a new project in [Supabase](https://supabase.com).
2.  Go to **Project Settings > Database** and copy the `Connection String` (Transaction Pooler).
3.  Go to the **SQL Editor** in Supabase and run the initialization script (if not using Prisma Migrate in CI):

    ```bash
    # Locally, simply run:
    npx prisma db push
    ```

---

## 2. Infrastructure Services

### Helius (RPC & API)
1.  Sign up at [Helius.dev](https://helius.dev).
2.  Create a new API Key.
3.  This key is critical for fetching transaction history and parsing DeFi swaps.

### Upstash (Redis)
1.  Create a Redis database at [Upstash](https://upstash.com).
2.  Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## 3. Environment Variables

Configure these variables in your deployment platform (Vercel):

```env
# Database
DATABASE_URL="postgres://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Solana / Helius
HELIUS_API_KEY="your-helius-key-here"
NEXT_PUBLIC_HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=..."
NEXT_PUBLIC_SOLANA_NETWORK="mainnet-beta"

# Authentication
NEXTAUTH_SECRET="generate-a-random-string-here"
NEXTAUTH_URL="https://your-domain.com"

# Redis (Caching)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# App Config
NEXT_PUBLIC_ENABLE_DEMO_MODE="false" # Set 'true' to price everything at 0.0001 SOL
```

---

## 4. Deploying to Vercel

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel login`
3.  Run `vercel` in the project root.
4.  Set the Environment Variables in the Vercel Dashboard (Settings > Environment Variables).
5.  **Important**: Ensure functionality by checking limits. The Pro plan is recommended for high traffic.

---

## 5. Post-Deployment Verification

1.  **Test Login**: Connect a phantom wallet.
2.  **Test Scoring**: Click "Analyze Portfolio". It should fetch data from Helius.
3.  **Test Payments**: (Optional) Switch `NEXT_PUBLIC_ENABLE_DEMO_MODE` to `true` to test payments with dust amounts.

## 🤝 Handover Notes

- **Code Ownership**: The code is standard Next.js 14. No exotic frameworks.
- **Maintenance**: Regular updates via `npm update` are recommended.
- **Support**: Supabase and Helius have excellent documentation for scaling.

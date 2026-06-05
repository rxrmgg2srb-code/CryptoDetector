# 🚀 Render Deployment - Environment Variables Update

**Date**: 2025-11-16
**Reason**: Security credential rotation after exposure in git history

---

## 📋 Updated Environment Variables

You need to update the following environment variables in your Render dashboard:

### 🔐 Critical Updates (Required Immediately)

1. **DATABASE_URL** (Supabase - NEW PASSWORD)

   ```
   postgresql://postgres.thpsbnuxfrlectmqhajx:6yiJePuc5ncMqi8z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
   ```

2. **HELIUS_API_KEY** (NEW KEY)

   ```
   a60d4b18-2322-468c-99a2-feaaffecea58
   ```

3. **HELIUS_RPC_URL** (with new key)
   ```
   https://mainnet.helius-rpc.com/?api-key=a60d4b18-2322-468c-99a2-feaaffecea58
   ```

### 🔑 New Security Secrets (Required)

4. **JWT_SECRET**

   ```
   jfp1A05aEMDTLXQSllD75ztCoZR6mamRY6OSCBf+YeA=
   ```

5. **CRON_API_KEY**

   ```
   Lh6Mw8Ma1W0DXMUDfOjW6vloke92JOth8v+blTK/0Hc=
   ```

6. **WEBHOOK_SECRET**
   ```
   sIcKKlqdid3V+nhVd+wkYfK6tF84ExldnXbihyaXLdY=
   ```

### ✅ Existing Variables (Keep as-is)

7. **TREASURY_WALLET**

   ```
   Pf9yHR1qmkY9geMLfMJs7JD4yXZURkiaxm5h7K61J7N
   ```

8. **NEXT_PUBLIC_TREASURY_WALLET**

   ```
   Pf9yHR1qmkY9geMLfMJs7JD4yXZURkiaxm5h7K61J7N
   ```

9. **NEXT_PUBLIC_SOLANA_NETWORK**

   ```
   mainnet-beta
   ```

10. **NEXT_PUBLIC_HELIUS_RPC_URL** (with new key)

    ```
    https://mainnet.helius-rpc.com/?api-key=a60d4b18-2322-468c-99a2-feaaffecea58
    ```

11. **ADMIN_WALLETS**
    ```
    Pf9yHR1qmkY9geMLfMJs7JD4yXZURkiaxm5h7K61J7N
    ```

---

## 🛠️ Step-by-Step Update Guide

### 1. Access Render Dashboard

1. Go to: https://dashboard.render.com/
2. Login to your account
3. Find your DegenScore project

### 2. Navigate to Environment Variables

1. Click on your **Web Service** (DegenScore-Card)
2. Go to the **Environment** tab in the left sidebar
3. Scroll down to **Environment Variables** section

### 3. Update Each Variable

For each variable listed above:

1. **If it already exists**:
   - Click the **Edit** button (pencil icon)
   - Replace the old value with the new value
   - Click **Save**

2. **If it doesn't exist**:
   - Click **Add Environment Variable**
   - Enter the **Key** (e.g., `JWT_SECRET`)
   - Enter the **Value** (from the list above)
   - Click **Save**

### 4. Redeploy Your Application

After updating all variables:

1. Click **Manual Deploy** → **Deploy latest commit**
2. Wait for deployment to complete (usually 2-5 minutes)
3. Check deployment logs for any errors

### 5. Verify Deployment

1. Visit your deployed URL (e.g., https://degenscore-card.onrender.com)
2. Test critical features:
   - Database connectivity (check leaderboard loads)
   - Helius API (check wallet score generation)
   - Authentication (if applicable)

---

## 🔍 Troubleshooting

### Issue: "Database connection failed"

**Cause**: DATABASE_URL might be incorrect or Supabase password not updated.

**Solution**:

1. Verify DATABASE_URL in Render matches exactly (including password: `6yiJePuc5ncMqi8z`)
2. Check Supabase dashboard that password was actually reset
3. Redeploy after confirming

### Issue: "Helius API rate limit exceeded"

**Cause**: Old API key still in use.

**Solution**:

1. Verify HELIUS_API_KEY matches: `a60d4b18-2322-468c-99a2-feaaffecea58`
2. Verify HELIUS_RPC_URL contains the new key
3. Check both HELIUS_RPC_URL and NEXT_PUBLIC_HELIUS_RPC_URL

### Issue: "Deployment failed"

**Cause**: Missing required environment variables.

**Solution**:

1. Verify ALL variables from the list are present
2. Check for typos in variable names (case-sensitive)
3. Check Render build logs for specific errors

---

## 📝 Complete Environment Variables Checklist

Copy this to ensure you have everything:

```bash
# Database
✓ DATABASE_URL

# Helius
✓ HELIUS_API_KEY
✓ HELIUS_RPC_URL
✓ NEXT_PUBLIC_HELIUS_RPC_URL

# Wallets
✓ TREASURY_WALLET
✓ NEXT_PUBLIC_TREASURY_WALLET
✓ ADMIN_WALLETS

# App Config
✓ NEXT_PUBLIC_SOLANA_NETWORK
✓ NEXT_PUBLIC_APP_URL (if used)

# Security
✓ JWT_SECRET
✓ CRON_API_KEY
✓ WEBHOOK_SECRET

# Optional (if configured)
□ DISCORD_WEBHOOK_URL
□ TELEGRAM_BOT_TOKEN
□ TELEGRAM_CHANNEL_ID
□ NEXT_PUBLIC_SENTRY_DSN
□ UPSTASH_REDIS_REST_URL
□ UPSTASH_REDIS_REST_TOKEN
```

---

## 🎯 Expected Timeline

| Step                          | Time          |
| ----------------------------- | ------------- |
| Update variables in dashboard | 5-10 min      |
| Trigger redeploy              | 1 min         |
| Wait for deployment           | 2-5 min       |
| Verify application works      | 2-3 min       |
| **Total**                     | **10-20 min** |

---

## 🔗 Useful Links

- **Render Dashboard**: https://dashboard.render.com/
- **Render Docs - Environment Variables**: https://render.com/docs/configure-environment-variables
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Helius Dashboard**: https://dashboard.helius.dev/

---

## ✅ Completion Checklist

After completing all steps, mark these as done:

- [ ] All 11 required environment variables updated in Render
- [ ] Application redeployed successfully
- [ ] No errors in deployment logs
- [ ] Application accessible at deployed URL
- [ ] Database queries working (leaderboard loads)
- [ ] Helius API working (score generation works)
- [ ] SECURITY_NOTICE.md marked as resolved

---

**Last Updated**: 2025-11-16
**Next Review**: After successful deployment

**Delete this file after successful deployment.**

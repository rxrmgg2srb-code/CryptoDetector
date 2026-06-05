# Database Schema Fix Summary

## Issue Fixed

**Error:** `The column DegenCard.deletedAt does not exist in the current database`

**Root Cause:** The Prisma migration for the `deletedAt` column (soft delete feature) was created but never applied to the production database on Vercel deployments.

## Changes Made

### 1. Updated Vercel Build Configuration

**File:** `vercel.json`

```json
{
  "buildCommand": "bash scripts/vercel-build.sh"
}
```

This ensures migrations run automatically during every Vercel deployment.

### 2. Created Vercel Build Script

**File:** `scripts/vercel-build.sh`

A robust build script that:

- Applies Prisma migrations during build
- Generates Prisma Client
- Builds Next.js application
- Includes graceful error handling

### 3. Added Helper NPM Scripts

**File:** `package.json`

New scripts for database management:

```json
{
  "build:vercel": "bash scripts/vercel-build.sh",
  "db:migrate": "npx prisma migrate deploy",
  "db:migrate:status": "npx prisma migrate status",
  "db:fix-schema": "npx prisma migrate deploy && npx prisma generate"
}
```

### 4. Created Fix Documentation

**File:** `FIXME_DATABASE_SCHEMA.md`

Comprehensive guide with 4 different fix options:

1. Redeploy on Vercel (recommended)
2. Run migration via Vercel CLI
3. Run migration via database client (SQL)
4. Use Vercel's shell feature

## How to Apply the Fix

### Immediate Fix (Production)

**Option A: Trigger Vercel Redeploy**

```bash
# Commit and push these changes
git add .
git commit -m "fix: add automatic database migrations to Vercel builds"
git push

# Vercel will automatically redeploy and apply migrations
```

**Option B: Manual Migration (Fastest)**

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your_production_database_url"

# Run the fix script
npm run db:fix-schema

# Verify
npm run db:migrate:status
```

### Preventing Future Issues

✅ **Render deployments:** Already configured correctly via `render.yaml`

✅ **Vercel deployments:** Now configured correctly via `vercel.json` + `scripts/vercel-build.sh`

All future deployments will automatically apply database migrations.

## Migration Details

**Migration file:** `prisma/migrations/20251118015447_add_soft_delete/migration.sql`

**What it does:**

```sql
-- Adds deletedAt column for soft deletes
ALTER TABLE "DegenCard" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Creates indexes for efficient queries
CREATE INDEX "DegenCard_deletedAt_idx" ON "DegenCard"("deletedAt");
CREATE INDEX "DegenCard_isPaid_deletedAt_degenScore_idx"
  ON "DegenCard"("isPaid", "deletedAt", "degenScore" DESC);
CREATE INDEX "DegenCard_deletedAt_isPaid_degenScore_idx"
  ON "DegenCard"("deletedAt", "isPaid", "degenScore" DESC);
```

## Testing the Fix

After applying the fix, verify it works:

```bash
# 1. Check migration status
npm run db:migrate:status

# Expected: "Database schema is up to date!"

# 2. Test the API endpoint
curl -X POST https://your-app.vercel.app/api/save-card \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "CEBiKkD8q6F28byTb9iVqPUiojv9n5bHEW5wEJJpVAQE",
    "degenScore": 0,
    "totalTrades": 0,
    "totalVolume": 0,
    "profitLoss": 0,
    "winRate": 0
  }'

# Should return success instead of column error
```

## Files Modified

1. ✅ `vercel.json` - Updated build command
2. ✅ `scripts/vercel-build.sh` - New build script (created)
3. ✅ `package.json` - Added migration scripts
4. ✅ `FIXME_DATABASE_SCHEMA.md` - Fix guide (created)
5. ✅ `DATABASE_SCHEMA_FIX_SUMMARY.md` - This file (created)

## Deployment Checklist

- [ ] Review changes in this commit
- [ ] Push changes to repository
- [ ] Verify Vercel redeploys automatically
- [ ] Check Vercel build logs for "Migrations applied successfully"
- [ ] Test API endpoint `/api/save-card`
- [ ] Verify no more `deletedAt` column errors
- [ ] Monitor production logs for 24 hours

## Next Steps

1. **Commit these changes:**

   ```bash
   git add .
   git commit -m "fix: add automatic database migrations for Vercel deployments"
   git push origin claude/fix-database-schema-01SnuyQZvqDWzwJLqCShf4WN
   ```

2. **Merge to main branch** (or trigger redeploy)

3. **Monitor deployment logs** to confirm migrations run successfully

4. **Verify production** - Check that save-card API works without errors

## Support Resources

- **Fix Guide:** `FIXME_DATABASE_SCHEMA.md`
- **Migration Guide:** `MIGRATION_GUIDE.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Build Script:** `scripts/vercel-build.sh`
- **Migration Script:** `scripts/migrate-and-start.js`

---

**Status:** ✅ Ready to deploy
**Impact:** 🔧 Fixes critical production error
**Breaking Changes:** ❌ None (backwards compatible)

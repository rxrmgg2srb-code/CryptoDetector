# 🔧 FIX: Database Schema Missing `deletedAt` Column

## The Error

```
Invalid `prisma.degenCard.upsert()` invocation:
The column `DegenCard.deletedAt` does not exist in the current database.
```

## Root Cause

The Prisma schema includes a `deletedAt` column for soft deletes, but the production database hasn't been updated with this migration yet.

## Quick Fix Options

### Option 1: Redeploy on Vercel (Recommended)

The simplest fix - just trigger a new deployment:

```bash
# Using Vercel CLI
vercel --prod

# Or push to your main branch to trigger auto-deployment
git push origin main
```

**Why this works:** The updated `vercel.json` now includes `npx prisma migrate deploy` in the build command, which will automatically apply the missing migration during deployment.

### Option 2: Run Migration Manually via Vercel CLI

If you have Vercel CLI installed and configured:

```bash
# 1. Set your DATABASE_URL environment variable locally
export DATABASE_URL="your_production_database_url"

# 2. Apply migrations directly to production database
npx prisma migrate deploy

# 3. Verify migrations were applied
npx prisma migrate status
```

### Option 3: Run Migration via Database Client

If you have direct access to your PostgreSQL database:

```sql
-- Connect to your production database and run:

-- Add the deletedAt column
ALTER TABLE "DegenCard" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Create the required indexes
CREATE INDEX "DegenCard_deletedAt_idx" ON "DegenCard"("deletedAt");
CREATE INDEX "DegenCard_isPaid_deletedAt_degenScore_idx" ON "DegenCard"("isPaid", "deletedAt", "degenScore" DESC);
CREATE INDEX "DegenCard_deletedAt_isPaid_degenScore_idx" ON "DegenCard"("deletedAt", "isPaid", "degenScore" DESC);
```

### Option 4: Use Vercel's Shell Feature

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → General → Functions
4. Click "Shell" or use the deployment shell
5. Run:
   ```bash
   npx prisma migrate deploy
   ```

## Verification

After applying the fix, verify it worked:

```bash
# Check migration status
npx prisma migrate status

# Expected output:
# Database schema is up to date!
```

Or test the API endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/save-card \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"test123","degenScore":100,...}'

# Should no longer error about missing column
```

## Prevention

To prevent this issue in the future:

### ✅ For Vercel Deployments

The `vercel.json` has been updated to include migrations in the build process:

```json
{
  "buildCommand": "bash scripts/vercel-build.sh"
}
```

This ensures migrations run automatically on every deployment.

### ✅ For Render Deployments

The `render.yaml` already uses the correct start command:

```yaml
startCommand: node scripts/migrate-and-start.js
```

This runs migrations on every deployment.

### ✅ Environment Variable

Make sure `DATABASE_URL` is set in your deployment environment:

- **Vercel**: Project Settings → Environment Variables → Add `DATABASE_URL`
- **Render**: Dashboard → Environment → Add Environment Variable → `DATABASE_URL`

## Understanding the Migration

The migration file is located at:

```
prisma/migrations/20251118015447_add_soft_delete/migration.sql
```

It adds:

- `deletedAt` column (nullable timestamp) to `DegenCard` table
- Indexes for efficient querying with soft deletes
- Composite indexes for leaderboard queries filtering deleted cards

This enables "soft delete" functionality where records are marked as deleted instead of being removed from the database.

## Still Having Issues?

1. **Check your DATABASE_URL** - Make sure it points to the correct production database
2. **Check permissions** - The database user needs CREATE, ALTER, and INDEX permissions
3. **Check migration history** - Run `npx prisma migrate status` to see which migrations are applied
4. **Check logs** - Look at Vercel deployment logs for migration errors

## Support

- Check deployment logs in Vercel dashboard
- Verify database connectivity
- Ensure all environment variables are set correctly
- Review the migration file for any conflicts

# Database Migration Guide

## Issue: Missing `deletedAt` Column

If you're seeing an error like:

```
The column `DegenCard.deletedAt` does not exist in the current database.
```

This means the soft delete migration hasn't been applied to your production database yet.

## Solution

### Option 1: Restart the Application (Recommended)

If you're using Render.com or similar platforms with the `render.yaml` configuration:

1. **Trigger a new deployment** or **manually restart** your web service
2. The `scripts/migrate-and-start.js` will automatically run migrations on startup

### Option 2: Run Migrations Manually

If you need to run migrations separately:

```bash
# Using the standalone migration script
NODE_ENV=production node scripts/run-migrations.js

# Or using Prisma CLI directly
npx prisma migrate deploy
```

### Option 3: Using Render.com Shell

If you have access to the Render.com dashboard:

1. Go to your web service
2. Click on **Shell** tab
3. Run the migration command:
   ```bash
   node scripts/run-migrations.js
   ```

## Verifying the Migration

After running migrations, verify they were applied:

```bash
npx prisma migrate status
```

You should see output indicating all migrations are applied:

```
Database schema is up to date!
```

## Migration Details

The soft delete migration adds:

- `deletedAt` column to the `DegenCard` table (nullable timestamp)
- Indexes for efficient querying with soft deletes
- Composite indexes for leaderboard queries with deletion status

## Troubleshooting

### Error: "DATABASE_URL is not set"

Make sure the `DATABASE_URL` environment variable is properly configured in your deployment environment.

### Error: "Migration failed"

Check:

1. Database is accessible from your server
2. Database user has proper permissions (CREATE, ALTER, INDEX)
3. No conflicting schema changes were made manually

### Error: "Migration already applied"

If migrations show as already applied but the column is missing, the database might be out of sync. Contact your database administrator or check if you're connecting to the correct database.

## Prevention

To prevent this issue in the future:

- Always run `npm run start:migrate` instead of `npm start` in production
- Ensure your deployment configuration uses `node scripts/migrate-and-start.js` as the start command
- Test migrations in a staging environment before deploying to production

## Need Help?

If you continue experiencing issues:

1. Check the server logs for detailed error messages
2. Verify your `DATABASE_URL` is correct
3. Ensure the database server is running and accessible
4. Check that the Prisma version matches between your local and production environments

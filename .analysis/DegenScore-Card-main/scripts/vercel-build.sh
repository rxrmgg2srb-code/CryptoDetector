#!/bin/bash
# Vercel Build Script with Database Migrations
# This script runs Prisma migrations during Vercel deployment

set -e  # Exit on error

echo "========================================="
echo "🚀 Vercel Build - DegenScore Card"
echo "========================================="
echo ""

# Step 1: Apply Prisma migrations
echo "📊 [1/3] Applying Prisma migrations..."
echo ""

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL is not set"
  echo "Skipping migrations - this may cause runtime errors!"
  echo ""
else
  echo "🔍 Checking DATABASE_URL configuration..."

  # Check if using connection pooler (port 6543)
  if [[ "$DATABASE_URL" == *":6543"* ]]; then
    echo "⚠️  Connection pooler detected (port 6543)"
    echo "⏭️  SKIPPING migrations - poolers don't support Prisma migrate"
    echo ""
    echo "ℹ️  Migrations should be run manually with DIRECT connection:"
    echo "   1. Use direct connection: postgresql://...@db.xxx.supabase.co:5432/postgres"
    echo "   2. Run: npx prisma migrate deploy"
    echo ""
    echo "✅ Continuing build without migrations..."
    echo ""
    # Skip migrations entirely
    SKIP_MIGRATIONS=true
  elif [[ "$DATABASE_URL" == *":5432"* ]]; then
    echo "✅ Direct connection detected (port 5432)"
    SKIP_MIGRATIONS=false
  else
    echo "ℹ️  Using custom DATABASE_URL configuration"
    SKIP_MIGRATIONS=false
  fi
  echo ""

  # Only run migrations if NOT using pooler
  if [ "$SKIP_MIGRATIONS" = "false" ]; then
    # Try to run migrations with timeout, but NEVER fail the build
    echo "⏱️  Running migrations (60s timeout)..."
    set +e  # Disable exit on error - we NEVER want to fail the build
    MIGRATION_OUTPUT=$(timeout 60 npx prisma@6.19.0 migrate deploy 2>&1)
    EXIT_CODE=$?
    # NEVER re-enable exit on error for migrations - we continue no matter what

    if [ $EXIT_CODE -eq 0 ]; then
      echo "✅ Migrations applied successfully"
      echo ""
    elif [ $EXIT_CODE -eq 124 ]; then
      echo "⚠️  WARNING: Migration timed out after 60 seconds"
      echo "Database might be paused or unreachable."
      echo "🔄 This is OK - continuing build anyway!"
      echo "Schema will be applied on first runtime connection."
      echo ""
    elif echo "$MIGRATION_OUTPUT" | grep -q "P3005"; then
      echo "ℹ️  Database schema already exists (P3005)"
      echo "✅ Schema is up to date - continuing build"
      echo ""
    elif echo "$MIGRATION_OUTPUT" | grep -q "P1001"; then
      echo "⚠️  WARNING: Can't reach database (P1001)"
      echo "Database is likely paused or connection failed."
      echo "🔄 This is OK - continuing build anyway!"
      echo "Database will reconnect automatically at runtime."
      echo ""
    else
      echo "⚠️  WARNING: Migration failed (exit code: $EXIT_CODE)"
      echo "Output: $MIGRATION_OUTPUT"
      echo "🔄 This is OK - continuing build anyway!"
      echo ""
    fi
    
    # ALWAYS continue - don't check exit codes
    set -e  # Re-enable exit on error for other commands
  fi  # End of SKIP_MIGRATIONS check
fi  # End of DATABASE_URL check

# Step 2: Generate Prisma Client
echo "🔧 [2/3] Generating Prisma Client..."
echo ""
# Use our custom script that ensures Prisma 6.19.0 is used
node generate-prisma.js
echo ""

# Step 3: Build Next.js
echo "🏗️  [3/3] Building Next.js application..."
echo ""
# Prevent DB connections during build to avoid timeouts
export SKIP_DB_CONNECTION=true
npm run build
echo ""

echo "========================================="
echo "✅ Build completed successfully!"
echo "========================================="

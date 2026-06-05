#!/bin/bash

# 🔧 Migrate Rate Limiting Imports to Redis
# CVE-DEGEN-008 Fix

echo "🚀 Migrating rate limit imports to Redis..."
echo ""

# Find all files with rateLimit imports
files=$(grep -rl "from.*rateLimit" pages/api lib --include="*.ts" --include="*.tsx" 2>/dev/null)

count=0

for file in $files; do
  # Skip the rateLimit.ts and rateLimitRedis.ts files themselves
  if [[ "$file" == *"rateLimit.ts" ]] || [[ "$file" == *"rateLimitRedis.ts" ]] || [[ "$file" == *"rateLimitPersistent.ts" ]]; then
    continue
  fi

  # Check if file contains rateLimit import
  if grep -q "from.*@/lib/rateLimit" "$file" || grep -q "from.*'.*lib/rateLimit'" "$file" || grep -q 'from.*".*lib/rateLimit"' "$file"; then
    # Replace the import
    sed -i "s|from '@/lib/rateLimit'|from '@/lib/rateLimitRedis'|g" "$file"
    sed -i 's|from "@/lib/rateLimit"|from "@/lib/rateLimitRedis"|g' "$file"
    sed -i "s|from '../../lib/rateLimit'|from '../../lib/rateLimitRedis'|g" "$file"
    sed -i 's|from "../../lib/rateLimit"|from "../../lib/rateLimitRedis"|g' "$file"
    sed -i "s|from '../lib/rateLimit'|from '../lib/rateLimitRedis'|g" "$file"
    sed -i 's|from "../lib/rateLimit"|from "../lib/rateLimitRedis"|g' "$file"

    # Make handler async if it calls rateLimit (since Redis version is async)
    if grep -q "strictRateLimit\|rateLimit\|paymentRateLimit" "$file"; then
      # Check if handler is already async
      if ! grep -q "export default async function handler" "$file" && ! grep -q "async function handler" "$file"; then
        sed -i "s|export default function handler|export default async function handler|g" "$file"
        sed -i "s|function handler(|async function handler(|g" "$file"
      fi

      # Add await to rateLimit calls if not already present
      sed -i "s|if (!rateLimit(|if (!(await rateLimit(|g" "$file"
      sed -i "s|if (!strictRateLimit(|if (!(await strictRateLimit(|g" "$file"
      sed -i "s|if (!paymentRateLimit(|if (!(await paymentRateLimit(|g" "$file"

      # Fix double await if any
      sed -i "s|await await|await|g" "$file"
    fi

    echo "✅ Migrated: $file"
    ((count++))
  fi
done

echo ""
echo "✨ Complete! Migrated $count files"
echo ""
echo "📝 Next steps:"
echo "1. Verify changes: git diff"
echo "2. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are in .env"
echo "3. Run tests: npm test"

#!/usr/bin/env node

/**
 * 🔧 Migrate Rate Limiting from In-Memory to Redis
 *
 * CVE-DEGEN-008 Fix: Replace in-memory rate limiting with Redis-based
 *
 * Strategy:
 * - Replace: import { rateLimit } from '@/lib/rateLimit'
 * - With: import { rateLimitMiddleware } from '@/lib/rateLimitRedis'
 * - Update function calls to use the new middleware
 */

const fs = require('fs');
const path = require('path');

// Files to migrate
const FILES_TO_MIGRATE = [
  'pages/api/verify-payment.ts',
  'pages/api/spots-remaining.ts',
  'pages/api/recent-activity.ts',
  'pages/api/apply-promo-code.ts',
  'pages/api/update-profile.ts',
  'pages/api/upload-profile-image.ts',
  'pages/api/referrals/check-rewards.ts',
  'pages/api/save-card.ts',
  'pages/api/leaderboard.ts',
  'pages/api/like.ts',
  'pages/api/generate-card-async.ts',
  'pages/api/auth/verify.ts',
  'pages/api/analyze.ts',
  'pages/api/auth/challenge.ts',
  'pages/api/export/card.ts',
];

function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipped (not found): ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace import statement
  if (content.includes("from '@/lib/rateLimit'") || content.includes("from '@/lib/rateLimit'")) {
    content = content.replace(
      /import\s*{\s*rateLimit\s*}\s*from\s*['"]@\/lib\/rateLimit['"]/g,
      "import { rateLimitMiddleware } from '@/lib/rateLimitRedis'"
    );
    content = content.replace(
      /import\s*{\s*rateLimit\s*}\s*from\s*['"]\.\.\/\.\.\/lib\/rateLimit['"]/g,
      "import { rateLimitMiddleware } from '../../lib/rateLimitRedis'"
    );
    content = content.replace(
      /import\s*{\s*rateLimit\s*}\s*from\s*['"]\.\.\/lib\/rateLimit['"]/g,
      "import { rateLimitMiddleware } from '../lib/rateLimitRedis'"
    );
    modified = true;
  }

  // Replace function calls: rateLimit(req, res) → await rateLimitMiddleware()(req, res)
  // Pattern 1: if (!rateLimit(req, res))
  if (/if\s*\(\s*!rateLimit\(req,\s*res\)/.test(content)) {
    // Extract endpoint name from file path
    const endpoint = filePath.replace('pages/api/', '').replace('.ts', '').replace('/', '-');

    // Add comment about the migration
    content = content.replace(
      /if\s*\(\s*!rateLimit\(req,\s*res\)\s*\)\s*{\s*return;?\s*}/g,
      `// Rate limiting with Redis\n  const rateLimitResult = await rateLimitMiddleware('${endpoint}')(req, res);\n  if (rateLimitResult === undefined) return; // Rate limited`
    );
    modified = true;
  }

  // Pattern 2: Check if handler is async
  if (
    modified &&
    !/async\s+function\s+handler/.test(content) &&
    !/export\s+default\s+async\s+function/.test(content)
  ) {
    // Make handler async if it's not
    content = content.replace(
      /export\s+default\s+function\s+handler/g,
      'export default async function handler'
    );
    content = content.replace(/function\s+handler\(/g, 'async function handler(');
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
  }

  return false;
}

// Main execution
console.log('🚀 Migrating rate limiting to Redis...\n');

let migratedCount = 0;

for (const file of FILES_TO_MIGRATE) {
  if (migrateFile(file)) {
    console.log(`✅ Migrated: ${file}`);
    migratedCount++;
  } else {
    console.log(`⏭️  Skipped: ${file}`);
  }
}

console.log(`\n✨ Complete! Migrated ${migratedCount}/${FILES_TO_MIGRATE.length} files`);

console.log('\n📝 Manual steps required:');
console.log('1. Review each migrated file for proper async/await usage');
console.log('2. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are in .env');
console.log('3. Test all endpoints to ensure rate limiting works');
console.log('4. Run: npm test');

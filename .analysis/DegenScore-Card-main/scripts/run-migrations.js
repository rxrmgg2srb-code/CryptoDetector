#!/usr/bin/env node
/**
 * 🔄 Standalone Migration Script
 *
 * Use this script to manually apply Prisma migrations to the database.
 * This is useful for production deployments or when migrations need to be
 * run separately from the server startup.
 *
 * Usage:
 *   NODE_ENV=production node scripts/run-migrations.js
 */

const { execSync } = require('child_process');

console.log('========================================');
console.log('🔄 Running Prisma Migrations');
console.log('========================================');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT SET'}`);
console.log('========================================\n');

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL before running migrations.\n');
  process.exit(1);
}

try {
  console.log('📊 Applying migrations...\n');

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });

  console.log('\n========================================');
  console.log('✅ Migrations applied successfully!');
  console.log('========================================\n');

  // Show migration status
  console.log('📋 Migration status:\n');
  execSync('npx prisma migrate status', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });

  process.exit(0);
} catch (error) {
  console.error('\n========================================');
  console.error('❌ ERROR: Migration failed');
  console.error('========================================');
  console.error(error.message);
  console.error('\nPlease check:');
  console.error('1. DATABASE_URL is correct and accessible');
  console.error('2. Database server is running');
  console.error('3. Database user has proper permissions');
  console.error('4. Migration files are not corrupted\n');
  process.exit(1);
}

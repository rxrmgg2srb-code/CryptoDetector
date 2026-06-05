#!/usr/bin/env node
// Script to sync database schema with Prisma
const { execSync } = require('child_process');

console.log('🔄 Starting database sync...\n');

try {
  // Execute prisma db push
  const output = execSync('npx prisma db push --accept-data-loss', {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit',
  });

  console.log('\n✅ Database sync completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Create promo code: npx ts-node scripts/create-promo-code.ts');
  console.log('2. Create weekly challenge: npx ts-node scripts/create-weekly-challenge.ts');
} catch (error) {
  console.error('\n❌ Database sync failed:', error.message);
  process.exit(1);
}

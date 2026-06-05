#!/usr/bin/env node
/**
 * Development Setup Script
 * Automates the initial setup for DegenScore development
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DegenScore Development Setup\n');

// Check Node version
const nodeVersion = process.version;
const requiredVersion = 'v20';
if (!nodeVersion.startsWith(requiredVersion)) {
  console.error(`❌ Node.js ${requiredVersion}.x required, you have ${nodeVersion}`);
  process.exit(1);
}
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env.local not found, creating from example...');
  const examplePath = path.join(__dirname, '..', '.env.local.example');
  fs.copyFileSync(examplePath, envPath);
  console.log('✅ Created .env.local from example');
  console.log('⚠️  IMPORTANT: Edit .env.local with your actual credentials!\n');
} else {
  console.log('✅ .env.local exists\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Generate Prisma Client
console.log('🔨 Generating Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client');
  process.exit(1);
}

// Setup Git hooks (Husky)
console.log('🪝 Setting up Git hooks...');
try {
  execSync('npm run prepare:husky', { stdio: 'inherit' });
  console.log('✅ Git hooks configured\n');
} catch (error) {
  console.log('⚠️  Husky setup skipped (optional)\n');
}

// Check database connection (optional)
console.log('🗄️  Checking database connection...');
try {
  execSync('npx prisma db execute --stdin < /dev/null', { stdio: 'pipe' });
  console.log('✅ Database connection OK\n');
} catch (error) {
  console.log('⚠️  Could not connect to database (may need configuration)\n');
}

console.log('🎉 Setup complete!\n');
console.log('Next steps:');
console.log('  1. Edit .env.local with your API keys');
console.log('  2. Run: npm run dev');
console.log('  3. Open: http://localhost:3000\n');
console.log('For more help, see: docs/development/QUICK_START.md\n');

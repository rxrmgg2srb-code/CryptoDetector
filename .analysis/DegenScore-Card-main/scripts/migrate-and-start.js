#!/usr/bin/env node
/**
 * 🚀 Migrate and Start Script for Render.com
 *
 * This script ensures that:
 * 1. Prisma migrations are applied
 * 2. Prisma client is generated
 * 3. Next.js starts with correct configuration
 */

const { execSync } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('========================================');
console.log('🚀 DegenScore Card - Starting Server');
console.log('========================================');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Host: ${HOST}`);
console.log(`🔌 Port: ${PORT}`);
console.log('========================================\n');

// Step 1: Apply Prisma migrations (production)
if (process.env.NODE_ENV === 'production') {
  console.log('📊 [1/3] Applying Prisma migrations...');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL is not set!');
    console.error('Cannot apply migrations without database connection.');
    console.error('Please set DATABASE_URL environment variable.\n');
    process.exit(1);
  }

  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    });
    console.log('✅ Prisma migrations applied successfully');

    // Verify migration status
    console.log('\n📋 Verifying migration status...');
    execSync('npx prisma migrate status', {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    });
    console.log('');
  } catch (error) {
    console.error('\n========================================');
    console.error('⚠️  WARNING: Prisma migration encountered an issue!');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('\nThis may cause runtime errors if schema is out of sync.');
    console.error('Please check:');
    console.error('1. DATABASE_URL is correct and accessible');
    console.error('2. Database server is running');
    console.error('3. Database user has proper permissions (CREATE, ALTER, INDEX)');
    console.error('4. Migration files are not corrupted');
    console.error('\nServer will attempt to start anyway...\n');

    // Sleep for 3 seconds to ensure error is visible
    execSync('sleep 3');
  }
} else {
  console.log('⏭️  [1/3] Skipping migrations (not in production)\n');
}

// Step 2: Generate Prisma Client (just in case)
console.log('🔧 [2/3] Generating Prisma Client...');
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
  console.log('✅ Prisma Client generated successfully\n');
} catch (error) {
  console.error('❌ ERROR: Failed to generate Prisma Client');
  console.error(error.message);
  process.exit(1);
}

// Step 3: Start Next.js server using programmatic API
console.log(`🚀 [3/3] Starting Next.js on ${HOST}:${PORT}...`);
console.log('');

const http = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname: HOST, port: PORT });
const handle = app.getRequestHandler();

// Prepare Next.js and start server
app
  .prepare()
  .then(() => {
    // Create HTTP server
    const server = http.createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Start listening
    server.listen(PORT, HOST, (err) => {
      if (err) {
        console.error('❌ FATAL ERROR: Failed to start Next.js server');
        console.error(err);
        process.exit(1);
      }

      console.log('\n========================================');
      console.log('✅ Server is ready!');
      console.log(`🌐 Listening on http://${HOST}:${PORT}`);
      console.log(`🏥 Health check: http://${HOST}:${PORT}/api/health`);
      console.log('📡 Ready to accept connections');
      console.log('========================================\n');
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Forward termination signals
    ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
      process.on(signal, () => shutdown(signal));
    });
  })
  .catch((err) => {
    console.error('❌ FATAL ERROR: Failed to prepare Next.js');
    console.error(err);
    process.exit(1);
  });

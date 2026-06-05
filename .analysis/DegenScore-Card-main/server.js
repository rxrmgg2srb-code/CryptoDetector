#!/usr/bin/env node
/**
 * Custom server startup script for Render.com
 * Opens port IMMEDIATELY and prepares Next.js in background
 */

const http = require('http');
const next = require('next');

// Get PORT from environment or use default
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

console.log(`🚀 Starting Next.js server on ${host}:${port}...`);
console.log(`📊 Environment: ${dev ? 'development' : 'production'}`);
console.log(`📝 Database configured: ${!!process.env.DATABASE_URL}`);

// Initialize Next.js app
const app = next({ dev, hostname: host, port });
const handle = app.getRequestHandler();

// Track if Next.js is ready
let nextReady = false;

// Start preparing Next.js in background
console.log('⏳ Preparing Next.js...');
app
  .prepare()
  .then(() => {
    nextReady = true;
    console.log('✅ Next.js is ready!');
  })
  .catch((err) => {
    console.error('❌ Failed to prepare Next.js:', err);
    process.exit(1);
  });

// Create HTTP server IMMEDIATELY (don't wait for Next.js)
const server = http.createServer(async (req, res) => {
  // Health check always responds immediately
  if (req.url === '/api/health' || req.url === '/api/health/') {
    if (!nextReady) {
      // Return simple health check while Next.js is preparing
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          status: 'preparing',
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  // If Next.js not ready, show loading page
  if (!nextReady) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loading...</title>
          <meta http-equiv="refresh" content="2">
        </head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;background:#0a0a0a;color:#fff;">
          <div style="text-align:center;">
            <h1>🚀 Starting server...</h1>
            <p>Please wait, the page will reload automatically.</p>
          </div>
        </body>
      </html>
    `);
  }

  // Next.js is ready, handle normally
  try {
    await handle(req, res);
  } catch (err) {
    console.error('Error handling request:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// Start listening IMMEDIATELY
server.listen(port, host, (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  console.log(`✅ Server listening on http://${host}:${port}`);
  console.log(`📡 Port is open, preparing Next.js...`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

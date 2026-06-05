const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable standalone output for better Docker/Render deployments
  output: 'standalone',

  // Disable ESLint during builds (TypeScript provides sufficient type safety)
  // ESLint can be run separately in CI/CD pipeline
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enable TypeScript type checking during builds
  // This ensures type errors are caught before deployment
  typescript: {
    ignoreBuildErrors: false,
  },

  // Disable font optimization to reduce memory during build
  optimizeFonts: false,

  // Increase timeout for static page generation (default is 60s)
  staticPageGenerationTimeout: 180,

  // Skip static generation for these pages - they timeout during build
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Disable static optimization for specific pages
  // This forces them to be server-rendered on-demand
  onDemandEntries: {
    // Keep pages in memory for 60 seconds
    maxInactiveAge: 60 * 1000,
    // Number of pages to keep simultaneously
    pagesBufferLength: 2,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://js.sentry-cdn.com https://browser.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://extension-cdn.getdirecto.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://*.helius-rpc.com wss://*.helius-rpc.com https://*.supabase.co wss://*.supabase.co https://twitter.com https://t.me https://*.ingest.sentry.io https://pusher.com https://sockjs-eu.pusher.com https://sockjs-us2.pusher.com https://sockjs-us3.pusher.com https://sockjs-ap1.pusher.com https://sockjs-ap2.pusher.com https://sockjs-ap3.pusher.com https://sockjs-ap4.pusher.com",
              "worker-src 'self' blob:",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Performance optimizations
  compress: true,

  // Enable SWC minification for better performance and smaller bundle size
  // SWC is required in Next.js 15+ and provides faster builds
  swcMinify: true,

  // Disable x-powered-by header
  poweredByHeader: false,

  // Webpack optimizations with memory constraints
  webpack: (config, { dev, isServer }) => {
    // 🔥 COPY FONTS to .next for serverless functions in Vercel
    if (isServer) {
      try {
        const CopyPlugin = require('copy-webpack-plugin');
        config.plugins.push(
          new CopyPlugin({
            patterns: [
              {
                from: 'public/fonts',
                to: '../public/fonts',
              },
            ],
          })
        );
        console.log('✅ copy-webpack-plugin loaded - fonts will be copied to build');
      } catch (error) {
        console.warn(
          '⚠️ copy-webpack-plugin not available - fonts will be loaded from public/fonts directly'
        );
        console.warn('   Run: npm install to fix this warning');
      }
    }

    // Reduce memory usage during builds
    config.optimization = {
      ...config.optimization,
      // Minimize memory usage
      minimize: !dev,
      // Reduce parallelization to save memory
      ...(isServer
        ? {}
        : {
            moduleIds: 'deterministic',
            runtimeChunk: 'single',
            splitChunks: {
              chunks: 'all',
              maxSize: 244000, // Split large chunks to reduce memory
              cacheGroups: {
                default: false,
                vendors: false,
                framework: {
                  chunks: 'all',
                  name: 'framework',
                  test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
                  priority: 40,
                  enforce: true,
                },
                commons: {
                  name: 'commons',
                  chunks: 'all',
                  minChunks: 2,
                  priority: 20,
                },
                lib: {
                  test(module) {
                    return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
                  },
                  name(module) {
                    const hash = require('crypto').createHash('sha1');
                    hash.update(module.identifier());
                    return hash.digest('hex').substring(0, 8);
                  },
                  priority: 30,
                  minChunks: 1,
                  reuseExistingChunk: true,
                },
              },
            },
          }),
    };

    // Reduce memory footprint by limiting parallelism
    if (!dev) {
      config.parallelism = 1;
    }

    return config;
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Sentry auth token solo para builds de producción
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Solo subir source maps en producción
  widenClientFileUpload: false, // Reduce memory during build
  hideSourceMaps: true,
  disableLogger: true,

  // Reduce memory usage during build
  dryRun: !process.env.SENTRY_AUTH_TOKEN, // Skip upload if no token
};

// Exportar con Sentry solo si está configurado Y hay auth token
// Esto reduce el uso de memoria durante el build
module.exports =
  process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.SENTRY_AUTH_TOKEN
    ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
    : nextConfig;

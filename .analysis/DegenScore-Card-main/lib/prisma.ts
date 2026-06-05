import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Helper to sanitize and optimize the database URL for Serverless
const getOptimalDatabaseUrl = () => {
  let url = process.env.DATABASE_URL;

  if (!url) {
    return undefined;
  }

  // 🚀 AUTOMATIC OPTIMIZATION FOR SUPABASE + VERCEL
  // If we are in production and using Supabase on port 5432 (Session Pooler),
  // we automatically switch to port 6543 (Transaction Pooler) which is designed for Serverless.
  if (
    process.env.NODE_ENV === 'production' &&
    url.includes('supabase.com') &&
    url.includes(':5432')
  ) {
    console.log(
      '⚡ Auto-optimizing Supabase connection: Switching to Transaction Pooler (port 6543)'
    );
    url = url.replace(':5432', ':6543');
  }

  // Ensure query parameters exist
  const hasQueryParams = url.includes('?');
  const separator = hasQueryParams ? '&' : '?';

  // Append pgbouncer=true if using port 6543 (Transaction Pooler)
  if (url.includes(':6543') && !url.includes('pgbouncer=true')) {
    url += `${separator}pgbouncer=true`;
  }

  // Append connection_limit=1 for Serverless (prevent exhaustion)
  if (!url.includes('connection_limit=')) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}connection_limit=1`;
  }

  // Ensure sslmode=require
  if (!url.includes('sslmode=')) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}sslmode=require`;
  }

  return url;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getOptimalDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import os from 'os';

const prisma = new PrismaClient();

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  database: {
    connected: boolean;
    responseTime?: number;
  };
  services: {
    name: string;
    status: 'up' | 'down';
    latency?: number;
  }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SystemHealth | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.ADMIN_API_KEY;

  if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check database connection
    const dbStart = Date.now();
    let dbConnected = true;
    let dbResponseTime = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbConnected = false;
      console.error('Database health check failed:', error);
    }

    // Memory stats
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // System uptime
    const uptime = process.uptime();

    // Service checks
    const services = [
      {
        name: 'Database',
        status: dbConnected ? ('up' as const) : ('down' as const),
        latency: dbConnected ? dbResponseTime : undefined,
      },
      {
        name: 'API',
        status: 'up' as const,
        latency: 0,
      },
    ];

    // Determine overall health
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!dbConnected) {
      status = 'unhealthy';
    } else if (memoryPercentage > 90) {
      status = 'degraded';
    }

    const health: SystemHealth = {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: memoryPercentage,
      },
      database: {
        connected: dbConnected,
        responseTime: dbConnected ? dbResponseTime : undefined,
      },
      services,
    };

    return res.status(200).json(health);
  } catch (error) {
    console.error('System health check error:', error);
    return res.status(500).json({ error: 'Failed to check system health' });
  }
}

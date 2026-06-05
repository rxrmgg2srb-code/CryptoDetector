import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeTokenSecurity } from '@/lib/services/tokenSecurityAnalyzer';
import { isValidSolanaAddress } from '@/lib/validation';
import { strictRateLimit } from '@/lib/rateLimitRedis';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet } from '@/lib/cache/redis';

/**
 * 🔒 Token Security Analysis API
 *
 * POST /api/analyze-token
 *
 * Analyzes a Solana token for security risks and returns comprehensive report.
 *
 * Request body:
 * {
 *   "tokenAddress": "string",
 *   "forceRefresh": boolean (optional)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "report": TokenSecurityReport,
 *   "cached": boolean
 * }
 */

const CACHE_TTL = 3600; // 1 hour cache
const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply strict rate limiting (expensive operation)
  if (!(await strictRateLimit(req, res))) {
    return;
  }

  try {
    const { tokenAddress, forceRefresh } = req.body;

    // Validate token address
    if (!tokenAddress || typeof tokenAddress !== 'string') {
      return res.status(400).json({ error: 'Token address is required' });
    }

    if (!isValidSolanaAddress(tokenAddress)) {
      return res.status(400).json({ error: 'Invalid Solana token address' });
    }

    logger.info('🔒 Token security analysis requested', { tokenAddress });

    // Define cacheKey at the top level so it's available throughout the function
    const cacheKey = `token:analysis:${tokenAddress}`;

    // Check Redis cache first (if not forcing refresh)
    if (!forceRefresh) {
      const cached = await cacheGet<string>(cacheKey);

      if (cached) {
        logger.info('✅ Returning cached token analysis', { tokenAddress });

        // Update view count asynchronously
        prisma.tokenAnalysis
          .update({
            where: { tokenAddress },
            data: {
              viewCount: { increment: 1 },
              lastViewedAt: new Date(),
            },
          })
          .catch((err: unknown) => {
            logger.error('Failed to update view count', err instanceof Error ? err : undefined);
          });

        return res.status(200).json({
          success: true,
          report: JSON.parse(cached as string),
          cached: true,
        });
      }
    }

    // Check database for recent analysis (if not forcing refresh)
    if (!forceRefresh) {
      const existing = await prisma.tokenAnalysis.findUnique({
        where: { tokenAddress },
      });

      if (existing) {
        const age = Date.now() - existing.analyzedAt.getTime();

        // If analysis is less than 24 hours old, return it
        if (age < STALE_THRESHOLD) {
          logger.info('✅ Returning database cached analysis', {
            tokenAddress,
            ageHours: age / 3600000,
          });

          // Update view count
          await prisma.tokenAnalysis.update({
            where: { tokenAddress },
            data: {
              viewCount: { increment: 1 },
              lastViewedAt: new Date(),
            },
          });

          const report = existing.fullAnalysisJson as any;

          // Cache in Redis
          await cacheSet(cacheKey, JSON.stringify(report), { ttl: CACHE_TTL }).catch(() => {
            // Fail silently
          });

          return res.status(200).json({
            success: true,
            report,
            cached: true,
          });
        }
      }
    }

    // Perform fresh analysis
    logger.info('🔍 Starting fresh token analysis', { tokenAddress });

    const report = await analyzeTokenSecurity(tokenAddress, (progress, message) => {
      logger.info(`Analysis progress: ${progress}% - ${message}`);
    });

    // Save to database
    await saveAnalysisToDatabase(tokenAddress, report);

    // Cache in Redis
    await cacheSet(cacheKey, JSON.stringify(report), { ttl: CACHE_TTL }).catch((err) => {
      logger.error('Failed to cache analysis in Redis', err instanceof Error ? err : undefined);
    });

    logger.info('✅ Token analysis complete', {
      tokenAddress,
      securityScore: report.securityScore,
      riskLevel: report.riskLevel,
    });

    return res.status(200).json({
      success: true,
      report,
      cached: false,
    });
  } catch (error: any) {
    logger.error('❌ Token analysis failed', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    // Don't expose internal errors in production
    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Failed to analyze token. Please try again later.';

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

/**
 * Save analysis results to database
 */
async function saveAnalysisToDatabase(tokenAddress: string, report: any) {
  try {
    await prisma.tokenAnalysis.upsert({
      where: { tokenAddress },
      create: {
        tokenAddress,

        // Basic info
        tokenSymbol: report.metadata.symbol,
        tokenName: report.metadata.name,
        decimals: report.metadata.decimals,
        supply: report.metadata.supply,
        verified: report.metadata.verified,

        // Security scores
        securityScore: report.securityScore,
        authorityScore: report.tokenAuthorities.score,
        holderScore: report.holderDistribution.score,
        liquidityScore: report.liquidityAnalysis.score,
        tradingScore: report.tradingPatterns.score,
        metadataScore: report.metadata.score,
        marketScore: report.marketMetrics.score,

        // Risk assessment
        riskLevel: report.riskLevel,
        recommendation: report.recommendation,

        // Authorities
        hasMintAuthority: report.tokenAuthorities.hasMintAuthority,
        hasFreezeAuthority: report.tokenAuthorities.hasFreezeAuthority,
        authoritiesRevoked: report.tokenAuthorities.isRevoked,

        // Holder distribution
        totalHolders: report.holderDistribution.totalHolders,
        top10HoldersPercent: report.holderDistribution.top10HoldersPercent,
        creatorPercent: report.holderDistribution.creatorPercent,
        concentrationRisk: report.holderDistribution.concentrationRisk,
        bundleDetected: report.holderDistribution.bundleDetected,
        bundleWallets: report.holderDistribution.bundleWallets,

        // Liquidity
        totalLiquiditySOL: report.liquidityAnalysis.totalLiquiditySOL,
        liquidityUSD: report.liquidityAnalysis.liquidityUSD,
        lpBurned: report.liquidityAnalysis.lpBurned,
        lpLocked: report.liquidityAnalysis.lpLocked,
        lpLockEnd: report.liquidityAnalysis.lpLockEnd
          ? new Date(report.liquidityAnalysis.lpLockEnd)
          : null,

        // Trading patterns
        bundleBots: report.tradingPatterns.bundleBots,
        snipers: report.tradingPatterns.snipers,
        washTrading: report.tradingPatterns.washTrading,
        honeypotDetected: report.tradingPatterns.honeypotDetected,
        canSell: report.tradingPatterns.canSell,

        // Market metrics
        ageInDays: report.marketMetrics.ageInDays,
        volume24h: report.marketMetrics.volume24h,
        priceChange24h: report.marketMetrics.priceChange24h,
        marketCap: report.marketMetrics.marketCap,
        isPumpAndDump: report.marketMetrics.isPumpAndDump,

        // Red flags
        criticalFlags: report.redFlags.criticalCount,
        highFlags: report.redFlags.highCount,
        totalPenalty: report.redFlags.totalPenalty,
        redFlagsJson: report.redFlags,

        // Full report
        fullAnalysisJson: report,

        // Metadata
        imageUrl: report.metadata.imageUrl,
        description: report.metadata.description,

        // Analytics
        viewCount: 1,
        lastViewedAt: new Date(),
        analyzedAt: new Date(),
      },
      update: {
        // Update fields same as in create
      },
    });

    logger.info('✅ Analysis saved to database', { tokenAddress });
  } catch (error) {
    logger.error(
      'Failed to save analysis to database',
      error instanceof Error ? error : undefined,
      {
        tokenAddress,
        error: String(error),
      }
    );
    // Don't throw - analysis was successful even if DB save failed
  }
}

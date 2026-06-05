import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { rateLimit } from '../../lib/rateLimitRedis';
import { isValidSolanaAddress } from '../../lib/validation';
import { sanitizePromoCode, sanitizeText } from '../../lib/sanitize';
import { logger } from '@/lib/logger';
import { cacheDel, CacheKeys } from '../../lib/cache/redis';

/**
 * 🎟️ PROMO CODE APPLICATION ENDPOINT
 *
 * Applies a promotional code to unlock premium features for a wallet.
 * Includes comprehensive validation, security checks, and error handling.
 *
 * Security Features:
 * - Rate limiting to prevent abuse
 * - Input sanitization to prevent injection attacks
 * - Transaction-based operations for data consistency
 * - Detailed logging for audit trail
 * - Protection against race conditions
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ═══════════════════════════════════════════════════════════
  // 1. METHOD VALIDATION
  // ═══════════════════════════════════════════════════════════
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      details: 'Only POST requests are accepted',
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 2. RATE LIMITING (Anti-abuse protection)
  // ═══════════════════════════════════════════════════════════
  if (!(await rateLimit(req, res))) {
    logger.warn('⚠️ Rate limit exceeded for promo code application', {
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });
    return;
  }

  try {
    // ═══════════════════════════════════════════════════════════
    // 3. INPUT VALIDATION
    // ═══════════════════════════════════════════════════════════
    const { walletAddress, promoCode } = req.body;

    // Validate required fields
    if (!walletAddress || !promoCode) {
      logger.warn('⚠️ Missing required fields', {
        walletAddress: !!walletAddress,
        promoCode: !!promoCode,
      });
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Both walletAddress and promoCode are required',
      });
    }

    // Validate wallet address format
    if (!isValidSolanaAddress(walletAddress)) {
      logger.warn('⚠️ Invalid wallet address format', { walletAddress });
      return res.status(400).json({
        error: 'Invalid wallet address',
        details: 'Please provide a valid Solana wallet address',
      });
    }

    // Validate promo code format
    if (typeof promoCode !== 'string' || promoCode.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid promo code format',
        details: 'Promo code must be a non-empty string',
      });
    }

    // Sanitize inputs to prevent injection attacks
    const sanitizedCode = sanitizePromoCode(promoCode.trim().toUpperCase());

    if (sanitizedCode.length > 50) {
      return res.status(400).json({
        error: 'Invalid promo code',
        details: 'Promo code is too long',
      });
    }

    logger.info('🎟️ Processing promo code application', {
      walletAddress,
      promoCode: sanitizedCode,
      timestamp: new Date().toISOString(),
    });

    // ═══════════════════════════════════════════════════════════
    // 4. PRE-VALIDATION (Before transaction)
    // ═══════════════════════════════════════════════════════════

    // Check if promo code exists (OUTSIDE transaction for better error messages)
    const promoExists = await prisma.promoCode.findUnique({
      where: { code: sanitizedCode },
      select: {
        id: true,
        code: true,
        description: true,
        isActive: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        _count: {
          select: {
            redemptions: {
              where: { walletAddress },
            },
          },
        },
      },
    });

    // CRITICAL: Promo code doesn't exist
    if (!promoExists) {
      logger.warn('⚠️ Promo code not found', {
        code: sanitizedCode,
        walletAddress,
        timestamp: new Date().toISOString(),
      });
      return res.status(404).json({
        error: 'Invalid promo code',
        details: 'This promo code does not exist. Please check the code and try again.',
        code: 'PROMO_NOT_FOUND',
      });
    }

    // Check if code is active
    if (!promoExists.isActive) {
      logger.warn('⚠️ Inactive promo code', { code: sanitizedCode, walletAddress });
      return res.status(400).json({
        error: 'Promo code inactive',
        details: 'This promo code is no longer active.',
        code: 'PROMO_INACTIVE',
      });
    }

    // Check expiration
    if (promoExists.expiresAt && promoExists.expiresAt < new Date()) {
      logger.warn('⚠️ Expired promo code', {
        code: sanitizedCode,
        expiresAt: promoExists.expiresAt,
        walletAddress,
      });
      return res.status(400).json({
        error: 'Promo code expired',
        details: `This promo code expired on ${promoExists.expiresAt.toLocaleDateString()}.`,
        code: 'PROMO_EXPIRED',
      });
    }

    // Check usage limit
    if (promoExists.maxUses > 0 && promoExists.usedCount >= promoExists.maxUses) {
      logger.warn('⚠️ Promo code usage limit reached', {
        code: sanitizedCode,
        maxUses: promoExists.maxUses,
        usedCount: promoExists.usedCount,
        walletAddress,
      });
      return res.status(400).json({
        error: 'Promo code fully redeemed',
        details: 'This promo code has reached its maximum number of uses.',
        code: 'PROMO_LIMIT_REACHED',
      });
    }

    // Check if user already redeemed this code
    if (promoExists._count.redemptions > 0) {
      logger.warn('⚠️ Promo code already used by this wallet', {
        code: sanitizedCode,
        walletAddress,
        previousRedemptions: promoExists._count.redemptions,
      });
      return res.status(400).json({
        error: 'Already redeemed',
        details: 'You have already used this promo code.',
        code: 'PROMO_ALREADY_USED',
      });
    }

    // Check if card exists
    const cardExists = await prisma.degenCard.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        isPaid: true,
        degenScore: true,
      },
    });

    if (!cardExists) {
      logger.warn('⚠️ Card not found for wallet', { walletAddress });
      return res.status(404).json({
        error: 'Card not found',
        details: 'Please generate your DegenScore card first before applying a promo code.',
        code: 'CARD_NOT_FOUND',
      });
    }

    if (cardExists.isPaid) {
      logger.warn('⚠️ Card already premium', { walletAddress });
      return res.status(400).json({
        error: 'Already premium',
        details: 'This card is already premium. No promo code needed!',
        code: 'ALREADY_PREMIUM',
      });
    }

    logger.info('✅ All pre-validations passed, starting transaction', {
      walletAddress,
      promoCode: sanitizedCode,
      cardScore: cardExists.degenScore,
    });

    // ═══════════════════════════════════════════════════════════
    // 5. ATOMIC TRANSACTION (All or nothing)
    // ═══════════════════════════════════════════════════════════
    const result = await prisma.$transaction(
      async (tx) => {
        // Double-check in transaction to prevent race conditions
        const promo = await tx.promoCode.findUnique({
          where: { code: sanitizedCode },
          include: {
            redemptions: {
              where: { walletAddress },
            },
          },
        });

        // This should never happen due to pre-validation, but double-check
        if (!promo) {
          throw new Error('RACE_CONDITION: Promo code was deleted during processing');
        }

        if (promo.redemptions.length > 0) {
          throw new Error('RACE_CONDITION: Promo code was already redeemed during processing');
        }

        // Create redemption record
        const redemption = await tx.promoRedemption.create({
          data: {
            promoCodeId: promo.id,
            walletAddress,
          },
        });

        logger.info('✅ Redemption record created', {
          redemptionId: redemption.id,
          walletAddress,
          promoCode: sanitizedCode,
        });

        // Increment usage counter
        await tx.promoCode.update({
          where: { id: promo.id },
          data: {
            usedCount: { increment: 1 },
          },
        });

        // Upgrade card to premium
        const updatedCard = await tx.degenCard.update({
          where: { walletAddress },
          data: {
            isPaid: true,
            isMinted: true,
            mintedAt: new Date(),
          },
        });

        logger.info('✅ Card upgraded to premium', {
          cardId: updatedCard.id,
          walletAddress,
          degenScore: updatedCard.degenScore,
        });

        // Create or update PRO subscription (30-day trial)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        const subscription = await tx.subscription.upsert({
          where: { walletAddress },
          create: {
            walletAddress,
            tier: 'PRO',
            seasonExpiresAt: trialEndDate,
          },
          update: {
            tier: 'PRO',
            seasonExpiresAt: trialEndDate,
          },
        });

        logger.info('✅ PRO subscription activated', {
          walletAddress,
          tier: subscription.tier,
          expiresAt: subscription.seasonExpiresAt ? subscription.seasonExpiresAt.toISOString() : null,
        });

        return {
          card: updatedCard,
          promo,
          subscription,
        };
      },
      {
        maxWait: 5000, // Maximum time to wait for a connection
        timeout: 15000, // Maximum time for the transaction
        isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
      }
    );

    // ═══════════════════════════════════════════════════════════
    // Log activity for analytics (OUTSIDE transaction - non-critical)
    // ═══════════════════════════════════════════════════════════
    try {
      await prisma.activityLog.create({
        data: {
          walletAddress,
          action: 'promo_code_applied',
          metadata: {
            promoCode: sanitizedCode,
            promoDescription: result.promo.description,
            subscriptionTier: 'PRO',
            trialDays: 30,
          },
        },
      });
      logger.info('✅ Activity logged successfully');
    } catch (activityError) {
      // If ActivityLog table doesn't exist or fails, just log the error but don't fail the request
      logger.warn('⚠️ Failed to log activity (non-critical)', {
        error: activityError instanceof Error ? activityError.message : String(activityError),
      });
    }

    // ═══════════════════════════════════════════════════════════
    // 6. CACHE INVALIDATION
    // ═══════════════════════════════════════════════════════════
    // Clear cached card image so it regenerates with premium design
    const cacheKey = CacheKeys.cardImage(walletAddress);
    await cacheDel(cacheKey);

    // Clear leaderboard cache to show updated premium card
    const leaderboardKeys = ['degenScore', 'totalVolume', 'winRate', 'likes'];
    for (const sortBy of leaderboardKeys) {
      await cacheDel(`${CacheKeys.leaderboard()}:${sortBy}:100`);
    }

    logger.info('🗑️ Cache invalidated for updated card and leaderboard');

    // ═══════════════════════════════════════════════════════════
    // 7. SUCCESS RESPONSE
    // ═══════════════════════════════════════════════════════════
    const successMessage = result.promo.description
      ? `${sanitizeText(result.promo.description)} applied successfully! 🎉`
      : `Promo code applied successfully! 🎉`;

    logger.info('🎉 Promo code application completed successfully', {
      walletAddress,
      promoCode: sanitizedCode,
      newTier: result.subscription.tier,
      expiresAt: result.subscription.seasonExpiresAt ? result.subscription.seasonExpiresAt.toISOString() : null,
    });

    return res.status(200).json({
      success: true,
      message: successMessage,
      data: {
        card: {
          id: result.card.id,
          walletAddress: result.card.walletAddress,
          isPaid: result.card.isPaid,
          degenScore: result.card.degenScore,
        },
        subscription: {
          tier: result.subscription.tier,
          expiresAt: result.subscription.seasonExpiresAt,
          daysRemaining: result.subscription.seasonExpiresAt
            ? Math.ceil(
              (result.subscription.seasonExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            : null,
        },
      },
    });
  } catch (error) {
    // ═══════════════════════════════════════════════════════════
    // 8. ERROR HANDLING
    // ═══════════════════════════════════════════════════════════
    logger.error('❌ Error applying promo code', error instanceof Error ? error : undefined, {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error cases
    if (error instanceof Error) {
      // Race condition errors
      if (error.message.includes('RACE_CONDITION')) {
        return res.status(409).json({
          error: 'Conflict',
          details: 'The promo code status changed during processing. Please try again.',
          code: 'RACE_CONDITION',
        });
      }

      // Database connection errors
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          details: 'Database connection error. Please try again in a moment.',
          code: 'DB_CONNECTION_ERROR',
        });
      }

      // Transaction timeout
      if (error.message.includes('Transaction') && error.message.includes('timeout')) {
        return res.status(504).json({
          error: 'Request timeout',
          details: 'The operation took too long. Please try again.',
          code: 'TRANSACTION_TIMEOUT',
        });
      }

      // Return the error message (already validated above)
      return res.status(400).json({
        error: error.message,
        code: 'VALIDATION_ERROR',
      });
    }

    // Unknown error
    return res.status(500).json({
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development'
          ? String(error)
          : 'An unexpected error occurred. Please try again or contact support.',
      code: 'UNKNOWN_ERROR',
    });
  }
}

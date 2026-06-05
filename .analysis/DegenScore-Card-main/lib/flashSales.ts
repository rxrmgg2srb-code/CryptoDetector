/**
 * Flash Sales System
 *
 * Time-limited offers to create urgency and drive conversions
 * Features: Dynamic pricing, countdown timers, limited quantities
 */

import { prisma } from './prisma';
import { logger } from './logger';

export interface FlashSale {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bonus';
  discount: number;
  originalPrice: number;
  salePrice: number;
  startTime: Date;
  endTime: Date;
  maxRedemptions?: number;
  currentRedemptions: number;
  isActive: boolean;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface FlashSaleConfig {
  name: string;
  description: string;
  discountPercent: number;
  durationHours: number;
  maxRedemptions?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const FLASH_SALE_PRESETS: FlashSaleConfig[] = [
  {
    name: '⚡ Lightning Deal',
    description: '50% OFF for the next 2 hours!',
    discountPercent: 50,
    durationHours: 2,
    maxRedemptions: 100,
    tier: 'gold',
  },
  {
    name: '🐦 Early Bird Special',
    description: '30% OFF - Limited to first 50 buyers',
    discountPercent: 30,
    durationHours: 24,
    maxRedemptions: 50,
    tier: 'silver',
  },
  {
    name: '🔥 Weekend Blitz',
    description: '40% OFF all weekend long!',
    discountPercent: 40,
    durationHours: 48,
    tier: 'bronze',
  },
  {
    name: '💎 VIP Flash Sale',
    description: '70% OFF - Exclusive 1-hour sale',
    discountPercent: 70,
    durationHours: 1,
    maxRedemptions: 25,
    tier: 'platinum',
  },
];

/**
 * Get currently active flash sales
 */
export async function getActiveFlashSales(): Promise<FlashSale[]> {
  try {
    const now = new Date();

    const sales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: {
        endTime: 'asc',
      },
    });

    // Filter out sales that have reached max redemptions
    return sales.filter((sale) => {
      if (!sale.maxRedemptions) {
        return true;
      }
      return sale.currentRedemptions < sale.maxRedemptions;
    }) as FlashSale[];
  } catch (error: any) {
    logger.error('Error fetching active flash sales:', error);
    return [];
  }
}

/**
 * Create a new flash sale
 */
export async function createFlashSale(config: FlashSaleConfig): Promise<FlashSale | null> {
  try {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + config.durationHours * 60 * 60 * 1000);

    const originalPrice = 0.05; // 0.05 SOL base price
    const salePrice = originalPrice * (1 - config.discountPercent / 100);

    const sale = await prisma.flashSale.create({
      data: {
        name: config.name,
        description: config.description,
        type: 'percentage',
        discount: config.discountPercent,
        originalPrice,
        salePrice,
        startTime,
        endTime,
        maxRedemptions: config.maxRedemptions,
        currentRedemptions: 0,
        isActive: true,
        tier: config.tier || 'bronze',
      },
    });

    return sale as FlashSale;
  } catch (error: any) {
    logger.error('Error creating flash sale:', error);
    return null;
  }
}

/**
 * Redeem a flash sale
 */
export async function redeemFlashSale(
  saleId: string,
  walletAddress: string
): Promise<{ success: boolean; error?: string; finalPrice?: number }> {
  try {
    const sale = await prisma.flashSale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      return { success: false, error: 'Flash sale not found' };
    }

    const now = new Date();

    // Check if sale is still active
    if (!sale.isActive || now > sale.endTime || now < sale.startTime) {
      return { success: false, error: 'Flash sale has expired' };
    }

    // Check if max redemptions reached
    if (sale.maxRedemptions && sale.currentRedemptions >= sale.maxRedemptions) {
      return { success: false, error: 'Flash sale sold out' };
    }

    // Check if user already redeemed this sale
    const existingRedemption = await prisma.flashSaleRedemption.findFirst({
      where: {
        flashSaleId: saleId,
        walletAddress,
      },
    });

    if (existingRedemption) {
      return { success: false, error: 'You already redeemed this flash sale' };
    }

    // Create redemption record
    await prisma.flashSaleRedemption.create({
      data: {
        flashSaleId: saleId,
        walletAddress,
        redeemedAt: new Date(),
        pricePaid: sale.salePrice,
      },
    });

    // Increment redemption count
    await prisma.flashSale.update({
      where: { id: saleId },
      data: {
        currentRedemptions: { increment: 1 },
      },
    });

    return { success: true, finalPrice: sale.salePrice };
  } catch (error: any) {
    logger.error('Error redeeming flash sale:', error);
    return { success: false, error: 'Failed to redeem flash sale' };
  }
}

/**
 * Deactivate expired flash sales
 */
export async function deactivateExpiredSales(): Promise<number> {
  try {
    const now = new Date();

    const result = await prisma.flashSale.updateMany({
      where: {
        isActive: true,
        endTime: { lt: now },
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  } catch (error: any) {
    logger.error('Error deactivating expired sales:', error);
    return 0;
  }
}

/**
 * Get flash sale statistics
 */
export async function getFlashSaleStats(saleId: string) {
  try {
    const sale = await prisma.flashSale.findUnique({
      where: { id: saleId },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!sale) {
      return null;
    }

    const now = new Date();
    const timeLeft = sale.endTime.getTime() - now.getTime();
    const percentageRedeemed = sale.maxRedemptions
      ? (sale.currentRedemptions / sale.maxRedemptions) * 100
      : 0;

    return {
      ...sale,
      timeLeftMs: Math.max(0, timeLeft),
      percentageRedeemed,
      isExpired: now > sale.endTime,
      isSoldOut: sale.maxRedemptions ? sale.currentRedemptions >= sale.maxRedemptions : false,
    };
  } catch (error: any) {
    logger.error('Error getting flash sale stats:', error);
    return null;
  }
}

/**
 * Get recommended flash sale for user
 */
export function getRecommendedFlashSale(userTier?: string): FlashSaleConfig {
  const tierPriority = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  const userTierValue = tierPriority[userTier as keyof typeof tierPriority] ?? 999;

  // Find the best sale for user's tier
  const filteredSales = FLASH_SALE_PRESETS.filter((sale) => {
    if (!sale.tier) {
      return true;
    }
    const saleTierValue = tierPriority[sale.tier];
    return saleTierValue >= userTierValue;
  }).sort((a, b) => b.discountPercent - a.discountPercent);

  // Return best sale or fallback to first preset (guaranteed to exist)
  if (filteredSales.length > 0) {
    return filteredSales[0]!;
  }

  return FLASH_SALE_PRESETS[0]!;
}

export { FLASH_SALE_PRESETS };

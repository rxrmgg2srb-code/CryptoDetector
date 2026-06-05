import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { isValidSolanaAddress } from '../../lib/services/helius';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet1, wallet2 } = req.query;

    if (!wallet1 || !wallet2) {
      return res.status(400).json({
        error: 'Both wallet1 and wallet2 parameters are required',
      });
    }

    // Validate wallet addresses
    if (!isValidSolanaAddress(wallet1 as string)) {
      return res.status(400).json({ error: 'Invalid wallet1 address' });
    }

    if (!isValidSolanaAddress(wallet2 as string)) {
      return res.status(400).json({ error: 'Invalid wallet2 address' });
    }

    // Fetch both cards
    const [card1, card2] = await Promise.all([
      prisma.degenCard.findUnique({
        where: { walletAddress: wallet1 as string },
        include: { badges: true },
      }),
      prisma.degenCard.findUnique({
        where: { walletAddress: wallet2 as string },
        include: { badges: true },
      }),
    ]);

    if (!card1) {
      return res.status(404).json({
        error: `Card not found for wallet1: ${wallet1}`,
      });
    }

    if (!card2) {
      return res.status(404).json({
        error: `Card not found for wallet2: ${wallet2}`,
      });
    }

    // Calculate comparison metrics
    const comparison = {
      wallet1: {
        address: card1.walletAddress,
        displayName: card1.displayName,
        degenScore: card1.degenScore,
        totalTrades: card1.totalTrades,
        totalVolume: card1.totalVolume,
        profitLoss: card1.profitLoss,
        winRate: card1.winRate,
        bestTrade: card1.bestTrade,
        badges: card1.badges.length,
        likes: card1.likes,
      },
      wallet2: {
        address: card2.walletAddress,
        displayName: card2.displayName,
        degenScore: card2.degenScore,
        totalTrades: card2.totalTrades,
        totalVolume: card2.totalVolume,
        profitLoss: card2.profitLoss,
        winRate: card2.winRate,
        bestTrade: card2.bestTrade,
        badges: card2.badges.length,
        likes: card2.likes,
      },
      differences: {
        degenScore: card1.degenScore - card2.degenScore,
        totalTrades: card1.totalTrades - card2.totalTrades,
        totalVolume: card1.totalVolume - card2.totalVolume,
        profitLoss: card1.profitLoss - card2.profitLoss,
        winRate: card1.winRate - card2.winRate,
        bestTrade: card1.bestTrade - card2.bestTrade,
        badges: card1.badges.length - card2.badges.length,
        likes: card1.likes - card2.likes,
      },
      winner: {
        degenScore:
          card1.degenScore > card2.degenScore
            ? 'wallet1'
            : card1.degenScore < card2.degenScore
              ? 'wallet2'
              : 'tie',
        totalTrades:
          card1.totalTrades > card2.totalTrades
            ? 'wallet1'
            : card1.totalTrades < card2.totalTrades
              ? 'wallet2'
              : 'tie',
        totalVolume:
          card1.totalVolume > card2.totalVolume
            ? 'wallet1'
            : card1.totalVolume < card2.totalVolume
              ? 'wallet2'
              : 'tie',
        profitLoss:
          card1.profitLoss > card2.profitLoss
            ? 'wallet1'
            : card1.profitLoss < card2.profitLoss
              ? 'wallet2'
              : 'tie',
        winRate:
          card1.winRate > card2.winRate
            ? 'wallet1'
            : card1.winRate < card2.winRate
              ? 'wallet2'
              : 'tie',
        bestTrade:
          card1.bestTrade > card2.bestTrade
            ? 'wallet1'
            : card1.bestTrade < card2.bestTrade
              ? 'wallet2'
              : 'tie',
        badges:
          card1.badges.length > card2.badges.length
            ? 'wallet1'
            : card1.badges.length < card2.badges.length
              ? 'wallet2'
              : 'tie',
        likes:
          card1.likes > card2.likes ? 'wallet1' : card1.likes < card2.likes ? 'wallet2' : 'tie',
      },
    };

    // Calculate overall winner (based on Degen Score)
    const overallWinner =
      card1.degenScore > card2.degenScore
        ? 'wallet1'
        : card1.degenScore < card2.degenScore
          ? 'wallet2'
          : 'tie';

    res.status(200).json({
      success: true,
      comparison,
      overallWinner,
    });
  } catch (error: any) {
    logger.error('Error comparing cards:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to compare cards',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

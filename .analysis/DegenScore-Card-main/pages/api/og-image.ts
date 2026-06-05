import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from '@napi-rs/canvas';
import { prisma } from '../../lib/prisma';
import { isValidSolanaAddress } from '../../lib/validation';
import { logger } from '../../lib/logger';

/**
 * Generate dynamic Open Graph images for social sharing
 * GET /api/og-image?wallet=xxx
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet } = req.query;

    if (!wallet || typeof wallet !== 'string' || !isValidSolanaAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    logger.debug('Generating OG image for:', { wallet });

    // Fetch card data
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress: wallet },
      include: { badges: true },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Create canvas (1200x630 for optimal social sharing)
    const width = 1200;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.fillText('DegenScore Card', 80, 100);

    // Subtitle
    ctx.fillStyle = '#a0aec0';
    ctx.font = '30px Arial';
    ctx.fillText('Solana Trading Analytics', 80, 150);

    // Degen Score - Big Display
    const scoreGradient = ctx.createLinearGradient(0, 200, 0, 350);
    scoreGradient.addColorStop(0, '#22d3ee');
    scoreGradient.addColorStop(1, '#a855f7');
    ctx.fillStyle = scoreGradient;
    ctx.font = 'bold 120px Arial';
    ctx.fillText(card.degenScore.toString(), 80, 320);

    ctx.fillStyle = '#a0aec0';
    ctx.font = '40px Arial';
    ctx.fillText('Degen Score', 80, 370);

    // Stats Grid
    const stats = [
      { label: 'Total Trades', value: card.totalTrades.toLocaleString() },
      { label: 'Win Rate', value: `${card.winRate.toFixed(1)}%` },
      {
        label: 'P&L',
        value: `${card.profitLoss >= 0 ? '+' : ''}${card.profitLoss.toFixed(2)} SOL`,
      },
      { label: 'Volume', value: `${card.totalVolume.toFixed(0)} SOL` },
    ];

    let yPos = 220;
    const xStart = 650;
    stats.forEach((stat) => {
      // Stat box background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(xStart, yPos, 480, 80);

      // Stat label
      ctx.fillStyle = '#a0aec0';
      ctx.font = '24px Arial';
      ctx.fillText(stat.label, xStart + 30, yPos + 35);

      // Stat value
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(stat.value, xStart + 30, yPos + 65);

      yPos += 95;
    });

    // Wallet address
    ctx.fillStyle = '#a0aec0';
    ctx.font = '24px monospace';
    const shortAddress = `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
    ctx.fillText(shortAddress, 80, height - 80);

    // Website
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('degenscore.com', 80, height - 40);

    // Badge count indicator
    if (card.badges.length > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`🏆 ${card.badges.length} Badges`, xStart, height - 40);
    }

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Set headers for image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).send(buffer);
  } catch (error: any) {
    logger.error('Error generating OG image:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate OG image';

    res.status(500).json({ error: errorMessage });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { isValidUUID } from '../../lib/validation';
import { rateLimit } from '../../lib/rateLimitRedis';
import { logger } from '../../lib/logger';
import { verifySessionToken } from '../../lib/walletAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  if (!(await rateLimit(req, res))) {
    return;
  }

  try {
    const { cardId, increment } = req.body;

    logger.debug('Like request:', { cardId, increment });

    // SECURITY: Require authentication to prevent spam
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required to like cards' });
    }

    const token = authHeader.replace('Bearer ', '');
    const authResult = verifySessionToken(token);

    if (!authResult.valid) {
      logger.warn('Invalid authentication token for like:', { error: authResult.error });
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    // Validate cardId
    if (!cardId || typeof cardId !== 'string' || !isValidUUID(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }

    // Validate increment
    if (typeof increment !== 'boolean') {
      return res.status(400).json({ error: 'Invalid increment value' });
    }

    // Check if card exists
    const currentCard = await prisma.degenCard.findUnique({
      where: { id: cardId },
      select: { id: true, likes: true },
    });

    if (!currentCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Prevent negative likes
    if (!increment && currentCard.likes <= 0) {
      return res.status(400).json({ error: 'Likes cannot be negative' });
    }

    // Update likes
    const updatedCard = await prisma.degenCard.update({
      where: { id: cardId },
      data: {
        likes: {
          increment: increment ? 1 : -1,
        },
      },
    });

    logger.debug('Likes updated for card:', { cardId, newCount: updatedCard.likes });

    res.status(200).json({ success: true, likes: updatedCard.likes });
  } catch (error: any) {
    logger.error('Error updating likes:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to update likes';

    res.status(500).json({ error: errorMessage });
  }
}

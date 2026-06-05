import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySessionToken } from '../../../lib/walletAuth';
import { analyzeTraderWithAI, getLatestAnalysis, needsNewAnalysis } from '../../../lib/aiCoach';
import { logger } from '../../../lib/logger';
import { rateLimit } from '../../../lib/rateLimit';

/**
 * AI Trading Coach API
 * GET: Get latest analysis (if exists)
 * POST: Request new AI analysis
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  if (!rateLimit(req, res)) {
    return;
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET - Fetch latest AI analysis
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const authResult = verifySessionToken(token);

    if (!authResult.valid) {
      logger.warn('Invalid authentication token for AI coach', { error: authResult.error });
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const walletAddress = authResult.wallet!;

    logger.debug('Fetching AI analysis for:', { walletAddress });

    const analysis = await getLatestAnalysis(walletAddress);

    if (!analysis) {
      return res.status(404).json({
        error: 'No analysis found',
        message: 'Request a new analysis to get started',
      });
    }

    // Check if new analysis is available
    const canRequestNew = await needsNewAnalysis(walletAddress);

    res.status(200).json({
      success: true,
      analysis,
      canRequestNew,
    });
  } catch (error: any) {
    logger.error('Error fetching AI analysis:', error);

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch analysis';

    res.status(500).json({ error: errorMessage });
  }
}

/**
 * POST - Request new AI analysis
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const authResult = verifySessionToken(token);

    if (!authResult.valid) {
      logger.warn('Invalid authentication token for AI coach', { error: authResult.error });
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const walletAddress = authResult.wallet!;

    logger.info('AI analysis requested for:', { walletAddress });

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'AI Coach is temporarily unavailable',
        message: 'OpenAI API key not configured',
      });
    }

    // Check cooldown
    const canRequest = await needsNewAnalysis(walletAddress);
    if (!canRequest) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Free users: 1 analysis per week. Premium users: 1 analysis per day.',
      });
    }

    // Perform AI analysis (this may take 10-30 seconds)
    const analysis = await analyzeTraderWithAI(walletAddress);

    res.status(200).json({
      success: true,
      message: 'Analysis complete',
      analysis,
    });
  } catch (error: any) {
    logger.error('Error performing AI analysis:', error);

    // Handle specific errors
    if (error.message?.includes('Card not found')) {
      return res.status(404).json({
        error: 'Card not found',
        message: 'Generate your DegenScore card first',
      });
    }

    if (error.message?.includes('No response from AI')) {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'Please try again in a moment',
      });
    }

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to analyze trading behavior';

    res.status(500).json({ error: errorMessage });
  }
}

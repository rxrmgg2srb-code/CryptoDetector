import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../lib/logger';

// Types
interface WhaleAlert {
    id: string;
    type: 'buy' | 'sell';
    walletAddress: string;
    walletScore: number;
    tokenSymbol: string;
    tokenMint: string;
    amount: number;
    timestamp: number;
    priceImpact: number;
    txSignature: string;
}

interface SubscriptionSettings {
    walletAddress: string;
    enabled: boolean;
    minScore: number;
    minAmount: number;
    onlyFollowed: boolean;
    buyAlerts: boolean;
    sellAlerts: boolean;
    followedWallets: string[];
    pushEndpoint?: string;
}

// In-memory storage (use Redis/DB in production)
const subscriptions = new Map<string, SubscriptionSettings>();
const recentAlerts: WhaleAlert[] = [];
const MAX_ALERTS = 100;

// Helper to generate mock alerts
function generateMockAlert(): WhaleAlert {
    const tokens = [
        { symbol: '$BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
        { symbol: '$WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
        { symbol: '$POPCAT', mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr' },
        { symbol: '$FWOG', mint: 'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump' },
        { symbol: '$GIGA', mint: 'FhRzm3T4Y2sNxHNJvKkqJVXpqELfkX5PnvL3K9N8mUad' },
    ];

    const wallets = [
        { address: 'DgX7...h9Kp', score: 92 },
        { address: 'Bc4Y...mN2x', score: 88 },
        { address: 'Fk8P...qR5t', score: 85 },
        { address: 'Jm2W...vK9z', score: 79 },
        { address: 'Np7L...xM3s', score: 76 },
    ];

    const token = tokens[Math.floor(Math.random() * tokens.length)]!;
    const wallet = wallets[Math.floor(Math.random() * wallets.length)]!;

    return {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        walletAddress: wallet.address,
        walletScore: wallet.score,
        tokenSymbol: token.symbol,
        tokenMint: token.mint,
        amount: Math.floor(Math.random() * 100) + 10,
        timestamp: Date.now(),
        priceImpact: Math.random() * 5,
        txSignature: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
    };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    try {
        switch (method) {
            // GET - Fetch recent alerts
            case 'GET': {
                const { minScore, minAmount, type, limit = '20' } = req.query;

                let filtered = [...recentAlerts];

                if (minScore) {
                    filtered = filtered.filter(a => a.walletScore >= parseInt(minScore as string));
                }

                if (minAmount) {
                    filtered = filtered.filter(a => a.amount >= parseInt(minAmount as string));
                }

                if (type && (type === 'buy' || type === 'sell')) {
                    filtered = filtered.filter(a => a.type === type);
                }

                return res.status(200).json({
                    success: true,
                    alerts: filtered.slice(0, parseInt(limit as string)),
                    total: filtered.length,
                    timestamp: Date.now(),
                });
            }

            // POST - Subscribe to notifications
            case 'POST': {
                const { action, ...data } = req.body;

                if (action === 'subscribe') {
                    const { walletAddress, settings } = data;

                    if (!walletAddress) {
                        return res.status(400).json({ error: 'Wallet address required' });
                    }

                    const subscription: SubscriptionSettings = {
                        walletAddress,
                        enabled: settings?.enabled ?? true,
                        minScore: settings?.minScore ?? 70,
                        minAmount: settings?.minAmount ?? 10,
                        onlyFollowed: settings?.onlyFollowed ?? false,
                        buyAlerts: settings?.buyAlerts ?? true,
                        sellAlerts: settings?.sellAlerts ?? true,
                        followedWallets: settings?.followedWallets ?? [],
                        pushEndpoint: settings?.pushEndpoint,
                    };

                    subscriptions.set(walletAddress, subscription);

                    logger.info(`[WhaleAlerts] Subscription created for ${walletAddress}`);

                    return res.status(200).json({
                        success: true,
                        message: 'Subscribed to whale alerts',
                        subscription,
                    });
                }

                if (action === 'unsubscribe') {
                    const { walletAddress } = data;

                    if (!walletAddress) {
                        return res.status(400).json({ error: 'Wallet address required' });
                    }

                    subscriptions.delete(walletAddress);

                    return res.status(200).json({
                        success: true,
                        message: 'Unsubscribed from whale alerts',
                    });
                }

                if (action === 'test') {
                    // Generate a test alert
                    const alert = generateMockAlert();
                    recentAlerts.unshift(alert);

                    if (recentAlerts.length > MAX_ALERTS) {
                        recentAlerts.pop();
                    }

                    return res.status(200).json({
                        success: true,
                        alert,
                        message: 'Test alert generated',
                    });
                }

                return res.status(400).json({ error: 'Invalid action' });
            }

            // PUT - Update subscription settings
            case 'PUT': {
                const { walletAddress, settings } = req.body;

                if (!walletAddress) {
                    return res.status(400).json({ error: 'Wallet address required' });
                }

                const existing = subscriptions.get(walletAddress);

                if (!existing) {
                    return res.status(404).json({ error: 'Subscription not found' });
                }

                const updated = { ...existing, ...settings };
                subscriptions.set(walletAddress, updated);

                return res.status(200).json({
                    success: true,
                    subscription: updated,
                });
            }

            // DELETE - Unsubscribe
            case 'DELETE': {
                const { walletAddress } = req.query;

                if (!walletAddress) {
                    return res.status(400).json({ error: 'Wallet address required' });
                }

                subscriptions.delete(walletAddress as string);

                return res.status(200).json({
                    success: true,
                    message: 'Unsubscribed from whale alerts',
                });
            }

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error: any) {
        logger.error('[WhaleAlerts] Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}

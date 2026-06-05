import type { NextApiRequest, NextApiResponse } from 'next';
import { getWalletTransactions } from '../../lib/services/helius';
import { logger } from '../../lib/logger';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { wallet } = req.query;
        const walletAddress = (wallet as string) || 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

        logger.info('🔍 Analyzing wallet for debug:', { walletAddress });

        const transactions = await getWalletTransactions(walletAddress, 100);
        logger.info(`📊 Total transacciones: ${transactions.length}`);

        let swapCount = 0;
        let validTrades = 0;
        const rejectedReasons = {
            notSwap: 0,
            noTokenTransfers: 0,
            noNativeTransfers: 0,
            dustTrade: 0,
            priceOutOfRange: 0,
            noTokenAmount: 0,
            other: 0
        };

        const validTradesDetails: any[] = [];
        const rejectedTradesDetails: any[] = [];

        for (const tx of transactions) {
            if (tx.type !== 'SWAP' && !tx.description?.toLowerCase().includes('swap')) {
                rejectedReasons.notSwap++;
                continue;
            }
            swapCount++;

            if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) {
                rejectedReasons.noTokenTransfers++;
                continue;
            }

            if (!tx.nativeTransfers || tx.nativeTransfers.length === 0) {
                rejectedReasons.noNativeTransfers++;
                continue;
            }

            let solNet = 0;
            for (const nt of tx.nativeTransfers) {
                if (nt.fromUserAccount === walletAddress) {
                    solNet -= nt.amount / 1e9;
                }
                if (nt.toUserAccount === walletAddress) {
                    solNet += nt.amount / 1e9;
                }
            }

            // FILTRO: Dust (< 0.0001 SOL)
            if (Math.abs(solNet) < 0.0001) {
                rejectedReasons.dustTrade++;

                // Detailed logging for dust rejections
                const nativeTransferDetails = tx.nativeTransfers.map((nt: any) => ({
                    from: nt.fromUserAccount === walletAddress ? 'WALLET' : nt.fromUserAccount?.substring(0, 8) + '...',
                    to: nt.toUserAccount === walletAddress ? 'WALLET' : nt.toUserAccount?.substring(0, 8) + '...',
                    amount: (nt.amount / 1e9).toFixed(6) + ' SOL'
                }));

                rejectedTradesDetails.push({
                    signature: tx.signature?.substring(0, 20) + '...',
                    fullSignature: tx.signature,
                    reason: 'DUST',
                    solNet: Math.abs(solNet).toFixed(6),
                    description: tx.description,
                    timestamp: tx.timestamp,
                    nativeTransfers: nativeTransferDetails,
                    tokenTransfersCount: tx.tokenTransfers?.length || 0
                });
                continue;
            }

            const tokenTransfers = tx.tokenTransfers.filter((t: any) =>
                t.mint !== SOL_MINT &&
                (t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress)
            );

            if (tokenTransfers.length === 0) {
                rejectedReasons.other++;
                continue;
            }

            const isBuy = solNet < 0;
            const tokenAmount = isBuy
                ? tokenTransfers.find((t: any) => t.toUserAccount === walletAddress)?.tokenAmount || 0
                : tokenTransfers.find((t: any) => t.fromUserAccount === walletAddress)?.tokenAmount || 0;

            if (tokenAmount === 0) {
                rejectedReasons.noTokenAmount++;
                continue;
            }

            const pricePerToken = Math.abs(solNet) / tokenAmount;

            if (pricePerToken > 1000000 || pricePerToken < 0.00000000001) {
                rejectedReasons.priceOutOfRange++;
                rejectedTradesDetails.push({
                    signature: tx.signature?.substring(0, 20) + '...',
                    reason: 'PRICE_OUT_OF_RANGE',
                    price: pricePerToken.toExponential(2),
                    solAmount: Math.abs(solNet).toFixed(4),
                    tokenAmount: tokenAmount.toFixed(2),
                    type: isBuy ? 'BUY' : 'SELL'
                });
                continue;
            }

            // ✅ Trade válido
            validTrades++;
            validTradesDetails.push({
                signature: tx.signature?.substring(0, 20) + '...',
                type: isBuy ? 'BUY' : 'SELL',
                solAmount: Math.abs(solNet).toFixed(4),
                tokenAmount: tokenAmount.toFixed(2),
                pricePerToken: pricePerToken.toExponential(4)
            });
        }

        const dustRejected = rejectedTradesDetails.filter(t => t.reason === 'DUST');

        res.status(200).json({
            wallet: walletAddress,
            summary: {
                totalTransactions: transactions.length,
                swapCount,
                validTrades,
                rejectedTrades: swapCount - validTrades,
                rejectionRate: swapCount > 0 ? ((swapCount - validTrades) / swapCount * 100).toFixed(1) + '%' : '0%'
            },
            rejectedReasons,
            dustRejectedExamples: dustRejected,
            validTradesExamples: validTradesDetails.slice(0, 10),
            diagnosis: {
                mainIssue: rejectedReasons.dustTrade > 0 ? 'DUST_TRADES' : rejectedReasons.priceOutOfRange > 0 ? 'PRICE_OUT_OF_RANGE' : 'OTHER',
                tradesLost: rejectedReasons.dustTrade + rejectedReasons.priceOutOfRange,
                dustThreshold: '0.0001 SOL',
                recommendation: rejectedReasons.dustTrade > 0
                    ? `${rejectedReasons.dustTrade} trades fueron descartados por ser dust (< 0.0001 SOL). Ver detalles en dustRejectedExamples.`
                    : 'Filtros están funcionando correctamente.'
            }
        });

    } catch (error: any) {
        logger.error('❌ Error in debug endpoint:', error instanceof Error ? error : undefined, {
            error: String(error),
        });
        res.status(500).json({
            error: error?.message || 'Failed to analyze trades'
        });
    }
}

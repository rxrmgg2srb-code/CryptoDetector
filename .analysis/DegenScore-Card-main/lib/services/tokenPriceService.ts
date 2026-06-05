/**
 * 🔥 Token Price Service
 * Gets real-time and historical prices from multiple sources
 * 
 * Sources (in order of preference):
 * 1. Jupiter Price API (most accurate for Solana)
 * 2. Birdeye API (good historical data)
 * 3. DexScreener (free fallback)
 */

import { logger } from '@/lib/logger';

// Cache prices for 30 seconds to avoid rate limits
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL_MS = 30_000;

export interface TokenPrice {
    mint: string;
    priceInSol: number;
    priceInUsd?: number;
    source: 'jupiter' | 'birdeye' | 'dexscreener' | 'cache';
    timestamp: number;
}

/**
 * Get current price of a token in SOL
 */
export async function getCurrentPrice(tokenMint: string): Promise<TokenPrice | null> {
    // Check cache first
    const cached = priceCache.get(tokenMint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return {
            mint: tokenMint,
            priceInSol: cached.price,
            source: 'cache',
            timestamp: cached.timestamp,
        };
    }

    // Try Jupiter first (most reliable)
    try {
        const price = await getJupiterPrice(tokenMint);
        if (price !== null) {
            priceCache.set(tokenMint, { price, timestamp: Date.now() });
            return {
                mint: tokenMint,
                priceInSol: price,
                source: 'jupiter',
                timestamp: Date.now(),
            };
        }
    } catch (error) {
        logger.warn('Jupiter price fetch failed', { tokenMint, error: String(error) });
    }

    // Try DexScreener as fallback
    try {
        const price = await getDexScreenerPrice(tokenMint);
        if (price !== null) {
            priceCache.set(tokenMint, { price, timestamp: Date.now() });
            return {
                mint: tokenMint,
                priceInSol: price,
                source: 'dexscreener',
                timestamp: Date.now(),
            };
        }
    } catch (error) {
        logger.warn('DexScreener price fetch failed', { tokenMint, error: String(error) });
    }

    return null;
}

/**
 * Get prices for multiple tokens at once (batch)
 */
export async function getBatchPrices(tokenMints: string[]): Promise<Map<string, TokenPrice>> {
    const results = new Map<string, TokenPrice>();

    // Dedupe mints
    const uniqueMints = [...new Set(tokenMints)];

    // Check cache first
    const uncachedMints: string[] = [];
    for (const mint of uniqueMints) {
        const cached = priceCache.get(mint);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            results.set(mint, {
                mint,
                priceInSol: cached.price,
                source: 'cache',
                timestamp: cached.timestamp,
            });
        } else {
            uncachedMints.push(mint);
        }
    }

    // Fetch uncached in parallel (max 10 at a time)
    const BATCH_SIZE = 10;
    for (let i = 0; i < uncachedMints.length; i += BATCH_SIZE) {
        const batch = uncachedMints.slice(i, i + BATCH_SIZE);
        const promises = batch.map(mint => getCurrentPrice(mint));
        const prices = await Promise.all(promises);

        for (const price of prices) {
            if (price) {
                results.set(price.mint, price);
            }
        }
    }

    return results;
}

/**
 * Jupiter Price API
 */
async function getJupiterPrice(tokenMint: string): Promise<number | null> {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    // Jupiter gives price in USDC, we need to convert to SOL
    const url = `https://price.jup.ag/v4/price?ids=${tokenMint},${SOL_MINT}`;

    const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    const tokenPriceUsd = data.data?.[tokenMint]?.price;
    const solPriceUsd = data.data?.[SOL_MINT]?.price;

    if (!tokenPriceUsd || !solPriceUsd) {
        return null;
    }

    // Price in SOL = token USD price / SOL USD price
    return tokenPriceUsd / solPriceUsd;
}

/**
 * DexScreener API (free, no API key needed)
 */
async function getDexScreenerPrice(tokenMint: string): Promise<number | null> {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`;

    const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    // Get the most liquid pair
    const pairs = data.pairs || [];
    if (pairs.length === 0) {
        return null;
    }

    // Find SOL pair or convert from USD
    // DexScreener returns priceNative (price in quote token) and priceUsd
    const solPair = pairs.find((p: any) =>
        p.quoteToken?.symbol === 'SOL' ||
        p.quoteToken?.symbol === 'WSOL'
    );

    if (solPair && solPair.priceNative) {
        return parseFloat(solPair.priceNative);
    }

    // Fallback: use USD price and convert
    // Assuming SOL ~$100 (could fetch real price)
    const usdPair = pairs[0];
    if (usdPair && usdPair.priceUsd) {
        const SOL_USD_APPROX = 200; // Should be fetched dynamically
        return parseFloat(usdPair.priceUsd) / SOL_USD_APPROX;
    }

    return null;
}

/**
 * Calculate current value of open positions
 */
export async function calculateOpenPositionsValue(
    openPositions: Array<{ tokenMint: string; tokensBought: number; buyAmount: number }>
): Promise<{
    totalCurrentValue: number;
    totalCostBasis: number;
    unrealizedPnL: number;
    positions: Array<{
        tokenMint: string;
        currentValue: number;
        costBasis: number;
        unrealizedPnL: number;
        pnlPercent: number;
        currentPrice: number | null;
    }>;
}> {
    const results = {
        totalCurrentValue: 0,
        totalCostBasis: 0,
        unrealizedPnL: 0,
        positions: [] as any[],
    };

    if (openPositions.length === 0) {
        return results;
    }

    // Get all prices at once
    const mints = openPositions.map(p => p.tokenMint);
    const prices = await getBatchPrices(mints);

    for (const pos of openPositions) {
        const priceData = prices.get(pos.tokenMint);
        const currentPrice = priceData?.priceInSol || null;

        const costBasis = pos.buyAmount;

        // CRITICAL FIX: If price fetch fails, assume break-even (currentValue = costBasis)
        // instead of 0 (which assumes 100% loss). This prevents API errors from destroying P&L.
        // Unless it looks like a rugged token (implies logic elsewhere, but here be safe).
        const currentValue = currentPrice !== null ? pos.tokensBought * currentPrice : costBasis;

        // Calculate P&L ONLY if we have a valid price. If not, unrealized P&L is 0 (neutral).
        // PnL = Current Value - Cost Basis
        // If price failed: CostBasis - CostBasis = 0.
        const unrealizedPnL = currentValue - costBasis;

        const pnlPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

        results.totalCostBasis += costBasis;
        results.totalCurrentValue += currentValue;
        results.unrealizedPnL += unrealizedPnL;

        results.positions.push({
            tokenMint: pos.tokenMint,
            currentValue,
            costBasis,
            unrealizedPnL,
            pnlPercent,
            currentPrice,
        });
    }

    return results;
}

/**
 * Clear price cache (useful for testing)
 */
export function clearPriceCache(): void {
    priceCache.clear();
}

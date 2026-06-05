/**
 * Jupiter Price API Service
 * 100% Free - No API key required
 * Fallback to DexScreener for maximum coverage
 */

import { logger } from '../logger';

// In-memory cache to avoid duplicate requests in the same session
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface JupiterPriceResponse {
    data: Record<string, {
        id: string;
        mintSymbol: string;
        vsToken: string;
        vsTokenSymbol: string;
        price: number;
    }>;
    timeTaken: number;
}

interface DexScreenerPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd?: string;
    liquidity?: {
        usd: number;
    };
    fdv?: number;
    marketCap?: number;
}

interface DexScreenerResponse {
    schemaVersion: string;
    pairs: DexScreenerPair[] | null;
}

/**
 * Get token prices from Jupiter (primary) with DexScreener fallback
 * @param mints Array of token mint addresses
 * @returns Record of mint -> price in USD
 */
export async function getTokenPrices(mints: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const uncachedMints: string[] = [];
    const now = Date.now();

    // Check cache first
    for (const mint of mints) {
        const cached = priceCache.get(mint);
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            prices[mint] = cached.price;
        } else {
            uncachedMints.push(mint);
        }
    }

    if (uncachedMints.length === 0) {
        return prices; // All cached
    }

    // Try Jupiter first (batch request for efficiency)
    try {
        const jupiterPrices = await getJupiterPrices(uncachedMints);
        Object.assign(prices, jupiterPrices);

        // Cache successful results
        for (const [mint, price] of Object.entries(jupiterPrices)) {
            priceCache.set(mint, { price, timestamp: now });
        }
    } catch (error) {
        logger.warn('Jupiter price fetch failed, will try DexScreener for individual tokens', { error });
    }

    // For any tokens Jupiter didn't have, try DexScreener
    const missingMints = uncachedMints.filter(mint => !prices[mint]);
    if (missingMints.length > 0) {
        logger.info(`Fetching ${missingMints.length} tokens from DexScreener (Jupiter didn't have them)`);

        for (const mint of missingMints) {
            try {
                const price = await getDexScreenerPrice(mint);
                if (price > 0) {
                    prices[mint] = price;
                    priceCache.set(mint, { price, timestamp: now });
                }
            } catch (error) {
                logger.debug(`DexScreener failed for ${mint}:`, { error });
                // Token has no price, set to 0
                prices[mint] = 0;
                priceCache.set(mint, { price: 0, timestamp: now });
            }
        }
    }

    return prices;
}

/**
 * Get single token price (convenience wrapper)
 */
export async function getTokenPrice(mint: string): Promise<number> {
    const prices = await getTokenPrices([mint]);
    return prices[mint] || 0;
}

/**
 * Jupiter Price API (primary source)
 * Free, no API key, very fast
 */
async function getJupiterPrices(mints: string[]): Promise<Record<string, number>> {
    if (mints.length === 0) return {};

    const ids = mints.join(',');
    const url = `https://price.jup.ag/v4/price?ids=${ids}`;

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status} ${response.statusText}`);
    }

    const data: JupiterPriceResponse = await response.json();

    const prices: Record<string, number> = {};
    for (const mint of mints) {
        const priceData = data.data[mint];
        if (priceData?.price) {
            prices[mint] = priceData.price;
        }
    }

    logger.debug(`Jupiter returned prices for ${Object.keys(prices).length}/${mints.length} tokens`);
    return prices;
}

/**
 * DexScreener API (fallback source)
 * Free, ~300 req/min limit, good for new tokens
 */
async function getDexScreenerPrice(mint: string): Promise<number> {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
        return 0; // No liquidity pools found
    }

    // Get the pair with highest liquidity (most reliable price)
    const bestPair = data.pairs.reduce((best, pair) => {
        const currentLiq = pair.liquidity?.usd || 0;
        const bestLiq = best.liquidity?.usd || 0;
        return currentLiq > bestLiq ? pair : best;
    });

    const price = parseFloat(bestPair.priceUsd || '0');
    logger.debug(`DexScreener price for ${mint}: $${price} (liquidity: $${bestPair.liquidity?.usd || 0})`);

    return price;
}

/**
 * Clear price cache (useful for testing or forced refresh)
 */
export function clearPriceCache(): void {
    priceCache.clear();
}

/**
 * Get cache stats (for debugging)
 */
export function getPriceCacheStats() {
    return {
        size: priceCache.size,
        entries: Array.from(priceCache.entries()).map(([mint, data]) => ({
            mint: mint.substring(0, 8) + '...',
            price: data.price,
            age: Math.floor((Date.now() - data.timestamp) / 1000) + 's',
        })),
    };
}

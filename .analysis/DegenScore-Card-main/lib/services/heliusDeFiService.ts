/**
 * 🔥 HELIUS DEFI ACTIVITIES SERVICE
 * 
 * Servicio especializado para obtener SOLO actividades DeFi (swaps/trades)
 * excluyendo transferencias simples usando la API de Helius.
 * 
 * Utiliza el parámetro `type` de Helius Enhanced Transactions API para filtrar
 * únicamente transacciones de tipo SWAP, lo cual nos da trades reales de DEX.
 */

import { retry, CircuitBreaker } from '../retryLogic';
import { logger } from '@/lib/logger';
import { Trade } from '../metricsEngine';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const heliusCircuitBreaker = new CircuitBreaker(5, 60000);

// ============================================================================
// TIPOS - Basados en la documentación de Helius Enhanced Transactions API
// ============================================================================

export interface HeliusDeFiSwap {
    description: string;
    type: 'SWAP'; // Solo swaps
    source: string; // DEX name (JUPITER, RAYDIUM, ORCA, etc.)
    fee: number;
    feePayer: string;
    signature: string;
    slot: number;
    timestamp: number; // Unix timestamp en segundos
    nativeTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        amount: number; // En lamports
    }>;
    tokenTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        mint: string;
        tokenAmount: number; // Ya está en unidades normales (con decimals aplicados)
    }>;
    accountData?: Array<{
        account: string;
        nativeBalanceChange: number;
        tokenBalanceChanges?: Array<{
            mint: string;
            rawTokenAmount: {
                tokenAmount: string;
                decimals: number;
            };
            userAccount: string;
        }>;
    }>;
}

export interface HeliusDeFiActivityResponse {
    data: HeliusDeFiSwap[];
    hasMore?: boolean;
}

// ============================================================================
// API SERVICE
// ============================================================================

/**
 * Obtiene SOLO transacciones de tipo SWAP (trades en DEX) de una wallet.
 * Excluye automáticamente transfers, NFTs, staking, etc.
 * 
 * @param walletAddress - Dirección de la wallet a analizar
 * @param limit - Número máximo de swaps a obtener (máx 100 por request)
 * @param before - Signature para paginación (opcional)
 * @returns Array de swaps parseados de Helius
 */
export async function getDeFiSwaps(
    walletAddress: string,
    limit: number = 100,
    before?: string
): Promise<HeliusDeFiSwap[]> {
    return heliusCircuitBreaker.execute(() =>
        retry(
            async () => {
                // Construir URL con filtro de tipo SWAP
                let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}`;
                url += `&limit=${Math.min(limit, 100)}`; // Helius max = 100
                url += `&type=SWAP`; // 🔥 FILTRO CLAVE: Solo swaps

                if (before) {
                    url += `&before=${before}`;
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                try {
                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        let errorDetails = '';
                        try {
                            const errorBody = await response.text();
                            errorDetails = errorBody ? ` - ${errorBody.substring(0, 200)}` : '';
                        } catch (e) {
                            // Ignore
                        }

                        const error: any = new Error(
                            `Helius DeFi API error: ${response.status} ${response.statusText}${errorDetails}`
                        );
                        error.status = response.status;

                        if (response.status === 400) {
                            logger.error('[HeliusDeFi] Bad Request:', undefined, {
                                walletAddress: walletAddress.substring(0, 10) + '...',
                                limit,
                                hasBefore: !!before,
                            });
                        }

                        throw error;
                    }

                    const swaps: HeliusDeFiSwap[] = await response.json();

                    logger.info(`[HeliusDeFi] Fetched ${swaps.length} swaps for wallet`, {
                        wallet: walletAddress.substring(0, 8) + '...',
                        count: swaps.length,
                    });

                    return swaps;
                } catch (error: any) {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        throw new Error('Helius DeFi API timeout after 30 seconds');
                    }
                    throw error;
                }
            },
            {
                maxRetries: 3,
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
                onRetry: (attempt, error) => {
                    logger.warn(`[HeliusDeFi] Retrying getDeFiSwaps (attempt ${attempt}):`, {
                        message: error.message,
                    });
                },
            }
        )
    );
}

/**
 * Obtiene TODOS los swaps de una wallet con paginación automática
 * @param walletAddress - Dirección de la wallet
 * @param maxSwaps - Máximo de swaps a obtener (default 10000)
 * @param onProgress - Callback de progreso
 */
export async function getAllDeFiSwaps(
    walletAddress: string,
    maxSwaps: number = 10000,
    onProgress?: (progress: number, message: string) => void
): Promise<HeliusDeFiSwap[]> {
    const allSwaps: HeliusDeFiSwap[] = [];
    let before: string | undefined;
    let fetchCount = 0;
    let consecutiveEmpty = 0;

    const MAX_BATCHES = Math.ceil(maxSwaps / 100);
    const BATCH_SIZE = 100;
    const MAX_EMPTY = 3;

    logger.info(`[HeliusDeFi] Fetching up to ${maxSwaps} swaps (${MAX_BATCHES} batches)`);

    while (fetchCount < MAX_BATCHES && allSwaps.length < maxSwaps) {
        try {
            const batch = await getDeFiSwaps(walletAddress, BATCH_SIZE, before);

            if (batch.length > 0) {
                allSwaps.push(...batch);
                before = batch[batch.length - 1]?.signature;
                consecutiveEmpty = 0;

                logger.info(
                    `  ✓ Batch ${fetchCount + 1}: ${batch.length} swaps (Total: ${allSwaps.length})`
                );

                // Si obtuvimos menos de lo solicitado, probablemente no hay más
                if (batch.length < BATCH_SIZE) {
                    logger.info('  ✅ Received less than batch size, no more swaps available');
                    break;
                }
            } else {
                consecutiveEmpty++;
                logger.info(`  ⚠️ Batch ${fetchCount + 1}: empty (${consecutiveEmpty}/${MAX_EMPTY})`);

                if (consecutiveEmpty >= MAX_EMPTY) {
                    logger.info('  ✅ No more swaps available');
                    break;
                }
            }

            fetchCount++;

            if (onProgress) {
                const progress = Math.min(95, (allSwaps.length / maxSwaps) * 100);
                onProgress(progress, `📡 Fetched ${allSwaps.length} swaps...`);
            }

            // Rate limiting - pequeño delay entre requests
            await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error: any) {
            logger.error(
                `  ❌ Error fetching batch ${fetchCount + 1}`,
                error instanceof Error ? error : undefined,
                {
                    error: String(error),
                    allSwapsSoFar: allSwaps.length,
                }
            );

            // Si tenemos algunos swaps, continuar con lo que tenemos
            if (allSwaps.length > 0) {
                logger.warn(`  ⚠️ Using ${allSwaps.length} swaps fetched before error`);
                break;
            }

            throw error; // Re-throw si no tenemos nada
        }
    }

    logger.info(`[HeliusDeFi] Total swaps fetched: ${allSwaps.length}`);
    return allSwaps;
}

// ============================================================================
// CONVERSION TO TRADE FORMAT
// ============================================================================

const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Tokens excluidos: stablecoins y wrapped tokens
const EXCLUDED_TOKENS = new Set([
    // Stablecoins
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    'Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS', // PAI
    'EPeUFDgHRxs9xxEPVaL6kfGQvCon7jmAWKVUHuux1Tpz', // BAI
    'AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3', // FakeUSDC

    // Wrapped tokens principales
    'So11111111111111111111111111111111111111112', // Wrapped SOL
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wrapped ETH
    '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', // Wrapped BTC
    '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Wrapped BTC v2
    '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk', // Wrapped ETH (Sollet)

    // Staked/Liquid staking tokens
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
    '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
    'He3iAEV5rYjv6Xf7PxKro19eVrC3QAcdic5CF2D2obPt', // scnSOL
    'DdFPRnccQqLD4zCHrBqdY95D6hvw6PLWp9DEXj1fLCL9', // daoSOL
]);

/**
 * Convierte un swap de Helius a nuestro formato Trade
 * @param swap - Swap de Helius
 * @param walletAddress - Dirección de la wallet del usuario
 * @returns Trade o null si no es válido
 */
export function convertHeliusSwapToTrade(
    swap: HeliusDeFiSwap,
    walletAddress: string
): Trade | null {
    try {
        // Calcular cambio neto de SOL
        let solNet = 0;
        if (swap.nativeTransfers) {
            for (const nt of swap.nativeTransfers) {
                if (nt.fromUserAccount === walletAddress) {
                    solNet -= nt.amount / 1e9; // Lamports a SOL
                }
                if (nt.toUserAccount === walletAddress) {
                    solNet += nt.amount / 1e9;
                }
            }
        }

        // Obtener transfers de tokens relevantes (excluyendo SOL wrapped y excluidos)
        const relevantTokenTransfers = (swap.tokenTransfers || []).filter(
            (t) =>
                t.mint !== SOL_MINT &&
                !EXCLUDED_TOKENS.has(t.mint) &&
                (t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress)
        );

        if (relevantTokenTransfers.length === 0) {
            return null; // No hay tokens relevantes
        }

        // Determinar si es buy o sell
        const tokensIn = relevantTokenTransfers.filter((t) => t.toUserAccount === walletAddress);
        const tokensOut = relevantTokenTransfers.filter((t) => t.fromUserAccount === walletAddress);

        const isBuy = tokensIn.length > 0 && tokensOut.length === 0;
        const isSell = tokensOut.length > 0 && tokensIn.length === 0;

        if (!isBuy && !isSell) {
            // Swap token-token complejo, skip
            return null;
        }

        const tokenTransfer = isBuy ? tokensIn[0] : tokensOut[0];
        if (!tokenTransfer) {
            return null;
        }

        const tokenAmount = tokenTransfer.tokenAmount;
        if (tokenAmount === 0) {
            return null;
        }

        const solAmount = Math.abs(solNet);

        // Filtro de dust - ignorar trades < 0.000001 SOL
        if (solAmount < 0.000001) {
            return null;
        }

        const pricePerToken = solAmount / tokenAmount;

        // Sanity checks
        if (pricePerToken < 0.000000001 || pricePerToken > 1000000) {
            return null;
        }

        if (solAmount > 1000) {
            return null; // Demasiado grande
        }

        return {
            timestamp: swap.timestamp,
            tokenMint: tokenTransfer.mint,
            type: isBuy ? 'buy' : 'sell',
            solAmount,
            tokenAmount,
            pricePerToken,
        };
    } catch (error) {
        logger.error('[HeliusDeFi] Error converting swap to trade:', error instanceof Error ? error : undefined);
        return null;
    }
}

/**
 * Convierte un array de swaps de Helius a formato Trade
 * @param swaps - Array de swaps de Helius
 * @param walletAddress - Dirección de la wallet
 * @returns Array de trades válidos
 */
export function convertHeliusSwapsToTrades(
    swaps: HeliusDeFiSwap[],
    walletAddress: string
): Trade[] {
    const trades: Trade[] = [];
    let skipped = 0;

    for (const swap of swaps) {
        const trade = convertHeliusSwapToTrade(swap, walletAddress);
        if (trade) {
            trades.push(trade);
        } else {
            skipped++;
        }
    }

    logger.info(`[HeliusDeFi] Converted ${trades.length} trades (skipped ${skipped})`);
    return trades;
}

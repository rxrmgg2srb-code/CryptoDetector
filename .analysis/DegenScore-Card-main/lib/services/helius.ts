import { Connection, PublicKey } from '@solana/web3.js';
import { retry, CircuitBreaker } from '../retryLogic';
import { logger } from '@/lib/logger';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Circuit breaker for Helius API (prevents cascading failures in high concurrency)
const heliusCircuitBreaker = new CircuitBreaker(5, 60000);

export interface ParsedTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source?: string;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
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
  description?: string;
  fee: number;
  feePayer: string;
}

export interface HeliusTransaction {
  description: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
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

/**
 * Obtiene las transacciones parseadas de una wallet usando Helius
 * @param walletAddress - Dirección de la wallet
 * @param limit - Número máximo de transacciones a obtener (default 100)
 * @param before - Signature de la última transacción para paginación (opcional)
 */
export async function getWalletTransactions(
  walletAddress: string,
  limit: number = 100,
  before?: string,
  type?: string
): Promise<ParsedTransaction[]> {
  return heliusCircuitBreaker.execute(() =>
    retry(
      async () => {
        let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;

        // Agregar parámetro de paginación si existe
        if (before) {
          url += `&before=${before}`;
        }

        // Agregar filtro de tipo si existe (ej. SWAP)
        if (type) {
          url += `&type=${type}`;
        }

        // Timeout de 30 segundos para prevenir hangs (aumentado porque Helius puede tardar)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) {
            // For 400 errors, try to get more details from response body
            let errorDetails = '';
            try {
              const errorBody = await response.text();
              errorDetails = errorBody ? ` - ${errorBody.substring(0, 200)}` : '';
            } catch (e) {
              // Ignore if we can't read the error body
            }

            const error: any = new Error(
              `Helius API error: ${response.status} ${response.statusText}${errorDetails}`
            );
            error.status = response.status;

            // Log additional info for 400 errors to help debug
            if (response.status === 400) {
              logger.error('[Helius] Bad Request details:', undefined, {
                walletAddress: walletAddress.substring(0, 10) + '...',
                limit,
                hasBefore: !!before,
                beforeSignature: before ? before.substring(0, 20) + '...' : 'none',
              });
            }

            throw error;
          }

          const transactions: HeliusTransaction[] = await response.json();

          return transactions.map((tx) => ({
            signature: tx.signature,
            timestamp: tx.timestamp,
            type: tx.type,
            source: tx.source,
            nativeTransfers: tx.nativeTransfers,
            tokenTransfers: tx.tokenTransfers,
            accountData: tx.accountData,
            description: tx.description,
            fee: tx.fee,
            feePayer: tx.feePayer,
          }));
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Helius API timeout after 30 seconds');
          }
          throw error;
        }
      },
      {
        maxRetries: 3,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          logger.warn(`[Helius] Retrying getWalletTransactions (attempt ${attempt}):`, {
            message: error.message,
          });
        },
      }
    )
  );
}

/**
 * Obtiene información detallada de tokens usando Helius DAS API
 */
export async function getTokenMetadata(mintAddresses: string[]): Promise<Map<string, any>> {
  if (mintAddresses.length === 0) {
    return new Map();
  }

  return heliusCircuitBreaker
    .execute(() =>
      retry(
        async () => {
          const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

          const requests = mintAddresses.map((mint) => ({
            jsonrpc: '2.0',
            id: mint,
            method: 'getAsset',
            params: { id: mint },
          }));

          // Timeout de 30 segundos para prevenir hangs (aumentado porque Helius puede tardar)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requests),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              const error: any = new Error(`Helius DAS API error: ${response.status}`);
              error.status = response.status;
              throw error;
            }

            const results = await response.json();
            const metadataMap = new Map();

            if (Array.isArray(results)) {
              results.forEach((result: any) => {
                if (result.result) {
                  metadataMap.set(result.id, {
                    symbol: result.result.content?.metadata?.symbol || 'UNKNOWN',
                    name: result.result.content?.metadata?.name || 'Unknown Token',
                    image: result.result.content?.links?.image,
                  });
                }
              });
            }

            return metadataMap;
          } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
              throw new Error('Helius DAS API timeout after 30 seconds');
            }
            throw error;
          }
        },
        {
          maxRetries: 3,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
          onRetry: (attempt, error) => {
            logger.warn(`[Helius] Retrying getTokenMetadata (attempt ${attempt}):`, {
              message: error.message,
            });
          },
        }
      )
    )
    .catch((error) => {
      logger.error(
        'Error fetching token metadata after retries',
        error instanceof Error ? error : undefined,
        {
          error: String(error),
        }
      );
      return new Map(); // Fallback to empty map on failure
    });
}

/**
 * Obtiene el balance actual de SOL de una wallet
 */
export async function getWalletBalance(walletAddress: string): Promise<number> {
  return heliusCircuitBreaker
    .execute(() =>
      retry(
        async () => {
          const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
          const publicKey = new PublicKey(walletAddress);
          const balance = await connection.getBalance(publicKey);

          return balance / 1e9; // Convert lamports to SOL
        },
        {
          maxRetries: 3,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
          onRetry: (attempt, error) => {
            logger.warn(`[Helius] Retrying getWalletBalance (attempt ${attempt}):`, {
              message: error.message,
            });
          },
        }
      )
    )
    .catch((error) => {
      logger.error(
        'Error fetching wallet balance after retries',
        error instanceof Error ? error : undefined,
        {
          error: String(error),
        }
      );
      return 0; // Fallback to 0 on failure
    });
}

/**
 * Valida si una dirección de wallet es válida
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

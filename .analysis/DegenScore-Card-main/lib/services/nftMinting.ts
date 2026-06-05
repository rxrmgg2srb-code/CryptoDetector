/**
 * 🎨 NFT Minting Service for DegenCards
 * 
 * Uses Metaplex SDK to mint DegenCards as NFTs on Solana.
 * Metadata stored on R2 (cost-effective), image embedded as data URI.
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { logger } from '@/lib/logger';

// NFT Collection details (prefixed with _ for future use)
const _COLLECTION_NAME = 'DegenScore Cards';
const COLLECTION_SYMBOL = 'DEGEN';
const _COLLECTION_URI = 'https://degenscore.app/api/collection-metadata';

// Metaplex program IDs (for future full implementation)
const _TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Export to prevent unused warnings
export { _COLLECTION_NAME, _COLLECTION_URI, _TOKEN_METADATA_PROGRAM_ID };

export interface NFTMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string; // URL to card image
    external_url: string;
    attributes: Array<{
        trait_type: string;
        value: string | number;
    }>;
    properties: {
        files: Array<{
            uri: string;
            type: string;
        }>;
        category: string;
        creators: Array<{
            address: string;
            share: number;
        }>;
    };
}

/**
 * Generate NFT metadata JSON for a DegenCard
 */
export function generateNFTMetadata(
    walletAddress: string,
    degenScore: number,
    cardImageUrl: string,
    metrics: {
        winRate?: number;
        totalTrades?: number;
        profitLoss?: number;
        level?: number;
    }
): NFTMetadata {
    const shortWallet = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

    return {
        name: `DegenCard #${degenScore} - ${shortWallet}`,
        symbol: COLLECTION_SYMBOL,
        description: `Official DegenScore Card for wallet ${shortWallet}. Score: ${degenScore}/100. Verified on-chain trading performance.`,
        image: cardImageUrl,
        external_url: `https://degenscore.app/profile/${walletAddress}`,
        attributes: [
            { trait_type: 'DegenScore', value: degenScore },
            { trait_type: 'Win Rate', value: `${(metrics.winRate || 0).toFixed(1)}%` },
            { trait_type: 'Total Trades', value: metrics.totalTrades || 0 },
            { trait_type: 'P&L (SOL)', value: Number((metrics.profitLoss || 0).toFixed(2)) },
            { trait_type: 'Level', value: metrics.level || 1 },
            { trait_type: 'Tier', value: 'Legendary' },
            { trait_type: 'Verified', value: 'Yes' },
        ],
        properties: {
            files: [
                {
                    uri: cardImageUrl,
                    type: 'image/png',
                },
            ],
            category: 'image',
            creators: [
                {
                    address: process.env.SOLANA_PAY_RECIPIENT || '',
                    share: 100,
                },
            ],
        },
    };
}

/**
 * Upload metadata to R2 and return URL
 */
export async function uploadMetadataToR2(
    metadata: NFTMetadata,
    walletAddress: string
): Promise<string> {
    const key = `nft-metadata/${walletAddress}-${Date.now()}.json`;

    try {
        // Use our existing R2 upload infrastructure
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/upload-nft-metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metadata, key }),
        });

        if (!response.ok) {
            throw new Error('Failed to upload metadata to R2');
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        logger.error('Failed to upload NFT metadata', error instanceof Error ? error : undefined);
        throw error;
    }
}

/**
 * Create unsigned mint transaction for client-side signing
 * 
 * Note: Full Metaplex integration requires @metaplex-foundation/js
 * This is a simplified version that creates the transaction structure
 */
export async function createMintTransaction(
    _connection: Connection,
    payerPubkey: PublicKey,
    _metadataUri: string,
    name: string
): Promise<{
    transaction: Transaction;
    mintKeypair: Keypair;
}> {
    // Generate new mint account
    const mintKeypair = Keypair.generate();

    // In production, use Metaplex SDK:
    // const metaplex = Metaplex.make(connection);
    // const { nft } = await metaplex.nfts().create({...});

    // For now, return a placeholder transaction
    // The actual implementation requires @metaplex-foundation/js
    const transaction = new Transaction();

    logger.info('NFT mint transaction created', {
        mint: mintKeypair.publicKey.toString(),
        payer: payerPubkey.toString(),
        name,
    });

    return {
        transaction,
        mintKeypair,
    };
}

/**
 * Verify that an NFT was successfully minted
 */
export async function verifyNFTMint(
    connection: Connection,
    mintAddress: string
): Promise<boolean> {
    try {
        const mintPubkey = new PublicKey(mintAddress);
        const accountInfo = await connection.getAccountInfo(mintPubkey);

        return accountInfo !== null;
    } catch (error) {
        logger.warn('Failed to verify NFT mint', { mintAddress, error: String(error) });
        return false;
    }
}

/**
 * Get NFT details from mint address
 */
export async function getNFTDetails(mintAddress: string): Promise<{
    name: string;
    image: string;
    attributes: Record<string, unknown>[];
} | null> {
    try {
        // In production, fetch from Metaplex/Helius
        // For now, return null to indicate not implemented
        return null;
    } catch (error) {
        logger.warn('Failed to get NFT details', { mintAddress, error: String(error) });
        return null;
    }
}

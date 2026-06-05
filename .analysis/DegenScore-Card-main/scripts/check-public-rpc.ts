/**
 * Check wallet on Public Solana RPC to verify existence
 */

import { Connection, PublicKey } from '@solana/web3.js';

const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';
const WALLET = 'VAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function checkPublic() {
    console.log('Pf Testing Public Solana RPC...');
    console.log(`📍 Wallet: ${WALLET}`);

    try {
        const connection = new Connection(PUBLIC_RPC, 'confirmed');
        const pubKey = new PublicKey(WALLET);

        const balance = await connection.getBalance(pubKey);
        console.log(`💰 Balance: ${balance / 1e9} SOL`);

        const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 5 });
        console.log(`✅ Signatures found: ${signatures.length}`);

        if (signatures.length > 0) {
            console.log('Latest:', signatures[0].signature);
        } else {
            console.log('❌ No signatures on Public RPC either.');
        }

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

checkPublic();

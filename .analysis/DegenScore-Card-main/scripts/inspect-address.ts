/**
 * Inspect address type on Mainnet
 */

import { Connection, PublicKey } from '@solana/web3.js';

const RPC = 'https://api.mainnet-beta.solana.com';
const ADDRESS = 'VAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function inspect() {
    console.log(`🔍 Inspecting address: ${ADDRESS}`);
    const connection = new Connection(RPC, 'confirmed');
    const pubKey = new PublicKey(ADDRESS);

    try {
        const info = await connection.getAccountInfo(pubKey);

        if (info === null) {
            console.log('❌ Account NOT FOUND on Mainnet.');
            console.log('   (It has 0 lamports and no data)');
        } else {
            console.log('✅ Account FOUND!');
            console.log(`   Owner: ${info.owner.toBase58()}`);
            console.log(`   Lamports: ${info.lamports}`);
            console.log(`   Executable: ${info.executable}`);
            console.log(`   Data Length: ${info.data.length} bytes`);

            // Check if it's a Token Program
            if (info.owner.toBase58() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
                console.log('   👉 This is a TOKEN Account or Mint (not a user wallet)');
            } else if (info.owner.toBase58() === '11111111111111111111111111111111') {
                console.log('   👉 This is a SYSTEM Account (User Wallet)');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

inspect();

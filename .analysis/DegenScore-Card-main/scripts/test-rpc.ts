/**
 * Test RPC connection and getSignaturesForAddress
 */

import { Connection, PublicKey } from '@solana/web3.js';

const HELIUS_API_KEY = 'd65a816a-162e-4dd6-9841-c607146e03e3';
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function testRPC() {
    console.log('🔌 Testing RPC connection...');
    console.log(`📍 Wallet: ${WALLET}`);

    try {
        const connection = new Connection(RPC_URL, 'confirmed');
        const pubKey = new PublicKey(WALLET);

        // 1. Get Balance
        const balance = await connection.getBalance(pubKey);
        console.log(`💰 Balance: ${balance / 1e9} SOL`);

        // 2. Get Signatures
        console.log('📜 Fetching signatures...');
        const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 20 });
        console.log(`✅ Found ${signatures.length} signatures`);

        if (signatures.length > 0) {
            console.log('Latest signature:', signatures[0].signature);
            console.log('Time:', new Date((signatures[0].blockTime || 0) * 1000).toLocaleString());
        } else {
            console.log('❌ No signatures found via RPC. Wallet might be empty or inactive.');
        }

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

testRPC();

/**
 * Test Helius API filtering by SOURCE
 */

const API_KEY = 'd65a816a-162e-4dd6-9841-c607146e03e3';
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function testSource(source: string) {
    console.log(`\n🔍 Testing Source: ${source}`);
    const url = `https://api.helius.xyz/v0/addresses/${WALLET}/transactions?api-key=${API_KEY}&source=${source}`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Found ${data.length} transactions`);
            if (data.length > 0) {
                console.log('Sample type:', data[0].type);
                console.log('Sample desc:', data[0].description);
            }
        } else {
            console.log(`❌ Failed: ${response.status}`);
            const text = await response.text();
            console.log(text);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function run() {
    console.log('🧪 Testing Helius Source Filtering');
    console.log(`📍 Wallet: ${WALLET}`);

    await testSource('PUMP_FUN');
    await testSource('RAYDIUM');
    await testSource('JUPITER');
    await testSource('ORCA');
}

run();

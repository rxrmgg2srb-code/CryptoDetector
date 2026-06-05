/**
 * Test script to verify if the provided key works with Solscan API
 */

const API_KEY = 'd65a816a-162e-4dd6-9841-c607146e03e3';
const WALLET = 'VAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function testSolscan() {
    console.log('🔍 Testing Solscan API Key...');
    console.log(`🔑 Key: ${API_KEY}`);
    console.log(`📍 Wallet: ${WALLET}`);

    // Endpoint from docs: account/defi/activities
    const url = `https://pro-api.solscan.io/v2.0/account/defi/activities?address=${WALLET}&page=1&page_size=10`;

    try {
        const response = await fetch(url, {
            headers: {
                'token': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`\n📡 Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success!');
            console.log(`📄 Data found: ${data.data?.length || 0} items`);
            if (data.data?.length > 0) {
                console.log('First item type:', data.data[0].activity_type);
            }
        } else {
            console.log('❌ Failed');
            const text = await response.text();
            console.log('Response:', text);
        }

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

testSolscan();

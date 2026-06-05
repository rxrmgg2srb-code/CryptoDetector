/**
 * Test public Solscan endpoints without API Key
 */

const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function testPublicSolscan() {
    console.log('🔍 Testing Public Solscan Endpoints...');
    console.log(`📍 Wallet: ${WALLET}`);

    const endpoints = [
        `https://public-api.solscan.io/account/defi/activities?address=${WALLET}&page=1&page_size=50`,
        `https://api.solscan.io/v2/account/defi/activities?address=${WALLET}&page=1&page_size=50`,
        `https://api.solscan.io/account/defi/activities?address=${WALLET}&page=1&page_size=50`
    ];

    for (const url of endpoints) {
        console.log(`\nTesting: ${url}`);
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            console.log(`Status: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                // Check structure
                const items = data.data || data;
                if (Array.isArray(items)) {
                    console.log(`✅ Success! Found ${items.length} activities`);
                    if (items.length > 0) {
                        console.log('Sample activity:', JSON.stringify(items[0], null, 2).substring(0, 200));
                    }
                    return; // Found a working one
                } else {
                    console.log('⚠️ Response is not an array:', JSON.stringify(data).substring(0, 100));
                }
            } else {
                console.log('❌ Failed');
            }
        } catch (error) {
            console.error('💥 Error:', error.message);
        }
    }
}

testPublicSolscan();

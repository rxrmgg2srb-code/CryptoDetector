/**
 * Test: Obtener transacciones SIN filtro type=SWAP
 * Para ver qué retorna Helius realmente
 */

const HELIUS_API_KEY = 'd65a816a-162e-4dd6-9841-c607146e03e3';

async function testHelius() {
    const wallet = 'DCAKuApAuZtVNYLk3KTAVW9GLWVvPbnb5CxxRRmVgcTr';

    console.log('🔍 Test 1: CON filtro type=SWAP\n');
    const urlWithFilter = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=10&type=SWAP`;

    try {
        const res1 = await fetch(urlWithFilter);
        console.log(`Status: ${res1.status}`);
        const data1 = await res1.json();
        console.log('Resultado:', JSON.stringify(data1, null, 2).substring(0, 500));
    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n\n🔍 Test 2: SIN filtro type (todas las txs)\n');
    const urlNoFilter = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=10`;

    try {
        const res2 = await fetch(urlNoFilter);
        console.log(`Status: ${res2.status}`);
        const data2 = await res2.json();
        console.log(`Transacciones obtenidas: ${Array.isArray(data2) ? data2.length : 0}`);

        if (Array.isArray(data2) && data2.length > 0) {
            const types = new Set(data2.map((tx: any) => tx.type));
            console.log('Tipos encontrados:', Array.from(types));

            const swaps = data2.filter((tx: any) => tx.type === 'SWAP');
            console.log(`SWAP transactions: ${swaps.length}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testHelius();

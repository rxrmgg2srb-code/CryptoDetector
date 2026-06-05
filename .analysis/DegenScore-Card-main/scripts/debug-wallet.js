/**
 * COMPLETE WALLET ANALYSIS
 * Since this wallet has minimal trading, show full activity summary
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function getWalletTransactions(walletAddress, limit = 100, before, type) {
    let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    if (before) url += `&before=${before}`;
    if (type) url += `&type=${type}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

async function main() {
    console.log('💰 COMPLETE WALLET ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Wallet: ${WALLET}\n`);

    // Get the 2 SWAP transactions
    const swaps = await getWalletTransactions(WALLET, 100, undefined, 'SWAP');
    console.log(`🔄 SWAP TRANSACTIONS FOUND: ${swaps.length}`);

    if (swaps.length > 0) {
        console.log('\n📊 TRADING ACTIVITY (SWAPS):');
        console.log('─'.repeat(60));

        let totalSpent = 0;
        let totalReceived = 0;

        for (const tx of swaps) {
            const date = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
            console.log(`\nDate: ${date}`);
            console.log(`Sig:  ${tx.signature.substring(0, 30)}...`);
            console.log(`Source: ${tx.source}`);

            // Analyze the swap
            if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
                const WSOL = 'So11111111111111111111111111111111111111112';

                for (const t of tx.tokenTransfers) {
                    if (t.fromUserAccount === WALLET || t.toUserAccount === WALLET) {
                        const dir = t.toUserAccount === WALLET ? 'RECEIVED' : 'SENT';
                        const isSOL = t.mint === WSOL;

                        if (isSOL) {
                            if (dir === 'RECEIVED') {
                                totalReceived += t.tokenAmount;
                                console.log(`  💰 ${dir}: ${t.tokenAmount.toFixed(4)} SOL`);
                            } else {
                                totalSpent += t.tokenAmount;
                                console.log(`  💸 ${dir}: ${t.tokenAmount.toFixed(4)} SOL`);
                            }
                        } else {
                            console.log(`  🪙 ${dir}: ${t.tokenAmount.toFixed(4)} ${t.mint.substring(0, 8)}...`);
                        }
                    }
                }
            }

            // Check native balance change  
            if (tx.accountData) {
                const acc = tx.accountData.find(a => a.account === WALLET);
                if (acc && acc.nativeBalanceChange !== 0) {
                    const change = acc.nativeBalanceChange / 1e9;
                    if (change > 0) {
                        console.log(`  💰 Native SOL IN: ${change.toFixed(4)} SOL`);
                    } else {
                        console.log(`  💸 Native SOL OUT: ${Math.abs(change).toFixed(4)} SOL`);
                    }
                }
            }
        }

        console.log('\n' + '─'.repeat(60));
        console.log(`💸 Total Spent on Trades:    ${totalSpent.toFixed(4)} SOL`);
        console.log(`💰 Total Received from Trades: ${totalReceived.toFixed(4)} SOL`);
        console.log(`📊 Net P&L from Trading:     ${(totalReceived - totalSpent).toFixed(4)} SOL`);
    }

    // Show overall SOL flow from all transactions
    console.log('\n\n📊 OVERALL WALLET ACTIVITY (Last 500 transactions):');
    console.log('─'.repeat(60));

    let allTxs = [];
    let before = undefined;

    for (let i = 0; i < 5; i++) {
        const batch = await getWalletTransactions(WALLET, 100, before);
        if (batch.length === 0) break;
        allTxs = allTxs.concat(batch);
        before = batch[batch.length - 1]?.signature;
        await new Promise(r => setTimeout(r, 100));
    }

    let totalIn = 0;
    let totalOut = 0;
    let transferCount = 0;

    for (const tx of allTxs) {
        if (tx.accountData) {
            const acc = tx.accountData.find(a => a.account === WALLET);
            if (acc) {
                const change = acc.nativeBalanceChange / 1e9;
                if (change > 0) totalIn += change;
                else totalOut += Math.abs(change);
                transferCount++;
            }
        }
    }

    const oldestDate = allTxs.length > 0
        ? new Date(allTxs[allTxs.length - 1].timestamp * 1000).toISOString().split('T')[0]
        : 'N/A';
    const newestDate = allTxs.length > 0
        ? new Date(allTxs[0].timestamp * 1000).toISOString().split('T')[0]
        : 'N/A';

    console.log(`Transactions analyzed: ${allTxs.length}`);
    console.log(`Date range: ${oldestDate} to ${newestDate}`);
    console.log();
    console.log(`↓ Total SOL Received:  ${totalIn.toFixed(4)} SOL`);
    console.log(`↑ Total SOL Sent Out:  ${totalOut.toFixed(4)} SOL`);
    console.log('─'.repeat(40));

    const net = totalIn - totalOut;
    const emoji = net >= 0 ? '🟢' : '🔴';
    console.log(`${emoji} Net SOL Change: ${net.toFixed(4)} SOL`);

    console.log('\n⚠️ NOTE: This wallet has only 2 swap/trade transactions.');
    console.log('   It is primarily used for receiving and sending SOL transfers,');
    console.log('   NOT for active trading on DEXs like Jupiter, Raydium, etc.');
}

main().catch(console.error);

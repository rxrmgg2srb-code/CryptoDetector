/**
 * helius.js - On-chain intelligence wrapper.
 *
 * Commercial-demo mode uses the local backend proxy in server.js so the Helius
 * key is not exposed in the browser. For quick local experiments you can set
 * window.DD_CONFIG.heliusApiKey before loading this file, but do not ship that.
 */

const Helius = (() => {
    const DIRECT_API_KEY = window.DD_CONFIG?.heliusApiKey || '';
    const BASE_API = 'https://api-mainnet.helius-rpc.com/v0';
    const BASE_RPC = 'https://mainnet.helius-rpc.com/';
    const PROXY_TX = '/api/helius/address-transactions';
    const PROXY_RPC = '/api/solana/rpc';

    let requestCount = 0;
    let lastReset = Date.now();
    let onLog = () => {};

    function log(msg, level = 'info') { onLog(msg, level); }

    async function rateLimitedFetch(url, opts = {}) {
        const now = Date.now();
        if (now - lastReset > 1000) { requestCount = 0; lastReset = now; }
        if (requestCount >= 2) {
            await new Promise(r => setTimeout(r, Math.max(150, 1100 - (now - lastReset))));
            requestCount = 0;
            lastReset = Date.now();
        }
        requestCount++;

        try {
            const res = await fetch(url, opts);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            log(`Helius unavailable: ${e.message}. Start server.js with HELIUS_API_KEY for live on-chain scans.`, 'warning');
            return null;
        }
    }

    function buildTransactionsUrl(address, { type = 'SWAP', limit = 20 } = {}) {
        const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
        const params = new URLSearchParams({ type, limit: String(safeLimit) });
        if (DIRECT_API_KEY) {
            params.set('api-key', DIRECT_API_KEY);
            return `${BASE_API}/addresses/${encodeURIComponent(address)}/transactions?${params.toString()}`;
        }
        params.set('address', address);
        return `${PROXY_TX}?${params.toString()}`;
    }

    async function getAddressTransactions(address, options = {}) {
        if (!address) return [];
        const data = await rateLimitedFetch(buildTransactionsUrl(address, options));
        return Array.isArray(data) ? data : [];
    }

    async function rpcRequest(method, params = []) {
        const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
        const url = DIRECT_API_KEY ? `${BASE_RPC}?api-key=${DIRECT_API_KEY}` : PROXY_RPC;
        const data = await rateLimitedFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });
        return data;
    }

    /**
     * Get recent swap transactions for a token address.
     */
    async function getTokenSwaps(tokenAddress, limit = 20) {
        return getAddressTransactions(tokenAddress, { type: 'SWAP', limit });
    }

    /**
     * Analyze swap transactions for bot patterns.
     */
    function analyzeSwaps(swaps) {
        if (!swaps || swaps.length === 0) {
            return { bundleScore: 0, freshWalletScore: 0, patterns: [], swapCount: 0 };
        }

        const patterns = [];
        let bundleScore = 0;
        let freshWalletScore = 0;
        const slotMap = new Map();
        const walletSet = new Set();

        for (const swap of swaps) {
            const slot = swap.slot || 0;
            const feePayer = swap.feePayer || '';

            if (!slotMap.has(slot)) slotMap.set(slot, []);
            slotMap.get(slot).push(swap);
            if (feePayer) walletSet.add(feePayer);
        }

        for (const [slot, blockSwaps] of slotMap) {
            if (blockSwaps.length >= 2) {
                const uniqueWallets = new Set(blockSwaps.map(s => s.feePayer).filter(Boolean)).size;
                if (uniqueWallets >= 2) {
                    bundleScore = Math.min(100, bundleScore + uniqueWallets * 20);
                    patterns.push({
                        type: 'BUNDLE',
                        label: `BUNDLE (${uniqueWallets} wallets, slot ${slot})`,
                        severity: uniqueWallets >= 4 ? 'critical' : 'high'
                    });
                }
            }
        }

        const recentSwaps = swaps.filter(s => (Date.now() / 1000 - (s.timestamp || 0)) < 3600);
        const recentWallets = new Set(recentSwaps.map(s => s.feePayer).filter(Boolean));
        if (recentWallets.size >= 3 && recentSwaps.length <= recentWallets.size + 2) {
            freshWalletScore = Math.min(100, recentWallets.size * 15);
            patterns.push({
                type: 'FRESH_WALLETS',
                label: `${recentWallets.size} WALLETS EN 1H`,
                severity: recentWallets.size >= 5 ? 'critical' : 'high'
            });
        }

        if (recentSwaps.length >= 5) {
            const times = recentSwaps.map(s => s.timestamp || 0).sort((a, b) => a - b);
            const timeSpanMinutes = (times[times.length - 1] - times[0]) / 60;
            if (timeSpanMinutes <= 10) {
                patterns.push({
                    type: 'RAPID_FIRE',
                    label: `${recentSwaps.length} SWAPS EN ${Math.round(timeSpanMinutes)}MIN`,
                    severity: 'critical'
                });
                bundleScore = Math.max(bundleScore, 80);
            }
        }

        const buySwaps = recentSwaps.filter(s => {
            const desc = (s.description || '').toLowerCase();
            return desc.includes('bought') || desc.includes('swap');
        });
        if (recentSwaps.length >= 3 && buySwaps.length === recentSwaps.length) {
            patterns.push({ type: 'ALL_BUYS', label: 'SOLO COMPRAS', severity: 'high' });
        }

        return {
            bundleScore,
            freshWalletScore,
            patterns,
            swapCount: swaps.length,
            recentSwapCount: recentSwaps.length,
            uniqueWallets: walletSet.size
        };
    }

    async function deepScanToken(tokenAddress) {
        log(`Helius deep scan: ${tokenAddress.slice(0, 8)}...`);
        const swaps = await getTokenSwaps(tokenAddress, 30);
        const analysis = analyzeSwaps(swaps);

        if (analysis.patterns.length > 0) {
            const criticals = analysis.patterns.filter(p => p.severity === 'critical');
            const labels = (criticals.length > 0 ? criticals : analysis.patterns).map(p => p.label).join(' | ');
            log(`${tokenAddress.slice(0, 8)}: ${labels}`, criticals.length > 0 ? 'error' : 'warning');
        }

        return analysis;
    }

    async function getHolderCount(mintAddress) {
        try {
            const data = await rpcRequest('getTokenLargestAccounts', [mintAddress]);
            const accounts = data?.result?.value || [];
            return accounts.filter(a => parseInt(a.amount, 10) > 0).length;
        } catch (e) {
            log(`Holder count error: ${e.message}`, 'warning');
            return -1;
        }
    }

    return {
        deepScanToken,
        analyzeSwaps,
        getAddressTransactions,
        getHolderCount,
        set onLog(fn) { onLog = fn; },
        get apiKey() { return DIRECT_API_KEY; }
    };
})();

/**
 * SignalTracker - local performance ledger for commercial validation.
 *
 * This turns the scanner into a measurable signal product: each relevant alert
 * is logged at T0 and updated as the token appears again in later scans.
 */

const SignalTracker = (() => {
    const KEY = 'dd_signal_performance_v1';
    const MAX_RECORDS = 5000;
    const SIGNAL_BUCKET_MS = 12 * 60 * 60 * 1000;
    const SNAPSHOT_WINDOWS = [
        { key: 'm5', ms: 5 * 60 * 1000 },
        { key: 'm15', ms: 15 * 60 * 1000 },
        { key: 'h1', ms: 60 * 60 * 1000 },
        { key: 'h6', ms: 6 * 60 * 60 * 1000 },
        { key: 'h24', ms: 24 * 60 * 60 * 1000 }
    ];

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : { records: {} };
        } catch {
            return { records: {} };
        }
    }

    function save(store) {
        const records = Object.values(store.records || {})
            .sort((a, b) => b.firstSeen - a.firstSeen)
            .slice(0, MAX_RECORDS);
        const next = { records: Object.fromEntries(records.map(r => [r.id, r])) };
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
        return next;
    }

    function num(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }

    function priceOf(token) {
        return num(token?.pair?.priceUsd);
    }

    function mcapOf(token) {
        return num(token?.mcap || token?.pair?.marketCap || token?.pair?.fdv);
    }

    function getSignalType(token) {
        if (token?.microcap10x?.qualifies) return 'MICROCAP_10X';
        if (token?.wakeup?.tier === 'CONFIRMED') return 'WAKEUP_CONFIRMED';
        if (token?.x2Potential?.qualifies) return 'X2_SETUP';
        if (token?.isClonePump) return 'CLONE_PUMP';
        if (token?.wakeup?.tier === 'DETECTED') return 'WAKEUP_DETECTED';
        if (token?.dormantBuys?.despertando) return 'DORMANT_WAKEUP';
        if ((token?.score || 0) >= 75) return 'HIGH_SCORE';
        if ((token?.dormantHours || 0) >= 24) return 'DORMANT_WATCH';
        return '';
    }

    function signalId(token, type, now) {
        const bucket = Math.floor(now / SIGNAL_BUCKET_MS);
        return `${token.address}:${type}:${bucket}`;
    }

    function explain(token, type) {
        if (token?.wakeup?.reason) return token.wakeup.reason;
        if (token?.microcap10x?.matches?.length) return token.microcap10x.matches.join('|');
        if (token?.x2Potential?.matches?.length) return token.x2Potential.matches.join('|');
        if (token?.convergence?.active?.length) return token.convergence.active.join('|');
        return type;
    }

    function multipleFrom(base, current) {
        if (!base || !current) return 0;
        return +(current / base).toFixed(3);
    }

    function updateRecord(record, token, now) {
        const price = priceOf(token);
        const mcap = mcapOf(token);
        const priceMultiple = multipleFrom(record.firstPrice, price);
        const mcapMultiple = multipleFrom(record.firstMcap, mcap);
        const bestMultiple = Math.max(priceMultiple, mcapMultiple, record.maxMultiple || 0);

        record.lastSeen = now;
        record.lastPrice = price;
        record.lastMcap = mcap;
        record.lastScore = token.score || 0;
        record.maxPrice = Math.max(record.maxPrice || 0, price);
        record.maxMcap = Math.max(record.maxMcap || 0, mcap);
        record.maxPriceMultiple = Math.max(record.maxPriceMultiple || 0, priceMultiple);
        record.maxMcapMultiple = Math.max(record.maxMcapMultiple || 0, mcapMultiple);
        record.maxMultiple = bestMultiple;
        record.outcome = bestMultiple >= 5 ? '5X_PLUS' : bestMultiple >= 2 ? '2X_PLUS' : bestMultiple >= 1.5 ? '1_5X_PLUS' : 'OPEN';

        record.snapshots = record.snapshots || {};
        for (const win of SNAPSHOT_WINDOWS) {
            if (!record.snapshots[win.key] && now - record.firstSeen >= win.ms) {
                record.snapshots[win.key] = {
                    at: now,
                    price,
                    mcap,
                    multiple: bestMultiple,
                    score: token.score || 0
                };
            }
        }
    }

    function createRecord(token, type, now) {
        const price = priceOf(token);
        const mcap = mcapOf(token);
        const symbol = token?.pair?.baseToken?.symbol || '';
        return {
            id: signalId(token, type, now),
            address: token.address,
            symbol,
            name: token?.pair?.baseToken?.name || '',
            type,
            wakeupTier: token?.wakeup?.tier || '',
            dormantHours: token?.dormantHours || 0,
            firstSeen: now,
            firstPrice: price,
            firstMcap: mcap,
            firstScore: token.score || 0,
            firstLiquidity: token.liquidity || 0,
            firstVolume5m: token.volume5m || 0,
            firstBuyPressure: token.buyRatio?.ratio || 0,
            firstUrl: token?.pair?.url || `https://dexscreener.com/solana/${token.address}`,
            reason: explain(token, type),
            confirmations: token?.wakeup?.confirmations || [],
            lastSeen: now,
            lastPrice: price,
            lastMcap: mcap,
            lastScore: token.score || 0,
            maxPrice: price,
            maxMcap: mcap,
            maxPriceMultiple: 1,
            maxMcapMultiple: 1,
            maxMultiple: 1,
            outcome: 'OPEN',
            snapshots: {}
        };
    }

    function record(tokens) {
        if (!Array.isArray(tokens) || tokens.length === 0) return getSummary();
        const now = Date.now();
        const store = load();
        store.records = store.records || {};

        const byAddress = new Map(tokens.filter(t => t?.address).map(t => [t.address, t]));
        for (const existing of Object.values(store.records)) {
            const token = byAddress.get(existing.address);
            if (token) updateRecord(existing, token, now);
        }

        for (const token of tokens) {
            if (!token?.address) continue;
            const type = getSignalType(token);
            if (!type) continue;
            const id = signalId(token, type, now);
            if (!store.records[id]) {
                const price = priceOf(token);
                const mcap = mcapOf(token);
                if (price > 0 || mcap > 0) store.records[id] = createRecord(token, type, now);
            }
        }

        return getSummary(save(store));
    }

    function getSummary(store = load()) {
        const records = Object.values(store.records || {});
        const total = records.length;
        const confirmed = records.filter(r => r.type === 'WAKEUP_CONFIRMED' || r.type === 'MICROCAP_10X' || r.type === 'X2_SETUP');
        const x2 = records.filter(r => (r.maxMultiple || 0) >= 2).length;
        const x5 = records.filter(r => (r.maxMultiple || 0) >= 5).length;
        const confirmedX2 = confirmed.filter(r => (r.maxMultiple || 0) >= 2).length;

        return {
            total,
            confirmed: confirmed.length,
            x2,
            x5,
            hitRate2x: total ? +(x2 / total * 100).toFixed(1) : 0,
            confirmedHitRate2x: confirmed.length ? +(confirmedX2 / confirmed.length * 100).toFixed(1) : 0
        };
    }

    function csvEscape(value) {
        const text = String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    }

    function exportCSV() {
        const records = Object.values(load().records || {}).sort((a, b) => b.firstSeen - a.firstSeen);
        if (records.length === 0) return false;
        const headers = [
            'firstSeen','type','symbol','name','address',
            'dormantHours','wakeupTier',
            'firstPrice','firstMcap','firstLiquidity','firstVolume5m','firstBuyPressure','firstScore',
            'maxPrice','maxMcap','maxPriceMultiple','maxMcapMultiple','maxMultiple',
            'lastMcap','lastScore',
            'outcome','trackingHours',
            'reason','confirmations','url'
        ];
        const rows = records.map(r => [
            new Date(r.firstSeen).toISOString(),
            r.type,
            r.symbol,
            r.name,
            r.address,
            r.dormantHours || 0,
            r.wakeupTier || '',
            r.firstPrice || 0,
            r.firstMcap,
            r.firstLiquidity || 0,
            r.firstVolume5m || 0,
            r.firstBuyPressure ? +(r.firstBuyPressure).toFixed(3) : 0,
            r.firstScore,
            r.maxPrice || 0,
            r.maxMcap,
            r.maxPriceMultiple || 1,
            r.maxMcapMultiple || 1,
            r.maxMultiple,
            r.lastMcap,
            r.lastScore,
            r.outcome,
            r.lastSeen && r.firstSeen ? +((r.lastSeen - r.firstSeen) / 3.6e6).toFixed(1) : 0,
            r.reason,
            (r.confirmations || []).join('|'),
            r.firstUrl
        ].map(csvEscape).join(','));

        const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dormant_signal_performance_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
    }

    function clear() {
        localStorage.removeItem(KEY);
    }

    return { record, getSummary, exportCSV, clear };
})();

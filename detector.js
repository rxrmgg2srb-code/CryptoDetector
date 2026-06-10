/**
 * detector.js - Dormant token scorer.
 * Finds tokens inactive for 24h+ that are waking up with 2x+ potential.
 */
const Detector = (() => {
    const MIN_WAKEUP_DORMANT_HOURS = 24;
    const SNAPSHOT_KEY = 'dormant_detector_snapshots';
    const FLUSH_INTERVAL_MS = 5 * 60 * 1000;
    const WEIGHTS = { momentum: 0.20, volumeSpike: 0.13, buyRatio: 0.13, microBuys: 0.12, mcap: 0.12, liquidity: 0.08, age: 0.07, liqChange: 0.05, prepump: 0.05, x2Potential: 0.05 };
    const TRENDING_NARRATIVES = ['TRUMP','AI','PEPE','DOGE','CAT','ELON','MAGA','WIF','BONK','BOME','GROK','GPT','MEME','SHIB','FLOKI','MOTHER','POPCAT','BRETT','WOJAK','CHAD','MOON','PUMP','BASED','BULL','APE','FROG'];
    let _snapshotCache = null;
    let _lastFlush = 0;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const val = (n, fallback = 0) => Number.isFinite(+n) ? +n : fallback;
    const tx = (pair, win, side) => val(pair.txns?.[win]?.[side]);
    const vol = (pair, win) => val(pair.volume?.[win]);

    function detectNarrative(name, symbol) {
        const text = `${name || ''} ${symbol || ''}`.toUpperCase();
        const matches = TRENDING_NARRATIVES.filter(k => text.includes(k));
        return { hasNarrative: matches.length > 0, narratives: matches, bonus: Math.min(8, matches.length * 5) };
    }
    function getTimeWeight() {
        const h = new Date().getUTCHours();
        if (h >= 14 && h <= 22) return 1.0 + Math.max(0, 0.3 - Math.abs(h - 18) * 0.075);
        if (h >= 2 && h <= 8) return 0.7 + (h - 2) * 0.025;
        return 0.9;
    }
    function getTimeLabel() {
        const h = new Date().getUTCHours();
        if (h >= 14 && h <= 22) return 'US Peak';
        if (h >= 2 && h <= 8) return 'Off-Peak';
        return 'Transition';
    }
    function getSnapshotCache() {
        if (_snapshotCache) return _snapshotCache;
        try {
            const raw = localStorage.getItem(SNAPSHOT_KEY);
            _snapshotCache = new Map(Object.entries(raw ? JSON.parse(raw) : {}));
        } catch { _snapshotCache = new Map(); }
        return _snapshotCache;
    }
    function flushSnapshotsIfNeeded() {
        const now = Date.now();
        if (now - _lastFlush < FLUSH_INTERVAL_MS) return;
        _lastFlush = now;
        try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(Object.fromEntries(_snapshotCache))); } catch {}
    }
    function getTokenHistory(address) { return getSnapshotCache().get(address) || []; }
    function saveSnapshot(address, data) {
        if (!address) return;
        const cache = getSnapshotCache();
        const arr = cache.get(address) || [];
        arr.push({ ...data, time: Date.now() });
        if (arr.length > 30) arr.splice(0, arr.length - 30);
        cache.set(address, arr);
        flushSnapshotsIfNeeded();
    }
    function calcScoreVelocity(address, currentScore) {
        const history = getTokenHistory(address);
        if (history.length < 2) return { velocity: 0, trend: 'NEW', arrow: 'NEW' };
        const prev = history[history.length - 1];
        const dt = (Date.now() - prev.time) / 60000;
        if (dt < 0.1) return { velocity: 0, trend: 'STABLE', arrow: '->' };
        const v = (currentScore - (prev.score || 0)) / dt;
        if (v > 3) return { velocity: +v.toFixed(1), trend: 'ROCKETING', arrow: '+++' };
        if (v > 1.5) return { velocity: +v.toFixed(1), trend: 'ACCELERATING', arrow: '++' };
        if (v > 0.3) return { velocity: +v.toFixed(1), trend: 'RISING', arrow: '+' };
        if (v < -3) return { velocity: +v.toFixed(1), trend: 'CRASHING', arrow: '--' };
        if (v < -0.5) return { velocity: +v.toFixed(1), trend: 'DECELERATING', arrow: '-' };
        return { velocity: +v.toFixed(1), trend: 'STABLE', arrow: '->' };
    }

    function calcDormantHours(pair) {
        if (!pair.pairCreatedAt) return -1;
        const ageHours = (Date.now() - pair.pairCreatedAt) / 3.6e6;
        const v24 = vol(pair, 'h24'), v6 = vol(pair, 'h6'), v1 = vol(pair, 'h1'), v5 = vol(pair, 'm5');
        const txM5 = tx(pair, 'm5', 'buys') + tx(pair, 'm5', 'sells');
        const txH1 = tx(pair, 'h1', 'buys') + tx(pair, 'h1', 'sells');
        const txH6 = tx(pair, 'h6', 'buys') + tx(pair, 'h6', 'sells');
        const txH24 = tx(pair, 'h24', 'buys') + tx(pair, 'h24', 'sells');

        // Sin volumen ni transacciones en 24h => totalmente dormido
        if (v24 <= 0 && txH24 <= 0) return Math.min(ageHours, 8760);

        // Actividad significativa fuera de las ultimas 6h => NO dormido
        const volBefore6h = Math.max(0, v24 - v6);
        const txBefore6h = Math.max(0, txH24 - txH6);
        if (volBefore6h > Math.max(50, v24 * 0.20) || txBefore6h > 3) return 0;

        // Actividad entre h6 y h1
        const volBetween6and1 = Math.max(0, v6 - v1);
        const txBetween6and1 = Math.max(0, txH6 - txH1);
        if (volBetween6and1 > 10 || txBetween6and1 > 2) return Math.max(0, ageHours - 3.5);

        // Actividad entre h1 y m5
        const volBetween1and5m = Math.max(0, v1 - v5);
        const txBetween1and5m = Math.max(0, txH1 - txM5);
        if (volBetween1and5m > 10 || txBetween1and5m > 1) return Math.max(0, ageHours - 1);

        // Solo actividad en los ultimos 5min (el "despertar")
        if (v5 > 0 || txM5 > 0) return Math.max(0, ageHours - 0.1);
        return 0;
    }
    function isDormantWithBuys(pair) {
        const dormantGap = calcDormantHours(pair);
        const buys5m = tx(pair, 'm5', 'buys'), buys1h = tx(pair, 'h1', 'buys');
        const volAntes = Math.max(0, vol(pair, 'h24') - vol(pair, 'h1'));
        const estabaDormido = volAntes < 50;
        const tieneCompras = buys5m > 0 || buys1h > 0;
        return { dormido: estabaDormido, compras: tieneCompras, despertando: estabaDormido && tieneCompras && dormantGap >= MIN_WAKEUP_DORMANT_HOURS, volPrevio: volAntes, buysRecientes: buys5m + buys1h, horasInactivo: dormantGap };
    }
    function detectMicroBuys(pair, dormantHours) {
        const buys5m = tx(pair, 'm5', 'buys'), buys1h = tx(pair, 'h1', 'buys'), buys24h = tx(pair, 'h24', 'buys');
        const sells5m = tx(pair, 'm5', 'sells'), sells1h = tx(pair, 'h1', 'sells');
        const v5 = vol(pair, 'm5'), v1 = vol(pair, 'h1'), v24 = vol(pair, 'h24');
        let score = 0, pattern = null;
        if (dormantHours >= 24 && buys5m >= 1 && buys5m <= 8 && sells5m === 0 && buys24h <= buys5m + 4) { score = 100; pattern = 'GHOST_BUYS_24H'; }
        if (dormantHours >= 24 && buys1h >= 1 && buys1h <= 12 && buys24h <= buys1h + 6 && sells1h <= 1) { score = Math.max(score, 88); pattern = pattern || 'WAKE_UP_24H'; }
        if (dormantHours >= 24 && v5 > 10 && v5 < 1500 && v24 < v5 * 3.5) { score = Math.max(score, 80); pattern = pattern || 'VOL_TEST_24H'; }
        if (dormantHours >= 24 && buys1h >= 3 && buys1h <= 18 && sells1h <= 1 && v1 < 2500) { score = Math.max(score, 76); pattern = pattern || 'STEALTH_ACCUMULATION'; }
        return { score, pattern, buys5m, buys1h, sells5m, sells1h };
    }
    function detectLiquidityChange(pair, address) {
        const currentLiq = val(pair.liquidity?.usd);
        const history = getTokenHistory(address);
        if (history.length < 2) return { score: 0, change: 0, previousLiq: 0 };
        const prevLiq = history[history.length - 1].liquidity || 0;
        const oldestLiq = history[0].liquidity || 0;
        const change = prevLiq > 0 ? ((currentLiq - prevLiq) / prevLiq) * 100 : currentLiq > 0 ? 100 : 0;
        let score = 0;
        if (change > 50) score = 100; else if (change > 20) score = 80; else if (change > 10) score = 60; else if (change > 5) score = 40;
        if (oldestLiq < 100 && currentLiq > 1000) score = Math.max(score, 90);
        return { score, change: Math.round(change), previousLiq: prevLiq };
    }
    function calcMomentumScore(pair) {
        let score = 0; const patterns = [];
        const pm5 = val(pair.priceChange?.m5), ph1 = val(pair.priceChange?.h1), v5 = vol(pair, 'm5'), v1 = vol(pair, 'h1');
        const buys5m = tx(pair, 'm5', 'buys'), sells5m = tx(pair, 'm5', 'sells'), liq = val(pair.liquidity?.usd, 1), mcap = val(pair.marketCap || pair.fdv);
        if (pm5 > 100) { score += 40; patterns.push('ROCKET'); } else if (pm5 > 50) { score += 35; patterns.push('SURGE'); } else if (pm5 > 20) { score += 30; patterns.push('PUMP'); } else if (pm5 > 10) { score += 25; patterns.push('RISING'); } else if (pm5 > 5) score += 20; else if (pm5 > 0) score += 10;
        if (buys5m > 0 && sells5m === 0) { score += 25; if (buys5m >= 3) patterns.push('PURE_BUYS'); } else if (buys5m > 0 && buys5m > sells5m * 3) score += 15;
        if (liq > 0 && v5 > 0) { const vlr = v5 / liq; if (vlr > 1) score += 20; else if (vlr > 0.5) score += 15; else if (vlr > 0.2) score += 10; }
        if (mcap > 0 && mcap < 100000 && buys5m > 0) score += mcap < 10000 ? 15 : mcap < 25000 ? 12 : mcap < 50000 ? 8 : 5;
        if (v1 > 0 && v5 > 0) { const exp = v1 / 12; if (v5 > exp * 5) { score += 15; patterns.push('ACCEL'); } else if (v5 > exp * 3) score += 10; }
        if (pm5 > 5 && ph1 < -10) { score += 10; patterns.push('REVERSAL'); }
        return { score: Math.min(100, score), patterns };
    }
    function calcVolumeSpike(pair) {
        const v5 = vol(pair, 'm5'), v1 = vol(pair, 'h1'), v24 = vol(pair, 'h24');
        if (v24 < 100 && (v5 > 50 || v1 > 100)) return { ratio: 999, score: 100 };
        if (v24 < 1) return { ratio: 0, score: 0 };
        const dailyRate = v24 / 24;
        const maxSpike = Math.max(v1 / dailyRate, (v5 * 12) / dailyRate);
        let score = 0;
        if (maxSpike > 50) score = 100; else if (maxSpike > 20) score = 85; else if (maxSpike > 10) score = 70; else if (maxSpike > 5) score = 55; else if (maxSpike > 2) score = 35; else if (maxSpike > 1.2) score = 15;
        return { ratio: maxSpike, score };
    }
    function calcBuyRatio(pair) {
        const wb = tx(pair, 'm5', 'buys') * 4 + tx(pair, 'h1', 'buys') * 2 + tx(pair, 'h24', 'buys');
        const ws = tx(pair, 'm5', 'sells') * 4 + tx(pair, 'h1', 'sells') * 2 + tx(pair, 'h24', 'sells');
        const rawBuys = tx(pair, 'm5', 'buys') + tx(pair, 'h1', 'buys') + tx(pair, 'h24', 'buys');
        const rawSells = tx(pair, 'm5', 'sells') + tx(pair, 'h1', 'sells') + tx(pair, 'h24', 'sells');
        const total = wb + ws;
        if (total === 0) return { ratio: 0, buys: rawBuys, sells: rawSells, score: 0 };
        const ratio = wb / total;
        const score = ratio > 0.95 ? 100 : ratio > 0.85 ? 80 : ratio > 0.75 ? 60 : ratio > 0.65 ? 40 : ratio > 0.55 ? 20 : 0;
        return { ratio, buys: rawBuys, sells: rawSells, score };
    }
    function calcAgeScore(h) { return h >= 336 ? 100 : h >= 168 ? 90 : h >= 72 ? 70 : h >= 48 ? 55 : h >= 24 ? 45 : 0; }
    function calcMcapScore(m) { return m <= 0 ? 0 : m < 5000 ? 100 : m < 10000 ? 95 : m < 25000 ? 88 : m < 50000 ? 74 : m < 100000 ? 58 : m < 500000 ? 30 : 8; }
    function calcLiquidityScore(l) { return l < 300 ? 0 : l < 1000 ? 45 : l < 2500 ? 70 : l < 15000 ? 100 : l < 50000 ? 72 : 30; }
    function calcViewers(pair, signals) {
        let est = (tx(pair, 'm5', 'buys') + tx(pair, 'm5', 'sells')) * 5 + tx(pair, 'h1', 'buys') + tx(pair, 'h1', 'sells');
        if (signals.boosted) est = Math.max(est, 15) * 1.5; if (signals.topBoosted) est *= 2; if (signals.communityTakeover) est += 10; if (signals.profileUpdated) est += 6;
        return Math.round(est);
    }
    function calcPumpProbability(pair) {
        let prob = 0;
        const pm5 = val(pair.priceChange?.m5), buys5m = tx(pair, 'm5', 'buys'), sells5m = tx(pair, 'm5', 'sells'), buys1h = tx(pair, 'h1', 'buys'), sells1h = tx(pair, 'h1', 'sells');
        const v5 = vol(pair, 'm5'), v1 = vol(pair, 'h1'), liq = val(pair.liquidity?.usd), mcap = val(pair.marketCap || pair.fdv);
        prob += pm5 > 50 ? 28 : pm5 > 20 ? 23 : pm5 > 10 ? 18 : pm5 > 5 ? 14 : pm5 > 0 ? 8 : 0;
        const total5m = buys5m + sells5m;
        if (total5m > 0) { const bp = buys5m / total5m; prob += bp >= 1 && buys5m >= 2 ? 20 : bp >= 0.8 ? 15 : bp >= 0.65 ? 10 : bp >= 0.5 ? 5 : 0; }
        if (v1 > 0 && v5 > 0) { const exp = v1 / 12; prob += v5 > exp * 10 ? 15 : v5 > exp * 5 ? 12 : v5 > exp * 3 ? 8 : 0; }
        prob += mcap > 0 && mcap < 5000 ? 15 : mcap > 0 && mcap < 25000 ? 12 : mcap > 0 && mcap < 100000 ? 8 : mcap > 0 && mcap < 500000 ? 3 : 0;
        prob += liq > 5000 && liq < 100000 ? 10 : liq > 1000 ? 5 : 0;
        if (buys1h > sells1h * 2 && buys1h >= 3) prob += 12;
        if (sells5m > buys5m && sells5m >= 2) prob -= 15;
        if (pm5 < -10) prob -= 10;
        if (liq < 500) prob -= 10;
        return clamp(Math.round(prob), 0, 99);
    }
    function calcPumpTarget(pair) {
        const mcap = val(pair.marketCap || pair.fdv), pm5 = val(pair.priceChange?.m5), buys5m = tx(pair, 'm5', 'buys'), sells5m = tx(pair, 'm5', 'sells');
        const v5 = vol(pair, 'm5'), v1 = vol(pair, 'h1'), liq = val(pair.liquidity?.usd);
        let ceiling = mcap <= 0 ? 100 : mcap < 5000 ? 1000 : mcap < 10000 ? 600 : mcap < 25000 ? 350 : mcap < 50000 ? 220 : mcap < 100000 ? 120 : mcap < 500000 ? 60 : 20;
        let strength = pm5 > 100 ? 0.95 : pm5 > 50 ? 0.85 : pm5 > 20 ? 0.72 : pm5 > 10 ? 0.58 : pm5 > 5 ? 0.42 : pm5 > 0 ? 0.28 : 0.15;
        const total5m = buys5m + sells5m;
        if (total5m > 0 && buys5m / total5m >= 0.8) strength = Math.min(1, strength + 0.15);
        if (buys5m > 0 && sells5m === 0) strength = Math.min(1, strength + 0.12);
        if (v1 > 0 && v5 > 0 && v5 > (v1 / 12) * 3) strength = Math.min(1, strength + 0.1);
        if (liq > 0 && liq < 5000) ceiling = Math.round(ceiling * 1.35);
        const estimate = Math.round(ceiling * strength);
        return { min: Math.max(5, Math.round(estimate * 0.4)), max: Math.min(2000, Math.round(estimate * 2.2)), estimate: clamp(estimate, 5, 2000) };
    }
    function detectPrePumpPattern(pair, signals, dormantHours, microBuys, liqChange, pumpTarget) {
        let score = 0; const patterns = [];
        if (signals.profileUpdated && signals.boosted && dormantHours >= 24) { score = Math.max(score, 90); patterns.push('SETUP_24H'); }
        if (microBuys.score >= 50 && liqChange.score >= 40) { score = Math.max(score, 95); patterns.push('STEALTH'); }
        if (signals.communityTakeover && microBuys.buys5m > 0 && dormantHours >= 24) { score = Math.max(score, 85); patterns.push('CTO_REVIVAL'); }
        if (signals.boosted && dormantHours >= 24 && vol(pair, 'h24') < 1000) { score = Math.max(score, 82); patterns.push('DEAD_BOOST_24H'); }
        if (liqChange.change > 10 && signals.profileUpdated && vol(pair, 'h24') < 1000) { score = Math.max(score, 88); patterns.push('LIQ_INJECT'); }
        if (pumpTarget?.max >= 100 && dormantHours >= 24 && microBuys.score >= 70) { score = Math.max(score, 92); patterns.push('EARLY_X2_SETUP'); }
        return { score, patterns };
    }
    function bucket(value, limits) { for (let i = 0; i < limits.length; i++) if (value < limits[i]) return i; return limits.length; }
    function calcX2Potential(pair, dormantHours, microBuys, volumeSpike, buyRatio, pumpTarget, signals) {
        const mcap = val(pair.marketCap || pair.fdv), liq = val(pair.liquidity?.usd), v5 = vol(pair, 'm5'), v1 = vol(pair, 'h1'), pm5 = val(pair.priceChange?.m5);
        const buys5m = tx(pair, 'm5', 'buys'), sells5m = tx(pair, 'm5', 'sells'), total5m = buys5m + sells5m;
        const buyPressure = total5m > 0 ? buys5m / total5m : buyRatio.ratio;
        const axes = { dormant: bucket(dormantHours, [24,48,72,168,336]), mcap: bucket(mcap || 999999999, [5000,10000,25000,50000,100000,250000]), liq: bucket(liq, [500,1000,2500,5000,15000,50000]), vol: bucket(v5, [10,50,100,250,500,1000,2500]), buys: bucket(buys5m, [1,2,3,5,8,13]), pressure: bucket(buyPressure, [0.55,0.65,0.75,0.85,0.95,1.01]), accel: bucket(v1 > 0 ? v5 / Math.max(1, v1 / 12) : 0, [1,2,3,5,8,13]), momentum: bucket(pm5, [0,5,10,20,40,80,150]) };
        const patternSpace = 5 * 6 * 6 * 7 * 6 * 6 * 6 * 7;
        const patternId = `X2-${Object.values(axes).join('-')}`;
        let score = 0; const matches = [];
        if (dormantHours >= 24) { score += 18; matches.push('24H_DORMANT'); }
        if (mcap > 0 && mcap <= 50000) { score += 18; matches.push('LOW_MCAP_ROOM'); } else if (mcap > 0 && mcap <= 100000) score += 10;
        if (liq >= 500 && liq <= 25000) { score += 13; matches.push('HEALTHY_THIN_LIQ'); }
        if (pumpTarget.max >= 100) { score += 18; matches.push('TARGET_2X'); }
        if (microBuys.score >= 70) { score += 13; matches.push('MICRO_BUYS'); }
        if (volumeSpike.score >= 55) { score += 8; matches.push('VOL_EXPANSION'); }
        if (buyPressure >= 0.8 && buys5m > 0) { score += 8; matches.push('BUY_PRESSURE'); }
        if (sells5m === 0 && buys5m > 0) { score += 5; matches.push('NO_SELLS_5M'); }
        if (signals.boosted || signals.profileUpdated || signals.communityTakeover || signals.graduated) { score += 5; matches.push('CATALYST'); }
        const stairStepWakeup = dormantHours >= 24 && v5 >= 50 && buyPressure >= 0.65 && (buys5m > 0 || pm5 > 5) && (mcap <= 0 || mcap <= 300000);
        if (stairStepWakeup) { score += 16; matches.push('STAIR_STEP_WAKEUP'); }
        const hardFail = dormantHours < 24 || (!stairStepWakeup && pumpTarget.max < 100) || (mcap > 0 && mcap > 300000);
        return { score: clamp(score, 0, 100), qualifies: !hardFail && score >= 58, patternId, patternSpace, matches, axes };
    }
    function calcMicrocap10xWakeup(pair, dormantHours, microBuys, volumeSpike, buyRatio, signals) {
        const mcap = val(pair.marketCap || pair.fdv);
        const liq = val(pair.liquidity?.usd);
        const v5 = vol(pair, 'm5'), v1 = vol(pair, 'h1'), v24 = vol(pair, 'h24');
        const buys5m = tx(pair, 'm5', 'buys'), sells5m = tx(pair, 'm5', 'sells');
        const buys1h = tx(pair, 'h1', 'buys'), sells1h = tx(pair, 'h1', 'sells');
        const pm5 = val(pair.priceChange?.m5), ph1 = val(pair.priceChange?.h1);
        const total5m = buys5m + sells5m;
        const total1h = buys1h + sells1h;
        const buyPressure5m = total5m > 0 ? buys5m / total5m : buyRatio.ratio;
        const buyPressure1h = total1h > 0 ? buys1h / total1h : buyRatio.ratio;
        const accel = v1 > 0 ? v5 / Math.max(1, v1 / 12) : 0;

        let score = 0; const matches = [];
        if (dormantHours >= 24) { score += 12; matches.push('DORMANT_24H'); }
        if (dormantHours >= 72) { score += 8; matches.push('DORMANT_3D'); }
        if (mcap >= 1800 && mcap <= 12000) { score += 22; matches.push('MCAP_2K_12K'); }
        else if (mcap > 0 && mcap <= 20000) { score += 12; matches.push('MCAP_UNDER_20K'); }
        if (liq >= 700 && liq <= 9000) { score += 16; matches.push('THIN_GOOD_LIQ'); }
        else if (liq >= 400 && liq <= 15000) { score += 9; matches.push('OK_LIQ'); }
        if (v5 >= 40 && v5 <= 750) { score += 14; matches.push('FIRST_SMALL_VOL'); }
        else if (v5 > 0 && v5 <= 1500) { score += 8; matches.push('EARLY_VOL'); }
        if (buys5m >= 1 && buys5m <= 8 && sells5m <= 1) { score += 14; matches.push('TINY_BUY_CLUSTER'); }
        if (buyPressure5m >= 0.75 || buyPressure1h >= 0.70) { score += 12; matches.push('BUY_PRESSURE'); }
        if (pm5 >= 3 && pm5 <= 45) { score += 9; matches.push('EARLY_GREEN'); }
        else if (ph1 >= 5 && ph1 <= 80) { score += 6; matches.push('H1_STAIR_STEP'); }
        if (accel >= 2.5 || volumeSpike.score >= 55) { score += 7; matches.push('VOL_ACCEL'); }
        if (microBuys.score >= 70) { score += 7; matches.push('MICRO_BUYS'); }
        if (v24 > 0 && v1 > 0 && v24 <= Math.max(1000, v1 * 4)) { score += 5; matches.push('LOW_PRIOR_VOLUME'); }
        if (signals.boosted || signals.profileUpdated || signals.communityTakeover || signals.graduated) { score += 4; matches.push('CATALYST'); }

        const hardFail = dormantHours < 24 || (mcap > 0 && (mcap < 1200 || mcap > 30000)) || (liq > 0 && (liq < 250 || liq > 25000)) || sells5m > buys5m + 2;
        const qualifies = !hardFail && score >= 62;
        return { score: clamp(score, 0, 100), qualifies, matches, targetMcap: mcap > 0 ? Math.round(mcap * 10) : 0 };
    }
    function calcConvergence(data, signals) {
        let c = 0; const a = [];
        if (data.momentum.patterns.length) { c++; a.push('MOMENTUM'); }
        if (data.microBuys.score >= 50) { c++; a.push('MICRO_BUYS'); }
        if (data.volumeSpike.ratio > 5) { c++; a.push('VOL_SPIKE'); }
        if (data.buyRatio.ratio > 0.8) { c++; a.push('BUY_PRESSURE'); }
        if (data.liqChange.change > 10) { c++; a.push('LIQ_CHANGE'); }
        if (data.dormantBuys?.despertando) { c++; a.push('AWAKENING'); }
        if (data.prePump.patterns.length) { c++; a.push('PRE_PUMP'); }
        if (data.x2Potential?.qualifies) { c++; a.push('X2_SETUP'); }
        if (data.microcap10x?.qualifies) { c += 2; a.push('MICROCAP_10X'); }
        if (data.wakeup?.tier === 'CONFIRMED') { c += 2; a.push('WAKEUP_CONFIRMED'); }
        else if (data.wakeup?.tier === 'DETECTED') { c++; a.push('WAKEUP_DETECTED'); }
        if (signals.boosted) { c++; a.push('BOOSTED'); }
        if (signals.communityTakeover) { c++; a.push('CTO'); }
        if (signals.profileUpdated) { c++; a.push('PROFILE'); }
        if (data.narrative?.hasNarrative) { c++; a.push('NARRATIVE'); }
        return { level: c >= 4 ? 'TOP_PICK' : c >= 3 ? 'STRONG' : c >= 2 ? 'WATCH' : 'NONE', count: c, active: a };
    }
    function antiRugCheck(pair, onChain) {
        const warnings = []; let rs = 0;
        const b1 = tx(pair, 'h1', 'buys'), s1 = tx(pair, 'h1', 'sells'), b5 = tx(pair, 'm5', 'buys'), s5 = tx(pair, 'm5', 'sells');
        const liq = val(pair.liquidity?.usd), mcap = val(pair.marketCap || pair.fdv), age = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3.6e6 : 999;
        if (b1 >= 5 && s1 === 0 && b5 >= 2 && s5 === 0) { warnings.push('HONEYPOTx no sells'); rs += 30; }
        if (liq < 200 && liq > 0) { warnings.push('Very low liquidity'); rs += 25; }
        if (age < 0.083 && mcap > 50000) { warnings.push('Suspicious fresh mcap'); rs += 20; }
        if (mcap > 0 && liq > 0 && mcap / liq > 50) { warnings.push('Low liquidity/mcap'); rs += 15; }
        if (onChain?.bundleScore > 60) { warnings.push('Bundle risk'); rs += 25; }
        if (onChain?.freshWalletScore > 70) { warnings.push('Fresh wallet risk'); rs += 20; }
        return { safe: rs < 50, warnings, rugScore: Math.min(100, rs) };
    }

    function classifyWakeup(pair, dormantHours, microBuys, volumeSpike, buyRatio, momentum, mcap, liq, rug) {
        const buys5m = tx(pair, 'm5', 'buys');
        const sells5m = tx(pair, 'm5', 'sells');
        const buys1h = tx(pair, 'h1', 'buys');
        const sells1h = tx(pair, 'h1', 'sells');
        const volume5m = vol(pair, 'm5');
        const volumeH1 = vol(pair, 'h1');
        const isWakeup = dormantHours >= MIN_WAKEUP_DORMANT_HOURS && (buys5m + buys1h) > 0;

        if (!isWakeup) {
            return { isWakeup: false, tier: 'NONE', tradable: false, confirmations: [] };
        }

        const confirmations = [];
        if (buys5m >= 2 || (buys5m >= 1 && buys1h >= 3)) confirmations.push('REPEAT_BUYS');
        if (buyRatio.ratio >= 0.70 && (buys5m + buys1h) >= 2) confirmations.push('BUY_PRESSURE');
        if (sells5m <= Math.max(1, buys5m) && sells1h <= Math.max(2, buys1h)) confirmations.push('SELLS_CONTROLLED');
        if (volume5m >= 40 || volumeH1 >= 150) confirmations.push('VOLUME_RETURNING');
        if (volumeSpike.score >= 55) confirmations.push('VOL_SPIKE');
        if (momentum.score >= 20 || microBuys.score >= 70) confirmations.push('EARLY_MOMENTUM');
        if (liq >= 500 && (mcap === 0 || mcap <= 300000)) confirmations.push('TRADABLE_RANGE');
        if (rug?.safe) confirmations.push('RISK_OK');

        const isolatedBuy = (buys5m + buys1h) <= 1 && volume5m < 40 && volumeSpike.score < 35;
        const tier = confirmations.length >= 4 && !isolatedBuy ? 'CONFIRMED' : 'DETECTED';
        const tradable = tier === 'CONFIRMED' && confirmations.includes('TRADABLE_RANGE') && confirmations.includes('RISK_OK');

        return {
            isWakeup,
            tier,
            tradable,
            confirmations,
            dormantHours: Math.round(dormantHours),
            buys5m,
            sells5m,
            buys1h,
            sells1h,
            buyPressure: +buyRatio.ratio.toFixed(3),
            volume5m,
            volumeH1,
            reason: tier === 'CONFIRMED'
                ? `${confirmations.length} confirmations after ${Math.round(dormantHours)}h dormant`
                : `first activity after ${Math.round(dormantHours)}h dormant`
        };
    }

    function scoreToken(pair, signals = {}) {
        const address = pair.baseToken?.address || '';
        const dormantHours = calcDormantHours(pair), volumeSpike = calcVolumeSpike(pair), buyRatio = calcBuyRatio(pair);
        const mcap = val(pair.marketCap || pair.fdv), liq = val(pair.liquidity?.usd);
        const microBuys = detectMicroBuys(pair, dormantHours), liqChange = detectLiquidityChange(pair, address), momentum = calcMomentumScore(pair);
        const pumpProb = calcPumpProbability(pair), pumpTarget = calcPumpTarget(pair), x2Potential = calcX2Potential(pair, dormantHours, microBuys, volumeSpike, buyRatio, pumpTarget, signals);
        const microcap10x = calcMicrocap10xWakeup(pair, dormantHours, microBuys, volumeSpike, buyRatio, signals);
        const prePump = detectPrePumpPattern(pair, signals, dormantHours, microBuys, liqChange, pumpTarget);
        const tokenAgeHours = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3.6e6 : -1;
        const dormantBuys = isDormantWithBuys(pair), narrative = detectNarrative(pair.baseToken?.name, pair.baseToken?.symbol), timeWeight = getTimeWeight(), rug = antiRugCheck(pair, null);
        const ageScore = calcAgeScore(dormantHours), mcapScore = calcMcapScore(mcap), liqScore = calcLiquidityScore(liq), viewers = calcViewers(pair, signals), adjustedMomentum = Math.round(momentum.score * timeWeight);
        const totalScore = Math.round(adjustedMomentum * WEIGHTS.momentum + volumeSpike.score * WEIGHTS.volumeSpike + buyRatio.score * WEIGHTS.buyRatio + ageScore * WEIGHTS.age + mcapScore * WEIGHTS.mcap + liqScore * WEIGHTS.liquidity + microBuys.score * WEIGHTS.microBuys + liqChange.score * WEIGHTS.liqChange + prePump.score * WEIGHTS.prepump + x2Potential.score * WEIGHTS.x2Potential);
        const wakeup = classifyWakeup(pair, dormantHours, microBuys, volumeSpike, buyRatio, momentum, mcap, liq, rug);
        let bonus = 0;
        if (signals.boosted) bonus += 8; if (signals.profileUpdated) bonus += 4; if (signals.communityTakeover) bonus += 6; if (signals.graduated) bonus += 15; if (narrative.hasNarrative) bonus += narrative.bonus; if (x2Potential.qualifies) bonus += 5; if (microcap10x.qualifies) bonus += 12; if (dormantBuys.despertando) bonus += 4; if (wakeup.tier === 'CONFIRMED') bonus += 8; else if (wakeup.tier === 'DETECTED') bonus += 2;
        const finalScore = Math.min(100, totalScore + bonus), velocity = calcScoreVelocity(address, finalScore);
        const interData = { momentum, microBuys, volumeSpike, buyRatio, liqChange, dormantBuys, prePump, narrative, x2Potential, microcap10x, wakeup };
        const convergence = calcConvergence(interData, signals);
        const activeTags = [];
        if (wakeup.tier === 'CONFIRMED') activeTags.push({ type: 'wakeup', label: `WAKEUP CONFIRMED (${wakeup.confirmations.length})` });
        else if (wakeup.tier === 'DETECTED') activeTags.push({ type: 'ghost', label: 'WAKEUP DETECTED' });
        if (microcap10x.qualifies) activeTags.push({ type: 'microcap10x', label: `10X WAKEUP ${microcap10x.score}` });
        if (x2Potential.qualifies) activeTags.push({ type: 'x2', label: `X2 SETUP ${x2Potential.score}` });
        if (convergence.level === 'TOP_PICK') activeTags.push({ type: 'top-pick', label: `TOP PICK (${convergence.count})` }); else if (convergence.level === 'STRONG') activeTags.push({ type: 'strong-pick', label: `STRONG (${convergence.count})` });
        for (const p of momentum.patterns) activeTags.push({ type: 'momentum', label: p });
        if (dormantBuys.despertando) activeTags.push({ type: 'ghost', label: `DESPERTANDO 24H+ (${dormantBuys.buysRecientes} buys)` });
        if (microBuys.pattern) activeTags.push({ type: 'wakeup', label: microBuys.pattern });
        if (liqChange.change > 10) activeTags.push({ type: 'liq', label: `LIQ +${liqChange.change}%` });
        for (const p of prePump.patterns) activeTags.push({ type: 'ghost', label: p });
        if (signals.boosted) activeTags.push({ type: 'boost', label: 'BOOST' }); if (signals.communityTakeover) activeTags.push({ type: 'cto', label: 'CTO' }); if (signals.profileUpdated) activeTags.push({ type: 'new-profile', label: 'PROFILE' });
        if (volumeSpike.ratio > 5) activeTags.push({ type: 'volume', label: 'SPIKE' }); if (buyRatio.ratio > 0.8 && !microBuys.pattern) activeTags.push({ type: 'buys', label: 'BUYS' }); if (narrative.hasNarrative) activeTags.push({ type: 'narrative', label: narrative.narratives[0] }); if (signals.graduated) activeTags.push({ type: 'graduated', label: 'GRADUATED' }); if (!rug.safe) activeTags.push({ type: 'rug', label: `RUG ${rug.rugScore}` });
        const priceChange = { m5: val(pair.priceChange?.m5), h1: val(pair.priceChange?.h1), h6: val(pair.priceChange?.h6), h24: val(pair.priceChange?.h24) };
        const subiendo = priceChange.m5 > 0 || priceChange.h1 > 0;
        if (subiendo && (priceChange.m5 > 5 || priceChange.h1 > 10)) activeTags.push({ type: 'buys', label: `+${Math.max(priceChange.m5, priceChange.h1).toFixed(0)}%` });
        saveSnapshot(address, { liquidity: liq, mcap, vol24: vol(pair, 'h24'), buys: buyRatio.buys, sells: buyRatio.sells, score: finalScore });
        const v = { m5: vol(pair, 'm5'), h1: vol(pair, 'h1'), h6: vol(pair, 'h6'), h24: vol(pair, 'h24') };
        return { score: finalScore, dormantHours: Math.round(dormantHours), dormantBuys, wakeup, viewers, volumeSpike, buyRatio, priceChange, subiendo, momentum, pumpProbability: pumpProb, pumpTarget, x2Potential, microcap10x, tokenAgeHours: Math.round(tokenAgeHours), microBuys, liqChange, prePump, ageScore, mcapScore, liqScore, mcap, liquidity: liq, volume5m: v.m5, volumeH1: v.h1, volume: v, narrative, velocity, convergence, rug, timeWeight, signals: activeTags, breakdown: { momentum: Math.round(adjustedMomentum * WEIGHTS.momentum), volumeSpike: Math.round(volumeSpike.score * WEIGHTS.volumeSpike), buyRatio: Math.round(buyRatio.score * WEIGHTS.buyRatio), age: Math.round(ageScore * WEIGHTS.age), mcap: Math.round(mcapScore * WEIGHTS.mcap), liquidity: Math.round(liqScore * WEIGHTS.liquidity), microBuys: Math.round(microBuys.score * WEIGHTS.microBuys), liqChange: Math.round(liqChange.score * WEIGHTS.liqChange), prePump: Math.round(prePump.score * WEIGHTS.prepump), x2Potential: Math.round(x2Potential.score * WEIGHTS.x2Potential), microcap10x: microcap10x.score, narrative: narrative.bonus, bonus } };
    }
    function passesFilters(scored, filters, filterDiag = null) {
        if (scored.score < filters.minScore) { if (filterDiag) filterDiag.score++; return false; }
        if (filters.maxMcap > 0 && scored.mcap > filters.maxMcap && scored.mcap > 0) { if (filterDiag) filterDiag.mcap++; return false; }
        const isDespertando = scored.dormantBuys && scored.dormantBuys.despertando;
        const horasInactivo = scored.dormantBuys?.horasInactivo ?? scored.dormantHours ?? -1;
        if (filters.minDormantHours > 0) {
            if (isDespertando && horasInactivo >= filters.minDormantHours) {}
            else if (scored.dormantHours !== -1 && scored.tokenAgeHours !== -1) { if (scored.dormantHours < filters.minDormantHours) { if (filterDiag) filterDiag.dormant++; return false; } }
            else { if (filterDiag) filterDiag.dormant++; return false; }
        }
        if (filters.minPumpTarget > 0 && (scored.pumpTarget?.max || 0) < filters.minPumpTarget && !scored.x2Potential?.qualifies) { if (filterDiag) filterDiag.x2 = (filterDiag.x2 || 0) + 1; return false; }
        if (filters.soloSubiendo) { const m5up = (scored.priceChange?.m5 || 0) > 0, h1up = (scored.priceChange?.h1 || 0) > 0; if (!m5up && !h1up) { if (filterDiag) filterDiag.subiendo++; return false; } }
        if (filters.minHolders > 0 && scored.holderCount !== undefined && scored.holderCount > 0 && scored.holderCount < filters.minHolders) { if (filterDiag) filterDiag.holders++; return false; }
        const vol5m = scored.volume5m || 0;
        if (filters.minVolume5m > 0 && vol5m < filters.minVolume5m) { if (filterDiag) filterDiag.vol5m++; return false; }
        if (filters.hideRug && scored.rug && !scored.rug.safe) { if (filterDiag) filterDiag.rug++; return false; }
        if (filterDiag) filterDiag.passed++;
        return true;
    }
    return { scoreToken, passesFilters, calcDormantHours, antiRugCheck, getTimeLabel, getTimeWeight };
})();

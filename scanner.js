/**
 * scanner.js a Multi-Source Discovery Engine v6 GOD MODE
 * Discovers tokens via:
 *   1. DexScreener (boosts, profiles, CTOs)
 *   2. GeckoTerminal (trending x3 + new pools + per-DEX pools)
 *   3. Helius (on-chain swaps Raydium + PumpSwap)
 *   4. Pump.fun API (150 currently-live tokens)
 *   5. WebSocket LIVE (Helius Enhanced WSS)
 */

const Scanner = (() => {
    const DEXS_BASE = 'https://api.dexscreener.com';
    const GECKO_BASE = 'https://api.geckoterminal.com/api/v2';
    const CHAIN = 'solana';
    // DexScreener /tokens/v1 accepts up to 30 token addresses per request.
    const BATCH_SIZE = 30;
    const REQ_DELAY = 100;  // minimo delay entre requests

    let requestCount = 0;
    let lastResetTime = Date.now();
    let onLog = () => {};
    
    // CachA para recordar tokens recientes y re-evaluar su precio en cada ciclo.
    // Esto nos permite detectar pumps de 1 minuto en tokens ya conocidos.
    const _recentTokensCache = new Map(); // address -> { data, lastSeen }
    const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h: seguir wake-ups por escalones tras la primera activacion
    const _pendingLiveDetails = new Map(); // address -> { data, firstSeen, lastSeen }
    const PENDING_LIVE_TTL = 10 * 60 * 1000;
    const FAST_PROGRAMS = [
        { name: 'PumpSwap', address: 'PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP', source: 'helius_fast_pumpswap' },
        { name: 'Pump.fun', address: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P', source: 'helius_fast_pumpfun' }
    ];
    let _lastFastHeliusPoll = 0;
    let _fastProgramIndex = 0;
    function log(msg, level = 'info') { onLog(msg, level); }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function resetRateCounter() {
        if (Date.now() - lastResetTime > 60000) {
            requestCount = 0;
            lastResetTime = Date.now();
        }
    }

    async function safeFetch(url) {
        resetRateCounter();
        if (requestCount >= 280) {
            const waitMs = 60000 - (Date.now() - lastResetTime) + 1000;
            log(`a3 Rate limit, esperando ${(waitMs/1000).toFixed(0)}s...`, 'warning');
            await sleep(waitMs);
            requestCount = 0;
            lastResetTime = Date.now();
        }
        requestCount++;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            log(`a Fetch error: ${e.message}`, 'error');
            return null;
        }
    }

    // ==========================================
    // SOURCE 1: DexScreener feeds (boosts, profiles, CTOs)
    // ==========================================
    async function discoverFromDexScreener() {
        const discovered = new Map();

        // 4 llamadas EN PARALELO (antes secuencial = 1.4s desperdiciados)
        const [boosted, topBoosted, profiles, ctos] = await Promise.all([
            safeFetch(`${DEXS_BASE}/token-boosts/latest/v1`),
            safeFetch(`${DEXS_BASE}/token-boosts/top/v1`),
            safeFetch(`${DEXS_BASE}/token-profiles/latest/v1`),
            safeFetch(`${DEXS_BASE}/community-takeovers/latest/v1`)
        ]);

        if (Array.isArray(boosted)) {
            for (const t of boosted) {
                if (t.chainId === CHAIN) {
                    const e = discovered.get(t.tokenAddress) || {};
                    discovered.set(t.tokenAddress, { ...e, boosted: true, source: 'dexscreener' });
                }
            }
        }
        if (Array.isArray(topBoosted)) {
            for (const t of topBoosted) {
                if (t.chainId === CHAIN) {
                    const e = discovered.get(t.tokenAddress) || {};
                    discovered.set(t.tokenAddress, { ...e, boosted: true, topBoosted: true, source: 'dexscreener' });
                }
            }
        }
        if (Array.isArray(profiles)) {
            for (const t of profiles) {
                if (t.chainId === CHAIN) {
                    const e = discovered.get(t.tokenAddress) || {};
                    discovered.set(t.tokenAddress, { ...e, profileUpdated: true, source: 'dexscreener' });
                }
            }
        }
        if (Array.isArray(ctos)) {
            for (const t of ctos) {
                if (t.chainId === CHAIN) {
                    const e = discovered.get(t.tokenAddress) || {};
                    discovered.set(t.tokenAddress, { ...e, communityTakeover: true, source: 'dexscreener' });
                }
            }
        }

        return discovered;
    }

    // ==========================================
    // SOURCE 2: GeckoTerminal a Recently active pools on Solana
    // This catches ALL tokens with new activity, not just promoted ones
    // ==========================================
    async function discoverFromGeckoTerminal() {
        const discovered = new Map();

        // 7 llamadas EN PARALELO (balanced for rate limit)
        log('YZ GeckoTerminal: trending x2 + new + Raydium x2 + PumpSwap x2...');
        const [t1, t2, n1, rayPools, rayVol, psPools, psVol] = await Promise.all([
            safeFetch(`${GECKO_BASE}/networks/solana/trending_pools?page=1`),
            safeFetch(`${GECKO_BASE}/networks/solana/trending_pools?page=2`),
            safeFetch(`${GECKO_BASE}/networks/solana/new_pools?page=1`),
            safeFetch(`${GECKO_BASE}/networks/solana/dexes/raydium/pools?page=1&sort=h24_tx_count_desc`),
            safeFetch(`${GECKO_BASE}/networks/solana/dexes/raydium/pools?page=1&sort=h24_volume_usd_desc`),
            safeFetch(`${GECKO_BASE}/networks/solana/dexes/pumpswap/pools?page=1`),
            safeFetch(`${GECKO_BASE}/networks/solana/dexes/pumpswap/pools?page=1&sort=h24_volume_usd_desc`)
        ]);

        for (const data of [t1, t2, n1, rayPools, rayVol, psPools, psVol]) {
            if (data?.data) {
                for (const pool of data.data) {
                    const attrs = pool.attributes || {};
                    const addr = attrs.address;
                    const tokenAddr = pool.relationships?.base_token?.data?.id?.replace('solana_', '') || '';
                    if (tokenAddr) {
                        const e = discovered.get(tokenAddr) || {};
                        discovered.set(tokenAddr, { ...e, source: e.source || 'gecko_trending', geckoPool: addr });
                    }
                }
            }
        }

        return discovered;
    }

    // ==========================================
    // SOURCE 3: Helius a Recent on-chain swaps
    // Monitors actual DEX transactions in real-time
    // ==========================================
    async function discoverFromHelius() {
        if (typeof Helius === 'undefined') return new Map();
        const discovered = new Map();
        // Get recent transactions from Raydium V4
        const RAYDIUM_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
        log('ai  Helius: escaneando swaps recientes en Raydium...');

        try {
            const swaps = await Helius.getAddressTransactions(RAYDIUM_V4, { type: 'SWAP', limit: 100 });
            if (Array.isArray(swaps)) {
                for (const swap of swaps) {
                    // Extract token addresses from swap events
                    const tokenTransfers = swap.tokenTransfers || [];
                    for (const transfer of tokenTransfers) {
                        const mint = transfer.mint;
                        if (mint && mint !== 'So11111111111111111111111111111111111111112' &&
                            mint !== 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
                            // Not SOL or USDC
                            const e = discovered.get(mint) || {};
                            discovered.set(mint, {
                                ...e,
                                source: e.source || 'helius_swap',
                                recentSwap: true,
                                lastSwapTime: swap.timestamp || 0
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log(`as i  Helius Raydium scan: ${e.message}`, 'warning');
        }

        // Also check PumpSwap / Pump.fun
        const PUMP_FUN = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
        log('ai  Helius: escaneando swaps en Pump.fun...');
        try {
            const swaps = await Helius.getAddressTransactions(PUMP_FUN, { type: 'SWAP', limit: 100 });
            if (Array.isArray(swaps)) {
                for (const swap of swaps) {
                    const tokenTransfers = swap.tokenTransfers || [];
                    for (const transfer of tokenTransfers) {
                        const mint = transfer.mint;
                        if (mint && mint !== 'So11111111111111111111111111111111111111112') {
                            const e = discovered.get(mint) || {};
                            discovered.set(mint, {
                                ...e,
                                source: e.source || 'helius_pump',
                                recentSwap: true
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log(`as i  Helius Pump.fun scan: ${e.message}`, 'warning');
        }

        // PumpSwap a El DEX graduado de Pump.fun (tokens que pasaron la bonding curve)
        const PUMPSWAP = 'PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP';
        log('ai  Helius: escaneando swaps en PumpSwap...');
        try {
            const swaps = await Helius.getAddressTransactions(PUMPSWAP, { type: 'SWAP', limit: 100 });
            if (Array.isArray(swaps)) {
                for (const swap of swaps) {
                    const tokenTransfers = swap.tokenTransfers || [];
                    for (const transfer of tokenTransfers) {
                        const mint = transfer.mint;
                        if (mint && mint !== 'So11111111111111111111111111111111111111112') {
                            const e = discovered.get(mint) || {};
                            discovered.set(mint, {
                                ...e,
                                source: e.source || 'helius_pumpswap',
                                recentSwap: true,
                                graduated: true
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log(`as i  Helius PumpSwap scan: ${e.message}`, 'warning');
        }

        return discovered;
    }

    // ==========================================
    // SOURCE 4: Pump.fun API a Currently live/active tokens
    // Direct from Pump.fun, catches tokens DexScreener/Gecko miss
    // ==========================================
    async function discoverFromPumpFun() {
        const discovered = new Map();
        log('YZ Pump.fun GOD: 3 pAginas de tokens activos...');

        async function pumpFetch(url) {
            // Try direct first, then proxy if CORS blocks
            try {
                const res = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) return await res.json();
            } catch (e) { /* CORS blocked, try proxy */ }
            try {
                const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const res = await fetch(proxy);
                if (res.ok) return await res.json();
            } catch (e) { /* proxy also failed */ }
            return null;
        }

        try {
            const [page1, page2, page3] = await Promise.all([
                pumpFetch('https://frontend-api-v3.pump.fun/coins/currently-live?limit=50&offset=0&includeNsfw=false'),
                pumpFetch('https://frontend-api-v3.pump.fun/coins/currently-live?limit=50&offset=50&includeNsfw=false'),
                pumpFetch('https://frontend-api-v3.pump.fun/coins/currently-live?limit=50&offset=100&includeNsfw=false')
            ]);

            for (const coins of [page1, page2, page3]) {
                if (!Array.isArray(coins)) continue;
                for (const coin of coins) {
                    if (!coin.mint) continue;
                    const e = discovered.get(coin.mint) || {};
                    discovered.set(coin.mint, {
                        ...e,
                        source: e.source || 'pumpfun_live',
                        pumpfunLive: true,
                        pumpfunMcap: coin.usd_market_cap || 0,
                        pumpfunCreated: coin.created_timestamp || 0
                    });
                }
            }
        } catch (e) {
            log(`as i  Pump.fun API: ${e.message}`, 'warning');
        }

        log(`YZ Pump.fun: ${discovered.size} tokens activos encontrados`);
        return discovered;
    }

    // ==========================================
    // FETCH DETAILED PAIR DATA FROM DEXSCREENER
    // Optimized: parallel batches, capped at 200 tokens
    // ==========================================
    const MAX_DEXS_TOKENS = 500; // Mas cobertura para no perder revivals de bajo volumen

    async function fetchTokenDetails(addresses) {
        // Cap addresses to avoid spending forever on DexScreener
        const capped = addresses.slice(0, MAX_DEXS_TOKENS);
        if (addresses.length > MAX_DEXS_TOKENS) {
            log(`as Capped: ${addresses.length} a ${MAX_DEXS_TOKENS} tokens (prioridad WS+multi-source)`, 'warning');
        }

        const results = [];
        const batches = [];
        for (let i = 0; i < capped.length; i += BATCH_SIZE) {
            batches.push(capped.slice(i, i + BATCH_SIZE));
        }

        // Process batches 3 at a time (parallel) instead of 1-by-1
        const CONCURRENT = 3;
        for (let i = 0; i < batches.length; i += CONCURRENT) {
            const chunk = batches.slice(i, i + CONCURRENT);
            log(`Y DexScreener lote ${i+1}-${Math.min(i+CONCURRENT, batches.length)}/${batches.length}...`);
            const promises = chunk.map(batch =>
                safeFetch(`${DEXS_BASE}/tokens/v1/${CHAIN}/${batch.join(',')}`)
            );
            const responses = await Promise.all(promises);
            for (const data of responses) {
                if (Array.isArray(data)) results.push(...data);
            }
            if (i + CONCURRENT < batches.length) await sleep(50); // Tiny delay between chunks
        }
        return results;
    }

    // ==========================================
    // SPARKLINE CACHE (in-memory)
    // ==========================================
    const sparklineCache = new Map();

    async function fetchSparklineData(poolAddress) {
        if (!poolAddress) return null;
        if (sparklineCache.has(poolAddress)) return sparklineCache.get(poolAddress);
        try {
            const data = await safeFetch(
                `${GECKO_BASE}/networks/solana/pools/${poolAddress}/ohlcv/minute?aggregate=5&limit=12&currency=usd`
            );
            if (data?.data?.attributes?.ohlcv_list) {
                const prices = data.data.attributes.ohlcv_list.map(c => c[4]).reverse(); // close prices
                sparklineCache.set(poolAddress, prices);
                return prices;
            }
        } catch(e) { /* ignore */ }
        return null;
    }

    // ==========================================
    // CLONE PUMP DETECTOR Y
    // Cuando un token NUEVO explota, los bots van a por versiones
    // ANTIGUAS del mismo sAmbolo/nombre a detectamos ese contagio.
    // ==========================================
    function detectClonePumps(tokenMap, allDiscovered, scored) {
        // Agrupar TODOS los pares (no solo los que pasaron +10%) por sAmbolo
        const bySymbol = new Map();
        for (const [addr, pair] of tokenMap) {
            const sym = (pair.baseToken?.symbol || '').toUpperCase().trim();
            if (!sym || sym.length < 2) continue;
            if (!bySymbol.has(sym)) bySymbol.set(sym, []);
            bySymbol.get(sym).push({ addr, pair });
        }

        const clones = [];
        let cloneCount = 0;

        for (const [sym, group] of bySymbol) {
            if (group.length < 2) continue;  // Necesitamos al menos 2 tokens con el mismo sAmbolo

            const now = Date.now();

            // aa Calcular edad real de forma segura aaaaaaaaaaaaaaaaaaaaaaaaaa
            // Si pairCreatedAt es 0 o undefined Y el token viene de Helius (swap
            // reciente) a lo consideramos "reciAn nacido" (ageH = 0)
            const getAgeH = (pair, addr) => {
                if (pair.pairCreatedAt && pair.pairCreatedAt > 0) {
                    return (now - pair.pairCreatedAt) / 3.6e6;
                }
                // Sin timestamp pero con swap reciente de Helius = token muy nuevo
                const src = allDiscovered.get(addr) || {};
                if (src.recentSwap || src.source === 'helius_pump' || src.source === 'helius_swap') {
                    return 0;  // Tratar como nuevo
                }
                return 9999;  // Sin datos y sin swap = desconocido, ignorar
            };

            // "Nuevo caliente": < 6h Y (subida a 10% en 5m O a 3 buys en 5m)
            // El umbral es 6h (no 3h) para capturar tokens con datos tardAos de DexScreener
            const hotNew = group.filter(({ addr, pair }) => {
                const ageH = getAgeH(pair, addr);
                const pm5  = pair.priceChange?.m5 || 0;
                const buys = pair.txns?.m5?.buys || 0;
                return ageH < 6 && (pm5 >= 10 || buys >= 3);
            });

            if (hotNew.length === 0) continue;

            // Ordenar el "nuevo caliente" por mayor subida en 5m
            hotNew.sort((a, b) => (b.pair.priceChange?.m5 || 0) - (a.pair.priceChange?.m5 || 0));
            const { addr: hotAddr, pair: hotPair } = hotNew[0];
            const hotPm5  = hotPair.priceChange?.m5 || 0;
            const hotAgeH = getAgeH(hotPair, hotAddr);
            const hotAgeLabel = hotAgeH < (1/60) ? '<1min'
                              : hotAgeH < 1       ? `${Math.round(hotAgeH * 60)}min`
                              : `${Math.round(hotAgeH)}h`;

            // Clones candidatos: mismo sAmbolo, DISTINTOS del nuevo, > 12h, con actividad
            const cloneCandidates = group.filter(({ addr, pair }) => {
                if (addr === hotAddr) return false;
                const ageH  = getAgeH(pair, addr);
                const buys5 = pair.txns?.m5?.buys || 0;
                const vol5  = pair.volume?.m5 || 0;
                // Debe ser claramente mAs viejo (> 12h) Y tener algo de actividad reciente
                return ageH > 12 && (buys5 > 0 || vol5 > 10);
            });

            // Calcular subida total del token nuevo (m5, h1, h6, h24)
            const hotPriceH1  = hotPair.priceChange?.h1 || 0;
            const hotPriceH6  = hotPair.priceChange?.h6 || 0;
            const hotPriceH24 = hotPair.priceChange?.h24 || 0;
            const hotTotalPump = Math.max(hotPm5, hotPriceH1, hotPriceH6, hotPriceH24);

            // El usuario pidio que el clon solo aparezca si el nuevo tiene MAS de un 100% de subida
            if (hotTotalPump <= 100) continue;

            for (const { addr, pair } of cloneCandidates) {
                const existing   = scored.find(t => t.address === addr);
                const cloneAgeH  = getAgeH(pair, addr);
                const cloneAgeLabel = cloneAgeH < 1 ? `${Math.round(cloneAgeH * 60)}min` : `${Math.round(cloneAgeH)}h`;
                const cloneBuys  = pair.txns?.m5?.buys || 0;
                const clonePm5   = pair.priceChange?.m5 || 0;

                const cloneSignal = {
                    type: 'clone-pump',
                    label: `Y CLONE +${hotPm5.toFixed(0)}% (${sym} ${hotAgeLabel})`
                };

                const cloneOfData = {
                    symbol: sym,
                    address: hotAddr,
                    priceM5: hotPm5,
                    priceH1: hotPriceH1,
                    priceH6: hotPriceH6,
                    priceH24: hotPriceH24,
                    totalPump: hotTotalPump,
                    ageHours: hotAgeH,
                    ageLabel: hotAgeLabel   // a "2min", "45min", "3h" etc.
                };

                if (existing) {
                    existing.signals.unshift(cloneSignal);
                    existing.isClonePump = true;
                    existing.cloneOf     = cloneOfData;
                    existing.score       = Math.min(100, existing.score + 18);
                } else {
                    const signals    = allDiscovered.get(addr) || {};
                    const result     = Detector.scoreToken(pair, signals);
                    const cloneToken = {
                        address: addr, pair, ...result,
                        isClonePump: true,
                        cloneOf: cloneOfData,
                        score: Math.min(100, result.score + 18)
                    };
                    cloneToken.signals.unshift(cloneSignal);
                    clones.push(cloneToken);
                }

                cloneCount++;
                log(`Y CLONE: ${sym} viejo (${cloneAgeLabel}) reacciona al nuevo (${hotAgeLabel}) +${hotPm5.toFixed(0)}% (total +${hotTotalPump.toFixed(0)}%) | buys=${cloneBuys} pm5=${clonePm5.toFixed(1)}%`, 'success');
            }
        }

        return { clones, cloneCount };
    }

    async function pollFastHeliusSwaps() {
        if (typeof Helius === 'undefined') return new Map();
        const now = Date.now();
        if (now - _lastFastHeliusPoll < 1200) return new Map();
        _lastFastHeliusPoll = now;

        const program = FAST_PROGRAMS[_fastProgramIndex % FAST_PROGRAMS.length];
        _fastProgramIndex++;
        const found = new Map();
        try {
            const swaps = await Helius.getAddressTransactions(program.address, { type: 'SWAP', limit: 40 });
            if (!Array.isArray(swaps)) return found;
            for (const swap of swaps) {
                const ageMs = Math.abs(now - (swap.timestamp || 0) * 1000);
                if (swap.timestamp && ageMs > 4 * 60 * 1000) continue;
                for (const transfer of swap.tokenTransfers || []) {
                    const mint = transfer.mint;
                    if (!mint || mint === 'So11111111111111111111111111111111111111112' || mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') continue;
                    const prev = found.get(mint) || {};
                    found.set(mint, {
                        ...prev,
                        source: program.source,
                        recentSwap: true,
                        firstSeen: prev.firstSeen || now,
                        lastSeen: now,
                        fastProgram: program.name,
                        swapCount: (prev.swapCount || 0) + 1
                    });
                }
            }
            if (found.size > 0) log(`FAST ${program.name}: ${found.size} mint(s) recientes`, 'success');
        } catch (e) {
            log(`FAST ${program.name}: ${e.message}`, 'warning');
        }
        return found;
    }

    // ==========================================
    // FULL SCAN CYCLE
    // ==========================================
    /**
     * Quick fetch for WebSocket-detected tokens (called every 3s)
     * Returns scored tokens from the live queue without running a full scan
     */
    async function quickFetchLiveTokens(filters, options = {}) {
        const liveTokens = (typeof LiveStream !== 'undefined' && LiveStream.isConnected)
            ? LiveStream.drainQueue()
            : new Map();
        const fastTokens = await pollFastHeliusSwaps();
        for (const [addr, data] of fastTokens) {
            liveTokens.set(addr, { ...(liveTokens.get(addr) || {}), ...data });
        }
        const now = Date.now();
        for (const [addr, data] of liveTokens) {
            const existing = _pendingLiveDetails.get(addr) || {};
            _pendingLiveDetails.set(addr, {
                ...existing,
                ...data,
                firstSeen: existing.firstSeen || data.firstSeen || now,
                lastSeen: data.lastSeen || now
            });
        }
        for (const [addr, data] of _pendingLiveDetails) {
            if (now - (data.firstSeen || data.lastSeen || now) > PENDING_LIVE_TTL) {
                _pendingLiveDetails.delete(addr);
            }
        }
        if (_pendingLiveDetails.size === 0) return null;

        const minPriceM5 = options.minPriceM5 ?? 40;
        const minMcap    = options.minMcap ?? 2000;
        const addresses  = Array.from(_pendingLiveDetails.keys()).slice(0, 200);
        log(`as LIVE batch: ${addresses.length} tokens pendientes del WebSocket...`, 'info');

        const pairsData = await fetchTokenDetails(addresses);
        if (!pairsData || pairsData.length === 0) {
            log(`as LIVE: DexScreener aun sin datos, reintentando ${addresses.length} mint(s)...`, 'info');
            return null;
        }

        // Best pair per token
        const tokenMap = new Map();
        for (const pair of pairsData) {
            const addr = pair.baseToken?.address;
            if (!addr) continue;
            const existing = tokenMap.get(addr);
            if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
                tokenMap.set(addr, pair);
            }
        }

        const scored = [];
        for (const [addr, pair] of tokenMap) {
            const pm5  = pair.priceChange?.m5 || 0;
            const mcap = pair.marketCap || pair.fdv || 0;
            const dormantHours = Detector.calcDormantHours(pair);
            const recentBuys = (pair.txns?.m5?.buys || 0) + (pair.txns?.h1?.buys || 0);
            const microcapWakeCandidate = mcap >= 1200 && mcap <= 30000 && dormantHours >= (filters.minDormantHours || 24) && recentBuys > 0;
            const dormantWakeCandidate = dormantHours >= (filters.minDormantHours || 24) && recentBuys > 0;
            if (pm5 < minPriceM5 && !dormantWakeCandidate && !microcapWakeCandidate) continue;
            if (mcap > 0 && mcap < minMcap) continue;
            const signals = _pendingLiveDetails.get(addr) || {};
            signals.source = 'ws_live';
            const result = Detector.scoreToken(pair, signals);
            scored.push({ address: addr, pair, ...result, isLive: true });
            _pendingLiveDetails.delete(addr);
        }

        if (scored.length > 0) {
            log(`as LIVE: ${scored.length} tokens con +${minPriceM5}% y mcap>${minMcap}!`, 'success');
        }

        // Add to cache so full scan sees them too
        for (const [addr, data] of liveTokens) {
            _recentTokensCache.set(addr, { data, lastSeen: now });
        }

        return scored.length > 0 ? scored : null;
    }

    async function runScan(filters, options = {}) {
        // options.minPriceM5 (default 40): solo muestra tokens que subieron X% en 5min
        // options.minMcap (default 2000): solo muestra tokens con mcap > X
        // options.lightMode (default true): desactiva deep scan Helius y sparklines
        const minPriceM5 = options.minPriceM5 ?? 40;
        const minMcap    = options.minMcap ?? 2000;
        const lightMode  = options.lightMode  ?? true;
        const startTime = Date.now();
        log('Iniciando scan multi-fuente...', 'info');
        log(`Y ${Detector.getTimeLabel()} | Peso momentum: ${Detector.getTimeWeight().toFixed(2)}x`);

        const [dexTokens, geckoTokens, heliusTokens, pumpfunTokens] = await Promise.all([
            discoverFromDexScreener(),
            discoverFromGeckoTerminal(),
            discoverFromHelius(),
            discoverFromPumpFun()
        ]);

        // Drain WebSocket live queue
        let wsTokens = new Map();
        if (typeof LiveStream !== 'undefined') {
            wsTokens = LiveStream.drainQueue();
            if (wsTokens.size > 0) {
                log(`WebSocket aporto ${wsTokens.size} tokens al scan`, 'info');
            }
        }

        // Merge all discoveries
        const allDiscovered = new Map();
        for (const [addr, data] of dexTokens) {
            allDiscovered.set(addr, { ...(allDiscovered.get(addr) || {}), ...data });
        }
        for (const [addr, data] of geckoTokens) {
            allDiscovered.set(addr, { ...(allDiscovered.get(addr) || {}), ...data });
        }
        for (const [addr, data] of heliusTokens) {
            allDiscovered.set(addr, { ...(allDiscovered.get(addr) || {}), ...data });
        }
        for (const [addr, data] of pumpfunTokens) {
            allDiscovered.set(addr, { ...(allDiscovered.get(addr) || {}), ...data });
        }
        // WebSocket live tokens get highest priority
        for (const [addr, data] of wsTokens) {
            allDiscovered.set(addr, { ...(allDiscovered.get(addr) || {}), ...data, source: data.source || 'ws_live' });
        }

        // aa ACTUALIZAR Y FUSIONAR CACHA DE TOKENS RECIENTES aa
        // AAadir nuevos a la cachA
        const now = Date.now();
        for (const [addr, data] of allDiscovered) {
            _recentTokensCache.set(addr, { data, lastSeen: now });
        }
        
        // Purgar cachA vieja (> 15 min)
        for (const [addr, cacheObj] of _recentTokensCache) {
            if (now - cacheObj.lastSeen > CACHE_TTL) {
                _recentTokensCache.delete(addr);
            } else {
                // Incluir token de la cachA en el scan actual (para actualizar su precio)
                if (!allDiscovered.has(addr)) {
                    allDiscovered.set(addr, cacheObj.data);
                }
            }
        }

        // Detect Pump.fun graduations: token in both helius_pump AND gecko/dex
        for (const [addr, data] of allDiscovered) {
            const fromPump = data.source === 'helius_pump';
            const inGecko = geckoTokens.has(addr);
            const inDex = dexTokens.has(addr);
            if (fromPump && (inGecko || inDex)) {
                data.graduated = true;
            }
        }

        log(`a... Descubiertos: ${dexTokens.size} DexS + ${geckoTokens.size} Gecko + ${heliusTokens.size} Helius + ${pumpfunTokens.size} PumpFun + ${wsTokens.size} WS = ${allDiscovered.size} Aonicos`, 'success');

        if (allDiscovered.size === 0) {
            log('as i  No se encontraron tokens', 'warning');
            return { tokens: [], stats: { scanned: 0, dormant: 0, awakening: 0, alerts: 0 } };
        }

        // aa PRIORIZAR tokens antes de enviar a DexScreener aa
        // WS live > multi-source > single source. Pre-filtrar mcap conocido.
        const maxMcapFilter = filters.maxMcap || 0;
        const prioritized = Array.from(allDiscovered.entries())
            .filter(([addr, data]) => {
                // Si Pump.fun nos dio mcap y estA fuera de rango, skip
                if (maxMcapFilter > 0 && data.pumpfunMcap && data.pumpfunMcap > maxMcapFilter * 2) return false;
                return true;
            })
            .sort((a, b) => {
                const da = a[1], db = b[1];
                // WS live primero
                const aWS = wsTokens.has(a[0]) ? 3 : 0;
                const bWS = wsTokens.has(b[0]) ? 3 : 0;
                // Multi-source bonus
                const aSources = (dexTokens.has(a[0]) ? 1 : 0) + (geckoTokens.has(a[0]) ? 1 : 0) + (heliusTokens.has(a[0]) ? 1 : 0) + (pumpfunTokens.has(a[0]) ? 1 : 0);
                const bSources = (dexTokens.has(b[0]) ? 1 : 0) + (geckoTokens.has(b[0]) ? 1 : 0) + (heliusTokens.has(b[0]) ? 1 : 0) + (pumpfunTokens.has(b[0]) ? 1 : 0);
                return (bWS + bSources) - (aWS + aSources);
            })
            .map(([addr]) => addr);

        const addresses = prioritized;
        log(`YZ  Enviando ${addresses.length} tokens a DexScreener (priorizados WS+multi-source)...`);
        const pairsData = await fetchTokenDetails(addresses);
        log(`YS Obtenidos ${pairsData.length} pares`);

        // Best pair per token
        const tokenMap = new Map();
        for (const pair of pairsData) {
            const addr = pair.baseToken?.address;
            if (!addr) continue;
            const existing = tokenMap.get(addr);
            if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
                tokenMap.set(addr, pair);
            }
        }

        // Score a filtro temprano por momentum y mcap
        const scored = [];
        for (const [addr, pair] of tokenMap) {
            const pm5  = pair.priceChange?.m5 || 0;
            const ph1  = pair.priceChange?.h1 || 0;
            const mcap = pair.marketCap || pair.fdv || 0;
            // Solo filtrar si minPriceM5 > 0 (el user puso un minimo explicito)
            // Usa el MEJOR de m5 o h1 a un token +54% h1 pero -15% m5 NO debe filtrarse
            const dormantHours = Detector.calcDormantHours(pair);
            const recentBuys = (pair.txns?.m5?.buys || 0) + (pair.txns?.h1?.buys || 0);
            const microcapWakeCandidate = mcap >= 1200 && mcap <= 30000 && dormantHours >= (filters.minDormantHours || 24) && recentBuys > 0;
            const dormantWakeCandidate = dormantHours >= (filters.minDormantHours || 24) && recentBuys > 0;
            if (minPriceM5 > 0 && pm5 < minPriceM5 && ph1 < minPriceM5 && !dormantWakeCandidate && !microcapWakeCandidate) continue;
            if (mcap > 0 && mcap < minMcap) continue;
            const signals  = allDiscovered.get(addr) || {};
            const isFromWS = wsTokens.has(addr);
            const result   = Detector.scoreToken(pair, signals);
            scored.push({ address: addr, pair, ...result, isLive: isFromWS });
        }
        log(`Y ${scored.length} tokens pasan filtro momentum (de ${tokenMap.size} totales)`);

        // Deep scan y sparklines SOLO si lightMode estA desactivado
        if (!lightMode) {
            const candidates = scored.filter(t => t.score >= 25).sort((a,b) => b.score - a.score).slice(0, 5);
            if (candidates.length > 0 && typeof Helius !== 'undefined') {
                log(`Y Deep scan en ${candidates.length} candidatos...`);
                for (const token of candidates) {
                    try {
                        const onChain = await Helius.deepScanToken(token.address);
                        token.onChain = onChain;
                        if (onChain.bundleScore > 0) token.score = Math.min(100, token.score + Math.round(onChain.bundleScore * 0.15));
                        if (onChain.freshWalletScore > 0) token.score = Math.min(100, token.score + Math.round(onChain.freshWalletScore * 0.10));
                        for (const p of onChain.patterns) {
                            token.signals.push({ type: p.severity === 'critical' ? 'ghost' : 'boost', label: p.label });
                        }
                        token.rug = Detector.antiRugCheck(token.pair, onChain);
                    } catch (e) {
                        log(`as i  Deep scan failed: ${e.message}`, 'warning');
                    }
                    await sleep(600);
                }
            }

            // Sparklines solo top 5
            const topForSparkline = scored.filter(t => t.score >= 30).slice(0, 5);
            for (const token of topForSparkline) {
                const geckoData = allDiscovered.get(token.address);
                if (geckoData?.geckoPool) {
                    const prices = await fetchSparklineData(geckoData.geckoPool);
                    if (prices) token.sparkline = prices;
                    await sleep(450);
                }
            }
        } else {
            log('as Modo ligero: deep scan y sparklines desactivados', 'info');
        }

        // aa CLONE PUMP DETECTION aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        // Pasa el tokenMap completo para detectar clones de cualquier token,
        // no solo de los que pasaron el filtro +10%
        const { clones, cloneCount } = detectClonePumps(tokenMap, allDiscovered, scored);

        // Merge clones into scored (evitar duplicados)
        for (const clone of clones) {
            if (!scored.some(t => t.address === clone.address)) {
                scored.push(clone);
            }
        }
        if (cloneCount > 0) {
            log(`Y ${cloneCount} CLONE PUMP(s) detectados a tokens viejos reaccionando`, 'success');
        }

        // Filter (includes holder count and rug checks)
        const filterDiag = { score: 0, mcap: 0, dormant: 0, subiendo: 0, holders: 0, vol5m: 0, rug: 0, x2: 0, passed: 0 };
        const filtered = scored.filter(t => Detector.passesFilters(t, filters, filterDiag));
        
        log(`YZ Filtro: ${filterDiag.passed} pasan | a score:${filterDiag.score} mcap:${filterDiag.mcap} dormant:${filterDiag.dormant} x2:${filterDiag.x2 || 0} subiendo:${filterDiag.subiendo} holders:${filterDiag.holders} vol5m:${filterDiag.vol5m} rug:${filterDiag.rug}`);

        // DEDUP: Cuando hay tokens con el mismo simbolo, quedarse solo con el mas nuevo.
        // Esto elimina tokens viejos muertos que comparten nombre con nuevas creaciones.
        const bySymDedup = new Map();
        for (const t of filtered) {
            const sym = (t.pair?.baseToken?.symbol || '').toUpperCase().trim();
            if (!sym || sym.length < 2) continue;
            const existing = bySymDedup.get(sym);
            if (!existing) {
                bySymDedup.set(sym, t);
            } else {
                const existingAge = existing.pair?.pairCreatedAt || 0;
                const currentAge = t.pair?.pairCreatedAt || 0;
                if (currentAge > existingAge) {
                    bySymDedup.set(sym, t);
                }
            }
        }
        const dedupSet = new Set(bySymDedup.values());
        const noSymTokens = filtered.filter(t => {
            const sym = (t.pair?.baseToken?.symbol || '').toUpperCase().trim();
            return !sym || sym.length < 2;
        });
        const dedupFiltered = [...dedupSet, ...noSymTokens];
        const dedupRemoved = filtered.length - dedupFiltered.length;
        if (dedupRemoved > 0) {
            log(`Y DEDUP: ${dedupRemoved} tokens viejos eliminados (mismo nombre que creaciones nuevas)`, 'info');
        }

        dedupFiltered.sort((a, b) => {
            if (a.isClonePump && !b.isClonePump) return -1;
            if (!a.isClonePump && b.isClonePump) return 1;
            return b.score - a.score;
        });

        const despertando = scored.filter(t => t.dormantBuys && t.dormantBuys.despertando).length;
        log(`Y ${scored.length} total a ${dedupFiltered.length} pasan filtros | Y ${despertando} despertando | Y ${cloneCount} clones`);

        const stats = {
            scanned: allDiscovered.size,
            dormant: scored.filter(t => t.dormantHours >= (filters.minDormantHours || 24)).length,
            awakening: despertando,
            alerts: dedupFiltered.filter(t => t.score >= 75).length,
            clones: cloneCount
        };

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log(`a... Scan completado en ${elapsed}s`, 'success');

        return { tokens: dedupFiltered, stats };
    }

    return {
        runScan,
        quickFetchLiveTokens,
        fetchSparklineData,
        log,
        set onLog(fn) { onLog = fn; }
    };
})();


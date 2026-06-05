/**
 * app.js  Main Application Controller v4
 * Now with: WebSocket live detection, 3s quick-fetch, 12s full scan, favorites, blacklist, 3-level alerts
 */

(function() {
    let isRunning = false;
    let scanInterval = null;
    let favInterval = null;
    let liveInterval = null;  // WebSocket quick-fetch every 3s
    let countdownInterval = null;
    let countdown = 0;
    const SCAN_INTERVAL_SEC = 6;   // 6s  scan completo; el radar LIVE va cada 1s
    const LIVE_FETCH_SEC = 1;      // 1s  reintento rapido de tokens vistos por WebSocket
    const FAV_SCAN_SEC = 6;        // favoritos cada 6s
    let allTokens = [];
    let alertCooldowns = {};
    let scanCycleCount = 0;  // para throttle de saveHistory
    let scanInProgress = false;
    let liveFetchInProgress = false;

    // Blacklist & Favorites from localStorage
    function getBlacklist() {
        try { return JSON.parse(localStorage.getItem('dd_blacklist') || '[]'); } catch { return []; }
    }
    function setBlacklist(list) {
        localStorage.setItem('dd_blacklist', JSON.stringify(list));
    }
    function getFavorites() {
        try { return JSON.parse(localStorage.getItem('dd_favorites') || '[]'); } catch { return []; }
    }
    function setFavorites(list) {
        localStorage.setItem('dd_favorites', JSON.stringify(list));
    }

    function toggleBlacklist(address) {
        const bl = getBlacklist();
        const idx = bl.indexOf(address);
        if (idx >= 0) { bl.splice(idx, 1); UI.addLogEntry(` Removed from blacklist: ${address.slice(0,8)}`, 'success'); }
        else { bl.push(address); UI.addLogEntry(` Blacklisted: ${address.slice(0,8)}`, 'warning'); }
        setBlacklist(bl);
        rerenderList();
    }

    function toggleFavorite(address) {
        const fav = getFavorites();
        const idx = fav.indexOf(address);
        if (idx >= 0) { fav.splice(idx, 1); UI.addLogEntry(` Unfavorited: ${address.slice(0,8)}`, 'info'); }
        else { fav.push(address); UI.addLogEntry(` Favorited: ${address.slice(0,8)}`, 'success'); }
        setFavorites(fav);
        rerenderList();
    }

    function isBlacklisted(address) { return getBlacklist().includes(address); }
    function isFavorited(address) { return getFavorites().includes(address); }

    //  Limpieza de localStorage al arrancar 
    // Evita que snapshots acumuladas de sesiones anteriores sobrecarguen memoria
    (function purgeOldSnapshots() {
        try {
            const key = 'dormant_detector_snapshots';
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const snaps = JSON.parse(raw);
            let changed = false;
            for (const addr of Object.keys(snaps)) {
                if (snaps[addr].length > 20) {
                    snaps[addr] = snaps[addr].slice(-20); // Conservar solo las 20 ultimas
                    changed = true;
                }
            }
            if (changed) localStorage.setItem(key, JSON.stringify(snaps));
        } catch(e) { /* ignorar */ }

        // Si el historial ocupa > 200KB, borrarlo directamente
        try {
            const hKey = 'dormant_detector_history';
            const hRaw = localStorage.getItem(hKey) || '';
            if (hRaw.length > 200000) {
                localStorage.removeItem(hKey);
                console.log('[DD] Historial purgado por tamano (>200KB)');
            }
        } catch(e) { /* ignorar */ }
    })();

    // Wire up logging
    Scanner.onLog = (msg, level) => UI.addLogEntry(msg, level);
    if (typeof Helius !== 'undefined') {
        Helius.onLog = (msg, level) => UI.addLogEntry(msg, level);
    }
    if (typeof LiveStream !== 'undefined') {
        LiveStream.onLog = (msg, level) => UI.addLogEntry(msg, level);
        LiveStream.onStatusChange = (connected) => {
            const indicator = document.getElementById('ws-status');
            if (indicator) {
                indicator.className = connected ? 'ws-indicator ws-connected' : 'ws-indicator ws-disconnected';
                indicator.title = connected ? 'WebSocket: Conectado' : 'WebSocket: Desconectado';
                indicator.innerHTML = connected
                    ? '<span class="ws-dot ws-dot-on"></span> WS LIVE'
                    : '<span class="ws-dot ws-dot-off"></span> WS OFF';
            }
        };

        //  Actually connect the WebSocket!
        LiveStream.connect();
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    function getFilters() {
        return {
            maxMcap: parseInt(document.getElementById('filter-mcap')?.value || '0'),
            minDormantHours: parseInt(document.getElementById('filter-dormant-hours')?.value || '0'),
            minScore: parseInt(document.getElementById('filter-min-score')?.value || '0'),
            minPumpTarget: parseInt(document.getElementById('filter-min-pump-target')?.value || '0'),
            soloSubiendo: document.getElementById('filter-subiendo')?.checked ?? true,
            minHolders: parseInt(document.getElementById('filter-min-holders')?.value || '0'),
            minVolume5m: parseInt(document.getElementById('filter-min-vol5m')?.value || '500'),
            hideRug: document.getElementById('filter-hide-rug')?.checked ?? true
        };
    }

    function getMinPriceM5() {
        return parseInt(document.getElementById('filter-price-m5')?.value || '40');
    }

    function getMinMcap() {
        return parseInt(document.getElementById('filter-min-mcap')?.value || '2000');
    }

    function getSortKey() {
        return document.getElementById('filter-sort')?.value || 'score';
    }

    function sortTokens(tokens, key) {
        const sorted = [...tokens];
        switch(key) {
            case 'score': sorted.sort((a,b) => b.score - a.score); break;
            case 'volume_spike': sorted.sort((a,b) => b.volumeSpike.ratio - a.volumeSpike.ratio); break;
            case 'buy_ratio': sorted.sort((a,b) => b.buyRatio.ratio - a.buyRatio.ratio); break;
            case 'dormant_hours': sorted.sort((a,b) => b.dormantHours - a.dormantHours); break;
            case 'mcap': sorted.sort((a,b) => (a.mcap || 999999999) - (b.mcap || 999999999)); break;
            case 'convergence': sorted.sort((a,b) => (b.convergence?.count||0) - (a.convergence?.count||0)); break;
            case 'vol5m': sorted.sort((a,b) => (b.volume5m || 0) - (a.volume5m || 0)); break;
        }
        return sorted;
    }

    function filterBlacklist(tokens) {
        const bl = getBlacklist();
        return tokens.filter(t => !bl.includes(t.address));
    }

    // 3-LEVEL ALERT SYSTEM
    function processAlerts(tokens) {
        const now = Date.now();
        for (const t of tokens) {
            const addr = t.address;
            const lastAlert = alertCooldowns[addr] || 0;
            if (now - lastAlert < 30000) continue; // 30s cooldown per token

            const sym = t.pair.baseToken?.symbol || '???';
            const name = t.pair.baseToken?.name || 'Unknown';
            const shortAddr = addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : '?';
            const tokenLabel = `${sym} (${name}) | ${shortAddr} | ${addr}`;
            const conv = t.convergence?.level || 'NONE';

            if (t.microcap10x?.qualifies) {
                UI.showAlert(`10x WAKEUP: ${tokenLabel} | mcap ${t.mcap ? '$' + Math.round(t.mcap/1000) + 'K' : '?'} | ${t.dormantHours}h dormido | ${t.microcap10x.score}/100`, 'critical');
                alertCooldowns[addr] = now;
            } else if (t.x2Potential?.qualifies && t.dormantHours >= 24) {
                UI.showAlert(`2x SETUP: ${tokenLabel} | ${t.dormantHours}h dormido | X2 ${t.x2Potential.score}/100 | +${t.pumpTarget?.min||0}%+${t.pumpTarget?.max||0}%`, 'critical');
                alertCooldowns[addr] = now;
            } else if (t.score >= 80 || conv === 'TOP_PICK') {
                UI.showAlert(`CRITICAL: ${tokenLabel} | Score ${t.score} | ${conv} | +${t.pumpTarget?.min||0}%+${t.pumpTarget?.max||0}%`, 'critical');
                alertCooldowns[addr] = now;
            } else if (t.score >= 65 && (t.convergence?.count || 0) >= 3) {
                UI.showAlert(`STRONG: ${tokenLabel} | Score ${t.score} | ${t.convergence.count} senales`, 'strong');
                alertCooldowns[addr] = now;
            } else if (t.score >= 50 && (t.convergence?.count || 0) >= 2) {
                UI.showAlert(`WATCH: ${tokenLabel} | Score ${t.score}`, 'watch');
                alertCooldowns[addr] = now;
            }
        }
    }

    function rerenderList() {
        if (allTokens.length > 0) {
            const filters = getFilters();
            const noBlacklist = filterBlacklist(allTokens);
            const filtered = noBlacklist.filter(t => Detector.passesFilters(t, filters));
            const sorted = sortTokens(filtered, getSortKey());
            UI.renderTokenList(sorted, { isFavorited, isBlacklisted });
        }
    }

    async function runScanCycle() {
        if (scanInProgress) return;
        scanInProgress = true;
        try {
        scanCycleCount++;
        const filters = getFilters();
        // Filtro +X% m5 y mcap minimo leidos del DOM | lightMode: true desactiva deep scan y sparklines
        const result = await Scanner.runScan(filters, { minPriceM5: getMinPriceM5(), minMcap: getMinMcap(), lightMode: true });
        allTokens = result.tokens;

        const noBlacklist = filterBlacklist(allTokens);
        const filtered = noBlacklist.filter(t => Detector.passesFilters(t, filters));
        const sorted = sortTokens(filtered, getSortKey());

        UI.renderTokenList(sorted, { isFavorited, isBlacklisted });
        UI.updateStats(result.stats);
        // Guardar historial solo 1 de cada 3 ciclos para ahorrar escrituras
        if (scanCycleCount % 3 === 0) saveHistory(allTokens);
        processAlerts(sorted);
        
        if (typeof SignalTracker !== 'undefined') {
            SignalTracker.record(allTokens);
        }
        
        } finally {
            scanInProgress = false;
        }
    }

    // Re-scan favorites only (lightweight)
    async function runFavoriteScan() {
        const favs = getFavorites();
        if (favs.length === 0) return;
        // Quick DexScreener fetch for favorite addresses only
        try {
            const url = `https://api.dexscreener.com/tokens/v1/solana/${favs.slice(0,10).join(',')}`;
            const res = await fetch(url);
            if (!res.ok) return;
            const pairs = await res.json();
            if (!Array.isArray(pairs)) return;
            // Update existing token data
            for (const pair of pairs) {
                const addr = pair.baseToken?.address;
                if (!addr) continue;
                const existing = allTokens.find(t => t.address === addr);
                if (existing) {
                    existing.pair = pair;
                    // Re-score
                    const signals = { boosted: false };
                    const result = Detector.scoreToken(pair, signals);
                    Object.assign(existing, result);
                }
            }
            rerenderList();
        } catch(e) { /* silent */ }
    }

    // Quick-fetch WebSocket/Helius-detected tokens (every 1s)
    async function runLiveFetch() {
        if (!isRunning) return;
        if (liveFetchInProgress) return;
        liveFetchInProgress = true;
        try {
            const filters = getFilters();
            const liveTokens = await Scanner.quickFetchLiveTokens(filters, {
                minPriceM5: getMinPriceM5(),
                minMcap: getMinMcap()
            });
            if (liveTokens && liveTokens.length > 0) {
                // Merge live tokens into allTokens (avoid duplicates)
                for (const lt of liveTokens) {
                    const existingIdx = allTokens.findIndex(t => t.address === lt.address);
                    if (existingIdx >= 0) {
                        allTokens[existingIdx] = lt; // Update with fresh data
                    } else {
                        allTokens.unshift(lt); // Add at top
                    }
                }
                rerenderList();
                processAlerts(liveTokens);
                if (typeof SignalTracker !== 'undefined') {
                    SignalTracker.record(liveTokens);
                }
                UI.addLogEntry(`LIVE: ${liveTokens.length} tokens nuevos axadidos en tiempo real`, 'success');
            }
        } finally {
            liveFetchInProgress = false;
        }
    }

    function startScanner() {
        isRunning = true;
        UI.setScannerActive(true);
        UI.addLogEntry(' Scanner GOD MODE v2  20+ APIs paralelas | PumpSwap + PumpFun x3 + Gecko x10 + Helius x3 + WS x3 | 8s', 'success');

        // Start WebSocket connection
        if (typeof LiveStream !== 'undefined') {
            LiveStream.connect();
        }

        runScanCycle();
        countdown = SCAN_INTERVAL_SEC;

        countdownInterval = setInterval(() => {
            countdown--;
            UI.updateTimer(countdown);
            if (countdown <= 0) countdown = SCAN_INTERVAL_SEC;
        }, 1000);

        scanInterval = setInterval(() => {
            countdown = SCAN_INTERVAL_SEC;
            runScanCycle();
        }, SCAN_INTERVAL_SEC * 1000);

        // WebSocket + Helius quick-fetch every 1s
        liveInterval = setInterval(runLiveFetch, LIVE_FETCH_SEC * 1000);

        // Favorites re-scan every 8s
        favInterval = setInterval(runFavoriteScan, FAV_SCAN_SEC * 1000);
    }

    function stopScanner() {
        isRunning = false;
        UI.setScannerActive(false);
        UI.addLogEntry(' Scanner detenido', 'warning');
        clearInterval(scanInterval);
        clearInterval(countdownInterval);
        clearInterval(favInterval);
        clearInterval(liveInterval);
        scanInterval = null;
        favInterval = null;
        liveInterval = null;

        // Disconnect WebSocket
        if (typeof LiveStream !== 'undefined') {
            LiveStream.disconnect();
        }

        UI.updateTimer('--');
    }

    function toggleScanner() {
        if (isRunning) stopScanner();
        else startScanner();
    }

    function showDetail(token) {
        UI.renderSidebar(token, { isFavorited, toggleFavorite, toggleBlacklist });
    }

    function closeSidebar() {
        document.getElementById('detail-sidebar')?.classList.add('hidden');
    }

    function clearHistory() {
        localStorage.removeItem('dormant_detector_history');
        localStorage.removeItem('dormant_detector_snapshots');
        UI.addLogEntry(' Historial limpiado', 'info');
    }

    function clearBlacklist() {
        setBlacklist([]);
        UI.addLogEntry(' Blacklist limpiada', 'success');
        rerenderList();
    }

    function saveHistory(tokens) {
        try {
            const existing = JSON.parse(localStorage.getItem('dormant_detector_history') || '{}');
            const now = Date.now();
            for (const t of tokens) {
                if (!existing[t.address]) existing[t.address] = [];
                existing[t.address].push({ score: t.score, mcap: t.mcap, time: now });
                if (existing[t.address].length > 50) existing[t.address] = existing[t.address].slice(-50);
            }
            localStorage.setItem('dormant_detector_history', JSON.stringify(existing));
        } catch(e) { /* localStorage full */ }
    }

    function exportCSV() {
        if (allTokens.length === 0) {
            UI.addLogEntry(' No hay tokens para exportar', 'warning');
            return;
        }
        const headers = ['Score','Symbol','Name','Address','Price','MarketCap','Liquidity','Holders','PumpMin','PumpMax','BuyRatio','Convergence','DexScreenerURL'];
        const rows = allTokens.map(t => {
            const p = t.pair;
            return [
                t.score, p.baseToken?.symbol, p.baseToken?.name, t.address,
                p.priceUsd, t.mcap, t.liquidity, t.holderCount || 'x',
                t.pumpTarget?.min || 0, t.pumpTarget?.max || 0,
                t.buyRatio.ratio.toFixed(2), t.convergence?.level || 'NONE',
                p.url || ''
            ].join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `dormant_tokens_${new Date().toISOString().slice(0,10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
        UI.addLogEntry(' CSV exportado', 'success');
    }

    function exportPerformanceCSV() {
        if (typeof SignalTracker !== 'undefined') {
            const success = SignalTracker.exportCSV();
            if (success) {
                UI.addLogEntry(' Signal CSV exportado', 'success');
            } else {
                UI.addLogEntry(' Todavia no hay suficientes señales confirmadas para exportar', 'warning');
            }
        }
    }

    // Re-render on filter change (price-m5 requiere nuevo scan completo)
    document.querySelectorAll('#controls-bar select, #controls-bar input[type=checkbox]').forEach(el => {
        el.addEventListener('change', () => {
            if (el.id === 'filter-price-m5') {
                UI.addLogEntry(` Filtro +${el.value}% en 5m  se aplicara en el proximo scan`, 'info');
            }
            rerenderList();
        });
    });

    //  WALLET MANAGEMENT 
    function openWalletModal() {
        document.getElementById('wallet-modal')?.classList.remove('hidden');
    }

    function closeWalletModal() {
        document.getElementById('wallet-modal')?.classList.add('hidden');
    }

    function updateWalletUI() {
        const btn = document.getElementById('wallet-btn-text');
        const btnEl = document.getElementById('btn-wallet');
        const discView = document.getElementById('wallet-disconnected-view');
        const connView = document.getElementById('wallet-connected-view');
        const pubkeyEl = document.getElementById('wallet-pubkey-text');

        if (typeof JitoBuy !== 'undefined' && JitoBuy.isReady()) {
            const pk = JitoBuy.getPublicKey();
            const short = pk.slice(0, 6) + '...' + pk.slice(-4);
            if (btn) btn.textContent = short;
            if (btnEl) btnEl.classList.add('wallet-connected');
            if (discView) discView.classList.add('hidden');
            if (connView) connView.classList.remove('hidden');
            if (pubkeyEl) {
                pubkeyEl.textContent = short;
                pubkeyEl.dataset.full = pk;
                pubkeyEl.dataset.short = short;
            }
            // Fetch balance
            JitoBuy.getSolBalance().then(bal => {
                const balEl = document.getElementById('wallet-balance-text');
                if (balEl) balEl.textContent = bal.toFixed(4) + ' SOL';
            });
        } else {
            if (btn) btn.textContent = 'Conectar Wallet';
            if (btnEl) btnEl.classList.remove('wallet-connected');
            if (discView) discView.classList.remove('hidden');
            if (connView) connView.classList.add('hidden');
        }
    }

    function importWallet() {
        const input = document.getElementById('wallet-pk-input');
        if (!input || !input.value.trim()) {
            UI.addLogEntry(' Introduce la clave privada', 'warning');
            return;
        }
        try {
            if (typeof JitoBuy === 'undefined') {
                UI.addLogEntry(' Modulo Jito no cargado', 'error');
                return;
            }
            const pubkey = JitoBuy.importWallet(input.value);
            input.value = '';
            updateWalletUI();
            UI.addLogEntry(` Wallet conectada: ${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`, 'success');
        } catch (e) {
            UI.addLogEntry(` Error: ${e.message}`, 'error');
        }
    }

    function disconnectWallet() {
        if (typeof JitoBuy !== 'undefined') {
            JitoBuy.clearWallet();
        }
        updateWalletUI();
        closeWalletModal();
        UI.addLogEntry(' Wallet desconectada', 'info');
    }

    // Auto-load saved wallet on startup
    if (typeof JitoBuy !== 'undefined') {
        JitoBuy.onLog = (msg, level) => UI.addLogEntry(msg, level);
        setTimeout(updateWalletUI, 500);
    }

    //  BUY TOKEN 
    async function buyToken(tokenMint, tokenSymbol, customAmount) {
        if (typeof JitoBuy === 'undefined' || !JitoBuy.isReady()) {
            UI.addLogEntry(' Conecta tu wallet primero', 'warning');
            openWalletModal();
            return;
        }

        const solAmount   = customAmount || parseFloat(document.getElementById('trade-amount')?.value || '0.1');
        const slippage    = parseInt(document.getElementById('trade-slippage')?.value || '15') * 100; // bps
        const jitoTip     = parseFloat(document.getElementById('trade-jito-tip')?.value || '0.002');

        UI.showAlert(` Comprando ${tokenSymbol}  ${solAmount} SOL...`, 'watch');

        const result = await JitoBuy.buyToken({
            tokenMint,
            tokenSymbol,
            solAmount,
            slippageBps: slippage,
            jitoTipSol: jitoTip
        });

        if (result.success) {
            UI.showAlert(` ${tokenSymbol} comprado en ${result.ms}ms  ${result.explorerUrl}`, 'critical');
            // Refresh balance
            JitoBuy.getSolBalance().then(bal => {
                const balEl = document.getElementById('wallet-balance-text');
                if (balEl) balEl.textContent = bal.toFixed(4) + ' SOL';
            });
        } else {
            UI.showAlert(` Error comprando ${tokenSymbol}: ${result.error}`, 'strong');
        }
    }

    // Expose to global
    window.app = {
        toggleScanner, showDetail, closeSidebar, clearHistory, exportCSV, exportPerformanceCSV,
        toggleBlacklist, toggleFavorite, clearBlacklist,
        isFavorited, isBlacklisted,
        openWalletModal, closeWalletModal, importWallet, disconnectWallet,
        buyToken
    };
})();

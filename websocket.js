/**
 * websocket.js  PumpPortal WebSocket for Real-Time Trade Detection
 * Connects to PumpPortal (free) to receive live trades from Pump.fun + PumpSwap.
 * Detects new token activity within ~200ms of trade.
 */

const LiveStream = (() => {
    const WS_URL = 'wss://pumpportal.fun/api/data';

    // Known non-token mints to ignore
    const IGNORE_MINTS = new Set([
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        'Es9vMFrzaCERmKFr8Y3pAQuLj5dZ6wFCFnvyN8PKxr5w',
    ]);

    let ws = null;
    let isConnected = false;
    let reconnectAttempts = 0;
    let heartbeatTimer = null;
    let onLog = () => {};
    let onStatusChange = () => {};

    const _liveQueue = new Map();
    const _processedMints = new Map(); // mint -> last drained time
    const QUEUE_MAX_AGE = 5 * 60 * 1000;
    const REQUEUE_AFTER_MS = 15 * 1000;
    let totalDetected = 0;

    function log(msg, level = 'info') { onLog(msg, level); }

    function connect() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        log(' WebSocket: Conectando a PumpPortal (trades en tiempo real)...', 'info');

        try {
            ws = new WebSocket(WS_URL);
        } catch (e) {
            log(` WebSocket: Error: ${e.message}`, 'error');
            scheduleReconnect();
            return;
        }

        ws.onopen = () => {
            isConnected = true;
            reconnectAttempts = 0;
            log(' WebSocket: Conectado a PumpPortal  escuchando TODOS los trades', 'success');
            onStatusChange(true);

            // Subscribe to all new token creations
            ws.send(JSON.stringify({
                method: "subscribeNewToken"
            }));
            ws.send(JSON.stringify({
                method: "subscribeMigration"
            }));

            startHeartbeat();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handlePumpPortalMessage(data);
            } catch (e) {
                // Binary/invalid frames, ignore
            }
        };

        ws.onerror = () => {
            log(' WebSocket: Error de conexion PumpPortal', 'warning');
        };

        ws.onclose = (event) => {
            isConnected = false;
            stopHeartbeat();
            onStatusChange(false);
            log(` WebSocket: Desconectado (code=${event.code})`, 'warning');
            scheduleReconnect();
        };
    }

    function handlePumpPortalMessage(data) {
        if (!data) return;

        let mint = null;

        // New token created on Pump.fun
        if (data.txType === 'create' && data.mint) {
            mint = data.mint;
        }
        // Buy/sell trade
        else if ((data.txType === 'buy' || data.txType === 'sell') && data.mint) {
            mint = data.mint;
        }
        // Token trade event (alternate format)
        else if (data.token && typeof data.token === 'string') {
            mint = data.token;
        }
        // Fallback: any object with a mint field
        else if (data.mint) {
            mint = data.mint;
        }

        if (!mint || IGNORE_MINTS.has(mint)) return;

        const now = Date.now();
        const solAmount = data.solAmount || data.sol_amount || 0;
        const isBuy = data.txType === 'buy' || data.type === 'buy';

        if (_processedMints.has(mint)) {
            // Already drained to scanner. Re-queue later waves instead of ignoring them forever.
            const existing = _liveQueue.get(mint);
            if (existing) {
                existing.swapCount++;
                existing.lastSeen = now;
                if (isBuy) existing.buyCount = (existing.buyCount || 0) + 1;
                existing.totalSol = (existing.totalSol || 0) + (solAmount || 0);
            } else if (now - (_processedMints.get(mint) || 0) >= REQUEUE_AFTER_MS) {
                _liveQueue.set(mint, {
                    firstSeen: now,
                    lastSeen: now,
                    swapCount: 1,
                    buyCount: isBuy ? 1 : 0,
                    totalSol: solAmount || 0,
                    source: 'ws_pumpportal_rewave'
                });
            }
            return;
        }

        // Check if already in queue (not yet drained)
        const inQueue = _liveQueue.get(mint);
        if (inQueue) {
            inQueue.swapCount++;
            inQueue.lastSeen = now;
            if (isBuy) inQueue.buyCount = (inQueue.buyCount || 0) + 1;
            inQueue.totalSol = (inQueue.totalSol || 0) + (solAmount || 0);
            return;
        }

        // Brand new detection
        _liveQueue.set(mint, {
            firstSeen: now,
            lastSeen: now,
            swapCount: 1,
            buyCount: isBuy ? 1 : 0,
            totalSol: solAmount || 0,
            source: 'ws_pumpportal'
        });
        totalDetected++;

        if (totalDetected % 100 === 1 || totalDetected <= 5) {
            log(` LIVE: Token ${mint.slice(0, 8)}... (total: ${totalDetected}, cola: ${_liveQueue.size})`, 'success');
        }
    }

    /**
     * Get and drain the live queue  called by scanner to fetch new mints
     */
    function drainQueue() {
        const now = Date.now();
        const result = new Map();

        for (const [mint, data] of _liveQueue) {
            if (now - data.firstSeen > QUEUE_MAX_AGE) {
                _liveQueue.delete(mint);
                continue;
            }
            result.set(mint, { ...data });
            _processedMints.set(mint, now);
        }

        _liveQueue.clear();

        // Purge old processed mints
        if (_processedMints.size > 10000) {
            for (const [mint, t] of _processedMints) {
                if (now - t > 30 * 60 * 1000) _processedMints.delete(mint);
            }
            if (_processedMints.size > 10000) _processedMints.clear();
        }

        return result;
    }

    function getQueueSize() {
        return _liveQueue.size;
    }

    function scheduleReconnect() {
        reconnectAttempts++;
        const delay = Math.min(30000, 2000 * Math.pow(2, reconnectAttempts - 1));
        log(` WebSocket: Reconectando en ${(delay / 1000).toFixed(0)}s...`, 'info');
        setTimeout(() => {
            if (!isConnected) connect();
        }, delay);
    }

    function startHeartbeat() {
        stopHeartbeat();
        heartbeatTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                try { ws.send(JSON.stringify({ method: "ping" })); } catch (e) { /* ignore */ }
            }
        }, 25000);
    }

    function stopHeartbeat() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }

    function disconnect() {
        stopHeartbeat();
        if (ws) {
            ws.onclose = null;
            ws.close();
            ws = null;
        }
        isConnected = false;
        onStatusChange(false);
        log(' WebSocket: Desconectado manualmente', 'info');
    }

    return {
        connect,
        disconnect,
        drainQueue,
        getQueueSize,
        get isConnected() { return isConnected; },
        get totalDetected() { return totalDetected; },
        set onLog(fn) { onLog = fn; },
        set onStatusChange(fn) { onStatusChange = fn; }
    };
})();

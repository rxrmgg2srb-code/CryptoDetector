/**
 * helius-firehose.js
 * Escucha transacciones de Raydium en tiempo real usando multiples API Keys de Helius en rotacion.
 */
const HeliusFirehose = (() => {
    const RAYDIUM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
    const IGNORE_MINTS = new Set([
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmKFr8Y3pAQuLj5dZ6wFCFnvyN8PKxr5w', // USDT
    ]);

    let apiKeys = [];
    let currentKeyIndex = 0;
    
    let ws = null;
    let isConnected = false;
    let reconnectAttempts = 0;
    
    let workerInterval = null;
    let _pendingSignatures = new Set();
    let _processedSignatures = new Set();
    
    const _liveQueue = new Map();
    const _processedMints = new Map(); // Para evitar saturar con el mismo token 20 veces
    const QUEUE_MAX_AGE = 5 * 60 * 1000;
    const REQUEUE_AFTER_MS = 15 * 1000;
    
    let totalDetected = 0;
    let onLog = () => {};
    let onStatusChange = () => {};

    function log(msg, level = 'info') { onLog(msg, level); }

    function getNextKey() {
        if (apiKeys.length === 0) return null;
        const key = apiKeys[currentKeyIndex];
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        return key;
    }

    function connect(keys) {
        if (!keys || keys.length === 0) {
            log(' Helius Firehose: No se han configurado API Keys', 'warning');
            return;
        }
        apiKeys = keys;
        
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const wsKey = getNextKey();
        log(` Helius Firehose: Conectando WS a Raydium...`, 'info');

        try {
            ws = new WebSocket(`wss://mainnet.helius-rpc.com/?api-key=${wsKey}`);
        } catch (e) {
            log(` Helius Firehose: Error WS: ${e.message}`, 'error');
            scheduleReconnect();
            return;
        }

        ws.onopen = () => {
            isConnected = true;
            reconnectAttempts = 0;
            log(` Helius Firehose: Conectado. Escuchando swaps de Raydium!`, 'success');
            onStatusChange(true);

            // Suscribirse a logs de Raydium
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "logsSubscribe",
                params: [
                    { mentions: [RAYDIUM_V4_PROGRAM_ID] },
                    { commitment: "processed" }
                ]
            }));

            startWorker();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.method === "logsNotification" && data.params && data.params.result) {
                    const logs = data.params.result.value.logs || [];
                    const signature = data.params.result.value.signature;
                    const err = data.params.result.value.err;
                    
                    if (err || !signature) return;

                    // Verificar si es un swap (ignoramos creaciones de pool o añadir liquidez pura para ir más rapido)
                    let isSwap = false;
                    for (const l of logs) {
                        if (l.includes('Instruction: Swap') || l.includes('ray_log:')) {
                            isSwap = true;
                            break;
                        }
                    }

                    if (isSwap && !_processedSignatures.has(signature)) {
                        _pendingSignatures.add(signature);
                        _processedSignatures.add(signature);
                        
                        // Limpieza de memoria
                        if (_processedSignatures.size > 10000) {
                            const arr = Array.from(_processedSignatures).slice(-5000);
                            _processedSignatures = new Set(arr);
                        }
                        if (_pendingSignatures.size > 500) {
                            // Si la cola se llena mucho (nos quedamos sin rate limit), borramos las mas viejas
                            const arr = Array.from(_pendingSignatures).slice(-200);
                            _pendingSignatures = new Set(arr);
                        }
                    }
                }
            } catch (e) {}
        };

        ws.onclose = () => {
            isConnected = false;
            onStatusChange(false);
            stopWorker();
            log(' Helius Firehose: WS Desconectado', 'warning');
            scheduleReconnect();
        };
        
        ws.onerror = () => {
            // log(' Helius Firehose: Error de red', 'error');
        };
    }

    function scheduleReconnect() {
        reconnectAttempts++;
        const delay = Math.min(10000, 2000 * reconnectAttempts);
        setTimeout(() => { if (!isConnected) connect(apiKeys); }, delay);
    }

    function startWorker() {
        stopWorker();
        // Procesamos firmas cada 200ms
        workerInterval = setInterval(processPendingSignatures, 200);
    }

    function stopWorker() {
        if (workerInterval) clearInterval(workerInterval);
        workerInterval = null;
    }

    async function processPendingSignatures() {
        if (_pendingSignatures.size === 0 || apiKeys.length === 0) return;

        // Limitar a maximo X peticiones por tick dependiendo del numero de keys para no comer el rate limit (50 req/sec per key)
        // Usamos un factor conservador de 20 peticiones por segundo por key = 4 peticiones por tick de 200ms por key
        const batchSize = Math.min(_pendingSignatures.size, apiKeys.length * 4);
        const signaturesToProcess = Array.from(_pendingSignatures).slice(0, batchSize);
        
        for (const sig of signaturesToProcess) {
            _pendingSignatures.delete(sig);
        }

        // Hacer las peticiones HTTP en paralelo
        await Promise.all(signaturesToProcess.map(sig => fetchTransactionWithRoundRobin(sig)));
    }

    async function fetchTransactionWithRoundRobin(signature) {
        const key = getNextKey();
        if (!key) return;

        try {
            const url = `https://mainnet.helius-rpc.com/?api-key=${key}`;
            const body = JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getTransaction",
                params: [signature, { maxSupportedTransactionVersion: 0, encoding: "jsonParsed" }]
            });

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            if (!res.ok) return;

            const data = await res.json();
            const tx = data.result;
            if (!tx || !tx.meta || !tx.meta.postTokenBalances) return;

            // Extraer mints de los balances
            const mints = new Set();
            for (const bal of tx.meta.postTokenBalances) {
                if (bal.mint && !IGNORE_MINTS.has(bal.mint)) {
                    mints.add(bal.mint);
                }
            }

            const now = Date.now();
            for (const mint of mints) {
                handleDiscoveredMint(mint, now);
            }
        } catch (e) {
            // Ignorar errores HTTP para no saturar consola
        }
    }

    function handleDiscoveredMint(mint, now) {
        if (_processedMints.has(mint)) {
            const existing = _liveQueue.get(mint);
            if (existing) {
                existing.swapCount++;
                existing.lastSeen = now;
            } else if (now - (_processedMints.get(mint) || 0) >= REQUEUE_AFTER_MS) {
                _liveQueue.set(mint, {
                    firstSeen: now,
                    lastSeen: now,
                    swapCount: 1,
                    buyCount: 1, // asumiendo actividad
                    source: 'ws_helius_rewave'
                });
            }
            return;
        }

        const inQueue = _liveQueue.get(mint);
        if (inQueue) {
            inQueue.swapCount++;
            inQueue.lastSeen = now;
            return;
        }

        _liveQueue.set(mint, {
            firstSeen: now,
            lastSeen: now,
            swapCount: 1,
            buyCount: 1,
            source: 'ws_helius_firehose'
        });
        
        totalDetected++;
        if (totalDetected % 50 === 1 || totalDetected <= 5) {
            log(` FIREHOSE: Detectado en Raydium: ${mint.slice(0, 8)}... (cola local: ${_liveQueue.size})`, 'success');
        }
    }

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

        if (_processedMints.size > 10000) {
            for (const [mint, t] of _processedMints) {
                if (now - t > 30 * 60 * 1000) _processedMints.delete(mint);
            }
        }

        return result;
    }

    function disconnect() {
        stopWorker();
        if (ws) {
            ws.onclose = null;
            ws.close();
            ws = null;
        }
        isConnected = false;
        onStatusChange(false);
        log(' Helius Firehose: Desconectado', 'info');
    }

    return {
        connect,
        disconnect,
        drainQueue,
        get isConnected() { return isConnected; },
        set onLog(fn) { onLog = fn; },
        set onStatusChange(fn) { onStatusChange = fn; }
    };
})();

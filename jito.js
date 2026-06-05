/**
 * jito.js  Instant Buy Engine v2
 * Firma localmente con clave privada (sin popups) + envio via Jito
 * Igual que Axiom/Photon: importas una "trading wallet" dedicada
 * 
 * FLUJO: Private Key  Sign in browser  Jito Block Engine  Solana Mainnet
 * TIEMPO: ~400-800ms (sin aprobaciones)
 */

const JitoBuy = (() => {

    //  Jito tip accounts (rotacion aleatoria) 
    const JITO_TIP_ACCOUNTS = [
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
        'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
        'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
        'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1SegSvGqmXA',
        'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    ];

    const JITO_URL  = 'https://mainnet.block-engine.jito.wtf/api/v1/transactions';
    const JUP_QUOTE = 'https://quote-api.jup.ag/v6/quote';
    const JUP_SWAP  = 'https://quote-api.jup.ag/v6/swap';
    const RPC_URL   = 'https://mainnet.helius-rpc.com/?api-key=ea67d7b7-31a4-4809-aab4-9103bb0a0968';
    const SOL_MINT  = 'So11111111111111111111111111111111111111112';
    const LAMPORTS  = 1_000_000_000;
    const STORE_KEY = 'dd_trading_wallet';

    let _keypair = null;   // Uint8Array[64]  clave privada cargada en memoria
    let _pubkey  = null;   // string base58
    let onLog    = () => {};
    function log(msg, level = 'info') { onLog(msg, level); }

    //  Base58 encode/decode (sin dependencias) 
    const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    function b58decode(str) {
        const bytes = [0];
        for (const ch of str) {
            let carry = BASE58_ALPHABET.indexOf(ch);
            if (carry < 0) throw new Error('Invalid base58 char: ' + ch);
            for (let i = 0; i < bytes.length; i++) {
                carry += bytes[i] * 58;
                bytes[i] = carry & 0xff;
                carry >>= 8;
            }
            while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
        }
        for (const ch of str) { if (ch === '1') bytes.push(0); else break; }
        return new Uint8Array(bytes.reverse());
    }

    function b58encode(bytes) {
        const digits = [0];
        for (const byte of bytes) {
            let carry = byte;
            for (let i = 0; i < digits.length; i++) {
                carry += digits[i] << 8;
                digits[i] = carry % 58;
                carry = (carry / 58) | 0;
            }
            while (carry > 0) { digits.push(carry % 58); carry = (carry / 58) | 0; }
        }
        let str = '';
        for (let i = bytes.length - 1; i >= 0 && bytes[i] === 0; i--) str += '1';
        for (let i = digits.length - 1; i >= 0; i--) str += BASE58_ALPHABET[digits[i]];
        return str;
    }

    //  XOR encrypt/decrypt simple (ofuscacion basica para localStorage) 
    // No es criptografia real  la clave nunca debe tener SOL serio
    function xorCipher(data, key = 'dormant_detector_v1') {
        const result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ key.charCodeAt(i % key.length);
        }
        return result;
    }

    //  Importar wallet desde clave privada 
    // Acepta: base58 (64 bytes) o JSON array [n,n,n,...] (Solana CLI format)
    function importWallet(input) {
        let secretKey;
        try {
            input = input.trim();
            if (input.startsWith('[')) {
                // Formato JSON array: [12,34,56,...]
                const arr = JSON.parse(input);
                if (arr.length !== 64) throw new Error('Array debe tener 64 bytes');
                secretKey = new Uint8Array(arr);
            } else {
                // Formato base58 (88 chars tipicamente)
                secretKey = b58decode(input);
                if (secretKey.length !== 64) throw new Error('Clave base58 debe ser 64 bytes');
            }
        } catch (e) {
            throw new Error('Formato invalido: ' + e.message);
        }

        // Los primeros 32 bytes = private key, ultimos 32 = public key
        _keypair = secretKey;
        _pubkey  = b58encode(secretKey.slice(32));

        // Guardar ofuscado en localStorage
        const obfuscated = xorCipher(secretKey);
        localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(obfuscated)));

        log(` Trading wallet importada: ${_pubkey.slice(0,4)}...${_pubkey.slice(-4)}`, 'success');
        return _pubkey;
    }

    //  Cargar wallet guardada 
    function loadSavedWallet() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return null;
            const obfuscated = new Uint8Array(JSON.parse(raw));
            const secretKey  = xorCipher(obfuscated);
            _keypair = secretKey;
            _pubkey  = b58encode(secretKey.slice(32));
            log(` Wallet cargada: ${_pubkey.slice(0,4)}...${_pubkey.slice(-4)}`, 'info');
            return _pubkey;
        } catch { return null; }
    }

    function clearWallet() {
        _keypair = null;
        _pubkey  = null;
        localStorage.removeItem(STORE_KEY);
        log(' Trading wallet eliminada', 'info');
    }

    function isReady()     { return !!_keypair; }
    function getPublicKey() { return _pubkey; }

    //  Firmar VersionedTransaction (Jupiter usa versioned txs) 
    function signTransaction(txBytes) {
        if (!_keypair) throw new Error('Wallet no cargada');

        // Detectar si es VersionedTransaction (empieza con 0x80) o Legacy
        const isVersioned = (txBytes[0] & 0x80) !== 0;

        if (isVersioned) {
            return signVersionedTx(txBytes);
        } else {
            return signLegacyTx(txBytes);
        }
    }

    // Ed25519 signing usando SubtleCrypto (API nativa del navegador)
    async function ed25519Sign(privateKeyBytes32, messageBytes) {
        const key = await crypto.subtle.importKey(
            'raw', privateKeyBytes32,
            { name: 'Ed25519' }, false, ['sign']
        );
        const sig = await crypto.subtle.sign('Ed25519', key, messageBytes);
        return new Uint8Array(sig);
    }

    async function signVersionedTx(txBytes) {
        // Estructura de VersionedTransaction:
        // [prefix byte] [signatures_count] [signatures...] [message...]
        // Necesitamos firmar el mensaje (todo menos el prefix + sigs actuales)
        
        let offset = 0;
        const prefix = txBytes[offset++]; // 0x80 | version
        
        // Numero de firmas requeridas (compact-u16)
        const numSigs = txBytes[offset++];
        
        // Saltar las firmas existentes (64 bytes cada una, rellenadas con 0)
        const sigStart = offset;
        offset += numSigs * 64;
        
        // El mensaje a firmar empieza aqui
        const message = txBytes.slice(offset);
        
        // Firmar
        const privateKey32 = _keypair.slice(0, 32);
        const signature    = await ed25519Sign(privateKey32, message);
        
        // Reemplazar la primera firma (indice 0) con la nuestra
        const signed = new Uint8Array(txBytes);
        signed.set(signature, sigStart); // posicion de la primera firma
        
        return signed;
    }

    async function signLegacyTx(txBytes) {
        // Legacy tx: [sigs_count] [sigs...] [message...]
        const numSigs  = txBytes[0];
        const sigStart = 1;
        const message  = txBytes.slice(1 + numSigs * 64);
        
        const privateKey32 = _keypair.slice(0, 32);
        const signature    = await ed25519Sign(privateKey32, message);
        
        const signed = new Uint8Array(txBytes);
        signed.set(signature, sigStart);
        return signed;
    }

    //  Jupiter: quote 
    async function getQuote(tokenMint, solAmount, slippageBps) {
        const lamports = Math.round(solAmount * LAMPORTS);
        const url = `${JUP_QUOTE}?inputMint=${SOL_MINT}&outputMint=${tokenMint}&amount=${lamports}&slippageBps=${slippageBps}&onlyDirectRoutes=false&maxAccounts=20`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const quote = await res.json();
            if (quote.error) throw new Error(quote.error);
            return quote;
        } catch (e) {
            throw new Error(`Jupiter Quote Error: ${e.message}`);
        }
    }

    //  Jupiter: obtener swap transaction 
    async function getSwapTx(quote) {
        if (!_pubkey) throw new Error('Wallet no cargada');

        try {
            const res = await fetch(JUP_SWAP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: _pubkey,
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true,
                    prioritizationFeeLamports: 'auto',
                    asLegacyTransaction: false   // usar VersionedTransaction
                })
            });

            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data.swapTransaction; // base64
        } catch (e) {
            throw new Error(`Jupiter Swap Error: ${e.message}`);
        }
    }

    //  Enviar a Jito block engine 
    async function sendToJito(signedTxB64) {
        try {
            const res = await fetch(JITO_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0', id: 1,
                    method: 'sendTransaction',
                    params: [signedTxB64, {
                        encoding: 'base64',
                        skipPreflight: true,
                        maxRetries: 0,
                        preflightCommitment: 'processed'
                    }]
                })
            });

            const result = await res.json();
            if (result.error) throw new Error(result.error.message);
            return result.result; // txSignature
        } catch (e) {
            throw new Error(`Jito RPC Error: ${e.message}`);
        }
    }

    //  COMPRA INSTANTANEA 
    async function buyToken({ tokenMint, tokenSymbol = '???', solAmount, slippageBps = 1500, jitoTipSol = 0.001 }) {
        if (!isReady()) throw new Error('Importa tu trading wallet primero');

        const t0 = Date.now();
        log(` COMPRANDO ${tokenSymbol}: ${solAmount} SOL | slip ${slippageBps/100}% | tip ${jitoTipSol} SOL`, 'info');

        try {
            // 1 Quote (paralelo mientras construimos)
            log(' Obteniendo quote de Jupiter...');
            const quote = await getQuote(tokenMint, solAmount, slippageBps);
            const outAmt = parseInt(quote.outAmount || 0);
            const impact = (parseFloat(quote.priceImpactPct || 0) * 100).toFixed(2);

            // 2 Swap transaction
            log(` Quote OK: ${outAmt.toLocaleString()} tokens | impacto ${impact}%`);
            const swapTxB64 = await getSwapTx(quote);

            // 3 Decodificar, firmar localmente (sin popup)
            const txBytes  = Uint8Array.from(atob(swapTxB64), c => c.charCodeAt(0));
            const signed   = await signTransaction(txBytes);
            const signedB64 = btoa(String.fromCharCode(...signed));

            // 4 Enviar a Jito
            const txSig = await sendToJito(signedB64);

            const ms  = Date.now() - t0;
            const url = `https://solscan.io/tx/${txSig}`;
            log(` COMPRADO en ${ms}ms | TX: ${txSig.slice(0,8)}... | ${url}`, 'success');

            return { success: true, signature: txSig, explorerUrl: url, ms };

        } catch (e) {
            const ms = Date.now() - t0;
            log(` Error en compra (${ms}ms): ${e.message}`, 'error');
            return { success: false, error: e.message, ms };
        }
    }

    //  Balance SOL 
    async function getSolBalance() {
        if (!_pubkey) return 0;
        try {
            const res = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0', id: 1,
                    method: 'getBalance',
                    params: [_pubkey, { commitment: 'confirmed' }]
                })
            });
            const data = await res.json();
            return (data.result?.value || 0) / LAMPORTS;
        } catch { return 0; }
    }

    // Auto-cargar wallet guardada al iniciar
    loadSavedWallet();

    return {
        importWallet, clearWallet, loadSavedWallet,
        buyToken, getQuote, getSolBalance,
        isReady, getPublicKey,
        set onLog(fn) { onLog = fn; }
    };
})();

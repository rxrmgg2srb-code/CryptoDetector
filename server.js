/**
 * Commercial demo server for Dormant Detector.
 *
 * Usage:
 *   HELIUS_API_KEY=your_key npm run start
 *
 * It serves the static app and proxies Helius calls so API keys stay out of
 * browser code. No external dependencies required.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendJson(res, status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1_000_000) reject(new Error('Request body too large'));
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function safeStaticPath(requestPath) {
    const cleanPath = requestPath === '/' ? '/index.html' : requestPath;
    const resolved = path.resolve(ROOT, `.${decodeURIComponent(cleanPath)}`);
    if (!resolved.startsWith(ROOT)) return null;
    return resolved;
}

async function proxyHeliusTransactions(reqUrl, res) {
    if (!HELIUS_API_KEY) {
        sendJson(res, 503, { error: 'HELIUS_API_KEY is not configured on the server' });
        return;
    }

    const address = reqUrl.searchParams.get('address') || '';
    const type = reqUrl.searchParams.get('type') || 'SWAP';
    const limit = Math.max(1, Math.min(100, Number(reqUrl.searchParams.get('limit') || 20)));
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(address)) {
        sendJson(res, 400, { error: 'Invalid address' });
        return;
    }

    const upstream = new URL(`https://api-mainnet.helius-rpc.com/v0/addresses/${address}/transactions`);
    upstream.searchParams.set('api-key', HELIUS_API_KEY);
    upstream.searchParams.set('type', type);
    upstream.searchParams.set('limit', String(limit));

    const response = await fetch(upstream);
    const body = await response.text();
    res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(body);
}

async function proxySolanaRpc(req, res) {
    if (!HELIUS_API_KEY) {
        sendJson(res, 503, { error: 'HELIUS_API_KEY is not configured on the server' });
        return;
    }

    const body = await readBody(req);
    const upstream = `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(HELIUS_API_KEY)}`;
    const response = await fetch(upstream, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    });
    const text = await response.text();
    res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(text);
}

async function handle(req, res) {
    try {
        const reqUrl = new URL(req.url, `http://${req.headers.host}`);

        if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
            sendJson(res, 200, { ok: true, heliusConfigured: Boolean(HELIUS_API_KEY) });
            return;
        }

        if (req.method === 'GET' && reqUrl.pathname === '/api/helius/address-transactions') {
            await proxyHeliusTransactions(reqUrl, res);
            return;
        }

        if (req.method === 'POST' && reqUrl.pathname === '/api/solana/rpc') {
            await proxySolanaRpc(req, res);
            return;
        }

        if (req.method !== 'GET') {
            sendJson(res, 405, { error: 'Method not allowed' });
            return;
        }

        const filePath = safeStaticPath(reqUrl.pathname);
        if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            sendJson(res, 404, { error: 'Not found' });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } catch (e) {
        sendJson(res, 500, { error: e.message });
    }
}

http.createServer(handle).listen(PORT, () => {
    console.log(`Dormant Detector demo running at http://localhost:${PORT}`);
    console.log(`Helius proxy: ${HELIUS_API_KEY ? 'configured' : 'missing HELIUS_API_KEY'}`);
});

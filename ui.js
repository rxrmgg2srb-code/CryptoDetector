/**
 * ui.js  Dashboard UI Renderer v4
 * TOP PICKs, velocity arrows, sparklines, profit calc, rug badges, LIVE detection, clone % display
 */

const UI = (() => {
    function formatUSD(n) {
        if (!n || n === 0) return '$0';
        if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
        if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
        if (n >= 1) return '$' + n.toFixed(2);
        return '$' + n.toFixed(6);
    }
    function formatHours(h) {
        if (h >= 168) return Math.floor(h / 168) + 'w ' + Math.floor((h % 168) / 24) + 'd';
        if (h >= 24) return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
        return h + 'h';
    }
    function formatAge(hours) {
        if (hours <= 0) return 'x';
        if (hours < 1) return Math.round(hours * 60) + 'm';
        if (hours < 24) return Math.round(hours) + 'h';
        const days = Math.floor(hours / 24);
        if (days < 7) return days + 'd ' + Math.round(hours % 24) + 'h';
        if (days < 30) return Math.floor(days / 7) + 'w ' + (days % 7) + 'd';
        return Math.floor(days / 30) + 'mo ' + (days % 30) + 'd';
    }
    function scoreClass(score) {
        if (score >= 75) return 'score-hot';
        if (score >= 50) return 'score-high';
        if (score >= 30) return 'score-mid';
        return 'score-low';
    }
    function truncAddr(addr) {
        if (!addr || addr.length < 10) return addr || '';
        return addr.slice(0, 4) + '...' + addr.slice(-4);
    }

    // SPARKLINE SVG
    function renderSparkline(prices) {
        if (!prices || prices.length < 2) return '<div class="sparkline-empty"></div>';
        const w = 80, h = 24, pad = 2;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const points = prices.map((p, i) => {
            const x = pad + (i / (prices.length - 1)) * (w - pad * 2);
            const y = pad + (1 - (p - min) / range) * (h - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        const up = prices[prices.length - 1] >= prices[0];
        const color = up ? '#00ffaa' : '#ff3b6a';
        return `<svg class="sparkline-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
            <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
    }

    // VELOCITY ARROW with color
    function velocityHtml(vel) {
        if (!vel) return '';
        const colors = { ROCKETING: '#00ff88', ACCELERATING: '#00ffaa', RISING: '#00d4ff', STABLE: '#55576a', DECELERATING: '#ffb800', CRASHING: '#ff3b6a', NEW: '#a855f7' };
        return `<span class="velocity-arrow" style="color:${colors[vel.trend]||'#55576a'}" title="Velocity: ${vel.velocity}/min">${vel.arrow}</span>`;
    }

    function renderTokenRow(token, helpers = {}) {
        const pair = token.pair;
        const name = pair.baseToken?.name || 'Unknown';
        const symbol = pair.baseToken?.symbol || '???';
        const price = pair.priceUsd ? formatUSD(parseFloat(pair.priceUsd)) : '-';
        const icon = pair.info?.imageUrl || '';
        const dex = pair.dexId || '';
        const spikeRatio = token.volumeSpike.ratio;
        const br = token.buyRatio;
        const buyPct = br.buys + br.sells > 0 ? Math.round((br.buys / (br.buys + br.sells)) * 100) : 0;
        const change5m = token.priceChange?.m5 || 0;
        const vol5m = token.volume5m || 0;
        const ageH = token.tokenAgeHours || 0;
        const pt = token.pumpTarget || { min: 0, max: 0, estimate: 0 };
        const x2 = token.x2Potential || { qualifies: false, score: 0, patternId: '' };
        const conv = token.convergence || { level: 'NONE', count: 0 };
        const isFav = helpers.isFavorited ? helpers.isFavorited(token.address) : false;
        const holders = token.holderCount;

        const row = document.createElement('div');
        let rowClass = 'token-row';
        if (token.microcap10x?.qualifies) rowClass += ' microcap-10x-row';
        if (token.isClonePump)   rowClass += ' clone-pump';
        else if (conv.level === 'TOP_PICK') rowClass += ' top-pick';
        else if (token.score >= 75) rowClass += ' hot';
        row.className = rowClass;
        row.dataset.address = token.address;
        row.onclick = () => window.app.showDetail(token);

        const iconHtml = icon
            ? `<img class="token-icon" src="${icon}" alt="" onerror="this.style.display='none'">`
            : `<div class="token-icon" style="display:flex;align-items:center;justify-content:center;font-size:14px;"></div>`;

        const signalTags = token.signals.slice(0, 5).map(s =>
            `<span class="signal-tag signal-${s.type}">${s.label}</span>`
        ).join('');

        // LIVE badge for WebSocket-detected tokens
        const liveBadge = token.isLive ? '<span class="signal-tag signal-live"> LIVE</span>' : '';

        // Clone pump: show new token's total pump %
        let clonePumpBadge = '';
        if (token.isClonePump && token.cloneOf) {
            const tp = token.cloneOf.totalPump || token.cloneOf.priceM5 || 0;
            const cloneClass = tp >= 100 ? 'clone-new-fire' : tp >= 50 ? 'clone-new-hot' : 'clone-new-warm';
            clonePumpBadge = `<span class="signal-tag ${cloneClass}"> NUEVO: +${tp.toFixed(0)}%</span>`;
        }

        const v = token.viewers || 0;
        const x2Badge = x2.qualifies ? `<span class="signal-tag signal-x2" title="${x2.patternId}">2x ${x2.score}</span>` : '';
        const m10 = token.microcap10x || { qualifies: false, score: 0 };
        const tenXBadge = m10.qualifies ? `<span class="signal-tag signal-10x" title="${(m10.matches || []).join(', ')}">10x ${m10.score}</span>` : '';
        const viewersClass = v >= 50 ? 'viewers-hot' : v >= 20 ? 'viewers-high' : v >= 5 ? 'viewers-mid' : 'viewers-low';
        const viewersDot = v > 0 ? '<span class="viewers-dot"></span>' : '';

        // Pump range display
        const pumpClass = pt.max >= 200 ? 'pump-fire' : pt.max >= 100 ? 'pump-high' : pt.max >= 50 ? 'pump-mid' : 'pump-low';

        // Holder display
        const holderHtml = holders !== undefined && holders >= 0
            ? `<span class="${holders >= 10 ? 'holders-ok' : 'holders-low'}">${holders}${holders >= 20 ? '+' : ''}</span>`
            : '<span class="holders-unknown">x</span>';

        // Sparkline
        const sparkHtml = token.sparkline ? renderSparkline(token.sparkline) : `<div class="sparkline-mini">${change5m > 0 ? '' : change5m < 0 ? '' : ''}</div>`;

        row.innerHTML = `
            <div class="cell-score-wrap">
                <span class="score-badge ${scoreClass(token.score)}">${token.score}</span>
                ${velocityHtml(token.velocity)}
            </div>
            <div class="token-info">
                ${iconHtml}
                <div class="token-meta">
                    <div class="token-name">${symbol} <span style="color:var(--text-muted);font-weight:400;font-size:11px;">${name.slice(0,20)}</span></div>
                    <div class="token-address">${truncAddr(token.address)}</div>
                    <div class="token-dex">${dex}</div>
                </div>
            </div>
            <div class="cell-viewers ${viewersClass}">${viewersDot} ${v > 0 ? v : '-'}</div>
            <div class="cell-sparkline">${sparkHtml}</div>
            <div class="cell-price">${price}</div>
            <div class="cell-change ${change5m > 10 ? 'change-hot' : change5m > 0 ? 'change-up' : change5m < 0 ? 'change-down' : ''}">${change5m > 0 ? '+' : ''}${change5m.toFixed(1)}%</div>
            <div class="cell-mcap">${formatUSD(token.mcap)}</div>
            <div class="cell-liq ${vol5m >= 2500 ? 'vol-fire' : vol5m >= 500 ? 'vol-hot' : ''}" title="Vol 5m: ${formatUSD(vol5m)} | Liq: ${formatUSD(token.liquidity)}">${formatUSD(vol5m)}</div>
            <div class="cell-pump ${pumpClass}">
                <span class="pump-range">+${pt.min}%+${pt.max}%</span>
            </div>
            <div class="buy-sell-bar">
                <div class="bar-container">
                    <div class="bar-buy" style="width:${buyPct}%"></div>
                    <div class="bar-sell" style="width:${100 - buyPct}%"></div>
                </div>
                <div class="bar-label">${br.buys}B/${br.sells}S (${buyPct}%)</div>
            </div>
            <div class="cell-holders">${holderHtml}</div>
            <div class="cell-age">${formatAge(ageH)}</div>
            <div class="signals">${liveBadge}${clonePumpBadge}${tenXBadge}${x2Badge}${signalTags}</div>
            <div class="cell-actions">
                ${typeof JitoBuy !== 'undefined' && JitoBuy.isReady() ? `<button class="btn-buy-sm" title="Comprar con Jito" onclick="event.stopPropagation();window.app.buyToken('${token.address}','${symbol}')">BUY</button>` : ''}
                <button class="btn-icon-sm btn-fav ${isFav ? 'fav-active' : ''}" title="${isFav ? 'Quitar favorito' : 'Anadir favorito'}" onclick="event.stopPropagation();window.app.toggleFavorite('${token.address}')">${isFav ? 'FAV' : 'F+'}</button>
                <button class="btn-icon-sm btn-copy" title="Copiar direccion" onclick="event.stopPropagation();navigator.clipboard.writeText('${token.address}')">CPY</button>
                <a class="btn-icon-sm btn-dex" href="${pair.url || 'https://dexscreener.com/solana/' + token.address}" target="_blank" onclick="event.stopPropagation()" title="DexScreener">DEX</a>
                <button class="btn-icon-sm btn-blacklist" title="Blacklist" onclick="event.stopPropagation();window.app.toggleBlacklist('${token.address}')">DEL</button>
            </div>
        `;
        return row;
    }

    function renderTokenList(tokens, helpers = {}) {
        const container = document.getElementById('token-list');
        const emptyState = document.getElementById('empty-state');
        container.innerHTML = '';
        if (tokens.length === 0) {
            container.appendChild(emptyState || createEmptyScanning());
            return;
        }
        for (const token of tokens) {
            container.appendChild(renderTokenRow(token, helpers));
        }
    }

    function createEmptyScanning() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.innerHTML = `<div class="empty-icon"></div><h3>Sin resultados con el filtro actual</h3><p>Ninguno de los tokens escaneados subio el % requerido en los ultimos 5 minutos.</p><p style="font-size:12px;color:var(--text-muted);margin-top:6px;">Prueba a bajar el filtro "Subida 5m min" o espera al proximo scan (30s).</p>`;
        return div;
    }

    function updateStats(stats) {
        setText('stat-scanned',  stats.scanned);
        setText('stat-dormant',  stats.dormant);
        setText('stat-awakening', stats.awakening);
        setText('stat-alerts',   stats.alerts);
        const clonesEl = document.querySelector('#stat-clones .stat-value');
        if (clonesEl) {
            clonesEl.textContent = stats.clones || 0;
            // Animar si hay clones
            if ((stats.clones || 0) > 0) {
                clonesEl.style.color = '#ff9500';
                clonesEl.parentElement.style.borderColor = 'rgba(255,149,0,0.4)';
            } else {
                clonesEl.style.color = '';
                clonesEl.parentElement.style.borderColor = '';
            }
        }
    }

    function setText(id, val) {
        const el = document.querySelector(`#${id} .stat-value`);
        if (el) el.textContent = val;
    }

    function renderSidebar(token, helpers = {}) {
        const pair = token.pair;
        const name = pair.baseToken?.name || 'Unknown';
        const symbol = pair.baseToken?.symbol || '???';
        const icon = pair.info?.imageUrl || '';
        const bd = token.breakdown;
        const pt = token.pumpTarget || { min: 0, max: 0, estimate: 0 };
        const conv = token.convergence || { level: 'NONE', count: 0 };
        const vel = token.velocity || { velocity: 0, trend: 'NEW', arrow: '' };
        const isFav = helpers.isFavorited ? helpers.isFavorited(token.address) : false;

        const sidebar = document.getElementById('detail-sidebar');
        const content = document.getElementById('sidebar-content');
        sidebar.classList.remove('hidden');

        const socials = (pair.info?.socials || [])
            .filter(s => s && s.platform && s.handle)
            .map(s => `<a class="sidebar-link" href="https://${s.platform}.com/${s.handle}" target="_blank">${s.platform}</a>`)
            .join('');

        // Convergence badge
        const convBadgeHtml = conv.level === 'TOP_PICK'
            ? `<div class="convergence-badge top-pick-badge"> TOP PICK  ${conv.count} senales convergentes</div>`
            : conv.level === 'STRONG'
            ? `<div class="convergence-badge strong-badge"> STRONG  ${conv.count} senales</div>`
            : conv.level === 'WATCH'
            ? `<div class="convergence-badge watch-badge"> WATCH  ${conv.count} senales</div>`
            : '';

        // Rug warnings
        const rugHtml = token.rug && !token.rug.safe
            ? `<div class="rug-warning-box">${token.rug.warnings.map(w => `<div class="rug-item">${w}</div>`).join('')}<div class="rug-score">Rug Score: ${token.rug.rugScore}/100</div></div>`
            : '<div class="rug-safe"> No se detectaron senales de rug</div>';

        // Profit calculator HTML
        const profitHtml = `
            <div class="profit-calculator">
                <h4> Calculadora de Profit</h4>
                <div class="profit-input-row">
                    <label>Inversion $</label>
                    <input type="number" id="profit-input" value="50" min="1" max="100000" onchange="UI.updateProfitCalc(${pt.min},${pt.max},${pt.estimate})">
                </div>
                <div class="profit-results" id="profit-results">
                    <div class="profit-row"><span>Min (+${pt.min}%)</span><span class="profit-val" id="prof-min">$${(50 * (1 + pt.min/100)).toFixed(0)}</span><span class="profit-gain">+$${(50 * pt.min/100).toFixed(0)}</span></div>
                    <div class="profit-row"><span>Est (+${pt.estimate}%)</span><span class="profit-val" id="prof-est">$${(50 * (1 + pt.estimate/100)).toFixed(0)}</span><span class="profit-gain">+$${(50 * pt.estimate/100).toFixed(0)}</span></div>
                    <div class="profit-row best"><span>Max (+${pt.max}%)</span><span class="profit-val" id="prof-max">$${(50 * (1 + pt.max/100)).toFixed(0)}</span><span class="profit-gain">+$${(50 * pt.max/100).toFixed(0)}</span></div>
                </div>
            </div>`;

        content.innerHTML = `
            <div class="sidebar-token-header">
                ${icon ? `<img src="${icon}" alt="" onerror="this.style.display='none'">` : ''}
                <div>
                    <div class="sidebar-token-name">${symbol}</div>
                    <div class="sidebar-token-symbol">${name}</div>
                </div>
                <button class="btn-fav-lg ${isFav ? 'fav-active' : ''}" onclick="window.app.toggleFavorite('${token.address}')">${isFav ? '' : ''}</button>
            </div>
            ${convBadgeHtml}
            <div class="sidebar-score-big ${scoreClass(token.score)}" style="color:${token.score >= 75 ? 'var(--alert)' : token.score >= 50 ? 'var(--cyan)' : 'var(--text-muted)'}">
                ${token.score} <span class="velocity-big">${vel.arrow} ${vel.trend}</span>
            </div>
            <div class="sidebar-pump-banner ${pt.max >= 200 ? 'pump-fire' : pt.max >= 100 ? 'pump-high' : pt.max >= 50 ? 'pump-mid' : 'pump-low'}">
                <span class="pump-label">Estimacion de Subida</span>
                <span class="pump-big-value">+${pt.min}%  +${pt.max}%</span>
                <span class="pump-sub">${token.pumpProbability || 0}% probabilidad</span>
            </div>
            ${rugHtml}
            <div class="sidebar-section">
                <h4>Score Breakdown</h4>
                <div class="sidebar-metric"><span class="metric-label"> Momentum (25%)</span><span class="metric-value" style="color:${bd.momentum > 10 ? 'var(--accent)' : ''}">${bd.momentum}/25</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Micro-Buys (10%)</span><span class="metric-value" style="color:${bd.microBuys > 5 ? 'var(--alert)' : ''}">${bd.microBuys}/10</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Volume Spike (15%)</span><span class="metric-value">${bd.volumeSpike}/15</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Buy Ratio (15%)</span><span class="metric-value">${bd.buyRatio}/15</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Liq Change (5%)</span><span class="metric-value" style="color:${bd.liqChange > 3 ? 'var(--cyan)' : ''}">${bd.liqChange}/5</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Pre-Pump (5%)</span><span class="metric-value" style="color:${bd.prePump > 3 ? 'var(--alert)' : ''}">${bd.prePump}/5</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Edad (5%)</span><span class="metric-value">${bd.age}/5</span></div>
                <div class="sidebar-metric"><span class="metric-label"> MCap (10%)</span><span class="metric-value">${bd.mcap}/10</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Liquidez (10%)</span><span class="metric-value">${bd.liquidity}/10</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Narrativa</span><span class="metric-value">+${bd.narrative || 0}</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Bonus</span><span class="metric-value">+${bd.bonus}</span></div>
            </div>
            <div class="sidebar-section">
                <h4>Datos del Token</h4>
                <div class="sidebar-metric"><span class="metric-label">Direccion</span><span class="metric-value" style="font-size:10px;cursor:pointer;" onclick="navigator.clipboard.writeText('${token.address}')" title="Click para copiar">${truncAddr(token.address)} </span></div>
                <div class="sidebar-metric"><span class="metric-label"> Edad</span><span class="metric-value">${formatAge(token.tokenAgeHours || 0)}</span></div>
                <div class="sidebar-metric"><span class="metric-label">Precio</span><span class="metric-value">${pair.priceUsd ? formatUSD(parseFloat(pair.priceUsd)) : '-'}</span></div>
                <div class="sidebar-metric"><span class="metric-label">Market Cap</span><span class="metric-value">${formatUSD(token.mcap)}</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Viewers</span><span class="metric-value" style="color:${(token.viewers||0) >= 20 ? 'var(--accent)' : 'var(--text-secondary)'}">${token.viewers || 0}</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Holders</span><span class="metric-value" style="color:${(token.holderCount||0) >= 10 ? 'var(--accent)' : 'var(--alert)'}">${token.holderCount !== undefined ? (token.holderCount >= 20 ? '20+' : token.holderCount) : 'x'}</span></div>
                <div class="sidebar-metric"><span class="metric-label">Liquidez</span><span class="metric-value">${formatUSD(token.liquidity)}</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Vol 5m</span><span class="metric-value" style="color:${(token.volume5m||0) >= 500 ? 'var(--accent)' : (token.volume5m||0) >= 100 ? 'var(--cyan)' : 'var(--text-secondary)'}">${formatUSD(token.volume5m || 0)}</span></div>
                <div class="sidebar-metric"><span class="metric-label">Vol 1h</span><span class="metric-value">${formatUSD(token.volumeH1 || 0)}</span></div>
                <div class="sidebar-metric"><span class="metric-label">Vol 24h</span><span class="metric-value">${formatUSD(pair.volume?.h24 || 0)}</span></div>
                <div class="sidebar-metric"><span class="metric-label"> Time Weight</span><span class="metric-value">${(token.timeWeight || 1).toFixed(2)}x</span></div>
                <div class="sidebar-metric"><span class="metric-label">DEX</span><span class="metric-value">${pair.dexId || '-'}</span></div>
            </div>
            ${token.onChain ? `
            <div class="sidebar-section">
                <h4> On-Chain Intelligence</h4>
                <div class="sidebar-metric"><span class="metric-label">Swaps recientes</span><span class="metric-value">${token.onChain.recentSwapCount || 0}</span></div>
                <div class="sidebar-metric"><span class="metric-label">Wallets unicas</span><span class="metric-value" style="color:${(token.onChain.uniqueWallets||0) >= 5 ? 'var(--alert)' : ''}">${token.onChain.uniqueWallets || 0}</span></div>
                <div class="sidebar-metric"><span class="metric-label">Bundle Score</span><span class="metric-value" style="color:${(token.onChain.bundleScore||0) > 0 ? 'var(--alert)' : ''}">${token.onChain.bundleScore || 0}/100</span></div>
                ${token.onChain.patterns.map(p => `<div style="margin-top:4px;padding:4px 8px;background:${p.severity==='critical' ? 'var(--alert-dim)' : 'var(--warning-dim)'};border-radius:4px;font-size:12px;font-weight:600;">${p.label}</div>`).join('')}
            </div>` : ''}
            ${token.isClonePump && token.cloneOf ? `
            <div class="clone-pump-banner">
                <div class="clone-pump-title"> CLONE PUMP ACTIVO</div>
                <div class="clone-pump-desc">
                    Este token viejo (<strong>${token.cloneOf.symbol}</strong>) esta siendo comprado por bots porque existe una version nueva del mismo nombre que esta explotando ahora mismo.
                </div>
                <div class="clone-new-pump-display ${(token.cloneOf.totalPump || 0) >= 100 ? 'clone-fire-pulse' : ''}">
                    <span class="clone-new-label"> Subida del NUEVO</span>
                    <span class="clone-new-value">+${(token.cloneOf.totalPump || token.cloneOf.priceM5 || 0).toFixed(0)}%</span>
                </div>
                <div class="clone-pump-stats">
                    <div class="sidebar-metric"><span class="metric-label"> Edad token nuevo</span><span class="metric-value" style="color:#ff9500">${token.cloneOf.ageLabel || (token.cloneOf.ageHours < 1 ? '<1h' : Math.round(token.cloneOf.ageHours) + 'h')}</span></div>
                    <div class="sidebar-metric"><span class="metric-label"> 5min</span><span class="metric-value" style="color:#ff9500">+${(token.cloneOf.priceM5 || 0).toFixed(1)}%</span></div>
                    <div class="sidebar-metric"><span class="metric-label"> 1h</span><span class="metric-value" style="color:${(token.cloneOf.priceH1 || 0) >= 50 ? '#ff3b6a' : '#ff9500'}">+${(token.cloneOf.priceH1 || 0).toFixed(1)}%</span></div>
                    <div class="sidebar-metric"><span class="metric-label"> 6h</span><span class="metric-value" style="color:${(token.cloneOf.priceH6 || 0) >= 100 ? '#ff3b6a' : '#ff9500'}">+${(token.cloneOf.priceH6 || 0).toFixed(1)}%</span></div>
                    <div class="sidebar-metric"><span class="metric-label"> 24h</span><span class="metric-value" style="color:${(token.cloneOf.priceH24 || 0) >= 100 ? '#ff3b6a' : '#ff9500'}">+${(token.cloneOf.priceH24 || 0).toFixed(1)}%</span></div>
                </div>
                <a class="clone-pump-link" href="https://dexscreener.com/solana/${token.cloneOf.address}" target="_blank">
                     Ver token NUEVO en DexScreener 
                </a>
            </div>` : ''}
            ${profitHtml}
            <div class="sidebar-links">
                <a class="sidebar-link" href="${pair.url || 'https://dexscreener.com/solana/' + token.address}" target="_blank"> DexScreener</a>
                <a class="sidebar-link" href="https://birdeye.so/token/${token.address}?chain=solana" target="_blank"> Birdeye</a>
                <a class="sidebar-link" href="https://solscan.io/token/${token.address}" target="_blank"> Solscan</a>
            </div>
            ${socials ? `<div class="sidebar-links" style="margin-top:8px;">${socials}</div>` : ''}
            ${typeof JitoBuy !== 'undefined' && JitoBuy.isReady() ? `
            <div class="sidebar-buy-section">
                <div class="sidebar-buy-header"> Compra Instantanea</div>
                <div class="sidebar-buy-row">
                    <div class="sidebar-buy-input-wrap">
                        <label>SOL</label>
                        <input type="number" id="sidebar-buy-amount" value="${document.getElementById('trade-amount')?.value || '0.1'}" step="0.05" min="0.01" class="sidebar-buy-input">
                    </div>
                    <button class="sidebar-buy-btn" onclick="window.app.buyToken('${token.address}','${symbol}',parseFloat(document.getElementById('sidebar-buy-amount').value))">
                         COMPRAR ${symbol}
                    </button>
                </div>
                <div class="sidebar-buy-hint">Jito MEV  Sin popups  ~500ms</div>
            </div>` : `
            <div class="sidebar-buy-section sidebar-buy-disabled">
                <div class="sidebar-buy-header"> Compra Instantanea</div>
                <button class="sidebar-buy-btn-connect" onclick="window.app.openWalletModal()"> Conectar Wallet para comprar</button>
            </div>`}
            <button class="btn-blacklist-lg" onclick="window.app.toggleBlacklist('${token.address}');window.app.closeSidebar()"> Blacklist este token</button>
        `;
    }

    function updateProfitCalc(min, max, est) {
        const input = document.getElementById('profit-input');
        if (!input) return;
        const inv = parseFloat(input.value) || 50;
        const setVal = (id, pct) => {
            const el = document.getElementById(id);
            if (el) el.textContent = '$' + (inv * (1 + pct/100)).toFixed(0);
        };
        setVal('prof-min', min);
        setVal('prof-est', est);
        setVal('prof-max', max);
    }

    function addLogEntry(msg, level) {
        const log = document.getElementById('scan-log');
        if (!log) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + level;
        const time = new Date().toLocaleTimeString('es-ES');
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
        while (log.children.length > 100) log.removeChild(log.firstChild);
    }

    function showAlert(msg, level = 'critical') {
        const banner = document.getElementById('alert-banner');
        const text = document.getElementById('alert-text');
        if (banner && text) {
            text.textContent = msg;
            banner.className = `alert-level-${level}`;
            banner.classList.remove('hidden');
            // Auto-hide WATCH after 5s
            if (level === 'watch') setTimeout(() => banner.classList.add('hidden'), 5000);
        }
        // Sound only for strong/critical
        if (level !== 'watch') {
            try { document.getElementById('alert-sound')?.play(); } catch(e) {}
        }
        // Browser notification for critical only
        if (level === 'critical' && Notification.permission === 'granted') {
            new Notification(' Dormant Detector  CRITICAL', { body: msg });
        }
        // Add to alert history
        const hist = document.getElementById('alert-history');
        if (hist) {
            const el = document.createElement('div');
            el.className = `alert-hist-item alert-hist-${level}`;
            el.innerHTML = `<span class="alert-hist-time">${new Date().toLocaleTimeString('es-ES')}</span> ${msg}`;
            hist.prepend(el);
            while (hist.children.length > 50) hist.removeChild(hist.lastChild);
        }
    }

    function setScannerActive(active) {
        const status = document.getElementById('scanner-status');
        const btn = document.getElementById('btn-scan');
        if (active) {
            status.classList.add('active');
            status.querySelector('.status-text').textContent = 'Escaneando...';
            btn.classList.add('running');
            btn.innerHTML = '<span class="btn-icon"></span> Detener';
        } else {
            status.classList.remove('active');
            status.querySelector('.status-text').textContent = 'Detenido';
            btn.classList.remove('running');
            btn.innerHTML = '<span class="btn-icon"></span> Iniciar Scanner';
        }
    }

    function updateTimer(seconds) {
        const el = document.getElementById('scan-timer');
        if (el) el.textContent = `Proximo scan: ${seconds}s`;
    }

    return {
        renderTokenList, updateStats, renderSidebar,
        addLogEntry, showAlert, setScannerActive, updateTimer,
        formatUSD, formatHours, updateProfitCalc
    };
})();

if (typeof module !== 'undefined') module.exports = UI;

import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { isValidSolanaAddress } from '../../lib/services/helius';
import { prisma } from '../../lib/prisma';
import { cacheGet, cacheSet, CacheKeys } from '../../lib/cache/redis';
import { uploadImage, generateCardImageKey, isStorageEnabled } from '../../lib/storage/r2';
import { logger } from '@/lib/logger';
import path from 'path';

// 🔤 REGISTER FONTS FOR CANVAS RENDERING
// This is critical for serverless environments where fonts aren't available by default
try {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans.ttf'), 'DejaVu Sans');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans-Bold.ttf'), 'DejaVu Sans Bold');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSansMono.ttf'), 'DejaVu Sans Mono');
  logger.info('✅ Fonts registered successfully');
} catch (error) {
  logger.error('❌ Error registering fonts', error instanceof Error ? error : undefined, {
    error: String(error),
  });
}

// Función auxiliar para formatear SOL
function formatSOL(amount: number, decimals: number = 2): string {
  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(decimals)}B`;
  }
  if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(decimals)}M`;
  }
  if (amount >= 1e3) {
    return `${(amount / 1e3).toFixed(decimals)}K`;
  }
  return `${amount.toFixed(decimals)}`;
}

// 🔥 FRASES FOMO ÉPICAS
function getFOMOPhrase(score: number): string {
  if (score >= 95) {
    return '🔥 GOD MODE - They Bow to You';
  }
  if (score >= 90) {
    return '👑 APEX PREDATOR - Pure Domination';
  }
  if (score >= 85) {
    return '💎 GENERATIONAL WEALTH - GG EZ';
  }
  if (score >= 80) {
    return '⚡ MAIN CHARACTER - Eating Good';
  }
  if (score >= 75) {
    return '🚀 MOON MISSION - Keep Stacking';
  }
  if (score >= 70) {
    return '🔥 KILLING IT - Above Average Chad';
  }
  if (score >= 65) {
    return "💪 SOLID - You'll Make It Anon";
  }
  if (score >= 60) {
    return '📈 MID CURVE - Touch Grass King';
  }
  if (score >= 55) {
    return '🎯 SLIGHTLY MID - Do Better';
  }
  if (score >= 50) {
    return '😬 NGMI VIBES - Yikes';
  }
  if (score >= 40) {
    return "📉 EXIT LIQUIDITY - That's You";
  }
  if (score >= 30) {
    return '💀 ABSOLUTELY COOKED - RIP';
  }
  if (score >= 20) {
    return "🤡 CIRCUS CLOWN - Everyone's Laughing";
  }
  if (score >= 10) {
    return '⚰️ DELETE APP - Uninstall Now';
  }
  return "🪦 QUIT FOREVER - It's Over Bro";
}

// Configuración de tier basada en el score - ENHANCED PREMIUM VERSION
function getTierConfig(score: number) {
  if (score >= 90) {
    return {
      name: 'LEGENDARY',
      emoji: '👑',
      colors: ['#f59e0b', '#fbbf24', '#fde047'],
      borderColor: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.8)',
    };
  }
  if (score >= 80) {
    return {
      name: 'MASTER',
      emoji: '💎',
      colors: ['#d946ef', '#a855f7', '#ec4899'],
      borderColor: '#d946ef',
      glowColor: 'rgba(217, 70, 239, 0.8)',
    };
  }
  if (score >= 70) {
    return {
      name: 'DIAMOND',
      emoji: '💠',
      colors: ['#06b6d4', '#3b82f6', '#22d3ee'],
      borderColor: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.8)',
    };
  }
  if (score >= 60) {
    return {
      name: 'PLATINUM',
      emoji: '⚡',
      colors: ['#94a3b8', '#cbd5e1', '#e2e8f0'],
      borderColor: '#94a3b8',
      glowColor: 'rgba(148, 163, 184, 0.7)',
    };
  }
  if (score >= 50) {
    return {
      name: 'GOLD',
      emoji: '🌟',
      colors: ['#f59e0b', '#eab308', '#facc15'],
      borderColor: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.6)',
    };
  }
  return {
    name: 'DEGEN',
    emoji: '🎮',
    colors: ['#10b981', '#34d399', '#6ee7b7'],
    borderColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    logger.info('🎨 Generating card image', { walletAddress });

    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
    });

    if (!card) {
      return res.status(404).json({
        error: 'Card not found. Please generate metrics first via /api/save-card',
      });
    }

    logger.info('✅ Found card in database', {
      walletAddress,
      degenScore: card.degenScore,
      isPaid: card.isPaid ? 'PREMIUM' : 'BASIC',
    });

    // 🚀 OPTIMIZACIÓN: Verificar cache de imagen
    const cacheKey = CacheKeys.cardImage(walletAddress);
    logger.info('🔍 Checking cache for key', { cacheKey });
    const cachedImageUrl = await cacheGet<string>(cacheKey);

    // Verificar si hay parámetro ?nocache en la query para forzar regeneración
    const forceRegenerate = req.query.nocache === 'true';

    if (cachedImageUrl && !forceRegenerate) {
      logger.info('⚡ Serving card from cache/R2', {
        cacheType: cachedImageUrl.startsWith('http') ? 'R2 URL' : 'Base64 buffer',
        urlPreview: cachedImageUrl.substring(0, 100),
      });
      // Si tenemos URL de R2, redirigir
      if (cachedImageUrl.startsWith('http')) {
        return res.redirect(302, cachedImageUrl);
      }
      // Si es buffer en cache, servir directamente
      const buffer = Buffer.from(cachedImageUrl, 'base64');
      logger.info('📤 Serving cached buffer', { size: buffer.length });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 días
      res.setHeader('X-Cache-Status', 'HIT');
      return res.status(200).send(buffer);
    }

    if (forceRegenerate) {
      logger.info('🔄 Force regenerating card (nocache=true)');
    } else {
      logger.info('💫 No cache found, generating new card image');
    }

    // No hay cache, generar imagen
    const imageBuffer = await generateCardImage(walletAddress, {
      degenScore: card.degenScore,
      totalTrades: card.totalTrades,
      totalVolume: card.totalVolume,
      profitLoss: card.profitLoss,
      winRate: card.winRate,
      bestTrade: card.bestTrade,
      worstTrade: card.worstTrade,
      avgTradeSize: card.avgTradeSize,
      tradingDays: card.tradingDays,
      isMinted: card.isMinted,
      displayName: card.displayName,
      twitter: card.twitter,
      telegram: card.telegram,
      profileImage: card.profileImage,
      isPaid: card.isPaid,
    });

    // 🚀 OPTIMIZACIÓN: Subir a R2 si está habilitado
    if (isStorageEnabled) {
      const imageKey = generateCardImageKey(walletAddress);
      const publicUrl = await uploadImage(imageKey, imageBuffer, {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000, immutable', // 1 año
      });

      if (publicUrl) {
        logger.info('☁️ Image uploaded to R2', { publicUrl });
        // Cachear la URL por 7 días
        await cacheSet(cacheKey, publicUrl, { ttl: 604800 });
        // Redirigir a R2
        return res.redirect(302, publicUrl);
      }
    }

    // Si R2 no está habilitado o falló, cachear el buffer
    const base64Buffer = imageBuffer.toString('base64');
    await cacheSet(cacheKey, base64Buffer, { ttl: 86400 }); // 24 horas (optimización de performance)

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
    res.setHeader('X-Cache-Status', 'MISS');
    res.status(200).send(imageBuffer);
  } catch (error) {
    logger.error('❌ Error generating card', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to generate card',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function generateCardImage(walletAddress: string, metrics: any): Promise<Buffer> {
  logger.info('🎨 generateCardImage called', { isPaid: metrics.isPaid });

  // Si está pagado, usar estilo premium del leaderboard
  if (metrics.isPaid) {
    logger.info('✅ Generating PREMIUM card...');
    try {
      const premiumBuffer = await generatePremiumCardImage(walletAddress, metrics);
      logger.info('✅ Premium card generated successfully');
      // Force garbage collection hint
      if (global.gc) {
        global.gc();
      }
      return premiumBuffer;
    } catch (error) {
      logger.error('❌ Error generating premium card', error instanceof Error ? error : undefined, {
        error: String(error),
      });
      logger.info('⚠️ Falling back to basic card');
      return generateBasicCardImage(walletAddress, metrics);
    }
  }

  // Si NO está pagado, usar el estilo básico original
  logger.info('📝 Generating BASIC card...');
  const buffer = await generateBasicCardImage(walletAddress, metrics);
  // Force garbage collection hint
  if (global.gc) {
    global.gc();
  }
  return buffer;
}

// 🔥 PREMIUM CARD ULTRA ENHANCED
async function generatePremiumCardImage(walletAddress: string, metrics: any): Promise<Buffer> {
  const width = 700;
  const height = 1100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const tier = getTierConfig(metrics.degenScore);

  // FONDO OSCURO CON GRADIENTE RADIAL
  const bgRadialGradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    width
  );
  bgRadialGradient.addColorStop(0, '#1f2937');
  bgRadialGradient.addColorStop(0.5, '#111827');
  bgRadialGradient.addColorStop(1, '#0a0e1a');
  ctx.fillStyle = bgRadialGradient;
  ctx.fillRect(0, 0, width, height);

  // PATRÓN DE FONDO CON GRADIENTE DEL TIER MÁS INTENSO
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, (tier.colors[0] as string) + '35');
  bgGradient.addColorStop(0.5, (tier.colors[1] as string) + '20');
  bgGradient.addColorStop(1, (tier.colors[2] as string) + '35');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // DOBLE BORDER CON GLOW INTENSO
  // Border exterior
  ctx.shadowColor = tier.glowColor;
  ctx.shadowBlur = 50;
  ctx.strokeStyle = tier.borderColor;
  ctx.lineWidth = 12;
  ctx.strokeRect(25, 25, width - 50, height - 50);

  // Border interior
  ctx.shadowBlur = 30;
  ctx.lineWidth = 6;
  ctx.strokeRect(35, 35, width - 70, height - 70);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  let currentY = 80; // ✅ Empezar más arriba

  // FOTO DE PERFIL
  if (metrics.profileImage) {
    try {
      let imageUrl = metrics.profileImage;

      if (!imageUrl.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      // Load image with timeout (5 seconds max)
      const profileImg = await Promise.race([
        loadImage(imageUrl),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Image load timeout')), 5000)
        ),
      ]);

      const imgSize = 140;
      const imgX = width / 2;

      ctx.shadowColor = tier.glowColor;
      ctx.shadowBlur = 40;

      ctx.save();
      ctx.beginPath();
      ctx.arc(imgX, currentY, imgSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(profileImg, imgX - imgSize / 2, currentY - imgSize / 2, imgSize, imgSize);
      ctx.restore();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      ctx.strokeStyle = tier.borderColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(imgX, currentY, imgSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      currentY += imgSize / 2 + 25;
    } catch (error) {
      logger.error('⚠️ Error loading profile image', error instanceof Error ? error : undefined, {
        error: String(error),
      });
      const imgSize = 140;
      const imgX = width / 2;

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(imgX, currentY, imgSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = tier.borderColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(imgX, currentY, imgSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = tier.borderColor;
      ctx.font = 'bold 80px "DejaVu Sans"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👤', imgX, currentY);

      currentY += imgSize / 2 + 25;
    }
  } else {
    const imgSize = 140;
    const imgX = width / 2;

    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(imgX, currentY, imgSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = tier.borderColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(imgX, currentY, imgSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = tier.borderColor;
    ctx.font = 'bold 80px "DejaVu Sans"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👤', imgX, currentY);

    currentY += imgSize / 2 + 25;
  }

  // NOMBRE
  if (metrics.displayName) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "DejaVu Sans"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(metrics.displayName, width / 2, currentY);
    currentY += 40;
  }

  // WALLET ADDRESS
  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px "DejaVu Sans Mono"';
  ctx.textAlign = 'center';
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`;
  ctx.fillText(shortAddress, width / 2, currentY);
  currentY += 35;

  // REDES SOCIALES
  if (metrics.twitter || metrics.telegram) {
    ctx.font = '14px "DejaVu Sans"';
    ctx.fillStyle = tier.borderColor;

    const socials = [];
    if (metrics.twitter) {
      socials.push(`🐦 @${metrics.twitter}`);
    }
    if (metrics.telegram) {
      socials.push(`✈️ @${metrics.telegram}`);
    }

    ctx.fillText(socials.join('  •  '), width / 2, currentY);
    currentY += 45;
  } else {
    currentY += 20;
  }

  // DEGEN SCORE - EXTRA GRANDE CON GRADIENTE Y GLOW
  const scoreGradient = ctx.createLinearGradient(
    width / 2 - 200,
    currentY,
    width / 2 + 200,
    currentY
  );
  scoreGradient.addColorStop(0, tier.colors[0] as string);
  scoreGradient.addColorStop(0.5, tier.colors[1] as string);
  scoreGradient.addColorStop(1, tier.colors[2] as string);

  ctx.fillStyle = scoreGradient;
  ctx.font = 'bold 130px "DejaVu Sans"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = tier.glowColor;
  ctx.shadowBlur = 60;
  ctx.fillText(metrics.degenScore.toString(), width / 2, currentY);

  // Segundo layer para más glow
  ctx.shadowBlur = 40;
  ctx.fillText(metrics.degenScore.toString(), width / 2, currentY);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  currentY += 80;

  ctx.fillStyle = '#d1d5db';
  ctx.font = 'bold 18px "DejaVu Sans"';
  ctx.letterSpacing = '4px';
  ctx.fillText('DEGEN SCORE', width / 2, currentY);
  currentY += 40;

  // 🔥 FRASE FOMO MEJORADA
  const fomoPhrase = getFOMOPhrase(metrics.degenScore);

  const fomoBgGradient = ctx.createLinearGradient(0, currentY - 25, width, currentY + 25);
  fomoBgGradient.addColorStop(0, 'rgba(234, 179, 8, 0.15)');
  fomoBgGradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.3)');
  fomoBgGradient.addColorStop(1, 'rgba(234, 179, 8, 0.15)');
  ctx.fillStyle = fomoBgGradient;

  ctx.font = 'bold 16px "DejaVu Sans"';
  const fomoTextWidth = ctx.measureText(fomoPhrase).width;
  const fomoBoxWidth = fomoTextWidth + 50;
  const fomoBoxHeight = 48;
  const fomoX = width / 2 - fomoBoxWidth / 2;
  const fomoY = currentY - fomoBoxHeight / 2;

  // Rounded rectangle para FOMO
  const fomoRadius = 12;
  ctx.beginPath();
  ctx.moveTo(fomoX + fomoRadius, fomoY);
  ctx.lineTo(fomoX + fomoBoxWidth - fomoRadius, fomoY);
  ctx.quadraticCurveTo(fomoX + fomoBoxWidth, fomoY, fomoX + fomoBoxWidth, fomoY + fomoRadius);
  ctx.lineTo(fomoX + fomoBoxWidth, fomoY + fomoBoxHeight - fomoRadius);
  ctx.quadraticCurveTo(
    fomoX + fomoBoxWidth,
    fomoY + fomoBoxHeight,
    fomoX + fomoBoxWidth - fomoRadius,
    fomoY + fomoBoxHeight
  );
  ctx.lineTo(fomoX + fomoRadius, fomoY + fomoBoxHeight);
  ctx.quadraticCurveTo(fomoX, fomoY + fomoBoxHeight, fomoX, fomoY + fomoBoxHeight - fomoRadius);
  ctx.lineTo(fomoX, fomoY + fomoRadius);
  ctx.quadraticCurveTo(fomoX, fomoY, fomoX + fomoRadius, fomoY);
  ctx.fill();

  ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fomoPhrase, width / 2, currentY);
  currentY += 50;

  // TIER BADGE PREMIUM
  const badgeGradient = ctx.createLinearGradient(
    width / 2 - 130,
    currentY,
    width / 2 + 130,
    currentY
  );
  badgeGradient.addColorStop(0, tier.colors[0] as string);
  badgeGradient.addColorStop(0.5, tier.colors[1] as string);
  badgeGradient.addColorStop(1, tier.colors[2] as string);

  ctx.shadowColor = tier.glowColor;
  ctx.shadowBlur = 30;

  ctx.fillStyle = badgeGradient;
  const badgeWidth = 260;
  const badgeHeight = 55;
  const badgeX = width / 2 - badgeWidth / 2;
  const badgeY = currentY - badgeHeight / 2;
  const radius = 28;

  ctx.beginPath();
  ctx.moveTo(badgeX + radius, badgeY);
  ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
  ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
  ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
  ctx.quadraticCurveTo(
    badgeX + badgeWidth,
    badgeY + badgeHeight,
    badgeX + badgeWidth - radius,
    badgeY + badgeHeight
  );
  ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
  ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
  ctx.lineTo(badgeX, badgeY + radius);
  ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "DejaVu Sans"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${tier.emoji} ${tier.name}`, width / 2, currentY);
  currentY += 55;

  // LÍNEA DIVISORIA
  const lineGradient = ctx.createLinearGradient(60, currentY, width - 60, currentY);
  lineGradient.addColorStop(0, 'transparent');
  lineGradient.addColorStop(0.5, tier.borderColor);
  lineGradient.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, currentY);
  ctx.lineTo(width - 60, currentY);
  ctx.stroke();
  currentY += 40;

  // MÉTRICAS - 2x2 GRID con más espacio
  const rowHeight = 75;
  const leftX = 120;
  const rightX = width - 120;

  drawPremiumMetric(
    ctx,
    'TRADES',
    metrics.totalTrades.toString(),
    leftX,
    currentY,
    true,
    tier.borderColor
  );
  drawPremiumMetric(
    ctx,
    'WIN RATE',
    `${metrics.winRate.toFixed(1)}%`,
    rightX,
    currentY,
    false,
    tier.borderColor
  );
  currentY += rowHeight;

  drawPremiumMetric(
    ctx,
    'VOLUME',
    `${formatSOL(metrics.totalVolume, 1)} SOL`,
    leftX,
    currentY,
    true,
    tier.borderColor
  );
  const pnlColor = metrics.profitLoss >= 0 ? '#10b981' : '#ef4444';
  drawPremiumMetric(
    ctx,
    'P&L',
    `${formatSOL(metrics.profitLoss, 2)} SOL`,
    rightX,
    currentY,
    false,
    pnlColor
  );
  currentY += rowHeight;

  drawPremiumMetric(
    ctx,
    'BEST TRADE',
    `${formatSOL(metrics.bestTrade, 2)} SOL`,
    leftX,
    currentY,
    true,
    tier.borderColor
  );
  drawPremiumMetric(
    ctx,
    'WORST TRADE',
    `${formatSOL(metrics.worstTrade, 2)} SOL`,
    rightX,
    currentY,
    false,
    tier.borderColor
  );
  currentY += rowHeight;

  drawPremiumMetric(
    ctx,
    'AVG TRADE',
    `${formatSOL(metrics.avgTradeSize, 2)} SOL`,
    leftX,
    currentY,
    true,
    tier.borderColor
  );
  drawPremiumMetric(
    ctx,
    'ACTIVE DAYS',
    metrics.tradingDays.toString(),
    rightX,
    currentY,
    false,
    tier.borderColor
  );
  currentY += 60;

  // FOOTER
  ctx.fillStyle = '#6b7280';
  ctx.font = '13px "DejaVu Sans"';
  ctx.textAlign = 'center';
  ctx.fillText('Powered by Helius × Solana', width / 2, currentY);

  // Convert to buffer and clear canvas reference to help GC
  const buffer = canvas.toBuffer('image/png');

  // Clear canvas context to free memory
  ctx.clearRect(0, 0, width, height);

  return buffer;
}

// Función para dibujar métricas premium MEJORADAS
function drawPremiumMetric(
  ctx: any,
  label: string,
  value: string,
  x: number,
  y: number,
  alignLeft: boolean = true,
  valueColor: string = '#ffffff'
) {
  const alignment = alignLeft ? 'left' : 'right';

  ctx.textAlign = alignment;
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 13px "DejaVu Sans"';
  ctx.letterSpacing = '2px';
  ctx.fillText(label, x, y);

  ctx.fillStyle = valueColor;
  ctx.font = 'bold 30px "DejaVu Sans"';
  ctx.fillText(value, x, y + 38);
}

// ✅ ORIGINAL: BASIC CARD (SIN PAGAR)
async function generateBasicCardImage(walletAddress: string, metrics: any): Promise<Buffer> {
  // Validar y proveer valores por defecto
  const safeMetrics = {
    degenScore: Number(metrics?.degenScore) || 0,
    totalTrades: Number(metrics?.totalTrades) || 0,
    totalVolume: Number(metrics?.totalVolume) || 0,
    profitLoss: Number(metrics?.profitLoss) || 0,
    winRate: Number(metrics?.winRate) || 0,
    bestTrade: Number(metrics?.bestTrade) || 0,
    worstTrade: Number(metrics?.worstTrade) || 0,
    avgTradeSize: Number(metrics?.avgTradeSize) || 0,
    tradingDays: Number(metrics?.tradingDays) || 0,
  };

  logger.info('📝 Generating BASIC card', {
    walletAddress,
    metrics: safeMetrics,
  });

  const width = 600;
  const height = 950;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // FONDO DEGRADADO BÁSICO
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a0e1a');
  gradient.addColorStop(0.5, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // BORDER BÁSICO
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, width - 30, height - 30);
  logger.info('✅ Border drawn successfully');

  let currentY = 90;

  // TÍTULO
  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 44px "DejaVu Sans"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DEGEN CARD', width / 2, currentY);
  currentY += 55;

  // WALLET ADDRESS
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px "DejaVu Sans Mono"';
  ctx.textAlign = 'center';
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`;
  ctx.fillText(shortAddress, width / 2, currentY);
  currentY += 60;

  // DEGEN SCORE
  const scoreColor = getScoreColor(safeMetrics.degenScore);
  ctx.fillStyle = scoreColor;
  ctx.font = 'bold 110px "DejaVu Sans"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = scoreColor;
  ctx.shadowBlur = 30;
  ctx.fillText(safeMetrics.degenScore.toString(), width / 2, currentY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  currentY += 75;

  ctx.fillStyle = '#aaaaaa';
  ctx.font = 'bold 20px "DejaVu Sans"';
  ctx.letterSpacing = '2px';
  ctx.fillText('DEGEN SCORE', width / 2, currentY);
  currentY += 40;

  // FRASE FOMO
  const fomoPhrase = getFOMOPhrase(safeMetrics.degenScore);

  ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
  const textWidth = ctx.measureText(fomoPhrase).width;
  ctx.fillRect(width / 2 - textWidth / 2 - 20, currentY - 18, textWidth + 40, 36);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 17px "DejaVu Sans"';
  ctx.textAlign = 'center';
  ctx.fillText(fomoPhrase, width / 2, currentY);
  currentY += 50;

  // LINEA DIVISORIA
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, currentY);
  ctx.lineTo(width - 60, currentY);
  ctx.stroke();
  currentY += 40;

  // METRICAS
  const rowHeight = 85;
  const leftX = 140;
  const rightX = width - 140;

  ctx.textAlign = 'left';

  logger.info('🖊️ Drawing metrics...');
  drawMetric(ctx, 'TOTAL TRADES', safeMetrics.totalTrades.toString(), leftX, currentY, true);
  drawMetric(ctx, 'WIN RATE', `${safeMetrics.winRate.toFixed(1)}%`, rightX, currentY, false);
  currentY += rowHeight;

  drawMetric(ctx, 'VOLUME', `${formatSOL(safeMetrics.totalVolume, 1)} SOL`, leftX, currentY, true);
  const pnlColor = safeMetrics.profitLoss >= 0 ? '#00ff88' : '#ff4444';
  drawMetric(
    ctx,
    'P&L',
    `${formatSOL(safeMetrics.profitLoss, 2)} SOL`,
    rightX,
    currentY,
    false,
    pnlColor
  );
  currentY += rowHeight;

  drawMetric(
    ctx,
    'BEST TRADE',
    `${formatSOL(safeMetrics.bestTrade, 2)} SOL`,
    leftX,
    currentY,
    true
  );
  drawMetric(
    ctx,
    'WORST TRADE',
    `${formatSOL(safeMetrics.worstTrade, 2)} SOL`,
    rightX,
    currentY,
    false
  );
  currentY += rowHeight;

  drawMetric(
    ctx,
    'AVG TRADE',
    `${formatSOL(safeMetrics.avgTradeSize, 2)} SOL`,
    leftX,
    currentY,
    true
  );
  drawMetric(ctx, 'ACTIVE DAYS', safeMetrics.tradingDays.toString(), rightX, currentY, false);
  currentY += 60;
  logger.info('✅ All metrics drawn');

  // LINEA DIVISORIA
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, currentY);
  ctx.lineTo(width - 60, currentY);
  ctx.stroke();
  currentY += 50;

  // FOOTER
  const rating = getRating(safeMetrics.degenScore);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "DejaVu Sans"';
  ctx.textAlign = 'center';
  ctx.fillText(rating, width / 2, currentY);
  currentY += 50;

  ctx.fillStyle = '#777777';
  ctx.font = '15px "DejaVu Sans"';
  ctx.fillText('Powered by Helius × Solana', width / 2, currentY);

  // Convert to buffer and clear canvas reference to help GC
  logger.info('📦 Converting canvas to PNG buffer...');
  const buffer = canvas.toBuffer('image/png');
  logger.info('✅ BASIC card buffer created successfully', { size: buffer.length });

  // Clear canvas context to free memory
  ctx.clearRect(0, 0, width, height);

  return buffer;
}

function drawMetric(
  ctx: any,
  label: string,
  value: string,
  x: number,
  y: number,
  alignLeft: boolean = true,
  valueColor: string = '#ffffff'
) {
  const alignment = alignLeft ? 'left' : 'right';

  ctx.textAlign = alignment;
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 13px "DejaVu Sans"';
  ctx.letterSpacing = '1px';
  ctx.fillText(label, x, y);

  ctx.fillStyle = valueColor;
  ctx.font = 'bold 26px "DejaVu Sans"';
  ctx.fillText(value, x, y + 32);
}

function getScoreColor(score: number): string {
  if (score >= 90) {
    return '#FFD700';
  }
  if (score >= 80) {
    return '#00ff88';
  }
  if (score >= 60) {
    return '#00d4ff';
  }
  if (score >= 40) {
    return '#ffaa00';
  }
  if (score >= 20) {
    return '#ff6600';
  }
  return '#ff4444';
}

function getRating(score: number): string {
  if (score >= 90) {
    return '🔥 LEGENDARY DEGEN 🔥';
  }
  if (score >= 75) {
    return '⭐ MASTER DEGEN ⭐';
  }
  if (score >= 60) {
    return '💎 DIAMOND HANDS 💎';
  }
  if (score >= 45) {
    return '📈 DEGEN IN TRAINING 📈';
  }
  if (score >= 30) {
    return '🎲 CASUAL GAMBLER 🎲';
  }
  if (score >= 15) {
    return '🐟 SMALL FRY 🐟';
  }
  return '😅 NGMI 😅';
}

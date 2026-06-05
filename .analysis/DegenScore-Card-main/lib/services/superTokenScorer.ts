/**
 * 🚀 SUPER TOKEN SCORER - EL SISTEMA MÁS COMPLETO DE ANÁLISIS DE TOKENS EN WEB3
 *
 * Integra TODAS las fuentes de datos posibles para dar el scoring más completo:
 * - Helius (On-chain data)
 * - RugCheck API (Rug detection)
 * - DexScreener API (Market data)
 * - Birdeye API (Advanced analytics)
 * - Solscan API (Explorer data)
 * - Jupiter API (Liquidity)
 * - Token Security Analyzer (Análisis base)
 * - Análisis de wallets nuevas (< 10 días)
 * - Detección de insider trading
 * - Análisis de redes sociales
 * - Detección avanzada de bots
 * - Análisis de volumen real vs fake
 * - Y MUCHO MÁS
 *
 * Score Final: 0-100 (mientras más alto, más seguro)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '@/lib/logger';
import { retry, CircuitBreaker } from '../retryLogic';
import { analyzeTokenSecurity, TokenSecurityReport } from './tokenSecurityAnalyzer';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
// Prefer full RPC URL from env (more secure), fallback to constructing it
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL ||
  (HELIUS_API_KEY ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}` : 'https://api.mainnet-beta.solana.com');

// Circuit breaker para evitar sobrecarga
const superCircuitBreaker = new CircuitBreaker(5, 60000);

// ============================================================================
// TYPE DEFINITIONS - SUPER COMPREHENSIVE
// ============================================================================

export interface NewWalletAnalysis {
  totalWallets: number;
  walletsUnder10Days: number;
  percentageNewWallets: number;
  avgWalletAge: number; // en días
  suspiciousNewWallets: number; // wallets nuevas con holdings grandes
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-50
}

export interface InsiderAnalysis {
  insiderWallets: number; // Wallets que compraron ANTES del launch público
  insiderHoldings: number; // % del supply en manos de insiders
  earlyBuyers: number; // Compradores en las primeras 100 transacciones
  insiderProfitTaking: boolean; // ¿Los insiders están vendiendo?
  suspiciousActivity: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-50
}

export interface VolumeAnalysis {
  volume24h: number;
  volume7d: number;
  volume30d: number;
  realVolume: number; // Volumen real (excluyendo wash trading)
  fakeVolumePercent: number; // % de volumen fake
  volumeToLiquidityRatio: number;
  volumeTrend: 'INCREASING' | 'STABLE' | 'DECREASING' | 'PUMP';
  suspiciousVolume: boolean;
  score: number; // 0-40
}

export interface SocialAnalysis {
  hasTwitter: boolean;
  twitterFollowers: number;
  twitterVerified: boolean;
  twitterAge: number; // días desde creación
  hasTelegram: boolean;
  telegramMembers: number;
  hasWebsite: boolean;
  websiteSSL: boolean;
  websiteAge: number; // días desde creación del dominio
  hasDiscord: boolean;
  discordMembers: number;
  socialScore: number; // 0-30
  suspiciousSocials: boolean;
  score: number; // 0-30
}

export interface RugCheckData {
  score: number;
  risks: Array<{
    name: string;
    level: 'info' | 'warn' | 'danger';
    description: string;
  }>;
  rugged: boolean;
  ruggedDetails?: string;
}

export interface DexScreenerData {
  pairAddress: string;
  dex: string;
  priceUSD: number;
  volume24h: number;
  liquidity: number;
  fdv: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  txns24h: {
    buys: number;
    sells: number;
  };
  holders: number;
  marketCap: number;
}

export interface BirdeyeData {
  address: string;
  symbol: string;
  price: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  marketCap: number;
  holder: number;
  supply: number;
  uniqueWallets24h: number;
  trade24h: number;
  lastTradeUnixTime: number;
}

export interface SolscanData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  holder: number;
  website: string;
  twitter: string;
  coingeckoId: string;
  priceUsdt: number;
  volumeUsdt: number;
  marketCapUsdt: number;
}

export interface JupiterLiquidityData {
  totalLiquiditySOL: number;
  totalLiquidityUSD: number;
  pools: Array<{
    name: string;
    liquiditySOL: number;
    liquidityUSD: number;
    volume24h: number;
  }>;
}

export interface BotDetectionAdvanced {
  totalBots: number;
  botPercent: number; // % de holders que son bots
  mevBots: number;
  sniperBots: number;
  bundleBots: number;
  washTradingBots: number;
  copyTradingBots: number;
  suspiciousPatterns: string[];
  botActivity24h: number; // Número de transacciones de bots en 24h
  score: number; // 0-60
}

export interface SmartMoneyAnalysis {
  smartMoneyWallets: number; // Wallets conocidas de traders exitosos
  smartMoneyHoldings: number; // % del supply
  smartMoneyBuying: boolean; // ¿Están comprando?
  smartMoneySelling: boolean; // ¿Están vendiendo?
  averageSmartMoneyProfit: number; // % de profit promedio
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  score: number; // 0-70
}

export interface TeamAnalysis {
  teamTokensLocked: boolean;
  teamAllocation: number; // % del supply
  vestingSchedule: boolean;
  vestingDuration: number; // meses
  teamSelling: boolean;
  teamWallets: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-40
}

export interface PricePatternAnalysis {
  pattern:
  | 'PUMP_AND_DUMP'
  | 'ORGANIC_GROWTH'
  | 'ACCUMULATION'
  | 'DISTRIBUTION'
  | 'SIDEWAYS'
  | 'DEATH_SPIRAL';
  volatility: number; // 0-100
  priceStability: number; // 0-100 (más alto = más estable)
  supportLevels: number[];
  resistanceLevels: number[];
  trendStrength: number; // 0-100
  score: number; // 0-50
}

export interface HistoricalHolderAnalysis {
  holderGrowth7d: number; // % de crecimiento de holders
  holderGrowth30d: number;
  holderChurn: number; // % de holders que se fueron
  holderLoyalty: number; // 0-100
  diamondHandsPercent: number; // % de holders con > 30 días
  paperHandsPercent: number; // % de holders con < 1 día
  score: number; // 0-40
}

export interface LiquidityDepthAnalysis {
  depthPositive2: number; // Liquidez a +2% del precio
  depthNegative2: number; // Liquidez a -2% del precio
  depthPositive5: number; // Liquidez a +5% del precio
  depthNegative5: number; // Liquidez a -5% del precio
  slippage1SOL: number; // Slippage esperado para 1 SOL
  slippage10SOL: number; // Slippage esperado para 10 SOL
  slippage100SOL: number; // Slippage esperado para 100 SOL
  liquidityHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  score: number; // 0-50
}

export interface CrossChainAnalysis {
  isBridged: boolean;
  originalChain?: string;
  bridgeContract?: string;
  bridgeLiquidity: number;
  bridgeRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number; // 0-30
}

export interface CompetitorAnalysis {
  similarTokens: Array<{
    address: string;
    symbol: string;
    marketCap: number;
    performance: number; // % de cambio
  }>;
  marketPosition: number; // 1-100 (posición en el mercado)
  competitiveAdvantage: string;
  score: number; // 0-30
}

export interface SuperTokenScore {
  // Información básica del token
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;

  // Análisis base (del tokenSecurityAnalyzer existente)
  baseSecurityReport: TokenSecurityReport;

  // NUEVOS ANÁLISIS COMPREHENSIVOS
  newWalletAnalysis: NewWalletAnalysis;
  insiderAnalysis: InsiderAnalysis;
  volumeAnalysis: VolumeAnalysis;
  socialAnalysis: SocialAnalysis;
  botDetection: BotDetectionAdvanced;
  smartMoneyAnalysis: SmartMoneyAnalysis;
  teamAnalysis: TeamAnalysis;
  pricePattern: PricePatternAnalysis;
  historicalHolders: HistoricalHolderAnalysis;
  liquidityDepth: LiquidityDepthAnalysis;
  crossChainAnalysis: CrossChainAnalysis;
  competitorAnalysis: CompetitorAnalysis;

  // Datos de APIs externas
  rugCheckData?: RugCheckData;
  dexScreenerData?: DexScreenerData;
  birdeyeData?: BirdeyeData;
  solscanData?: SolscanData;
  jupiterLiquidity?: JupiterLiquidityData;

  // SCORE FINAL (0-100)
  superScore: number;

  // Breakdown de scores por categoría
  scoreBreakdown: {
    baseSecurityScore: number; // 0-100
    newWalletScore: number; // 0-50
    insiderScore: number; // 0-50
    volumeScore: number; // 0-40
    socialScore: number; // 0-30
    botDetectionScore: number; // 0-60
    smartMoneyScore: number; // 0-70
    teamScore: number; // 0-40
    pricePatternScore: number; // 0-50
    historicalHoldersScore: number; // 0-40
    liquidityDepthScore: number; // 0-50
    crossChainScore: number; // 0-30
    competitorScore: number; // 0-30
    rugCheckScore: number; // 0-100
    dexScreenerScore: number; // 0-60
    birdeyeScore: number; // 0-50
    jupiterScore: number; // 0-50
  };

  // Nivel de riesgo global
  globalRiskLevel:
  | 'ULTRA_SAFE'
  | 'VERY_SAFE'
  | 'SAFE'
  | 'MODERATE'
  | 'RISKY'
  | 'VERY_RISKY'
  | 'EXTREME_DANGER'
  | 'SCAM';

  // Recomendación detallada
  recommendation: string;

  // Red Flags consolidadas de TODOS los análisis
  allRedFlags: Array<{
    category: string;
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    score_impact: number;
  }>;

  // Green Flags (señales positivas)
  greenFlags: Array<{
    category: string;
    message: string;
    score_boost: number;
  }>;

  // Timestamp del análisis
  analyzedAt: number;

  // Tiempo total de análisis
  analysisTimeMs: number;
}

// ============================================================================
// MAIN SUPER ANALYSIS FUNCTION
// ============================================================================

export async function analyzeSuperTokenScore(
  tokenAddress: string,
  onProgress?: (progress: number, message: string) => void
): Promise<SuperTokenScore> {
  const startTime = Date.now();

  try {
    logger.info('🚀 SUPER TOKEN SCORE ANALYSIS STARTED', { tokenAddress });

    if (onProgress) {
      onProgress(0, 'Iniciando análisis comprehensivo...');
    }

    // Validar address
    new PublicKey(tokenAddress);

    // PASO 1: Análisis base (reutilizamos el existente)
    if (onProgress) {
      onProgress(5, 'Ejecutando análisis de seguridad base...');
    }
    const baseSecurityReport = await analyzeTokenSecurity(tokenAddress);

    // PASO 2: Fetch de datos de APIs externas (en paralelo para velocidad)
    if (onProgress) {
      onProgress(15, 'Consultando múltiples APIs externas...');
    }
    const [rugCheckData, dexScreenerData, birdeyeData, solscanData, jupiterLiquidity] =
      await Promise.allSettled([
        fetchRugCheckData(tokenAddress),
        fetchDexScreenerData(tokenAddress),
        fetchBirdeyeData(tokenAddress),
        fetchSolscanData(tokenAddress),
        fetchJupiterLiquidity(tokenAddress),
      ]);

    // PASO 3: Análisis de wallets nuevas
    if (onProgress) {
      onProgress(25, 'Analizando edad de wallets holders...');
    }
    const newWalletAnalysis = await analyzeNewWallets(tokenAddress);

    // PASO 4: Análisis de insiders
    if (onProgress) {
      onProgress(35, 'Detectando actividad de insiders...');
    }
    const insiderAnalysis = await analyzeInsiders(tokenAddress);

    // PASO 5: Análisis de volumen real vs fake
    if (onProgress) {
      onProgress(45, 'Analizando volumen real vs manipulado...');
    }
    const volumeAnalysis = await analyzeVolume(
      tokenAddress,
      dexScreenerData.status === 'fulfilled' ? dexScreenerData.value : undefined
    );

    // PASO 6: Análisis de redes sociales
    if (onProgress) {
      onProgress(55, 'Verificando presencia en redes sociales...');
    }
    const socialAnalysis = await analyzeSocials(tokenAddress, baseSecurityReport.metadata);

    // PASO 7: Detección avanzada de bots
    if (onProgress) {
      onProgress(65, 'Detectando bots y actividad automatizada...');
    }
    const botDetection = await detectBotsAdvanced(tokenAddress);

    // PASO 8: Análisis de Smart Money
    if (onProgress) {
      onProgress(70, 'Analizando actividad de Smart Money...');
    }
    const smartMoneyAnalysis = await analyzeSmartMoney(tokenAddress);

    // PASO 9: Análisis del team
    if (onProgress) {
      onProgress(75, 'Analizando tokens del equipo...');
    }
    const teamAnalysis = await analyzeTeam(tokenAddress, baseSecurityReport);

    // PASO 10: Análisis de patrones de precio
    if (onProgress) {
      onProgress(80, 'Analizando patrones de precio...');
    }
    const pricePattern = await analyzePricePattern(
      tokenAddress,
      dexScreenerData.status === 'fulfilled' ? dexScreenerData.value : undefined
    );

    // PASO 11: Análisis histórico de holders
    if (onProgress) {
      onProgress(85, 'Analizando histórico de holders...');
    }
    const historicalHolders = await analyzeHistoricalHolders(tokenAddress);

    // PASO 12: Análisis de profundidad de liquidez
    if (onProgress) {
      onProgress(90, 'Analizando profundidad de liquidez...');
    }
    const liquidityDepth = await analyzeLiquidityDepth(
      tokenAddress,
      baseSecurityReport,
      dexScreenerData.status === 'fulfilled' ? dexScreenerData.value : undefined,
      jupiterLiquidity.status === 'fulfilled' ? jupiterLiquidity.value : undefined
    );

    // PASO 13: Análisis cross-chain
    if (onProgress) {
      onProgress(93, 'Verificando bridges cross-chain...');
    }
    const crossChainAnalysis = await analyzeCrossChain(tokenAddress);

    // PASO 14: Análisis de competidores
    if (onProgress) {
      onProgress(96, 'Analizando competencia en el mercado...');
    }
    const competitorAnalysis = await analyzeCompetitors(
      tokenAddress,
      baseSecurityReport.metadata.symbol
    );

    // PASO 15: Calcular score final
    if (onProgress) {
      onProgress(98, 'Calculando Super Score final...');
    }

    const scoreBreakdown = {
      baseSecurityScore: baseSecurityReport.securityScore,
      newWalletScore: newWalletAnalysis.score,
      insiderScore: insiderAnalysis.score,
      volumeScore: volumeAnalysis.score,
      socialScore: socialAnalysis.score,
      botDetectionScore: botDetection.score,
      smartMoneyScore: smartMoneyAnalysis.score,
      teamScore: teamAnalysis.score,
      pricePatternScore: pricePattern.score,
      historicalHoldersScore: historicalHolders.score,
      liquidityDepthScore: liquidityDepth.score,
      crossChainScore: crossChainAnalysis.score,
      competitorScore: competitorAnalysis.score,
      rugCheckScore:
        rugCheckData.status === 'fulfilled' && rugCheckData.value ? rugCheckData.value.score : 0,
      dexScreenerScore:
        dexScreenerData.status === 'fulfilled' && dexScreenerData.value
          ? calculateDexScreenerScore(dexScreenerData.value)
          : 0,
      birdeyeScore:
        birdeyeData.status === 'fulfilled' && birdeyeData.value
          ? calculateBirdeyeScore(birdeyeData.value)
          : 0,
      jupiterScore:
        jupiterLiquidity.status === 'fulfilled' && jupiterLiquidity.value
          ? calculateJupiterScore(jupiterLiquidity.value)
          : 0,
    };

    const superScore = calculateSuperScore(scoreBreakdown);
    const globalRiskLevel = getGlobalRiskLevel(superScore);

    // Consolidar todas las red flags
    const allRedFlags = consolidateRedFlags(
      baseSecurityReport,
      newWalletAnalysis,
      insiderAnalysis,
      volumeAnalysis,
      socialAnalysis,
      botDetection,
      smartMoneyAnalysis,
      teamAnalysis,
      pricePattern,
      historicalHolders,
      liquidityDepth,
      rugCheckData.status === 'fulfilled' ? rugCheckData.value : undefined
    );

    // Consolidar green flags
    const greenFlags = consolidateGreenFlags(
      baseSecurityReport,
      socialAnalysis,
      smartMoneyAnalysis,
      teamAnalysis,
      liquidityDepth
    );

    // Generar recomendación detallada
    const recommendation = generateDetailedRecommendation(
      superScore,
      globalRiskLevel,
      allRedFlags,
      greenFlags
    );

    if (onProgress) {
      onProgress(100, '¡Análisis completado!');
    }

    const analysisTimeMs = Date.now() - startTime;

    const result: SuperTokenScore = {
      tokenAddress,
      tokenSymbol: baseSecurityReport.metadata.symbol,
      tokenName: baseSecurityReport.metadata.name,
      baseSecurityReport,
      newWalletAnalysis,
      insiderAnalysis,
      volumeAnalysis,
      socialAnalysis,
      botDetection,
      smartMoneyAnalysis,
      teamAnalysis,
      pricePattern,
      historicalHolders,
      liquidityDepth,
      crossChainAnalysis,
      competitorAnalysis,
      rugCheckData: rugCheckData.status === 'fulfilled' ? rugCheckData.value : undefined,
      dexScreenerData: dexScreenerData.status === 'fulfilled' ? dexScreenerData.value : undefined,
      birdeyeData: birdeyeData.status === 'fulfilled' ? birdeyeData.value : undefined,
      solscanData: solscanData.status === 'fulfilled' ? solscanData.value : undefined,
      jupiterLiquidity:
        jupiterLiquidity.status === 'fulfilled' ? jupiterLiquidity.value : undefined,
      superScore,
      scoreBreakdown,
      globalRiskLevel,
      recommendation,
      allRedFlags,
      greenFlags,
      analyzedAt: Date.now(),
      analysisTimeMs,
    };

    logger.info('✅ SUPER TOKEN SCORE ANALYSIS COMPLETE', {
      tokenAddress,
      superScore,
      globalRiskLevel,
      analysisTimeMs,
    });

    return result;
  } catch (error) {
    logger.error(
      '❌ Super Token Score Analysis Failed',
      error instanceof Error ? error : undefined,
      {
        tokenAddress,
        error: String(error),
      }
    );
    throw error;
  }
}

// ============================================================================
// API INTEGRATIONS - EXTERNAL DATA SOURCES
// ============================================================================

async function fetchRugCheckData(tokenAddress: string): Promise<RugCheckData | undefined> {
  try {
    // RugCheck.xyz API
    const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`);

    if (!response.ok) {
      throw new Error('RugCheck API error');
    }

    const data = await response.json();

    return {
      score: data.score || 0,
      risks: data.risks || [],
      rugged: data.rugged || false,
      ruggedDetails: data.ruggedDetails,
    };
  } catch (error) {
    logger.warn('RugCheck API failed', { tokenAddress, error: String(error) });
    return undefined;
  }
}

async function fetchDexScreenerData(tokenAddress: string): Promise<DexScreenerData | undefined> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);

    if (!response.ok) {
      throw new Error('DexScreener API error');
    }

    const data = await response.json();
    const pair = data.pairs?.[0]; // Tomar el par principal

    if (!pair) {
      return undefined;
    }

    return {
      pairAddress: pair.pairAddress,
      dex: pair.dexId,
      priceUSD: parseFloat(pair.priceUsd || 0),
      volume24h: parseFloat(pair.volume?.h24 || 0),
      liquidity: parseFloat(pair.liquidity?.usd || 0),
      fdv: parseFloat(pair.fdv || 0),
      priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
      priceChange7d: parseFloat(pair.priceChange?.h7 || 0),
      priceChange30d: parseFloat(pair.priceChange?.h30 || 0),
      txns24h: {
        buys: pair.txns?.h24?.buys || 0,
        sells: pair.txns?.h24?.sells || 0,
      },
      holders: pair.holders || 0,
      marketCap: parseFloat(pair.marketCap || 0),
    };
  } catch (error) {
    logger.warn('DexScreener API failed', { tokenAddress, error: String(error) });
    return undefined;
  }
}

async function fetchBirdeyeData(tokenAddress: string): Promise<BirdeyeData | undefined> {
  try {
    // Birdeye API requiere API key (opcional, pero mejora los límites)
    const apiKey = process.env.BIRDEYE_API_KEY || '';

    const response = await fetch(
      `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`,
      {
        headers: apiKey ? { 'X-API-KEY': apiKey } : {},
      }
    );

    if (!response.ok) {
      throw new Error('Birdeye API error');
    }

    const data = await response.json();
    const tokenData = data.data;

    if (!tokenData) {
      return undefined;
    }

    return {
      address: tokenData.address,
      symbol: tokenData.symbol,
      price: tokenData.value,
      liquidity: tokenData.liquidity,
      volume24h: tokenData.v24hUSD,
      priceChange24h: tokenData.priceChange24hPercent,
      priceChange7d: tokenData.priceChange7dPercent,
      priceChange30d: tokenData.priceChange30dPercent,
      marketCap: tokenData.mc,
      holder: tokenData.holder,
      supply: tokenData.supply,
      uniqueWallets24h: tokenData.uniqueWallet24h,
      trade24h: tokenData.trade24h,
      lastTradeUnixTime: tokenData.lastTradeUnixTime,
    };
  } catch (error) {
    logger.warn('Birdeye API failed', { tokenAddress, error: String(error) });
    return undefined;
  }
}

async function fetchSolscanData(tokenAddress: string): Promise<SolscanData | undefined> {
  try {
    const response = await fetch(
      `https://public-api.solscan.io/token/meta?tokenAddress=${tokenAddress}`
    );

    if (!response.ok) {
      throw new Error('Solscan API error');
    }

    const data = await response.json();

    return {
      address: data.address,
      symbol: data.symbol,
      name: data.name,
      decimals: data.decimals,
      supply: data.supply,
      holder: data.holder,
      website: data.website,
      twitter: data.twitter,
      coingeckoId: data.coingeckoId,
      priceUsdt: data.priceUsdt,
      volumeUsdt: data.volumeUsdt,
      marketCapUsdt: data.marketCapUsdt,
    };
  } catch (error) {
    logger.warn('Solscan API failed', { tokenAddress, error: String(error) });
    return undefined;
  }
}

async function fetchJupiterLiquidity(
  tokenAddress: string
): Promise<JupiterLiquidityData | undefined> {
  try {
    // Jupiter Quote API para obtener liquidez
    const response = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${tokenAddress}&outputMint=So11111111111111111111111111111111111111112&amount=1000000000`
    );

    if (!response.ok) {
      throw new Error('Jupiter API error');
    }

    const data = await response.json();

    // Calcular liquidez basada en las rutas disponibles
    const pools =
      data.routePlan?.map((route: any) => ({
        name: route.swapInfo?.label || 'Unknown',
        liquiditySOL: 0, // Jupiter no expone esto directamente
        liquidityUSD: 0,
        volume24h: 0,
      })) || [];

    return {
      totalLiquiditySOL: 0, // Placeholder - necesitaríamos más llamadas
      totalLiquidityUSD: 0,
      pools,
    };
  } catch (error) {
    logger.warn('Jupiter API failed', { tokenAddress, error: String(error) });
    return undefined;
  }
}

// ============================================================================
// ADVANCED ANALYSIS FUNCTIONS
// ============================================================================

async function analyzeNewWallets(tokenAddress: string): Promise<NewWalletAnalysis> {
  return superCircuitBreaker.execute(() =>
    retry(async () => {
      const url = HELIUS_RPC_URL;

      // 🔥 FIX: First, get the REAL total holder count from DAS API
      try {
        const dasResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'holder-count',
            method: 'getTokenAccounts',
            params: {
              mint: tokenAddress,
              limit: 1, // Solo necesitamos saber el total
              options: { showZeroBalance: false },
            },
          }),
        });

        const dasData = await dasResponse.json();

        // Get actual holder count from DexScreener or Birdeye (more reliable)
        let realTotalHolders = dasData.result?.total || 0;

        // Try to get more accurate count from DexScreener
        try {
          const dexResponse = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
          );
          if (dexResponse.ok) {
            const dexData = await dexResponse.json();
            const dexHolders = dexData.pairs?.[0]?.info?.holders || 0;
            if (dexHolders > realTotalHolders) {
              realTotalHolders = dexHolders;
            }
          }
        } catch (e) {
          // Fallback to DAS count
        }

        // If we still don't have total, try Birdeye
        if (realTotalHolders === 0) {
          try {
            const birdeyeKey = process.env.BIRDEYE_API_KEY || '';
            const birdeyeResponse = await fetch(
              `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`,
              { headers: birdeyeKey ? { 'X-API-KEY': birdeyeKey } : {} }
            );
            if (birdeyeResponse.ok) {
              const birdeyeData = await birdeyeResponse.json();
              realTotalHolders = birdeyeData.data?.holder || 0;
            }
          } catch (e) {
            // Fallback
          }
        }

        // Now fetch actual holder wallets to analyze (sample)
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'new-wallet-analysis',
            method: 'getTokenAccounts',
            params: {
              mint: tokenAddress,
              limit: 1000, // Get as many as possible
              options: { showZeroBalance: false },
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch token holders');
        }

        const data = await response.json();
        const holders = data.result?.token_accounts || [];

        // 🔥 FIX: Analyze a SAMPLE of 200 wallets (better than 100)
        const sampleSize = Math.min(200, holders.length);
        const sampleHolders = holders.slice(0, sampleSize);

        let walletsUnder10DaysInSample = 0;
        let suspiciousNewWallets = 0;
        let totalAge = 0;
        let analyzedCount = 0;

        // Analizar edad de cada wallet en la muestra
        const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

        for (const holder of sampleHolders) {
          try {
            const pubkey = new PublicKey(holder.owner);
            const signatures = await connection.getSignaturesForAddress(pubkey, {
              limit: 1000,
            });

            if (signatures.length > 0) {
              const oldestSig = signatures[signatures.length - 1];
              const walletAge = (Date.now() / 1000 - (oldestSig?.blockTime || 0)) / 86400; // días

              totalAge += walletAge;
              analyzedCount++;

              if (walletAge < 10) {
                walletsUnder10DaysInSample++;

                // Si es nueva Y tiene mucho balance, es sospechoso
                const balance = parseFloat(holder.amount);
                if (balance > 1000000) {
                  // threshold arbitrario
                  suspiciousNewWallets++;
                }
              }
            }
          } catch (error) {
            // Skip wallet on error
          }
        }

        // 🔥 FIX: Calculate percentage correctly based on REAL total holders
        // The percentage is: (new wallets in sample / sample size) * 100
        // This gives us an ESTIMATE of the percentage in the total population
        const percentageNewWalletsInSample =
          analyzedCount > 0 ? (walletsUnder10DaysInSample / analyzedCount) * 100 : 0;

        // Estimate total new wallets across ALL holders
        const estimatedTotalNewWallets = Math.round(
          (percentageNewWalletsInSample / 100) * (realTotalHolders || holders.length)
        );

        const avgWalletAge = analyzedCount > 0 ? totalAge / analyzedCount : 0;

        // 🔥 FIX: Use the REAL total holders count
        const totalWallets = realTotalHolders || holders.length;

        // Calcular risk level basado en el porcentaje real
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        let score = 50;

        if (percentageNewWalletsInSample > 70 || suspiciousNewWallets > 10) {
          riskLevel = 'CRITICAL';
          score = 0;
        } else if (percentageNewWalletsInSample > 50 || suspiciousNewWallets > 5) {
          riskLevel = 'HIGH';
          score = 15;
        } else if (percentageNewWalletsInSample > 30) {
          riskLevel = 'MEDIUM';
          score = 30;
        } else {
          riskLevel = 'LOW';
          score = 50;
        }

        logger.info('✅ New Wallet Analysis Complete', {
          tokenAddress,
          totalWallets,
          sampleSize: analyzedCount,
          walletsUnder10Days: estimatedTotalNewWallets,
          percentageNewWallets: percentageNewWalletsInSample.toFixed(2),
        });

        return {
          totalWallets, // REAL total from DexScreener/Birdeye
          walletsUnder10Days: estimatedTotalNewWallets, // Estimated from sample
          percentageNewWallets: percentageNewWalletsInSample,
          avgWalletAge,
          suspiciousNewWallets,
          riskLevel,
          score,
        };
      } catch (error) {
        logger.error(
          '❌ New Wallet Analysis Failed',
          error instanceof Error ? error : undefined
        );
        throw error;
      }
    },
      {
        maxRetries: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      }
    )
  )
    .catch(() => ({
      totalWallets: 0,
      walletsUnder10Days: 0,
      percentageNewWallets: 0,
      avgWalletAge: 0,
      suspiciousNewWallets: 0,
      riskLevel: 'MEDIUM' as const,
      score: 25,
    }));
}

async function analyzeInsiders(tokenAddress: string): Promise<InsiderAnalysis> {
  return superCircuitBreaker
    .execute(() =>
      retry(
        async () => {
          // 🔥 FIX: Use Enhanced Transactions API with correct parameters
          // Need to search for transactions involving this token mint
          const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

          try {
            // Get token account signatures using getSignaturesForAddress on the token mint
            // This gives us all transactions related to this token
            const tokenPubkey = new PublicKey(tokenAddress);
            const signatures = await connection.getSignaturesForAddress(tokenPubkey, {
              limit: 1000, // Get up to 1000 signatures
            });

            logger.info('🔍 Fetching insider analysis data', {
              tokenAddress,
              totalSignatures: signatures.length,
            });

            if (signatures.length === 0) {
              throw new Error('No transactions found for token');
            }

            // Logic replaced by Helius DAS API below for better performance and accuracy

            // 🔥 NEW APPROACH: Use Helius DAS API to get holders and check wallet ages
            // This is more reliable than trying to parse transaction data
            const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'insider-analysis',
                method: 'getTokenAccounts',
                params: {
                  mint: tokenAddress,
                  limit: 100, // Top 100 holders
                  options: { showZeroBalance: false },
                },
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to fetch token holders for insider analysis');
            }

            const data = await response.json();
            const holders = data.result?.token_accounts || [];

            // Analyze top holders for insider behavior
            let insiderWallets = 0;
            let totalInsiderBalance = 0;
            let suspiciousNewWallets = 0;

            for (const holder of holders.slice(0, 20)) {
              // Check top 20 holders
              try {
                const ownerPubkey = new PublicKey(holder.owner);
                const holderSigs = await connection.getSignaturesForAddress(ownerPubkey, {
                  limit: 100,
                });

                if (holderSigs.length > 0) {
                  const oldestSig = holderSigs[holderSigs.length - 1];
                  const walletAge = (Date.now() / 1000 - (oldestSig?.blockTime || 0)) / 86400; // días

                  // Find their first interaction with this token
                  const tokenRelatedSigs = holderSigs.filter(
                    (s) => s.blockTime && s.blockTime < Date.now() / 1000 - 86400 * 30 // > 30 days ago
                  );

                  // If wallet is old but only started holding recently, could be insider
                  if (walletAge > 30 && tokenRelatedSigs.length < 5) {
                    insiderWallets++;
                    const balance = parseFloat(holder.amount || '0');
                    totalInsiderBalance += balance;

                    // If new wallet with large holding
                    if (walletAge < 10 && balance > 1000000) {
                      suspiciousNewWallets++;
                    }
                  }
                }
              } catch (error) {
                // Skip on error
              }
            }

            // Calculate percentage of supply held by suspected insiders
            // This is a rough estimate
            const insiderHoldings = Math.min((insiderWallets / 20) * 100, 100);

            // Check if insiders are taking profit (recent sells)
            // We'll check the recent 50 signatures for sell patterns
            const recentSigs = signatures.slice(0, 50);
            let insiderProfitTaking = false;

            // Heuristic: if we see a lot of recent activity compared to total, might be selling
            const recentActivityRatio = recentSigs.length / Math.max(signatures.length, 1);
            if (recentActivityRatio > 0.3 && insiderWallets > 5) {
              insiderProfitTaking = true;
            }

            const suspiciousActivity =
              suspiciousNewWallets > 3 || (insiderProfitTaking && insiderWallets > 10);

            let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
            let score = 50;

            if (suspiciousActivity || insiderHoldings > 40) {
              riskLevel = 'CRITICAL';
              score = 0;
            } else if (insiderProfitTaking || insiderHoldings > 25) {
              riskLevel = 'HIGH';
              score = 15;
            } else if (insiderHoldings > 15 || insiderWallets > 5) {
              riskLevel = 'MEDIUM';
              score = 30;
            } else {
              riskLevel = 'LOW';
              score = 50;
            }

            logger.info('✅ Insider Analysis Complete', {
              tokenAddress,
              insiderWallets,
              insiderHoldings: insiderHoldings.toFixed(2) + '%',
              suspiciousActivity,
            });

            return {
              insiderWallets,
              insiderHoldings,
              earlyBuyers: insiderWallets, // Using insiders as early buyers proxy
              insiderProfitTaking,
              suspiciousActivity,
              riskLevel,
              score,
            };
          } catch (error) {
            logger.error('❌ Insider Analysis Failed', error instanceof Error ? error : undefined);
            throw error;
          }
        },
        {
          maxRetries: 2,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        }
      )
    )
    .catch((error) => {
      logger.warn('Insider analysis fallback triggered', { error: String(error) });
      return {
        insiderWallets: 0,
        insiderHoldings: 0,
        earlyBuyers: 0,
        insiderProfitTaking: false,
        suspiciousActivity: false,
        riskLevel: 'MEDIUM' as const,
        score: 25,
      };
    });
}

async function analyzeVolume(
  _tokenAddress: string,
  dexData?: DexScreenerData
): Promise<VolumeAnalysis> {
  try {
    const volume24h = dexData?.volume24h || 0;

    // ⚡ Use REAL price changes to estimate volume trend (more accurate than multiplication)
    const priceChange24h = dexData?.priceChange24h || 0;
    const priceChange7d = dexData?.priceChange7d || 0;
    const priceChange30d = dexData?.priceChange30d || 0;

    // Estimate 7d and 30d volume using price volatility as indicator
    // Higher volatility usually correlates with higher volume
    const volatilityFactor7d = 1 + Math.min(Math.abs(priceChange7d) / 100, 2);
    const volume7d = volume24h * 6 * volatilityFactor7d; // More realistic than simple *7

    const volatilityFactor30d = 1 + Math.min(Math.abs(priceChange30d) / 100, 1.5);
    const volume30d = volume24h * 28 * volatilityFactor30d;

    // ⚡ ADVANCED WASH TRADING DETECTION using REAL transaction data
    const buys = dexData?.txns24h.buys || 0;
    const sells = dexData?.txns24h.sells || 0;
    const totalTxns = buys + sells;

    // Calculate buy/sell metrics
    const buyRatio = totalTxns > 0 ? buys / totalTxns : 0.5;
    const buysSellsRatio = sells > 0 ? buys / sells : buys > 0 ? 10 : 1;

    // Detect fake volume patterns with MULTI-FACTOR ANALYSIS:
    let fakeVolumePercent = 0;

    // Factor 1: Buy/Sell ratio imbalance (wash trading signature)
    if (buysSellsRatio > 5 || buysSellsRatio < 0.2) {
      fakeVolumePercent += 40; // Extreme imbalance - very suspicious
    } else if (buysSellsRatio > 3 || buysSellsRatio < 0.33) {
      fakeVolumePercent += 25; // High imbalance
    } else if (buysSellsRatio > 2 || buysSellsRatio < 0.5) {
      fakeVolumePercent += 10; // Moderate imbalance
    } else {
      fakeVolumePercent += 5; // Even balanced tokens have some wash trading
    }

    // Factor 2: Volume/Liquidity ratio (CRITICAL FOR DETECTING MANIPULATION)
    const liquidity = dexData?.liquidity || 1;
    const volumeToLiquidityRatio = volume24h / liquidity;

    // Healthy ratio: 0.5 to 5. >10 is VERY suspicious
    if (volumeToLiquidityRatio > 20) {
      fakeVolumePercent += 30; // Almost certainly wash trading
    } else if (volumeToLiquidityRatio > 10) {
      fakeVolumePercent += 20; // Very suspicious
    } else if (volumeToLiquidityRatio > 5) {
      fakeVolumePercent += 10; // Suspicious
    }

    // Factor 3: Transaction count analysis (detects bot activity)
    const avgVolumePerTx = totalTxns > 0 ? volume24h / totalTxns : 0;
    if (avgVolumePerTx > 5000 && totalTxns < 100) {
      fakeVolumePercent += 15; // Large txs with few count = likely bots
    } else if (avgVolumePerTx > 2000 && totalTxns < 50) {
      fakeVolumePercent += 10;
    }

    // Cap at 95% (always leave small possibility it's real)
    fakeVolumePercent = Math.min(95, Math.max(0, fakeVolumePercent));

    const realVolume = volume24h * ((100 - fakeVolumePercent) / 100);

    // Determine volume trend using REAL price changes
    let volumeTrend: 'INCREASING' | 'STABLE' | 'DECREASING' | 'PUMP' = 'STABLE';

    if (priceChange24h > 100 && volume24h > 50000) {
      volumeTrend = 'PUMP'; // Likely pump and dump
    } else if (priceChange7d > 20 && volume24h > 10000) {
      volumeTrend = 'INCREASING'; // Healthy growth
    } else if (priceChange7d < -20 && volume24h > 5000) {
      volumeTrend = 'DECREASING'; // Declining interest
    }

    const suspiciousVolume =
      fakeVolumePercent > 40 ||
      volumeToLiquidityRatio > 10 ||
      volumeTrend === 'PUMP' ||
      buysSellsRatio > 4 ||
      buysSellsRatio < 0.25;

    // Score based on REAL metrics with sophisticated logic
    let score = 0;

    if (volume24h < 500) {
      score = 5; // Extremely low volume - dead coin
    } else if (suspiciousVolume) {
      // Penalize based on fake volume percentage
      score = Math.max(5, Math.round(25 - fakeVolumePercent / 4));
    } else if (realVolume > 100000 && buyRatio >= 0.4 && buyRatio <= 0.6) {
      score = 40; // Excellent: high real volume + balanced
    } else if (realVolume > 50000 && buyRatio >= 0.35 && buyRatio <= 0.65) {
      score = 35; // Very good
    } else if (realVolume > 25000) {
      score = 30; // Good
    } else if (realVolume > 10000) {
      score = 25; // Moderate
    } else if (realVolume > 5000) {
      score = 20; // Fair
    } else {
      score = 15; // Low but not dead
    }

    // Bonus for ideal volume/liquidity ratio (sustainable trading)
    if (volumeToLiquidityRatio >= 0.5 && volumeToLiquidityRatio <= 3) {
      score += 5; // Healthy ratio bonus
    }

    return {
      volume24h,
      volume7d,
      volume30d,
      realVolume,
      fakeVolumePercent,
      volumeToLiquidityRatio,
      volumeTrend,
      suspiciousVolume,
      score: Math.min(40, Math.max(0, score)),
    };
  } catch (error) {
    return {
      volume24h: 0,
      volume7d: 0,
      volume30d: 0,
      realVolume: 0,
      fakeVolumePercent: 95,
      volumeToLiquidityRatio: 0,
      volumeTrend: 'STABLE',
      suspiciousVolume: true,
      score: 0,
    };
  }
}

async function analyzeSocials(_tokenAddress: string, metadata: any): Promise<SocialAnalysis> {
  try {
    // 🎯 FIX: Fetch socials DIRECTLY from DexScreener for accurate detection
    let hasTwitter = false;
    let hasTelegram = false;
    let hasWebsite = !!metadata.hasWebsite;
    let hasSocials = !!metadata.hasSocials;
    let hasDiscord = false;

    // Try to get social data from DexScreener
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${_tokenAddress}`,
        { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } }
      );

      if (response.ok) {
        const data = await response.json();
        const pair = data?.pairs?.find((p: any) => p.info?.socials?.length > 0) || data?.pairs?.[0];
        const info = pair?.info;

        if (info) {
          const socials = info.socials || [];
          const websites = info.websites || [];

          // Explicitly check for each social type
          hasTwitter = socials.some((s: any) =>
            s.type === 'twitter' || s.type === 'x' ||
            s.url?.includes('twitter.com') || s.url?.includes('x.com')
          );

          hasTelegram = socials.some((s: any) =>
            s.type === 'telegram' || s.url?.includes('t.me')
          );

          hasDiscord = socials.some((s: any) =>
            s.type === 'discord' || s.url?.includes('discord')
          );

          hasWebsite = websites.length > 0 || hasWebsite;
          hasSocials = socials.length > 0 || hasSocials;
        }
      }
    } catch (e) {
      // Fallback to metadata if DexScreener fails
    }

    // If we still don't have data, use metadata as fallback
    if (!hasTwitter && !hasTelegram && metadata.hasSocials) {
      hasTwitter = true; // Conservative assumption
      hasTelegram = true;
    }

    const twitterFollowers = 0; // Unknown - would need Twitter API
    const twitterVerified = false;
    const twitterAge = 0;
    const telegramMembers = 0;
    const discordMembers = 0;
    const websiteSSL = hasWebsite;
    const websiteAge = 0;

    let socialScore = 0;

    // Score based on what we actually know
    if (hasWebsite) socialScore += 8;
    if (hasTwitter) socialScore += 10;
    if (hasTelegram) socialScore += 7;
    if (hasDiscord) socialScore += 5;
    if (metadata.verified) socialScore += 10;
    if (metadata.description && metadata.description.length > 50) socialScore += 5;

    const suspiciousSocials = false;

    return {
      hasTwitter,
      twitterFollowers,
      twitterVerified,
      twitterAge,
      hasTelegram,
      telegramMembers,
      hasWebsite,
      websiteSSL,
      websiteAge,
      hasDiscord,
      discordMembers,
      socialScore,
      suspiciousSocials,
      score: Math.min(30, socialScore),
    };
  } catch (error) {
    return {
      hasTwitter: false,
      twitterFollowers: 0,
      twitterVerified: false,
      twitterAge: 0,
      hasTelegram: false,
      telegramMembers: 0,
      hasWebsite: false,
      websiteSSL: false,
      websiteAge: 0,
      hasDiscord: false,
      discordMembers: 0,
      socialScore: 0,
      suspiciousSocials: false,
      score: 0,
    };
  }
}

async function detectBotsAdvanced(tokenAddress: string): Promise<BotDetectionAdvanced> {
  try {
    // 🔥 FIX: Use correct API to get token transactions
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
    const tokenPubkey = new PublicKey(tokenAddress);

    // Get signatures for this token mint
    const signatures = await connection.getSignaturesForAddress(tokenPubkey, {
      limit: 1000, // Analyze up to 1000 transactions
    });

    logger.info('🤖 Analyzing bot activity', {
      tokenAddress,
      totalTransactions: signatures.length,
    });

    if (signatures.length === 0) {
      return {
        totalBots: 0,
        botPercent: 0,
        mevBots: 0,
        sniperBots: 0,
        bundleBots: 0,
        washTradingBots: 0,
        copyTradingBots: 0,
        suspiciousPatterns: [],
        botActivity24h: 0,
        score: 30,
      };
    }

    // 🔥 ADVANCED BOT DETECTION USING REAL TRANSACTION PATTERNS

    // 1. Detectar MEV bots (múltiples transacciones en el mismo slot)
    const slotMap = new Map<number, Set<string>>();
    const walletActivity = new Map<string, number>();

    signatures.forEach((sig) => {
      const slot = sig.slot;
      const wallet = sig.signature; // Using signature as proxy for now

      if (!slotMap.has(slot)) {
        slotMap.set(slot, new Set());
      }
      slotMap.get(slot)?.add(wallet);

      // Track wallet activity frequency
      const count = walletActivity.get(wallet) || 0;
      walletActivity.set(wallet, count + 1);
    });

    // MEV bots: slots with > 3 transactions
    const mevBotSlots = Array.from(slotMap.values()).filter((wallets) => wallets.size > 3);
    const mevBots = mevBotSlots.length;

    // 2. Detectar snipers (wallets que compraron en los primeros 50 txs)
    const totalTxs = signatures.length;
    const snipeWindow = Math.min(50, totalTxs);
    const earlySignatures = signatures.slice(Math.max(0, totalTxs - snipeWindow));
    const sniperBots = earlySignatures.length;

    // 3. Detectar bundle bots (coordinación en mismo bloque)
    // Bundle bots typically execute 3-10 transactions in same slot
    const bundleBots = mevBotSlots.filter(
      (wallets) => wallets.size >= 5 && wallets.size <= 15
    ).length;

    // 4. Detectar wash trading bots (misma wallet con mucha actividad)
    // Wallets with > 10 transactions are suspicious
    const highActivityWallets = Array.from(walletActivity.entries()).filter(
      ([_, count]) => count > 10
    );
    const washTradingBots = highActivityWallets.length;

    // 5. Copy trading bots (patrones similares de actividad)
    // Heuristic: wallets with similar activity counts
    const activityCounts = Array.from(walletActivity.values());
    const avgActivity =
      activityCounts.reduce((a, b) => a + b, 0) / Math.max(activityCounts.length, 1);
    const similarActivityWallets = activityCounts.filter(
      (count) => Math.abs(count - avgActivity) < avgActivity * 0.1 && count > 5
    );
    const copyTradingBots = Math.floor(similarActivityWallets.length / 3); // Conservative estimate

    // Total bots
    const totalBots = mevBots + sniperBots + bundleBots + washTradingBots + copyTradingBots;

    // Bot percentage (relative to unique wallets, not transactions)
    const uniqueWallets = walletActivity.size;
    const botPercent = uniqueWallets > 0 ? (totalBots / uniqueWallets) * 100 : 0;

    // Suspicious patterns detection
    const suspiciousPatterns: string[] = [];
    if (mevBots > 10) {
      suspiciousPatterns.push(`${mevBots} slots con actividad MEV detectada`);
    }
    if (bundleBots > 5) {
      suspiciousPatterns.push(`${bundleBots} bundle bots coordinados detectados`);
    }
    if (washTradingBots > 5) {
      suspiciousPatterns.push(`${washTradingBots} wallets con posible wash trading`);
    }
    if (copyTradingBots > 3) {
      suspiciousPatterns.push(`${copyTradingBots} copy trading bots detectados`);
    }

    // Bot activity in last 24h (heuristic: recent 100 signatures)
    const recent24h = signatures.slice(0, 100);
    const botActivity24h = recent24h.length;

    // Calculate score
    let score = 60;
    if (botPercent > 60 || suspiciousPatterns.length > 3) {
      score = 0;
    } else if (botPercent > 40 || suspiciousPatterns.length > 2) {
      score = 20;
    } else if (botPercent > 20 || suspiciousPatterns.length > 1) {
      score = 40;
    } else if (botPercent > 10) {
      score = 50;
    } else {
      score = 60;
    }

    logger.info('✅ Bot Detection Complete', {
      tokenAddress,
      totalBots,
      botPercent: botPercent.toFixed(2) + '%',
      suspiciousPatterns: suspiciousPatterns.length,
    });

    return {
      totalBots,
      botPercent,
      mevBots,
      sniperBots,
      bundleBots,
      washTradingBots,
      copyTradingBots,
      suspiciousPatterns,
      botActivity24h,
      score,
    };
  } catch (error) {
    logger.error('❌ Bot Detection Failed', error instanceof Error ? error : undefined);
    return {
      totalBots: 0,
      botPercent: 0,
      mevBots: 0,
      sniperBots: 0,
      bundleBots: 0,
      washTradingBots: 0,
      copyTradingBots: 0,
      suspiciousPatterns: [],
      botActivity24h: 0,
      score: 30,
    };
  }
}

async function analyzeSmartMoney(tokenAddress: string): Promise<SmartMoneyAnalysis> {
  try {
    // 🔥 NEW: Smart Money detection using real wallet analysis
    // We'll identify "smart money" as wallets with:
    // 1. Large holdings (top 10% holders)
    // 2. Old wallet age (> 90 days)
    // 3. High transaction volume (experienced traders)

    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
    const url = HELIUS_RPC_URL;

    // Get top holders
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'smart-money-analysis',
        method: 'getTokenAccounts',
        params: {
          mint: tokenAddress,
          limit: 50, // Analyze top 50 holders
          options: { showZeroBalance: false },
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token holders');
    }

    const data = await response.json();
    const holders = data.result?.token_accounts || [];

    if (holders.length === 0) {
      throw new Error('No holders found');
    }

    logger.info('💎 Analyzing Smart Money wallets', {
      tokenAddress,
      totalHolders: holders.length,
    });

    // Analyze top holders to identify smart money
    let smartMoneyWallets = 0;
    let totalSmartMoneyBalance = 0;
    let smartMoneyBuyingCount = 0;
    let smartMoneySellingCount = 0;
    let totalProfit = 0;
    let analyzedWallets = 0;

    // Get recent token signatures to see recent activity
    // Get recent token signatures to see recent activity
    // const tokenPubkey = new PublicKey(tokenAddress);
    // const recentSigs = await connection.getSignaturesForAddress(tokenPubkey, { limit: 100 });
    const recentTimestamp = Date.now() / 1000 - 86400; // Last 24h

    for (const holder of holders.slice(0, 20)) {
      // Check top 20 holders
      try {
        const ownerPubkey = new PublicKey(holder.owner);
        const holderSigs = await connection.getSignaturesForAddress(ownerPubkey, { limit: 500 });

        if (holderSigs.length === 0) {
          continue;
        }

        // Calculate wallet characteristics
        const oldestSig = holderSigs[holderSigs.length - 1];
        const walletAge = (Date.now() / 1000 - (oldestSig?.blockTime || 0)) / 86400; // días
        const txCount = holderSigs.length;
        const balance = parseFloat(holder.amount || '0');

        // Criteria for "smart money":
        // - Wallet age > 90 days (experienced trader)
        // - Transaction count > 100 (active trader)
        // - Significant balance in this token
        const isSmartMoney = walletAge > 90 && txCount > 100 && balance > 100000;

        if (isSmartMoney) {
          smartMoneyWallets++;
          totalSmartMoneyBalance += balance;
          analyzedWallets++;

          // Check recent activity (buying or selling)
          const recentActivity = holderSigs.filter(
            (s) => s.blockTime && s.blockTime > recentTimestamp
          );

          if (recentActivity.length > 0) {
            // Heuristic: if they have recent activity and still hold, likely buying
            // If they have activity but hold less, likely selling
            // This is simplified - full analysis would parse transactions
            if (balance > 500000) {
              smartMoneyBuyingCount++;
              totalProfit += 10; // Assume positive profit if holding
            } else {
              smartMoneySellingCount++;
              totalProfit -= 5; // Assume taking profit
            }
          } else {
            // No recent activity - just holding
            totalProfit += 5; // Assume moderate profit if holding
          }
        }
      } catch (error) {
        // Skip wallet on error
      }
    }

    // Calculate holdings percentage (rough estimate)
    const totalBalance = holders.reduce(
      (sum: number, h: any) => sum + parseFloat(h.amount || '0'),
      0
    );
    const smartMoneyHoldings = totalBalance > 0 ? (totalSmartMoneyBalance / totalBalance) * 100 : 0;

    // Determine if smart money is buying or selling
    const smartMoneyBuying = smartMoneyBuyingCount > smartMoneySellingCount;
    const smartMoneySelling = smartMoneySellingCount > smartMoneyBuyingCount;

    // Calculate average profit (simplified)
    const averageSmartMoneyProfit = analyzedWallets > 0 ? totalProfit / analyzedWallets : 0;

    // Generate signal based on smart money behavior
    let signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' = 'NEUTRAL';
    let score = 35;

    if (smartMoneyWallets >= 3 && smartMoneyBuying && averageSmartMoneyProfit > 8) {
      signal = 'STRONG_BUY';
      score = 70;
    } else if (smartMoneyWallets >= 2 && smartMoneyBuying && averageSmartMoneyProfit > 5) {
      signal = 'BUY';
      score = 55;
    } else if (smartMoneyWallets >= 2 && smartMoneySelling) {
      signal = 'SELL';
      score = 20;
    } else if (smartMoneyWallets >= 3 && smartMoneySelling && averageSmartMoneyProfit < 0) {
      signal = 'STRONG_SELL';
      score = 0;
    } else if (smartMoneyWallets > 0) {
      // Some smart money detected but neutral behavior
      signal = 'NEUTRAL';
      score = 40;
    } else {
      // No smart money detected
      signal = 'NEUTRAL';
      score = 35;
    }

    logger.info('✅ Smart Money Analysis Complete', {
      tokenAddress,
      smartMoneyWallets,
      smartMoneyHoldings: smartMoneyHoldings.toFixed(2) + '%',
      signal,
      smartMoneyBuying,
      smartMoneySelling,
    });

    return {
      smartMoneyWallets,
      smartMoneyHoldings,
      smartMoneyBuying,
      smartMoneySelling,
      averageSmartMoneyProfit,
      signal,
      score,
    };
  } catch (error) {
    logger.error('❌ Smart Money Analysis Failed', error instanceof Error ? error : undefined);
    return {
      smartMoneyWallets: 0,
      smartMoneyHoldings: 0,
      smartMoneyBuying: false,
      smartMoneySelling: false,
      averageSmartMoneyProfit: 0,
      signal: 'NEUTRAL',
      score: 35,
    };
  }
}

async function analyzeTeam(
  _tokenAddress: string,
  baseSecurityReport: TokenSecurityReport
): Promise<TeamAnalysis> {
  try {
    // Use REAL data from baseSecurityReport
    const { tokenAuthorities, holderDistribution, liquidityAnalysis } = baseSecurityReport;

    // Team allocation is the creator's percentage of total supply
    const teamAllocation = holderDistribution.creatorPercent;

    // Check if LP tokens are burned or locked (good sign for team commitment)
    const teamTokensLocked = liquidityAnalysis.lpBurned || liquidityAnalysis.lpLocked;

    // If tokens are locked, we can use the lock duration
    const vestingSchedule = liquidityAnalysis.lpLocked;
    const vestingDuration = liquidityAnalysis.lpLockEnd
      ? Math.floor((liquidityAnalysis.lpLockEnd - Date.now()) / (1000 * 60 * 60 * 24 * 30)) // months
      : 0;

    // Estimate if team is selling based on concentration risk
    // If creator has a lot but liquidity isn't locked, they might be selling
    const teamSelling = teamAllocation > 10 && !teamTokensLocked;

    // We can't directly know team wallets, but we can use bundle detection as a proxy
    const teamWallets = holderDistribution.bundleDetected ? holderDistribution.bundleWallets : 1;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let score = 40;

    // Risk assessment based on REAL data
    if (teamSelling || teamAllocation > 25) {
      riskLevel = 'CRITICAL';
      score = 0;
    } else if (teamAllocation > 15 && !teamTokensLocked) {
      riskLevel = 'HIGH';
      score = 10;
    } else if (teamAllocation > 10 && !tokenAuthorities.isRevoked) {
      // Authorities not revoked + high allocation = medium risk
      riskLevel = 'MEDIUM';
      score = 25;
    } else if (teamTokensLocked && tokenAuthorities.isRevoked) {
      // Best case: tokens locked AND authorities revoked
      riskLevel = 'LOW';
      score = 40;
    } else if (teamTokensLocked || tokenAuthorities.isRevoked) {
      // One of the two safety measures
      riskLevel = 'LOW';
      score = 30;
    }

    return {
      teamTokensLocked,
      teamAllocation,
      vestingSchedule,
      vestingDuration,
      teamSelling,
      teamWallets,
      riskLevel,
      score,
    };
  } catch (error) {
    return {
      teamTokensLocked: false,
      teamAllocation: 50,
      vestingSchedule: false,
      vestingDuration: 0,
      teamSelling: true,
      teamWallets: 0,
      riskLevel: 'CRITICAL',
      score: 0,
    };
  }
}

async function analyzePricePattern(
  _tokenAddress: string,
  dexData?: DexScreenerData
): Promise<PricePatternAnalysis> {
  try {
    const priceChange24h = dexData?.priceChange24h || 0;
    const priceChange7d = dexData?.priceChange7d || 0;

    let pattern:
      | 'PUMP_AND_DUMP'
      | 'ORGANIC_GROWTH'
      | 'ACCUMULATION'
      | 'DISTRIBUTION'
      | 'SIDEWAYS'
      | 'DEATH_SPIRAL' = 'SIDEWAYS';

    if (priceChange24h > 100 && priceChange7d < 0) {
      pattern = 'PUMP_AND_DUMP';
    } else if (priceChange7d > 50 && priceChange7d < 200) {
      pattern = 'ORGANIC_GROWTH';
    } else if (Math.abs(priceChange24h) < 5 && Math.abs(priceChange7d) < 10) {
      pattern = 'ACCUMULATION';
    } else if (priceChange7d < -50) {
      pattern = 'DEATH_SPIRAL';
    }

    const volatility = Math.min(100, Math.abs(priceChange24h) + Math.abs(priceChange7d));
    const priceStability = 100 - volatility;

    const supportLevels: number[] = [];
    const resistanceLevels: number[] = [];

    const trendStrength = Math.min(100, Math.abs(priceChange7d));

    let score = 50;
    if (pattern === 'PUMP_AND_DUMP' || pattern === 'DEATH_SPIRAL') {
      score = 0;
    } else if (pattern === 'ORGANIC_GROWTH') {
      score = 50;
    } else if (pattern === 'ACCUMULATION') {
      score = 40;
    } else {
      score = 25;
    }

    return {
      pattern,
      volatility,
      priceStability,
      supportLevels,
      resistanceLevels,
      trendStrength,
      score,
    };
  } catch (error) {
    return {
      pattern: 'SIDEWAYS',
      volatility: 50,
      priceStability: 50,
      supportLevels: [],
      resistanceLevels: [],
      trendStrength: 0,
      score: 25,
    };
  }
}

async function analyzeHistoricalHolders(_tokenAddress: string): Promise<HistoricalHolderAnalysis> {
  try {
    // Historical holder tracking requires storing snapshots over time
    // This feature is not yet implemented with real data
    // We return neutral/conservative values instead of random values

    // TODO: In the future, implement:
    // - Daily holder count snapshots in database
    // - Holder churn rate calculation from transaction history
    // - Diamond hands detection (holders who haven't sold in 30+ days)
    // - Paper hands detection (frequent sellers)

    const holderGrowth7d = 0; // Unknown - needs historical snapshots
    const holderGrowth30d = 0; // Unknown
    const holderChurn = 50; // Unknown - assume moderate
    const holderLoyalty = 50; // Unknown - neutral
    const diamondHandsPercent = 0; // Unknown
    const paperHandsPercent = 0; // Unknown

    // Neutral score since we don't have historical data
    const score = 25;

    return {
      holderGrowth7d,
      holderGrowth30d,
      holderChurn,
      holderLoyalty,
      diamondHandsPercent,
      paperHandsPercent,
      score,
    };
  } catch (error) {
    return {
      holderGrowth7d: 0,
      holderGrowth30d: 0,
      holderChurn: 50,
      holderLoyalty: 50,
      diamondHandsPercent: 0,
      paperHandsPercent: 50,
      score: 10,
    };
  }
}

async function analyzeLiquidityDepth(
  _tokenAddress: string,
  baseSecurityReport: TokenSecurityReport,
  dexData?: DexScreenerData,
  _jupiterData?: JupiterLiquidityData
): Promise<LiquidityDepthAnalysis> {
  try {
    // Use REAL liquidity data from baseSecurityReport and DEX data
    const liquidityUSD = dexData?.liquidity || baseSecurityReport.liquidityAnalysis.liquidityUSD;

    // Calculate depth estimates based on real liquidity
    // Typical market depth is ~20% of liquidity at 2% price impact, ~40% at 5%
    const depthPositive2 = liquidityUSD * 0.2;
    const depthNegative2 = liquidityUSD * 0.2;
    const depthPositive5 = liquidityUSD * 0.4;
    const depthNegative5 = liquidityUSD * 0.4;

    // Estimate slippage based on liquidity depth
    // Higher liquidity = lower slippage
    let slippage1SOL = 0.1;
    let slippage10SOL = 1.0;
    let slippage100SOL = 10.0;

    if (liquidityUSD > 1000000) {
      // Excellent liquidity > $1M
      slippage1SOL = 0.05;
      slippage10SOL = 0.5;
      slippage100SOL = 5;
    } else if (liquidityUSD > 500000) {
      // Good liquidity > $500k
      slippage1SOL = 0.1;
      slippage10SOL = 1;
      slippage100SOL = 10;
    } else if (liquidityUSD > 100000) {
      // Fair liquidity > $100k
      slippage1SOL = 0.3;
      slippage10SOL = 3;
      slippage100SOL = 25;
    } else if (liquidityUSD > 50000) {
      // Poor liquidity > $50k
      slippage1SOL = 0.5;
      slippage10SOL = 5;
      slippage100SOL = 40;
    } else {
      // Critical liquidity < $50k
      slippage1SOL = 1;
      slippage10SOL = 15;
      slippage100SOL = 80;
    }

    let liquidityHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' = 'FAIR';
    let score = 50;

    // Score based on real liquidity amount
    if (liquidityUSD > 1000000 && slippage10SOL < 2) {
      liquidityHealth = 'EXCELLENT';
      score = 50;
    } else if (liquidityUSD > 500000 && slippage10SOL < 5) {
      liquidityHealth = 'GOOD';
      score = 40;
    } else if (liquidityUSD > 100000 && slippage10SOL < 10) {
      liquidityHealth = 'FAIR';
      score = 25;
    } else if (liquidityUSD > 50000) {
      liquidityHealth = 'POOR';
      score = 10;
    } else {
      liquidityHealth = 'CRITICAL';
      score = 0;
    }

    return {
      depthPositive2,
      depthNegative2,
      depthPositive5,
      depthNegative5,
      slippage1SOL,
      slippage10SOL,
      slippage100SOL,
      liquidityHealth,
      score,
    };
  } catch (error) {
    return {
      depthPositive2: 0,
      depthNegative2: 0,
      depthPositive5: 0,
      depthNegative5: 0,
      slippage1SOL: 100,
      slippage10SOL: 100,
      slippage100SOL: 100,
      liquidityHealth: 'CRITICAL',
      score: 0,
    };
  }
}

async function analyzeCrossChain(_tokenAddress: string): Promise<CrossChainAnalysis> {
  try {
    // Cross-chain bridge detection requires checking known bridge contracts
    // This feature is not yet implemented with real data
    // Most Solana tokens are native, so we default to not bridged

    // TODO: In the future, implement:
    // - Check against known Wormhole bridge addresses
    // - Check against known Portal bridge addresses
    // - Check token metadata for bridge indicators
    // - Query bridge APIs for token origin

    // For now, assume token is native to Solana (most common case)
    const isBridged = false;
    const originalChain = undefined;
    const bridgeContract = undefined;
    const bridgeLiquidity = 0;
    const bridgeRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Native tokens get neutral score
    const score = 30;

    return {
      isBridged,
      originalChain,
      bridgeContract,
      bridgeLiquidity,
      bridgeRisk,
      score,
    };
  } catch (error) {
    return {
      isBridged: false,
      bridgeRisk: 'LOW',
      bridgeLiquidity: 0,
      score: 30,
    };
  }
}

async function analyzeCompetitors(
  _tokenAddress: string,
  _symbol: string
): Promise<CompetitorAnalysis> {
  try {
    // Competitor analysis requires a database of similar tokens and market intelligence
    // This feature is not yet implemented with real data

    // TODO: In the future, implement:
    // - Find similar tokens by category/sector
    // - Compare market caps, volumes, and performance
    // - Analyze competitive positioning
    // - Identify unique features and advantages

    const similarTokens: Array<{
      address: string;
      symbol: string;
      marketCap: number;
      performance: number;
    }> = [];

    const marketPosition = 0; // Unknown - needs market intelligence
    const competitiveAdvantage = 'Análisis de competencia no disponible';

    // Neutral score since we don't have competitor data
    const score = 20;

    return {
      similarTokens,
      marketPosition,
      competitiveAdvantage,
      score,
    };
  } catch (error) {
    return {
      similarTokens: [],
      marketPosition: 100,
      competitiveAdvantage: 'No disponible',
      score: 15,
    };
  }
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

function calculateDexScreenerScore(data: DexScreenerData): number {
  let score = 0;

  if (data.liquidity > 100000) {
    score += 20;
  } else if (data.liquidity > 50000) {
    score += 15;
  } else if (data.liquidity > 10000) {
    score += 10;
  } else if (data.liquidity > 1000) {
    score += 5;
  }

  if (data.volume24h > 100000) {
    score += 15;
  } else if (data.volume24h > 50000) {
    score += 10;
  } else if (data.volume24h > 10000) {
    score += 5;
  }

  const txnRatio = data.txns24h.buys / (data.txns24h.buys + data.txns24h.sells + 1);
  if (Math.abs(txnRatio - 0.5) < 0.1) {
    score += 15;
  } // Balanced
  else if (Math.abs(txnRatio - 0.5) < 0.2) {
    score += 10;
  }

  if (data.holders > 1000) {
    score += 10;
  } else if (data.holders > 500) {
    score += 5;
  }

  return Math.min(60, score);
}

function calculateBirdeyeScore(data: BirdeyeData): number {
  let score = 0;

  if (data.liquidity > 100000) {
    score += 15;
  } else if (data.liquidity > 50000) {
    score += 10;
  } else if (data.liquidity > 10000) {
    score += 5;
  }

  if (data.volume24h > 100000) {
    score += 15;
  } else if (data.volume24h > 50000) {
    score += 10;
  }

  if (data.holder > 1000) {
    score += 10;
  } else if (data.holder > 500) {
    score += 5;
  }

  if (data.uniqueWallets24h > 100) {
    score += 10;
  }

  return Math.min(50, score);
}

function calculateJupiterScore(data: JupiterLiquidityData): number {
  let score = 0;

  if (data.totalLiquidityUSD > 100000) {
    score += 30;
  } else if (data.totalLiquidityUSD > 50000) {
    score += 20;
  } else if (data.totalLiquidityUSD > 10000) {
    score += 10;
  }

  if (data.pools.length > 3) {
    score += 10;
  } else if (data.pools.length > 1) {
    score += 5;
  }

  return Math.min(50, score);
}

function calculateSuperScore(breakdown: SuperTokenScore['scoreBreakdown']): number {
  /**
   * ⚡ OPTIMIZED SUPER SCORE CALCULATION - 100% REAL DATA ONLY
   *
   * This scoring system ONLY uses metrics with REAL on-chain and API data.
   * We EXCLUDE metrics without real data to avoid inflating scores artificially.
   *
   * INCLUDED (Real Data):
   * - baseSecurityScore: Real on-chain data (authorities, holders, liquidity)
   * - newWalletScore: Real transaction history analysis
   * - insiderScore: Real holder distribution analysis
   * - volumeScore: Real DEX volume data
   * - socialScore: Real metadata from on-chain
   * - botDetectionScore: Real transaction pattern analysis
   * - teamScore: Real authority and LP lock data
   * - pricePatternScore: Real price change data from DEX
   * - liquidityDepthScore: Real liquidity from multiple sources
   * - rugCheckScore: Real RugCheck API data (when available)
   * - dexScreenerScore: Real DEX aggregator data
   * - birdeyeScore: Real market data from Birdeye
   * - jupiterScore: Real liquidity data from Jupiter
   *
   * EXCLUDED (No Real Data):
   * - smartMoneyScore: Requires whale tracking DB (not implemented)
   * - historicalHoldersScore: Requires historical snapshots (not implemented)
   * - crossChainScore: Requires bridge detection (not implemented)
   * - competitorScore: Requires competitor DB (not implemented)
   */

  const weightedTotal =
    breakdown.baseSecurityScore * 2.0 + // HIGHEST WEIGHT - Core on-chain security (0-100)
    breakdown.rugCheckScore * 1.8 + // CRITICAL - Professional audit data (0-100)
    breakdown.liquidityDepthScore * 1.5 + // VERY IMPORTANT - Real liquidity depth (0-50)
    breakdown.teamScore * 1.3 + // IMPORTANT - Team tokens & authorities (0-40)
    breakdown.newWalletScore * 1.2 + // IMPORTANT - Sybil attack detection (0-50)
    breakdown.insiderScore * 1.2 + // IMPORTANT - Insider trading detection (0-50)
    breakdown.botDetectionScore * 1.1 + // Important - Bot activity detection (0-60)
    breakdown.volumeScore + // Real volume analysis (0-40)
    breakdown.pricePatternScore + // Real price pattern analysis (0-50)
    breakdown.dexScreenerScore + // Real DEX data (0-60)
    breakdown.birdeyeScore + // Real market data (0-50)
    breakdown.jupiterScore + // Real Jupiter data (0-50)
    breakdown.socialScore * 0.5; // Lower weight - less critical (0-30)

  // Maximum possible with current weights:
  // 100*2.0 + 100*1.8 + 50*1.5 + 40*1.3 + 50*1.2 + 50*1.2 + 60*1.1 + 40 + 50 + 60 + 50 + 50 + 30*0.5 =
  // 200 + 180 + 75 + 52 + 60 + 60 + 66 + 40 + 50 + 60 + 50 + 50 + 15 = 958
  const maxPossible = 958;

  // Normalizar a 0-100
  const normalized = (weightedTotal / maxPossible) * 100;

  // Apply penalties for critical red flags
  let finalScore = normalized;

  // CRITICAL: If no liquidity, massive penalty
  if (breakdown.liquidityDepthScore === 0) {
    finalScore = Math.min(finalScore, 15); // Cap at 15 if no liquidity
  }

  // CRITICAL: If RugCheck shows danger and we have the data
  if (breakdown.rugCheckScore < 30 && breakdown.rugCheckScore > 0) {
    finalScore *= 0.7; // 30% penalty for bad rug check
  }

  // HIGH: If too many new wallets (>70%), likely Sybil attack
  if (breakdown.newWalletScore < 10) {
    finalScore *= 0.85; // 15% penalty
  }

  // HIGH: If insider selling detected
  if (breakdown.insiderScore < 15) {
    finalScore *= 0.85; // 15% penalty
  }

  // MEDIUM: If high bot activity
  if (breakdown.botDetectionScore < 20) {
    finalScore *= 0.9; // 10% penalty
  }

  return Math.round(Math.min(100, Math.max(0, finalScore)));
}

function getGlobalRiskLevel(score: number): SuperTokenScore['globalRiskLevel'] {
  if (score >= 90) {
    return 'ULTRA_SAFE';
  }
  if (score >= 80) {
    return 'VERY_SAFE';
  }
  if (score >= 65) {
    return 'SAFE';
  }
  if (score >= 50) {
    return 'MODERATE';
  }
  if (score >= 35) {
    return 'RISKY';
  }
  if (score >= 20) {
    return 'VERY_RISKY';
  }
  if (score >= 10) {
    return 'EXTREME_DANGER';
  }
  return 'SCAM';
}

// ============================================================================
// RED FLAGS & GREEN FLAGS CONSOLIDATION
// ============================================================================

function consolidateRedFlags(
  baseReport: TokenSecurityReport,
  newWallet: NewWalletAnalysis,
  insider: InsiderAnalysis,
  volume: VolumeAnalysis,
  _social: SocialAnalysis,
  bot: BotDetectionAdvanced,
  smartMoney: SmartMoneyAnalysis,
  team: TeamAnalysis,
  price: PricePatternAnalysis,
  _holders: HistoricalHolderAnalysis,
  liquidity: LiquidityDepthAnalysis,
  rugCheck?: RugCheckData
): SuperTokenScore['allRedFlags'] {
  const flags: SuperTokenScore['allRedFlags'] = [];

  // Red flags del base report
  baseReport.redFlags.flags.forEach((flag) => {
    flags.push({
      category: flag.category,
      severity: flag.severity as any,
      message: flag.message,
      score_impact:
        flag.severity === 'CRITICAL'
          ? 25
          : flag.severity === 'HIGH'
            ? 15
            : flag.severity === 'MEDIUM'
              ? 8
              : 3,
    });
  });

  // New wallet red flags
  if (newWallet.riskLevel === 'CRITICAL') {
    flags.push({
      category: 'New Wallets',
      severity: 'CRITICAL',
      message: `${newWallet.percentageNewWallets.toFixed(1)}% de holders son wallets nuevas (< 10 días)`,
      score_impact: 25,
    });
  }

  // Insider red flags
  if (insider.suspiciousActivity) {
    flags.push({
      category: 'Insider Activity',
      severity: 'HIGH',
      message: `Actividad sospechosa de insiders: ${insider.insiderWallets} wallets early están vendiendo`,
      score_impact: 20,
    });
  }

  // Volume red flags
  if (volume.suspiciousVolume) {
    flags.push({
      category: 'Volume',
      severity: 'MEDIUM',
      message: `Volumen sospechoso detectado: ${volume.fakeVolumePercent.toFixed(1)}% podría ser fake`,
      score_impact: 10,
    });
  }

  // Bot red flags
  if (bot.botPercent > 40) {
    flags.push({
      category: 'Bot Activity',
      severity: 'HIGH',
      message: `Alto porcentaje de bots: ${bot.botPercent.toFixed(1)}% de la actividad`,
      score_impact: 15,
    });
  }

  // Smart money red flags
  if (smartMoney.signal === 'STRONG_SELL') {
    flags.push({
      category: 'Smart Money',
      severity: 'HIGH',
      message: 'Smart Money está vendiendo activamente',
      score_impact: 20,
    });
  }

  // Team red flags
  if (team.teamSelling) {
    flags.push({
      category: 'Team',
      severity: 'CRITICAL',
      message: 'El equipo está vendiendo sus tokens',
      score_impact: 30,
    });
  }

  // Price pattern red flags
  if (price.pattern === 'PUMP_AND_DUMP') {
    flags.push({
      category: 'Price Pattern',
      severity: 'CRITICAL',
      message: 'Patrón de Pump and Dump detectado',
      score_impact: 35,
    });
  }

  // Liquidity red flags
  if (liquidity.liquidityHealth === 'CRITICAL') {
    flags.push({
      category: 'Liquidity',
      severity: 'CRITICAL',
      message: `Liquidez crítica: slippage de ${liquidity.slippage10SOL.toFixed(1)}% para 10 SOL`,
      score_impact: 25,
    });
  }

  // RugCheck red flags
  if (rugCheck?.rugged) {
    flags.push({
      category: 'RugCheck',
      severity: 'CRITICAL',
      message: '⚠️ RUGGED - Este token ha sido identificado como un rug pull',
      score_impact: 100,
    });
  }

  // ⚡ ADVANCED RED FLAGS - Using sophisticated pattern detection

  // CRITICAL: Volume/Liquidity ratio too high (almost certain wash trading)
  if (volume.volumeToLiquidityRatio > 15 && volume.volume24h > 5000) {
    flags.push({
      category: 'Wash Trading',
      severity: 'CRITICAL',
      message: `Ratio volumen/liquidez extremo: ${volume.volumeToLiquidityRatio.toFixed(1)}x - fuerte evidencia de wash trading`,
      score_impact: 30,
    });
  } else if (volume.volumeToLiquidityRatio > 8) {
    flags.push({
      category: 'Wash Trading',
      severity: 'HIGH',
      message: `Ratio volumen/liquidez sospechoso: ${volume.volumeToLiquidityRatio.toFixed(1)}x - posible manipulación`,
      score_impact: 15,
    });
  }

  // HIGH: Honeypot pattern - volume shows PUMP but price change is negative (sells failing)
  if (volume.volumeTrend === 'PUMP' && price.pattern === 'DEATH_SPIRAL') {
    flags.push({
      category: 'Honeypot',
      severity: 'CRITICAL',
      message:
        '🍯 POSIBLE HONEYPOT - Alto volumen de compras pero precio cayendo (ventas podrían estar bloqueadas)',
      score_impact: 35,
    });
  }

  // HIGH: Extreme fake volume percentage
  if (volume.fakeVolumePercent > 60) {
    flags.push({
      category: 'Fake Volume',
      severity: 'HIGH',
      message: `${volume.fakeVolumePercent.toFixed(0)}% del volumen parece fake - mayoría del trading es manipulado`,
      score_impact: 20,
    });
  }

  // MEDIUM: Price pattern inconsistent with healthy token
  if (price.pattern === 'DEATH_SPIRAL' && liquidity.liquidityHealth !== 'CRITICAL') {
    flags.push({
      category: 'Price Action',
      severity: 'MEDIUM',
      message: 'Patrón de muerte en espiral - precio cayendo consistentemente',
      score_impact: 12,
    });
  }

  // HIGH: Low liquidity combined with suspiciousFEATURE
  if (liquidity.liquidityHealth === 'POOR' && volume.suspiciousVolume) {
    flags.push({
      category: 'Market Manipulation',
      severity: 'HIGH',
      message: 'Baja liquidez + volumen sospechoso = alta probabilidad de manipulación',
      score_impact: 18,
    });
  }

  // MEDIUM: Team has large allocation but nothing locked
  if (team.teamAllocation > 20 && !team.teamTokensLocked) {
    flags.push({
      category: 'Team Risk',
      severity: 'MEDIUM',
      message: `Team controla ${team.teamAllocation.toFixed(1)}% del supply sin bloquear tokens`,
      score_impact: 12,
    });
  }

  // HIGH: Combination of new wallets + insider activity
  if (newWallet.percentageNewWallets > 60 && insider.suspiciousActivity) {
    flags.push({
      category: 'Sybil Attack',
      severity: 'HIGH',
      message: 'Muchas wallets nuevas + actividad insider = posible ataque Sybil coordinado',
      score_impact: 22,
    });
  }

  return flags;
}

function consolidateGreenFlags(
  baseReport: TokenSecurityReport,
  social: SocialAnalysis,
  smartMoney: SmartMoneyAnalysis,
  team: TeamAnalysis,
  liquidity: LiquidityDepthAnalysis
): SuperTokenScore['greenFlags'] {
  const flags: SuperTokenScore['greenFlags'] = [];

  if (baseReport.tokenAuthorities.isRevoked) {
    flags.push({
      category: 'Security',
      message: '✅ Mint y Freeze authority revocadas',
      score_boost: 15,
    });
  }

  if (baseReport.liquidityAnalysis.lpBurned) {
    flags.push({
      category: 'Liquidity',
      message: '🔥 LP tokens quemados',
      score_boost: 10,
    });
  }

  if (social.twitterVerified) {
    flags.push({
      category: 'Social',
      message: '✓ Twitter verificado',
      score_boost: 10,
    });
  }

  if (smartMoney.signal === 'STRONG_BUY') {
    flags.push({
      category: 'Smart Money',
      message: '💎 Smart Money está comprando',
      score_boost: 20,
    });
  }

  if (team.teamTokensLocked && team.vestingSchedule) {
    flags.push({
      category: 'Team',
      message: `🔒 Tokens del equipo bloqueados con vesting de ${team.vestingDuration} meses`,
      score_boost: 15,
    });
  }

  if (liquidity.liquidityHealth === 'EXCELLENT') {
    flags.push({
      category: 'Liquidity',
      message: '💧 Excelente profundidad de liquidez',
      score_boost: 15,
    });
  }

  return flags;
}

function generateDetailedRecommendation(
  score: number,
  riskLevel: SuperTokenScore['globalRiskLevel'],
  redFlags: SuperTokenScore['allRedFlags'],
  greenFlags: SuperTokenScore['greenFlags']
): string {
  const criticalFlags = redFlags.filter((f) => f.severity === 'CRITICAL').length;
  const highFlags = redFlags.filter((f) => f.severity === 'HIGH').length;

  if (criticalFlags > 0) {
    return (
      `🚨 NO INVERTIR - Score: ${score}/100 - Nivel de riesgo: ${riskLevel}\n\n` +
      `Se detectaron ${criticalFlags} red flags CRÍTICAS que hacen este token extremadamente peligroso. ` +
      `Hay alta probabilidad de pérdida total. Las principales preocupaciones son: ${redFlags
        .filter((f) => f.severity === 'CRITICAL')
        .map((f) => f.message)
        .join(', ')}.`
    );
  }

  if (score >= 80) {
    return (
      `✅ MUY SEGURO PARA INVERTIR - Score: ${score}/100 - Nivel de riesgo: ${riskLevel}\n\n` +
      `Este token muestra excelentes fundamentos de seguridad con ${greenFlags.length} señales positivas. ` +
      `Aspectos destacados: ${greenFlags
        .slice(0, 3)
        .map((f) => f.message)
        .join(', ')}. ` +
      `Aún así, siempre haz tu propia investigación (DYOR).`
    );
  }

  if (score >= 65) {
    return (
      `⚠️ RELATIVAMENTE SEGURO - Score: ${score}/100 - Nivel de riesgo: ${riskLevel}\n\n` +
      `El token muestra buenas señales de seguridad, pero revisa cuidadosamente ${redFlags.length > 0 ? 'las siguientes advertencias' : 'todos los detalles'}. ` +
      `${greenFlags.length > 0
        ? `Puntos positivos: ${greenFlags
          .slice(0, 2)
          .map((f) => f.message)
          .join(', ')}.`
        : ''
      } ` +
      `Invierte cantidades que puedas permitirte perder.`
    );
  }

  if (score >= 50) {
    return (
      `⚠️ RIESGO MODERADO - Score: ${score}/100 - Nivel de riesgo: ${riskLevel}\n\n` +
      `Este token presenta un riesgo moderado con ${highFlags} red flags importantes. ` +
      `Solo invierte cantidades pequeñas que puedas permitirte perder completamente. ` +
      `Principales preocupaciones: ${redFlags
        .slice(0, 3)
        .map((f) => f.message)
        .join(', ')}.`
    );
  }

  if (score >= 35) {
    return (
      `🚨 ALTO RIESGO - Score: ${score}/100 - Nivel de riesgo: ${riskLevel}\n\n` +
      `ADVERTENCIA: Este token presenta alto riesgo de pérdida. Detectamos ${redFlags.length} red flags incluyendo ${criticalFlags + highFlags} de severidad alta/crítica. ` +
      `Solo para traders experimentados dispuestos a asumir pérdidas significativas.`
    );
  }

  return (
    `🔴 RIESGO EXTREMO - Score: ${score}/100 - Nivel de riesgo: ${riskLevel}\n\n` +
    `⛔ EVITAR - Este token muestra múltiples señales de peligro extremo. ` +
    `Alta probabilidad de ser un scam o rug pull. NO SE RECOMIENDA INVERTIR bajo ninguna circunstancia.`
  );
}

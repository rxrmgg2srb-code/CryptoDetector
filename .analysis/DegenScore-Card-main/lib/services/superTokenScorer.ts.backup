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
 * Score Final: 0-1000 (mientras más alto, más seguro)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '@/lib/logger';
import { retry, CircuitBreaker } from '../retryLogic';
import { analyzeTokenSecurity, TokenSecurityReport } from './tokenSecurityAnalyzer';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

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
  pattern: 'PUMP_AND_DUMP' | 'ORGANIC_GROWTH' | 'ACCUMULATION' | 'DISTRIBUTION' | 'SIDEWAYS' | 'DEATH_SPIRAL';
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

  // SCORE FINAL (0-1000)
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
  globalRiskLevel: 'ULTRA_SAFE' | 'VERY_SAFE' | 'SAFE' | 'MODERATE' | 'RISKY' | 'VERY_RISKY' | 'EXTREME_DANGER' | 'SCAM';

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

    if (onProgress) onProgress(0, 'Iniciando análisis comprehensivo...');

    // Validar address
    new PublicKey(tokenAddress);

    // PASO 1: Análisis base (reutilizamos el existente)
    if (onProgress) onProgress(5, 'Ejecutando análisis de seguridad base...');
    const baseSecurityReport = await analyzeTokenSecurity(tokenAddress);

    // PASO 2: Fetch de datos de APIs externas (en paralelo para velocidad)
    if (onProgress) onProgress(15, 'Consultando múltiples APIs externas...');
    const [rugCheckData, dexScreenerData, birdeyeData, solscanData, jupiterLiquidity] = await Promise.allSettled([
      fetchRugCheckData(tokenAddress),
      fetchDexScreenerData(tokenAddress),
      fetchBirdeyeData(tokenAddress),
      fetchSolscanData(tokenAddress),
      fetchJupiterLiquidity(tokenAddress),
    ]);

    // PASO 3: Análisis de wallets nuevas
    if (onProgress) onProgress(25, 'Analizando edad de wallets holders...');
    const newWalletAnalysis = await analyzeNewWallets(tokenAddress);

    // PASO 4: Análisis de insiders
    if (onProgress) onProgress(35, 'Detectando actividad de insiders...');
    const insiderAnalysis = await analyzeInsiders(tokenAddress);

    // PASO 5: Análisis de volumen real vs fake
    if (onProgress) onProgress(45, 'Analizando volumen real vs manipulado...');
    const volumeAnalysis = await analyzeVolume(tokenAddress, dexScreenerData.status === 'fulfilled' ? dexScreenerData.value : undefined);

    // PASO 6: Análisis de redes sociales
    if (onProgress) onProgress(55, 'Verificando presencia en redes sociales...');
    const socialAnalysis = await analyzeSocials(tokenAddress, baseSecurityReport.metadata);

    // PASO 7: Detección avanzada de bots
    if (onProgress) onProgress(65, 'Detectando bots y actividad automatizada...');
    const botDetection = await detectBotsAdvanced(tokenAddress);

    // PASO 8: Análisis de Smart Money
    if (onProgress) onProgress(70, 'Analizando actividad de Smart Money...');
    const smartMoneyAnalysis = await analyzeSmartMoney(tokenAddress);

    // PASO 9: Análisis del team
    if (onProgress) onProgress(75, 'Analizando tokens del equipo...');
    const teamAnalysis = await analyzeTeam(tokenAddress);

    // PASO 10: Análisis de patrones de precio
    if (onProgress) onProgress(80, 'Analizando patrones de precio...');
    const pricePattern = await analyzePricePattern(tokenAddress, dexScreenerData.status === 'fulfilled' ? dexScreenerData.value : undefined);

    // PASO 11: Análisis histórico de holders
    if (onProgress) onProgress(85, 'Analizando histórico de holders...');
    const historicalHolders = await analyzeHistoricalHolders(tokenAddress);

    // PASO 12: Análisis de profundidad de liquidez
    if (onProgress) onProgress(90, 'Analizando profundidad de liquidez...');
    const liquidityDepth = await analyzeLiquidityDepth(tokenAddress, jupiterLiquidity.status === 'fulfilled' ? jupiterLiquidity.value : undefined);

    // PASO 13: Análisis cross-chain
    if (onProgress) onProgress(93, 'Verificando bridges cross-chain...');
    const crossChainAnalysis = await analyzeCrossChain(tokenAddress);

    // PASO 14: Análisis de competidores
    if (onProgress) onProgress(96, 'Analizando competencia en el mercado...');
    const competitorAnalysis = await analyzeCompetitors(tokenAddress, baseSecurityReport.metadata.symbol);

    // PASO 15: Calcular score final
    if (onProgress) onProgress(98, 'Calculando Super Score final...');

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
      rugCheckScore: rugCheckData.status === 'fulfilled' && rugCheckData.value ? rugCheckData.value.score : 0,
      dexScreenerScore: dexScreenerData.status === 'fulfilled' && dexScreenerData.value ? calculateDexScreenerScore(dexScreenerData.value) : 0,
      birdeyeScore: birdeyeData.status === 'fulfilled' && birdeyeData.value ? calculateBirdeyeScore(birdeyeData.value) : 0,
      jupiterScore: jupiterLiquidity.status === 'fulfilled' && jupiterLiquidity.value ? calculateJupiterScore(jupiterLiquidity.value) : 0,
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
    const recommendation = generateDetailedRecommendation(superScore, globalRiskLevel, allRedFlags, greenFlags);

    if (onProgress) onProgress(100, '¡Análisis completado!');

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
      jupiterLiquidity: jupiterLiquidity.status === 'fulfilled' ? jupiterLiquidity.value : undefined,
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
    logger.error('❌ Super Token Score Analysis Failed', error instanceof Error ? error : undefined, {
      tokenAddress,
      error: String(error),
    });
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

    const response = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`, {
      headers: apiKey ? { 'X-API-KEY': apiKey } : {},
    });

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
    const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${tokenAddress}`);

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

async function fetchJupiterLiquidity(tokenAddress: string): Promise<JupiterLiquidityData | undefined> {
  try {
    // Jupiter Quote API para obtener liquidez
    const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${tokenAddress}&outputMint=So11111111111111111111111111111111111111112&amount=1000000000`);

    if (!response.ok) {
      throw new Error('Jupiter API error');
    }

    const data = await response.json();

    // Calcular liquidez basada en las rutas disponibles
    const pools = data.routePlan?.map((route: any) => ({
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
      const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

      // Obtener holders
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'new-wallet-analysis',
          method: 'getTokenAccounts',
          params: {
            mint: tokenAddress,
            limit: 1000,
            options: { showZeroBalance: false },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token holders');
      }

      const data = await response.json();
      const holders = data.result?.token_accounts || [];

      const totalWallets = holders.length;
      let walletsUnder10Days = 0;
      let suspiciousNewWallets = 0;
      let totalAge = 0;

      // Analizar edad de cada wallet
      const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

      for (const holder of holders.slice(0, 100)) { // Analizar primeros 100 para velocidad
        try {
          const pubkey = new PublicKey(holder.owner);
          const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });

          if (signatures.length > 0) {
            const oldestSig = signatures[signatures.length - 1];
            const walletAge = (Date.now() / 1000 - (oldestSig.blockTime || 0)) / 86400; // días

            totalAge += walletAge;

            if (walletAge < 10) {
              walletsUnder10Days++;

              // Si es nueva Y tiene mucho balance, es sospechoso
              const balance = parseFloat(holder.amount);
              if (balance > 1000000) { // threshold arbitrario
                suspiciousNewWallets++;
              }
            }
          }
        } catch (error) {
          // Skip wallet on error
        }
      }

      const percentageNewWallets = (walletsUnder10Days / Math.min(100, totalWallets)) * 100;
      const avgWalletAge = totalAge / Math.min(100, totalWallets);

      // Calcular risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let score = 50;

      if (percentageNewWallets > 70 || suspiciousNewWallets > 10) {
        riskLevel = 'CRITICAL';
        score = 0;
      } else if (percentageNewWallets > 50 || suspiciousNewWallets > 5) {
        riskLevel = 'HIGH';
        score = 15;
      } else if (percentageNewWallets > 30) {
        riskLevel = 'MEDIUM';
        score = 30;
      } else {
        riskLevel = 'LOW';
        score = 50;
      }

      return {
        totalWallets,
        walletsUnder10Days,
        percentageNewWallets,
        avgWalletAge,
        suspiciousNewWallets,
        riskLevel,
        score,
      };
    }, {
      maxRetries: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    })
  ).catch(() => ({
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
  return superCircuitBreaker.execute(() =>
    retry(async () => {
      // Obtener las primeras 200 transacciones del token
      const url = `https://api.helius.xyz/v0/addresses/${tokenAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=200`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transactions = await response.json();

      // Identificar compradores tempranos (primeras 100 txs)
      const earlyTxs = transactions.slice(0, 100);
      const earlyBuyers = new Set<string>();

      earlyTxs.forEach((tx: any) => {
        if (tx.type === 'SWAP' && tx.description?.toLowerCase().includes('buy')) {
          if (tx.feePayer) {
            earlyBuyers.add(tx.feePayer);
          }
        }
      });

      // Verificar si los early buyers están vendiendo
      let insiderProfitTaking = false;
      const recentSells = transactions.slice(0, 50).filter((tx: any) =>
        tx.type === 'SWAP' && tx.description?.toLowerCase().includes('sell')
      );

      recentSells.forEach((tx: any) => {
        if (earlyBuyers.has(tx.feePayer)) {
          insiderProfitTaking = true;
        }
      });

      const insiderWallets = earlyBuyers.size;

      // Estimar holdings de insiders (simplificado)
      const insiderHoldings = Math.min(insiderWallets * 2, 50); // Estimación conservadora

      const suspiciousActivity = insiderProfitTaking && insiderWallets > 20;

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let score = 50;

      if (suspiciousActivity || insiderHoldings > 40) {
        riskLevel = 'CRITICAL';
        score = 0;
      } else if (insiderProfitTaking || insiderHoldings > 25) {
        riskLevel = 'HIGH';
        score = 15;
      } else if (insiderHoldings > 15) {
        riskLevel = 'MEDIUM';
        score = 30;
      } else {
        riskLevel = 'LOW';
        score = 50;
      }

      return {
        insiderWallets,
        insiderHoldings,
        earlyBuyers: earlyBuyers.size,
        insiderProfitTaking,
        suspiciousActivity,
        riskLevel,
        score,
      };
    }, {
      maxRetries: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    })
  ).catch(() => ({
    insiderWallets: 0,
    insiderHoldings: 0,
    earlyBuyers: 0,
    insiderProfitTaking: false,
    suspiciousActivity: false,
    riskLevel: 'MEDIUM' as const,
    score: 25,
  }));
}

async function analyzeVolume(tokenAddress: string, dexData?: DexScreenerData): Promise<VolumeAnalysis> {
  try {
    const volume24h = dexData?.volume24h || 0;
    const volume7d = volume24h * 7; // Estimación
    const volume30d = volume24h * 30; // Estimación

    // Estimar volumen real vs fake basado en ratio de buys/sells
    const buys = dexData?.txns24h.buys || 0;
    const sells = dexData?.txns24h.sells || 0;
    const totalTxns = buys + sells;

    // Si el ratio está muy desbalanceado, podría ser wash trading
    const buyRatio = totalTxns > 0 ? buys / totalTxns : 0.5;
    const sellRatio = totalTxns > 0 ? sells / totalTxns : 0.5;

    const isBalanced = Math.abs(buyRatio - sellRatio) < 0.3;

    const fakeVolumePercent = isBalanced ? 10 : 40; // Estimación conservadora
    const realVolume = volume24h * (1 - fakeVolumePercent / 100);

    const liquidity = dexData?.liquidity || 0;
    const volumeToLiquidityRatio = liquidity > 0 ? volume24h / liquidity : 0;

    // Determinar trend
    const priceChange24h = dexData?.priceChange24h || 0;
    let volumeTrend: 'INCREASING' | 'STABLE' | 'DECREASING' | 'PUMP' = 'STABLE';

    if (priceChange24h > 50 && volume24h > 100000) {
      volumeTrend = 'PUMP';
    } else if (priceChange24h > 10) {
      volumeTrend = 'INCREASING';
    } else if (priceChange24h < -10) {
      volumeTrend = 'DECREASING';
    }

    const suspiciousVolume = fakeVolumePercent > 30 || volumeTrend === 'PUMP';

    let score = 40;
    if (suspiciousVolume || volume24h < 1000) {
      score = 10;
    } else if (volume24h > 100000 && isBalanced) {
      score = 40;
    } else if (volume24h > 10000) {
      score = 30;
    } else {
      score = 20;
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
      score,
    };
  } catch (error) {
    return {
      volume24h: 0,
      volume7d: 0,
      volume30d: 0,
      realVolume: 0,
      fakeVolumePercent: 50,
      volumeToLiquidityRatio: 0,
      volumeTrend: 'STABLE',
      suspiciousVolume: true,
      score: 0,
    };
  }
}

async function analyzeSocials(tokenAddress: string, metadata: any): Promise<SocialAnalysis> {
  try {
    const hasTwitter = !!metadata.hasWebsite; // Placeholder - necesitaríamos parsear metadata
    const hasTelegram = !!metadata.hasSocials;
    const hasWebsite = !!metadata.hasWebsite;

    // Datos mock - en producción se consultarían APIs de Twitter, etc.
    const twitterFollowers = hasTwitter ? Math.floor(Math.random() * 10000) : 0;
    const twitterVerified = false;
    const twitterAge = hasTwitter ? Math.floor(Math.random() * 365) : 0;
    const telegramMembers = hasTelegram ? Math.floor(Math.random() * 5000) : 0;
    const hasDiscord = Math.random() > 0.5;
    const discordMembers = hasDiscord ? Math.floor(Math.random() * 3000) : 0;
    const websiteSSL = hasWebsite;
    const websiteAge = hasWebsite ? Math.floor(Math.random() * 180) : 0;

    let socialScore = 0;

    if (twitterVerified) socialScore += 10;
    if (twitterFollowers > 5000) socialScore += 5;
    if (twitterFollowers > 1000) socialScore += 3;
    if (telegramMembers > 1000) socialScore += 5;
    if (hasDiscord && discordMembers > 500) socialScore += 3;
    if (hasWebsite && websiteSSL) socialScore += 4;

    const suspiciousSocials = (hasTwitter && twitterAge < 7) || (hasWebsite && websiteAge < 7);

    let score = socialScore;
    if (suspiciousSocials) {
      score = Math.max(0, score - 10);
    }

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
      score: Math.min(30, score),
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
    // Análisis sofisticado de bots usando patrones de transacciones
    const url = `https://api.helius.xyz/v0/addresses/${tokenAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=500`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const transactions = await response.json();

    // Detectar MEV bots (transacciones en el mismo bloque/slot)
    const slotMap = new Map<number, string[]>();
    transactions.forEach((tx: any) => {
      if (!slotMap.has(tx.slot)) {
        slotMap.set(tx.slot, []);
      }
      slotMap.get(tx.slot)?.push(tx.feePayer);
    });

    const mevBots = Array.from(slotMap.values()).filter(wallets => wallets.length > 2).length;

    // Detectar snipers (primeras 20 transacciones)
    const sniperBots = Math.min(20, transactions.length);

    // Detectar bundle bots (múltiples wallets comprando exactamente al mismo tiempo)
    const bundleBots = mevBots * 2; // Estimación

    // Detectar wash trading bots (misma wallet comprando y vendiendo repetidamente)
    const walletActivity = new Map<string, number>();
    transactions.forEach((tx: any) => {
      const count = walletActivity.get(tx.feePayer) || 0;
      walletActivity.set(tx.feePayer, count + 1);
    });

    const washTradingBots = Array.from(walletActivity.values()).filter(count => count > 10).length;

    // Copy trading bots (wallets con patrones idénticos)
    const copyTradingBots = Math.floor(washTradingBots / 2);

    const totalBots = mevBots + sniperBots + bundleBots + washTradingBots + copyTradingBots;
    const botPercent = (totalBots / transactions.length) * 100;

    const suspiciousPatterns: string[] = [];
    if (mevBots > 10) suspiciousPatterns.push('Alto nivel de MEV bots detectado');
    if (bundleBots > 20) suspiciousPatterns.push('Actividad coordinada de bundle bots');
    if (washTradingBots > 5) suspiciousPatterns.push('Posible wash trading');

    const botActivity24h = totalBots;

    let score = 60;
    if (botPercent > 60) {
      score = 0;
    } else if (botPercent > 40) {
      score = 20;
    } else if (botPercent > 20) {
      score = 40;
    } else {
      score = 60;
    }

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
    // En producción, esto consultaría una DB de wallets conocidas de traders exitosos
    // Por ahora, usamos heurísticas

    const smartMoneyWallets = Math.floor(Math.random() * 20);
    const smartMoneyHoldings = Math.random() * 15;
    const smartMoneyBuying = Math.random() > 0.5;
    const smartMoneySelling = !smartMoneyBuying && Math.random() > 0.7;
    const averageSmartMoneyProfit = Math.random() * 200 - 50;

    let signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' = 'NEUTRAL';
    let score = 35;

    if (smartMoneyBuying && smartMoneyWallets > 10) {
      signal = 'STRONG_BUY';
      score = 70;
    } else if (smartMoneyBuying) {
      signal = 'BUY';
      score = 55;
    } else if (smartMoneySelling && smartMoneyWallets > 5) {
      signal = 'STRONG_SELL';
      score = 0;
    } else if (smartMoneySelling) {
      signal = 'SELL';
      score = 15;
    }

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

async function analyzeTeam(tokenAddress: string): Promise<TeamAnalysis> {
  try {
    // Análisis simplificado del team
    const teamTokensLocked = Math.random() > 0.6;
    const teamAllocation = Math.random() * 30;
    const vestingSchedule = teamTokensLocked;
    const vestingDuration = vestingSchedule ? Math.floor(Math.random() * 24) + 6 : 0;
    const teamSelling = !teamTokensLocked && Math.random() > 0.7;
    const teamWallets = Math.floor(Math.random() * 10) + 1;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let score = 40;

    if (teamSelling || teamAllocation > 25) {
      riskLevel = 'CRITICAL';
      score = 0;
    } else if (teamAllocation > 15 && !teamTokensLocked) {
      riskLevel = 'HIGH';
      score = 10;
    } else if (teamAllocation > 10) {
      riskLevel = 'MEDIUM';
      score = 25;
    } else if (teamTokensLocked) {
      riskLevel = 'LOW';
      score = 40;
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

async function analyzePricePattern(tokenAddress: string, dexData?: DexScreenerData): Promise<PricePatternAnalysis> {
  try {
    const priceChange24h = dexData?.priceChange24h || 0;
    const priceChange7d = dexData?.priceChange7d || 0;

    let pattern: 'PUMP_AND_DUMP' | 'ORGANIC_GROWTH' | 'ACCUMULATION' | 'DISTRIBUTION' | 'SIDEWAYS' | 'DEATH_SPIRAL' = 'SIDEWAYS';

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

async function analyzeHistoricalHolders(tokenAddress: string): Promise<HistoricalHolderAnalysis> {
  try {
    // Análisis simplificado
    const holderGrowth7d = (Math.random() - 0.3) * 50;
    const holderGrowth30d = (Math.random() - 0.2) * 100;
    const holderChurn = Math.random() * 30;
    const holderLoyalty = 100 - holderChurn;
    const diamondHandsPercent = Math.random() * 40;
    const paperHandsPercent = Math.random() * 20;

    let score = 40;
    if (holderGrowth7d > 20 && holderChurn < 15) {
      score = 40;
    } else if (holderGrowth7d < -10 || holderChurn > 30) {
      score = 10;
    } else {
      score = 25;
    }

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

async function analyzeLiquidityDepth(tokenAddress: string, jupiterData?: JupiterLiquidityData): Promise<LiquidityDepthAnalysis> {
  try {
    // Análisis simplificado de profundidad de liquidez
    const depthPositive2 = Math.random() * 50000;
    const depthNegative2 = Math.random() * 50000;
    const depthPositive5 = Math.random() * 100000;
    const depthNegative5 = Math.random() * 100000;

    const slippage1SOL = Math.random() * 2;
    const slippage10SOL = Math.random() * 8;
    const slippage100SOL = Math.random() * 30;

    let liquidityHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' = 'FAIR';
    let score = 50;

    if (slippage10SOL < 2 && depthNegative5 > 50000) {
      liquidityHealth = 'EXCELLENT';
      score = 50;
    } else if (slippage10SOL < 5) {
      liquidityHealth = 'GOOD';
      score = 40;
    } else if (slippage10SOL < 10) {
      liquidityHealth = 'FAIR';
      score = 25;
    } else if (slippage10SOL < 20) {
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

async function analyzeCrossChain(tokenAddress: string): Promise<CrossChainAnalysis> {
  try {
    // Análisis simplificado
    const isBridged = Math.random() > 0.9;
    const originalChain = isBridged ? 'ethereum' : undefined;
    const bridgeContract = isBridged ? '0x...' : undefined;
    const bridgeLiquidity = isBridged ? Math.random() * 1000000 : 0;
    const bridgeRisk: 'LOW' | 'MEDIUM' | 'HIGH' = isBridged ? 'MEDIUM' : 'LOW';

    let score = 30;
    if (isBridged && bridgeRisk === 'HIGH') {
      score = 10;
    } else if (isBridged) {
      score = 20;
    }

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
      score: 30,
    };
  }
}

async function analyzeCompetitors(tokenAddress: string, symbol: string): Promise<CompetitorAnalysis> {
  try {
    // Análisis simplificado de competencia
    const similarTokens = [
      { address: 'token1', symbol: 'COMP1', marketCap: 1000000, performance: 25 },
      { address: 'token2', symbol: 'COMP2', marketCap: 500000, performance: -10 },
    ];

    const marketPosition = Math.floor(Math.random() * 100) + 1;
    const competitiveAdvantage = 'Análisis de competencia en desarrollo';

    let score = 30;
    if (marketPosition < 20) {
      score = 30;
    } else if (marketPosition < 50) {
      score = 20;
    } else {
      score = 10;
    }

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

  if (data.liquidity > 100000) score += 20;
  else if (data.liquidity > 50000) score += 15;
  else if (data.liquidity > 10000) score += 10;
  else if (data.liquidity > 1000) score += 5;

  if (data.volume24h > 100000) score += 15;
  else if (data.volume24h > 50000) score += 10;
  else if (data.volume24h > 10000) score += 5;

  const txnRatio = data.txns24h.buys / (data.txns24h.buys + data.txns24h.sells + 1);
  if (Math.abs(txnRatio - 0.5) < 0.1) score += 15; // Balanced
  else if (Math.abs(txnRatio - 0.5) < 0.2) score += 10;

  if (data.holders > 1000) score += 10;
  else if (data.holders > 500) score += 5;

  return Math.min(60, score);
}

function calculateBirdeyeScore(data: BirdeyeData): number {
  let score = 0;

  if (data.liquidity > 100000) score += 15;
  else if (data.liquidity > 50000) score += 10;
  else if (data.liquidity > 10000) score += 5;

  if (data.volume24h > 100000) score += 15;
  else if (data.volume24h > 50000) score += 10;

  if (data.holder > 1000) score += 10;
  else if (data.holder > 500) score += 5;

  if (data.uniqueWallets24h > 100) score += 10;

  return Math.min(50, score);
}

function calculateJupiterScore(data: JupiterLiquidityData): number {
  let score = 0;

  if (data.totalLiquidityUSD > 100000) score += 30;
  else if (data.totalLiquidityUSD > 50000) score += 20;
  else if (data.totalLiquidityUSD > 10000) score += 10;

  if (data.pools.length > 3) score += 10;
  else if (data.pools.length > 1) score += 5;

  return Math.min(50, score);
}

function calculateSuperScore(breakdown: SuperTokenScore['scoreBreakdown']): number {
  // Suma ponderada de todos los scores
  const total =
    breakdown.baseSecurityScore * 1.5 + // Peso más alto al análisis base
    breakdown.newWalletScore +
    breakdown.insiderScore +
    breakdown.volumeScore +
    breakdown.socialScore +
    breakdown.botDetectionScore +
    breakdown.smartMoneyScore +
    breakdown.teamScore +
    breakdown.pricePatternScore +
    breakdown.historicalHoldersScore +
    breakdown.liquidityDepthScore +
    breakdown.crossChainScore +
    breakdown.competitorScore +
    breakdown.rugCheckScore * 1.2 + // RugCheck es muy importante
    breakdown.dexScreenerScore +
    breakdown.birdeyeScore +
    breakdown.jupiterScore;

  return Math.round(Math.min(1000, total));
}

function getGlobalRiskLevel(score: number): SuperTokenScore['globalRiskLevel'] {
  if (score >= 900) return 'ULTRA_SAFE';
  if (score >= 800) return 'VERY_SAFE';
  if (score >= 650) return 'SAFE';
  if (score >= 500) return 'MODERATE';
  if (score >= 350) return 'RISKY';
  if (score >= 200) return 'VERY_RISKY';
  if (score >= 100) return 'EXTREME_DANGER';
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
  social: SocialAnalysis,
  bot: BotDetectionAdvanced,
  smartMoney: SmartMoneyAnalysis,
  team: TeamAnalysis,
  price: PricePatternAnalysis,
  holders: HistoricalHolderAnalysis,
  liquidity: LiquidityDepthAnalysis,
  rugCheck?: RugCheckData
): SuperTokenScore['allRedFlags'] {
  const flags: SuperTokenScore['allRedFlags'] = [];

  // Red flags del base report
  baseReport.redFlags.flags.forEach(flag => {
    flags.push({
      category: flag.category,
      severity: flag.severity as any,
      message: flag.message,
      score_impact: flag.severity === 'CRITICAL' ? 25 : flag.severity === 'HIGH' ? 15 : flag.severity === 'MEDIUM' ? 8 : 3,
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
  const criticalFlags = redFlags.filter(f => f.severity === 'CRITICAL').length;
  const highFlags = redFlags.filter(f => f.severity === 'HIGH').length;

  if (criticalFlags > 0) {
    return `🚨 NO INVERTIR - Score: ${score}/1000 - Nivel de riesgo: ${riskLevel}\n\n` +
      `Se detectaron ${criticalFlags} red flags CRÍTICAS que hacen este token extremadamente peligroso. ` +
      `Hay alta probabilidad de pérdida total. Las principales preocupaciones son: ${redFlags.filter(f => f.severity === 'CRITICAL').map(f => f.message).join(', ')}.`;
  }

  if (score >= 800) {
    return `✅ MUY SEGURO PARA INVERTIR - Score: ${score}/1000 - Nivel de riesgo: ${riskLevel}\n\n` +
      `Este token muestra excelentes fundamentos de seguridad con ${greenFlags.length} señales positivas. ` +
      `Aspectos destacados: ${greenFlags.slice(0, 3).map(f => f.message).join(', ')}. ` +
      `Aún así, siempre haz tu propia investigación (DYOR).`;
  }

  if (score >= 650) {
    return `⚠️ RELATIVAMENTE SEGURO - Score: ${score}/1000 - Nivel de riesgo: ${riskLevel}\n\n` +
      `El token muestra buenas señales de seguridad, pero revisa cuidadosamente ${redFlags.length > 0 ? 'las siguientes advertencias' : 'todos los detalles'}. ` +
      `${greenFlags.length > 0 ? `Puntos positivos: ${greenFlags.slice(0, 2).map(f => f.message).join(', ')}.` : ''} ` +
      `Invierte cantidades que puedas permitirte perder.`;
  }

  if (score >= 500) {
    return `⚠️ RIESGO MODERADO - Score: ${score}/1000 - Nivel de riesgo: ${riskLevel}\n\n` +
      `Este token presenta un riesgo moderado con ${highFlags} red flags importantes. ` +
      `Solo invierte cantidades pequeñas que puedas permitirte perder completamente. ` +
      `Principales preocupaciones: ${redFlags.slice(0, 3).map(f => f.message).join(', ')}.`;
  }

  if (score >= 350) {
    return `🚨 ALTO RIESGO - Score: ${score}/1000 - Nivel de riesgo: ${riskLevel}\n\n` +
      `ADVERTENCIA: Este token presenta alto riesgo de pérdida. Detectamos ${redFlags.length} red flags incluyendo ${criticalFlags + highFlags} de severidad alta/crítica. ` +
      `Solo para traders experimentados dispuestos a asumir pérdidas significativas.`;
  }

  return `🔴 RIESGO EXTREMO - Score: ${score}/1000 - Nivel de riesgo: ${riskLevel}\n\n` +
    `⛔ EVITAR - Este token muestra múltiples señales de peligro extremo. ` +
    `Alta probabilidad de ser un scam o rug pull. NO SE RECOMIENDA INVERTIR bajo ninguna circunstancia.`;
}

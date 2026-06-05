import { WalletMetrics } from './metricsEngine';

export interface Badge {
  name: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  condition: (metrics: WalletMetrics) => boolean;
}

export const BADGES: Badge[] = [
  // ============================================================================
  // VOLUME BADGES
  // ============================================================================
  {
    name: 'Whale Trader',
    description: 'Trade over 1000 SOL in volume',
    icon: '🐋',
    rarity: 'LEGENDARY',
    condition: (m) => m.totalVolume >= 1000,
  },
  {
    name: 'Volume King',
    description: 'Trade over 500 SOL in volume',
    icon: '👑',
    rarity: 'EPIC',
    condition: (m) => m.totalVolume >= 500,
  },
  {
    name: 'High Roller',
    description: 'Trade over 100 SOL in volume',
    icon: '🎰',
    rarity: 'RARE',
    condition: (m) => m.totalVolume >= 100,
  },
  {
    name: 'Active Trader',
    description: 'Complete 100+ trades',
    icon: '📊',
    rarity: 'COMMON',
    condition: (m) => m.totalTrades >= 100,
  },

  // ============================================================================
  // WIN RATE BADGES
  // ============================================================================
  {
    name: 'Perfect Record',
    description: 'Achieve 100% win rate (min 10 trades)',
    icon: '💯',
    rarity: 'LEGENDARY',
    condition: (m) => m.winRate === 100 && m.totalTrades >= 10,
  },
  {
    name: 'Sharpshooter',
    description: 'Maintain 80%+ win rate',
    icon: '🎯',
    rarity: 'EPIC',
    condition: (m) => m.winRate >= 80,
  },
  {
    name: 'Consistent Winner',
    description: 'Maintain 60%+ win rate',
    icon: '✅',
    rarity: 'RARE',
    condition: (m) => m.winRate >= 60,
  },

  // ============================================================================
  // PROFIT BADGES
  // ============================================================================
  {
    name: 'Profit Master',
    description: 'Make over 100 SOL in profit',
    icon: '💰',
    rarity: 'LEGENDARY',
    condition: (m) => m.profitLoss >= 100,
  },
  {
    name: 'Money Maker',
    description: 'Make over 50 SOL in profit',
    icon: '💵',
    rarity: 'EPIC',
    condition: (m) => m.profitLoss >= 50,
  },
  {
    name: 'In The Green',
    description: 'Make over 10 SOL in profit',
    icon: '💚',
    rarity: 'RARE',
    condition: (m) => m.profitLoss >= 10,
  },
  {
    name: 'First Profit',
    description: 'Make your first profitable trade',
    icon: '🌱',
    rarity: 'COMMON',
    condition: (m) => m.profitLoss > 0,
  },

  // ============================================================================
  // RUG SURVIVAL BADGES (NUEVO)
  // ============================================================================
  {
    name: 'Rug Survivor Legend',
    description: 'Survived 10+ rug pulls by selling in time',
    icon: '🛡️',
    rarity: 'LEGENDARY',
    condition: (m) => m.rugsSurvived >= 10,
  },
  {
    name: 'Rug Detector',
    description: 'Survived 5+ rug pulls',
    icon: '🔍',
    rarity: 'EPIC',
    condition: (m) => m.rugsSurvived >= 5,
  },
  {
    name: 'Quick Exit',
    description: 'Survived 3+ rug pulls',
    icon: '🚪',
    rarity: 'RARE',
    condition: (m) => m.rugsSurvived >= 3,
  },
  {
    name: 'Rug Survivor',
    description: 'Survived at least 1 rug pull',
    icon: '✊',
    rarity: 'COMMON',
    condition: (m) => m.rugsSurvived >= 1,
  },
  {
    name: 'Rug Magnet',
    description: 'Got caught in 5+ rug pulls',
    icon: '🎪',
    rarity: 'RARE',
    condition: (m) => m.rugsCaught >= 5,
  },
  {
    name: 'Exit Liquidity',
    description: 'Got caught in 10+ rug pulls',
    icon: '💸',
    rarity: 'EPIC',
    condition: (m) => m.rugsCaught >= 10,
  },

  // ============================================================================
  // MOONSHOT BADGES (NUEVO)
  // ============================================================================
  {
    name: 'Moonshot Master',
    description: 'Hit 10+ trades with 10x+ gains',
    icon: '🚀',
    rarity: 'LEGENDARY',
    condition: (m) => m.moonshots >= 10,
  },
  {
    name: 'Gem Hunter',
    description: 'Hit 5+ moonshot trades (10x+ gains)',
    icon: '💎',
    rarity: 'EPIC',
    condition: (m) => m.moonshots >= 5,
  },
  {
    name: 'Lucky Finder',
    description: 'Hit 3+ moonshot trades',
    icon: '🍀',
    rarity: 'RARE',
    condition: (m) => m.moonshots >= 3,
  },
  {
    name: 'First Moonshot',
    description: 'Hit your first 10x trade',
    icon: '🌙',
    rarity: 'COMMON',
    condition: (m) => m.moonshots >= 1,
  },

  // ============================================================================
  // TRADING STYLE BADGES (NUEVO)
  // ============================================================================
  {
    name: 'Scalper King',
    description: 'Made 100+ trades in less than 1 hour',
    icon: '⚡',
    rarity: 'EPIC',
    condition: (m) => m.quickFlips >= 100,
  },
  {
    name: 'Quick Flipper',
    description: 'Made 50+ trades in less than 1 hour',
    icon: '🔄',
    rarity: 'RARE',
    condition: (m) => m.quickFlips >= 50,
  },
  {
    name: 'Speed Trader',
    description: 'Made 20+ quick flips',
    icon: '💨',
    rarity: 'COMMON',
    condition: (m) => m.quickFlips >= 20,
  },
  {
    name: 'Diamond Hands Legend',
    description: 'Held 50+ positions for over a week',
    icon: '💎🙌',
    rarity: 'LEGENDARY',
    condition: (m) => m.diamondHands >= 50,
  },
  {
    name: 'Patient Trader',
    description: 'Held 20+ positions for over a week',
    icon: '⏳',
    rarity: 'EPIC',
    condition: (m) => m.diamondHands >= 20,
  },
  {
    name: 'HODLer',
    description: 'Held 5+ positions for over a week',
    icon: '🤝',
    rarity: 'RARE',
    condition: (m) => m.diamondHands >= 5,
  },

  // ============================================================================
  // WIN STREAK BADGES (NUEVO)
  // ============================================================================
  {
    name: 'Unstoppable',
    description: 'Win streak of 20+ trades',
    icon: '🔥',
    rarity: 'LEGENDARY',
    condition: (m) => m.longestWinStreak >= 20,
  },
  {
    name: 'On Fire',
    description: 'Win streak of 10+ trades',
    icon: '🌟',
    rarity: 'EPIC',
    condition: (m) => m.longestWinStreak >= 10,
  },
  {
    name: 'Hot Streak',
    description: 'Win streak of 5+ trades',
    icon: '🎲',
    rarity: 'RARE',
    condition: (m) => m.longestWinStreak >= 5,
  },

  // ============================================================================
  // TRADING FREQUENCY BADGES
  // ============================================================================
  {
    name: 'Day Trader',
    description: 'Trade for 30+ different days',
    icon: '📅',
    rarity: 'EPIC',
    condition: (m) => m.tradingDays >= 30,
  },
  {
    name: 'Weekly Warrior',
    description: 'Trade for 7+ different days',
    icon: '⚔️',
    rarity: 'RARE',
    condition: (m) => m.tradingDays >= 7,
  },
  {
    name: 'Getting Started',
    description: 'Complete your first trade',
    icon: '🚀',
    rarity: 'COMMON',
    condition: (m) => m.totalTrades >= 1,
  },

  // ============================================================================
  // SPECIAL ACHIEVEMENTS
  // ============================================================================
  {
    name: 'Big Win',
    description: 'Hit a single trade worth 50+ SOL profit',
    icon: '🎆',
    rarity: 'EPIC',
    condition: (m) => m.bestTrade >= 50,
  },
  {
    name: 'Lucky Strike',
    description: 'Hit a single trade worth 10+ SOL profit',
    icon: '🍀',
    rarity: 'RARE',
    condition: (m) => m.bestTrade >= 10,
  },
  {
    name: 'Comeback Kid',
    description: 'Be profitable despite having significant losses',
    icon: '🔄',
    rarity: 'EPIC',
    condition: (m) => m.worstTrade < -20 && m.profitLoss > 50,
  },
  {
    name: 'Survivor',
    description: 'Still trading after experiencing a major loss',
    icon: '🛡️',
    rarity: 'RARE',
    condition: (m) => m.worstTrade < -10 && m.totalTrades >= 20,
  },

  // ============================================================================
  // DEGEN SCORE BADGES
  // ============================================================================
  {
    name: 'Degen Legend',
    description: 'Score 90+ Degen Score',
    icon: '🔥',
    rarity: 'LEGENDARY',
    condition: (m) => m.degenScore >= 90,
  },
  {
    name: 'True Degen',
    description: 'Score 75+ Degen Score',
    icon: '⭐',
    rarity: 'EPIC',
    condition: (m) => m.degenScore >= 75,
  },
  {
    name: 'Certified Degen',
    description: 'Score 60+ Degen Score',
    icon: '✨',
    rarity: 'RARE',
    condition: (m) => m.degenScore >= 60,
  },

  // ============================================================================
  // ENDURANCE BADGES
  // ============================================================================
  {
    name: 'Marathon Trader',
    description: 'Complete 500+ trades',
    icon: '🏃',
    rarity: 'EPIC',
    condition: (m) => m.totalTrades >= 500,
  },
  {
    name: 'Veteran',
    description: 'Complete 250+ trades',
    icon: '🎖️',
    rarity: 'RARE',
    condition: (m) => m.totalTrades >= 250,
  },

  // ============================================================================
  // VOLATILITY BADGES (NUEVO)
  // ============================================================================
  {
    name: 'Steady Eddie',
    description: 'Low volatility with consistent gains',
    icon: '📈',
    rarity: 'EPIC',
    condition: (m) => m.volatilityScore < 20 && m.profitLoss > 10,
  },
  {
    name: 'Degen Gambler',
    description: 'Extremely high volatility trader',
    icon: '🎰',
    rarity: 'RARE',
    condition: (m) => m.volatilityScore > 80,
  },
];

/**
 * Calcula qué badges ha desbloqueado un usuario
 */
export function calculateUnlockedBadges(metrics: WalletMetrics): Badge[] {
  return BADGES.filter((badge) => badge.condition(metrics));
}

/**
 * Calcula el nivel basado en XP (XP viene del degen score y métricas)
 */
export function calculateLevel(metrics: WalletMetrics): number {
  // XP = degenScore * 10 + totalTrades + (totalVolume / 10) + rugsSurvived * 5 + moonshots * 10
  const xp =
    metrics.degenScore * 10 +
    metrics.totalTrades +
    Math.floor(metrics.totalVolume / 10) +
    metrics.rugsSurvived * 5 +
    metrics.moonshots * 10;

  // Cada nivel requiere más XP: Level 1 = 0, Level 2 = 100, Level 3 = 300, etc.
  let level = 1;
  let requiredXp = 0;

  while (xp >= requiredXp) {
    level++;
    requiredXp += level * 100;
  }

  return Math.max(1, level - 1);
}

/**
 * Calcula XP total
 */
export function calculateXP(metrics: WalletMetrics): number {
  return (
    metrics.degenScore * 10 +
    metrics.totalTrades +
    Math.floor(metrics.totalVolume / 10) +
    metrics.rugsSurvived * 5 +
    metrics.moonshots * 10
  );
}

/**
 * Obtiene el XP necesario para el siguiente nivel
 */
export function getXPForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

/**
 * Obtiene las badges por rareza
 */
export function getBadgesByRarity(badges: Badge[]): Record<string, Badge[]> {
  return {
    LEGENDARY: badges.filter((b) => b.rarity === 'LEGENDARY'),
    EPIC: badges.filter((b) => b.rarity === 'EPIC'),
    RARE: badges.filter((b) => b.rarity === 'RARE'),
    COMMON: badges.filter((b) => b.rarity === 'COMMON'),
  };
}

/**
 * Obtiene un resumen de los logros más importantes
 */
export function getAchievementSummary(metrics: WalletMetrics): {
  highlights: string[];
  warnings: string[];
} {
  const highlights: string[] = [];
  const warnings: string[] = [];

  // Highlights
  if (metrics.rugsSurvived > 5) {
    highlights.push(`Survived ${metrics.rugsSurvived} rug pulls like a pro!`);
  }
  if (metrics.moonshots > 3) {
    highlights.push(`Hit ${metrics.moonshots} moonshot trades (10x+)`);
  }
  if (metrics.winRate > 70) {
    highlights.push(`Impressive ${metrics.winRate.toFixed(0)}% win rate`);
  }
  if (metrics.profitLoss > 50) {
    highlights.push(`${metrics.profitLoss.toFixed(1)} SOL in total profits`);
  }
  if (metrics.longestWinStreak > 10) {
    highlights.push(`Epic win streak of ${metrics.longestWinStreak} trades`);
  }

  // Warnings
  if (metrics.rugsCaught > 3) {
    warnings.push(
      `Caught in ${metrics.rugsCaught} rug pulls (-${metrics.totalRugValue.toFixed(1)} SOL)`
    );
  }
  if (metrics.profitLoss < -10) {
    warnings.push(`Net loss of ${Math.abs(metrics.profitLoss).toFixed(1)} SOL`);
  }
  if (metrics.winRate < 30 && metrics.totalTrades > 10) {
    warnings.push(`Low win rate (${metrics.winRate.toFixed(0)}%) - be more selective`);
  }

  return { highlights, warnings };
}

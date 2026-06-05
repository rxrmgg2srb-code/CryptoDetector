// Define la estructura esperada para el Badge
export interface Badge {
  name: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

// Define la estructura mínima de métricas requeridas
interface Metrics {
  totalTrades: number;
  winRate: number;
  totalVolume: number;
  tradingDays: number;
  moonshots: number;
}

/**
 * Genera una lista de badges basados en las métricas avanzadas de trading.
 * @param metrics Las métricas calculadas por calculateAdvancedMetrics.
 * @returns Array de objetos Badge.
 */
export function generateBadges(metrics: Metrics): Badge[] {
  const badges: Badge[] = [];

  // Lógica de Badges (extraída de tu API handler)

  if (metrics.totalTrades > 100) {
    badges.push({
      name: 'Active Trader',
      description: `${metrics.totalTrades} trades executed`,
      icon: '📈',
      rarity: 'COMMON',
    });
  }

  if (metrics.totalTrades > 500) {
    badges.push({
      name: 'Volume King',
      description: `${metrics.totalTrades} trades`,
      icon: '👑',
      rarity: 'RARE',
    });
  }

  if (metrics.winRate > 60) {
    badges.push({
      name: 'Winning Streak',
      description: `${metrics.winRate.toFixed(1)}% win rate`,
      icon: '🔥',
      rarity: 'EPIC',
    });
  }

  if (metrics.totalVolume > 1000) {
    badges.push({
      name: 'Whale',
      description: `${metrics.totalVolume.toFixed(0)} SOL volume`,
      icon: '🐋',
      rarity: 'LEGENDARY',
    });
  }

  if (metrics.tradingDays > 30) {
    badges.push({
      name: 'Consistent Trader',
      description: `Active for ${metrics.tradingDays} days`,
      icon: '📅',
      rarity: 'RARE',
    });
  }

  if (metrics.moonshots > 5) {
    badges.push({
      name: 'Moonshot Hunter',
      description: `${metrics.moonshots} big wins`,
      icon: '🚀',
      rarity: 'EPIC',
    });
  }

  return badges;
}

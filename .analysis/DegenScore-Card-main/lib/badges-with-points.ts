// Sistema de Badges con Puntuación
// Cada rarity tiene puntos asociados

export const BADGE_POINTS = {
  COMMON: 1,
  RARE: 3,
  EPIC: 5,
  LEGENDARY: 10,
  MYTHIC: 25,
} as const;

export type BadgeRarity = keyof typeof BADGE_POINTS;

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: 'volume' | 'pnl' | 'winrate' | 'activity' | 'social' | 'premium';
  threshold?: number;
  points: number;
}

// ═══════════════════════════════════════════════════════════════
// VOLUMEN TRADING (15 badges)
// ═══════════════════════════════════════════════════════════════

export const VOLUME_BADGES: BadgeDefinition[] = [
  {
    key: 'mini_degen',
    name: '🐣 Mini Degen',
    description: '1+ SOL traded',
    icon: '🐣',
    rarity: 'COMMON',
    category: 'volume',
    threshold: 1,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'starter_trader',
    name: '💼 Starter',
    description: '5+ SOL traded',
    icon: '💼',
    rarity: 'COMMON',
    category: 'volume',
    threshold: 5,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'fast_hands',
    name: '⚡ Fast Hands',
    description: '10+ SOL traded',
    icon: '⚡',
    rarity: 'COMMON',
    category: 'volume',
    threshold: 10,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'shark_trader',
    name: '🦈 Shark',
    description: '25+ SOL traded',
    icon: '🦈',
    rarity: 'RARE',
    category: 'volume',
    threshold: 25,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'hot_wallet',
    name: '🔥 Hot Wallet',
    description: '50+ SOL traded',
    icon: '🔥',
    rarity: 'RARE',
    category: 'volume',
    threshold: 50,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'baby_whale',
    name: '🐳 Baby Whale',
    description: '75+ SOL traded',
    icon: '🐳',
    rarity: 'RARE',
    category: 'volume',
    threshold: 75,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'solid_trader',
    name: '💎 Solid Trader',
    description: '100+ SOL traded',
    icon: '💎',
    rarity: 'EPIC',
    category: 'volume',
    threshold: 100,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'whale',
    name: '🐋 Whale',
    description: '150+ SOL traded',
    icon: '🐋',
    rarity: 'EPIC',
    category: 'volume',
    threshold: 150,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'volcano_wallet',
    name: '🌋 Volcano',
    description: '250+ SOL traded',
    icon: '🌋',
    rarity: 'EPIC',
    category: 'volume',
    threshold: 250,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'market_maker',
    name: '🪙 Market Maker',
    description: '300+ SOL traded',
    icon: '🪙',
    rarity: 'LEGENDARY',
    category: 'volume',
    threshold: 300,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'exec_whale',
    name: '💼 Executive Whale',
    description: '500+ SOL traded',
    icon: '💼',
    rarity: 'LEGENDARY',
    category: 'volume',
    threshold: 500,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'degen_king',
    name: '😈 Degen King',
    description: '750+ SOL traded',
    icon: '😈',
    rarity: 'LEGENDARY',
    category: 'volume',
    threshold: 750,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'alien_volume',
    name: '🛸 Alien Volume',
    description: '1000+ SOL traded',
    icon: '🛸',
    rarity: 'MYTHIC',
    category: 'volume',
    threshold: 1000,
    points: BADGE_POINTS.MYTHIC,
  },
  {
    key: 'extraterrestrial',
    name: '👽 Extraterrestrial',
    description: '2000+ SOL traded',
    icon: '👽',
    rarity: 'MYTHIC',
    category: 'volume',
    threshold: 2000,
    points: BADGE_POINTS.MYTHIC,
  },
  {
    key: 'god_volume',
    name: '⚡ Volume God',
    description: '5000+ SOL traded',
    icon: '⚡',
    rarity: 'MYTHIC',
    category: 'volume',
    threshold: 5000,
    points: BADGE_POINTS.MYTHIC,
  },
];

// ═══════════════════════════════════════════════════════════════
// PNL (Profit & Loss) (15 badges)
// ═══════════════════════════════════════════════════════════════

export const PNL_BADGES: BadgeDefinition[] = [
  // Ganancias
  {
    key: 'profit_rookie',
    name: '💰 Profit Rookie',
    description: '0.5+ SOL profit',
    icon: '💰',
    rarity: 'COMMON',
    category: 'pnl',
    threshold: 0.5,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'green_trader',
    name: '💵 Green Trader',
    description: '1+ SOL profit',
    icon: '💵',
    rarity: 'COMMON',
    category: 'pnl',
    threshold: 1,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'profit_machine',
    name: '🌿 Profit Machine',
    description: '3+ SOL profit',
    icon: '🌿',
    rarity: 'RARE',
    category: 'pnl',
    threshold: 3,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'energy_trader',
    name: '🔋 Energy Trader',
    description: '5+ SOL profit',
    icon: '🔋',
    rarity: 'RARE',
    category: 'pnl',
    threshold: 5,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'green_giant',
    name: '💚 Green Giant',
    description: '10+ SOL profit',
    icon: '💚',
    rarity: 'EPIC',
    category: 'pnl',
    threshold: 10,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'profit_wizard',
    name: '🧙‍♂️ Profit Wizard',
    description: '25+ SOL profit',
    icon: '🧙‍♂️',
    rarity: 'EPIC',
    category: 'pnl',
    threshold: 25,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'eagle_eye',
    name: '🦅 Eagle Eye',
    description: '40+ SOL profit',
    icon: '🦅',
    rarity: 'LEGENDARY',
    category: 'pnl',
    threshold: 40,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'green_god',
    name: '🟢 Green God',
    description: '75+ SOL profit',
    icon: '🟢',
    rarity: 'LEGENDARY',
    category: 'pnl',
    threshold: 75,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'profit_titan',
    name: '🧬 Profit Titan',
    description: '100+ SOL profit',
    icon: '🧬',
    rarity: 'MYTHIC',
    category: 'pnl',
    threshold: 100,
    points: BADGE_POINTS.MYTHIC,
  },

  // Pérdidas (humor)
  {
    key: 'rug_victim',
    name: '☠️ Rug Victim',
    description: '-1 SOL loss',
    icon: '☠️',
    rarity: 'COMMON',
    category: 'pnl',
    threshold: -1,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'rug_survivor',
    name: '💀 Rug Survivor',
    description: '-3 SOL loss',
    icon: '💀',
    rarity: 'RARE',
    category: 'pnl',
    threshold: -3,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'clown_badge',
    name: '🤡 Clown',
    description: '-5 SOL loss',
    icon: '🤡',
    rarity: 'RARE',
    category: 'pnl',
    threshold: -5,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'comedy_trader',
    name: '🎭 Comedy Trader',
    description: '-10 SOL loss',
    icon: '🎭',
    rarity: 'EPIC',
    category: 'pnl',
    threshold: -10,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'wallet_funeral',
    name: '🪦 Wallet Funeral',
    description: '-20 SOL loss',
    icon: '🪦',
    rarity: 'LEGENDARY',
    category: 'pnl',
    threshold: -20,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'nuke_wallet',
    name: '🧨 Nuked Wallet',
    description: '-30 SOL loss',
    icon: '🧨',
    rarity: 'MYTHIC',
    category: 'pnl',
    threshold: -30,
    points: BADGE_POINTS.MYTHIC,
  },
];

// ═══════════════════════════════════════════════════════════════
// WIN RATE (10 badges)
// ═══════════════════════════════════════════════════════════════

export const WINRATE_BADGES: BadgeDefinition[] = [
  {
    key: 'accurate',
    name: '🎯 Accurate',
    description: '50%+ win rate',
    icon: '🎯',
    rarity: 'COMMON',
    category: 'winrate',
    threshold: 50,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'sniper',
    name: '🎖️ Sniper',
    description: '60%+ win rate',
    icon: '🎖️',
    rarity: 'RARE',
    category: 'winrate',
    threshold: 60,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'ice_sniper',
    name: '🧊 Ice Sniper',
    description: '70%+ win rate',
    icon: '🧊',
    rarity: 'RARE',
    category: 'winrate',
    threshold: 70,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'elite_sniper',
    name: '🏅 Elite Sniper',
    description: '75%+ win rate',
    icon: '🏅',
    rarity: 'EPIC',
    category: 'winrate',
    threshold: 75,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'golden_aim',
    name: '🏆 Golden Aim',
    description: '80%+ win rate',
    icon: '🏆',
    rarity: 'EPIC',
    category: 'winrate',
    threshold: 80,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'bowmaster',
    name: '🏹 Bowmaster',
    description: '85%+ win rate',
    icon: '🏹',
    rarity: 'LEGENDARY',
    category: 'winrate',
    threshold: 85,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'perfect_shot',
    name: '🔥 Perfect Shot',
    description: '90%+ win rate',
    icon: '🔥',
    rarity: 'LEGENDARY',
    category: 'winrate',
    threshold: 90,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'zen_trader',
    name: '⛩️ Zen Trader',
    description: '95%+ win rate',
    icon: '⛩️',
    rarity: 'MYTHIC',
    category: 'winrate',
    threshold: 95,
    points: BADGE_POINTS.MYTHIC,
  },
  {
    key: 'god_accuracy',
    name: '⚜️ God Accuracy',
    description: '98%+ win rate',
    icon: '⚜️',
    rarity: 'MYTHIC',
    category: 'winrate',
    threshold: 98,
    points: BADGE_POINTS.MYTHIC,
  },
  {
    key: 'perfect_trader',
    name: '⭐ Perfect',
    description: '100% win rate',
    icon: '⭐',
    rarity: 'MYTHIC',
    category: 'winrate',
    threshold: 100,
    points: BADGE_POINTS.MYTHIC,
  },
];

// ═══════════════════════════════════════════════════════════════
// ACTIVIDAD (10 badges)
// ═══════════════════════════════════════════════════════════════

export const ACTIVITY_BADGES: BadgeDefinition[] = [
  {
    key: 'active_trader',
    name: '📈 Active Trader',
    description: '100+ trades',
    icon: '📈',
    rarity: 'COMMON',
    category: 'activity',
    threshold: 100,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'volume_king',
    name: '👑 Volume King',
    description: '500+ trades',
    icon: '👑',
    rarity: 'RARE',
    category: 'activity',
    threshold: 500,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'consistent_trader',
    name: '📅 Consistent',
    description: '30+ days trading',
    icon: '📅',
    rarity: 'RARE',
    category: 'activity',
    threshold: 30,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'moonshot_hunter',
    name: '🚀 Moonshot Hunter',
    description: '5+ big wins',
    icon: '🚀',
    rarity: 'EPIC',
    category: 'activity',
    threshold: 5,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'trading_veteran',
    name: '🎖️ Veteran',
    description: '1000+ trades',
    icon: '🎖️',
    rarity: 'EPIC',
    category: 'activity',
    threshold: 1000,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'diamond_hands',
    name: '💎🙌 Diamond Hands',
    description: '10+ long holds',
    icon: '💎',
    rarity: 'LEGENDARY',
    category: 'activity',
    threshold: 10,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'trading_machine',
    name: '🤖 Trading Machine',
    description: '2000+ trades',
    icon: '🤖',
    rarity: 'LEGENDARY',
    category: 'activity',
    threshold: 2000,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'immortal_trader',
    name: '⚡ Immortal',
    description: '90+ days trading',
    icon: '⚡',
    rarity: 'MYTHIC',
    category: 'activity',
    threshold: 90,
    points: BADGE_POINTS.MYTHIC,
  },
  {
    key: 'degen_god',
    name: '😈 Degen God',
    description: '5000+ trades',
    icon: '😈',
    rarity: 'MYTHIC',
    category: 'activity',
    threshold: 5000,
    points: BADGE_POINTS.MYTHIC,
  },
  {
    key: 'eternal_degen',
    name: '👑 Eternal Degen',
    description: '365+ days trading',
    icon: '👑',
    rarity: 'MYTHIC',
    category: 'activity',
    threshold: 365,
    points: BADGE_POINTS.MYTHIC,
  },
];

// ═══════════════════════════════════════════════════════════════
// 🐋 WHALE TRACKER BADGES (NEW - Based on 500+ trades analysis)
// These badges require extensive trade history to unlock
// ═══════════════════════════════════════════════════════════════

export const WHALE_TRACKER_BADGES: BadgeDefinition[] = [
  // Rug Survival Badges
  {
    key: 'rug_survivor_bronze',
    name: '🛡️ Rug Survivor',
    description: 'Survived 3+ rugs',
    icon: '🛡️',
    rarity: 'RARE',
    category: 'activity',
    threshold: 3,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'rug_survivor_silver',
    name: '⚔️ Rug Warrior',
    description: 'Survived 5+ rugs still profitable',
    icon: '⚔️',
    rarity: 'EPIC',
    category: 'activity',
    threshold: 5,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'rug_survivor_gold',
    name: '🏰 Rug Fortress',
    description: 'Survived 10+ rugs still profitable',
    icon: '🏰',
    rarity: 'LEGENDARY',
    category: 'activity',
    threshold: 10,
    points: BADGE_POINTS.LEGENDARY,
  },

  // Consistency Badges (based on 500+ trades)
  {
    key: 'steady_hands',
    name: '🧘 Steady Hands',
    description: 'Consistent profit over 100+ trades',
    icon: '🧘',
    rarity: 'EPIC',
    category: 'activity',
    threshold: 100,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'profit_streak',
    name: '🔥 Profit Streak',
    description: '10+ winning trades in a row',
    icon: '🔥',
    rarity: 'LEGENDARY',
    category: 'activity',
    threshold: 10,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'comeback_king',
    name: '🦅 Comeback King',
    description: 'Recovered from -50% drawdown to profit',
    icon: '🦅',
    rarity: 'LEGENDARY',
    category: 'activity',
    threshold: 50,
    points: BADGE_POINTS.LEGENDARY,
  },

  // Early Mover Badges
  {
    key: 'early_bird',
    name: '🐦 Early Bird',
    description: 'Bought 5+ tokens in first 1 hour',
    icon: '🐦',
    rarity: 'RARE',
    category: 'activity',
    threshold: 5,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'alpha_hunter',
    name: '🎯 Alpha Hunter',
    description: 'Found 3+ 10x gems early',
    icon: '🎯',
    rarity: 'EPIC',
    category: 'activity',
    threshold: 3,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'memecoin_master',
    name: '🐸 Memecoin Master',
    description: 'Profitable in 20+ different memecoins',
    icon: '🐸',
    rarity: 'LEGENDARY',
    category: 'activity',
    threshold: 20,
    points: BADGE_POINTS.LEGENDARY,
  },

  // Whale Status Badges
  {
    key: 'shark_status',
    name: '🦈 Shark Status',
    description: '$1,000+ volume + 55%+ win rate',
    icon: '🦈',
    rarity: 'EPIC',
    category: 'activity',
    threshold: 1000,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'whale_status',
    name: '🐋 Whale Status',
    description: '$10,000+ volume + 60%+ win rate',
    icon: '🐋',
    rarity: 'LEGENDARY',
    category: 'activity',
    threshold: 10000,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'megawhale_status',
    name: '🌊 Megawhale',
    description: '$100,000+ volume + 65%+ win rate',
    icon: '🌊',
    rarity: 'MYTHIC',
    category: 'activity',
    threshold: 100000,
    points: BADGE_POINTS.MYTHIC,
  },

  // Trading Pattern Badges
  {
    key: 'quick_flipper',
    name: '⚡ Quick Flipper',
    description: '50+ profitable trades under 1 hour',
    icon: '⚡',
    rarity: 'RARE',
    category: 'activity',
    threshold: 50,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'swing_trader',
    name: '📊 Swing Trader',
    description: '20+ profitable trades held 1-7 days',
    icon: '📊',
    rarity: 'EPIC',
    category: 'activity',
    threshold: 20,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'patient_investor',
    name: '🧠 Patient Investor',
    description: '10+ profitable trades held 30+ days',
    icon: '🧠',
    rarity: 'LEGENDARY',
    category: 'activity',
    threshold: 10,
    points: BADGE_POINTS.LEGENDARY,
  },
];

// ═══════════════════════════════════════════════════════════════
// SOCIAL / REFERIDOS (5 badges)
// ═══════════════════════════════════════════════════════════════

export const SOCIAL_BADGES: BadgeDefinition[] = [
  {
    key: 'networker',
    name: '🤝 Networker',
    description: '1+ referral',
    icon: '🤝',
    rarity: 'COMMON',
    category: 'social',
    threshold: 1,
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'influencer',
    name: '📢 Influencer',
    description: '5+ referrals',
    icon: '📢',
    rarity: 'RARE',
    category: 'social',
    threshold: 5,
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'viral_trader',
    name: '🔥 Viral Trader',
    description: '10+ referrals',
    icon: '🔥',
    rarity: 'EPIC',
    category: 'social',
    threshold: 10,
    points: BADGE_POINTS.EPIC,
  },
  {
    key: 'mega_influencer',
    name: '🌟 Mega Influencer',
    description: '25+ referrals',
    icon: '🌟',
    rarity: 'LEGENDARY',
    category: 'social',
    threshold: 25,
    points: BADGE_POINTS.LEGENDARY,
  },
  {
    key: 'ambassador',
    name: '👑 Ambassador',
    description: '50+ referrals',
    icon: '👑',
    rarity: 'MYTHIC',
    category: 'social',
    threshold: 50,
    points: BADGE_POINTS.MYTHIC,
  },
];

// ═══════════════════════════════════════════════════════════════
// PREMIUM (5 badges)
// ═══════════════════════════════════════════════════════════════

export const PREMIUM_BADGES: BadgeDefinition[] = [
  {
    key: 'premium_trader',
    name: '💎 Premium',
    description: 'Premium member',
    icon: '💎',
    rarity: 'RARE',
    category: 'premium',
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'logo_pro',
    name: '🎨 Logo Pro',
    description: 'Custom logo',
    icon: '🎨',
    rarity: 'RARE',
    category: 'premium',
    points: BADGE_POINTS.RARE,
  },
  {
    key: 'social_flex',
    name: '🐦 Social Flex',
    description: 'Linked Twitter',
    icon: '🐦',
    rarity: 'COMMON',
    category: 'premium',
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'telegram_verified',
    name: '✈️ Telegram',
    description: 'Linked Telegram',
    icon: '✈️',
    rarity: 'COMMON',
    category: 'premium',
    points: BADGE_POINTS.COMMON,
  },
  {
    key: 'full_profile',
    name: '⭐ Full Profile',
    description: 'Complete profile',
    icon: '⭐',
    rarity: 'EPIC',
    category: 'premium',
    points: BADGE_POINTS.EPIC,
  },
];

// ═══════════════════════════════════════════════════════════════
// TODOS LOS BADGES COMBINADOS
// ═══════════════════════════════════════════════════════════════

export const ALL_BADGES: BadgeDefinition[] = [
  ...VOLUME_BADGES,
  ...PNL_BADGES,
  ...WINRATE_BADGES,
  ...ACTIVITY_BADGES,
  ...WHALE_TRACKER_BADGES,
  ...SOCIAL_BADGES,
  ...PREMIUM_BADGES,
];

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE CHECKING
// ═══════════════════════════════════════════════════════════════

interface CardMetrics {
  totalVolume: number;
  profitLoss: number;
  winRate: number;
  totalTrades: number;
  tradingDays: number;
  moonshots: number;
  diamondHands: number;
  isPaid: boolean;
  twitter?: string | null;
  telegram?: string | null;
  profileImage?: string | null;
  displayName?: string | null;
}

export function calculateBadgePoints(badges: BadgeDefinition[]): number {
  return badges.reduce((total, badge) => total + badge.points, 0);
}

export function checkVolumeBadges(metrics: CardMetrics): BadgeDefinition[] {
  return VOLUME_BADGES.filter((badge) => metrics.totalVolume >= (badge.threshold || 0));
}

export function checkPnlBadges(metrics: CardMetrics): BadgeDefinition[] {
  return PNL_BADGES.filter((badge) => {
    const threshold = badge.threshold || 0;
    if (threshold < 0) {
      // Badges de pérdidas
      return metrics.profitLoss <= threshold;
    } else {
      // Badges de ganancias
      return metrics.profitLoss >= threshold;
    }
  });
}

export function checkWinRateBadges(metrics: CardMetrics): BadgeDefinition[] {
  return WINRATE_BADGES.filter((badge) => metrics.winRate >= (badge.threshold || 0));
}

export function checkActivityBadges(metrics: CardMetrics): BadgeDefinition[] {
  const badges: BadgeDefinition[] = [];

  // Badges basados en total trades
  const tradeBadges = [
    { key: 'active_trader', threshold: 100 },
    { key: 'volume_king', threshold: 500 },
    { key: 'trading_veteran', threshold: 1000 },
    { key: 'trading_machine', threshold: 2000 },
    { key: 'degen_god', threshold: 5000 },
  ];

  tradeBadges.forEach(({ key, threshold }) => {
    if (metrics.totalTrades >= threshold) {
      const badge = ACTIVITY_BADGES.find((b) => b.key === key);
      if (badge) {
        badges.push(badge);
      }
    }
  });

  // Badges basados en días de trading
  const dayBadges = [
    { key: 'consistent_trader', threshold: 30 },
    { key: 'immortal_trader', threshold: 90 },
    { key: 'eternal_degen', threshold: 365 },
  ];

  dayBadges.forEach(({ key, threshold }) => {
    if (metrics.tradingDays >= threshold) {
      const badge = ACTIVITY_BADGES.find((b) => b.key === key);
      if (badge) {
        badges.push(badge);
      }
    }
  });

  // Moonshot hunter
  if (metrics.moonshots >= 5) {
    const badge = ACTIVITY_BADGES.find((b) => b.key === 'moonshot_hunter');
    if (badge) {
      badges.push(badge);
    }
  }

  // Diamond hands
  if (metrics.diamondHands >= 10) {
    const badge = ACTIVITY_BADGES.find((b) => b.key === 'diamond_hands');
    if (badge) {
      badges.push(badge);
    }
  }

  return badges;
}

export function checkPremiumBadges(metrics: CardMetrics): BadgeDefinition[] {
  const badges: BadgeDefinition[] = [];

  if (metrics.isPaid) {
    const premiumBadge = PREMIUM_BADGES.find((b) => b.key === 'premium_trader');
    if (premiumBadge) {
      badges.push(premiumBadge);
    }
  }

  if (metrics.twitter) {
    const twitterBadge = PREMIUM_BADGES.find((b) => b.key === 'social_flex');
    if (twitterBadge) {
      badges.push(twitterBadge);
    }
  }

  if (metrics.telegram) {
    const telegramBadge = PREMIUM_BADGES.find((b) => b.key === 'telegram_verified');
    if (telegramBadge) {
      badges.push(telegramBadge);
    }
  }

  if (metrics.profileImage) {
    const logoBadge = PREMIUM_BADGES.find((b) => b.key === 'logo_pro');
    if (logoBadge) {
      badges.push(logoBadge);
    }
  }

  if (
    metrics.isPaid &&
    metrics.twitter &&
    metrics.telegram &&
    metrics.profileImage &&
    metrics.displayName
  ) {
    const fullProfileBadge = PREMIUM_BADGES.find((b) => b.key === 'full_profile');
    if (fullProfileBadge) {
      badges.push(fullProfileBadge);
    }
  }

  return badges;
}

/**
 * 🐋 Check Whale Tracker Badges
 * These badges require extensive trade history (500+ trades) to evaluate properly
 */
export function checkWhaleTrackerBadges(metrics: CardMetrics & {
  rugsSurvived?: number;
  longestWinStreak?: number;
  quickFlips?: number;
  uniqueTokensTraded?: number;
}): BadgeDefinition[] {
  const badges: BadgeDefinition[] = [];

  // Rug Survival Badges
  const rugsSurvived = metrics.rugsSurvived || 0;
  if (rugsSurvived >= 3) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'rug_survivor_bronze');
    if (badge) badges.push(badge);
  }
  if (rugsSurvived >= 5 && metrics.profitLoss > 0) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'rug_survivor_silver');
    if (badge) badges.push(badge);
  }
  if (rugsSurvived >= 10 && metrics.profitLoss > 0) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'rug_survivor_gold');
    if (badge) badges.push(badge);
  }

  // Consistency Badges
  if (metrics.totalTrades >= 100 && metrics.profitLoss > 0) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'steady_hands');
    if (badge) badges.push(badge);
  }

  const longestWinStreak = metrics.longestWinStreak || 0;
  if (longestWinStreak >= 10) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'profit_streak');
    if (badge) badges.push(badge);
  }

  // Whale Status Badges (based on volume + win rate)
  if (metrics.totalVolume >= 1000 && metrics.winRate >= 55) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'shark_status');
    if (badge) badges.push(badge);
  }
  if (metrics.totalVolume >= 10000 && metrics.winRate >= 60) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'whale_status');
    if (badge) badges.push(badge);
  }
  if (metrics.totalVolume >= 100000 && metrics.winRate >= 65) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'megawhale_status');
    if (badge) badges.push(badge);
  }

  // Trading Pattern Badges
  const quickFlips = metrics.quickFlips || 0;
  if (quickFlips >= 50) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'quick_flipper');
    if (badge) badges.push(badge);
  }

  // Diamond hands is already in activity badges - enhance with patient_investor
  if (metrics.diamondHands >= 10) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'patient_investor');
    if (badge) badges.push(badge);
  }

  // Memecoin Master - profitable in many different tokens
  const uniqueTokens = metrics.uniqueTokensTraded || 0;
  if (uniqueTokens >= 20 && metrics.profitLoss > 0) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'memecoin_master');
    if (badge) badges.push(badge);
  }

  // Alpha Hunter - found multiple 10x gems (moonshots)
  if (metrics.moonshots >= 3) {
    const badge = WHALE_TRACKER_BADGES.find((b) => b.key === 'alpha_hunter');
    if (badge) badges.push(badge);
  }

  return badges;
}

export function checkAllBadges(metrics: CardMetrics & {
  rugsSurvived?: number;
  longestWinStreak?: number;
  quickFlips?: number;
  uniqueTokensTraded?: number;
}): {
  badges: BadgeDefinition[];
  totalPoints: number;
} {
  const allUnlockedBadges: BadgeDefinition[] = [
    ...checkVolumeBadges(metrics),
    ...checkPnlBadges(metrics),
    ...checkWinRateBadges(metrics),
    ...checkActivityBadges(metrics),
    ...checkWhaleTrackerBadges(metrics),
    ...checkPremiumBadges(metrics),
  ];

  // Remover duplicados por key
  const uniqueBadges = Array.from(
    new Map(allUnlockedBadges.map((badge) => [badge.key, badge])).values()
  );

  const totalPoints = calculateBadgePoints(uniqueBadges);

  return {
    badges: uniqueBadges,
    totalPoints,
  };
}

// Helper para obtener color según rarity
export function getBadgeColor(rarity: BadgeRarity): string {
  const colors = {
    COMMON: 'text-gray-400',
    RARE: 'text-blue-400',
    EPIC: 'text-purple-400',
    LEGENDARY: 'text-yellow-400',
    MYTHIC: 'text-pink-400',
  };
  return colors[rarity];
}

export function getBadgeGlow(rarity: BadgeRarity): string {
  const glows = {
    COMMON: 'shadow-gray-500/20',
    RARE: 'shadow-blue-500/40',
    EPIC: 'shadow-purple-500/60',
    LEGENDARY: 'shadow-yellow-500/80',
    MYTHIC: 'shadow-pink-500/100',
  };
  return glows[rarity];
}

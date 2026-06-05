export interface LeaderboardEntry {
  id: string;
  walletAddress: string;
  degenScore: number;
  totalTrades: number;
  totalVolume: number;
  profitLoss: number;
  winRate: number;
  level: number;
  xp: number;
  bestTrade: number;
  worstTrade: number;
  badges: any[];
  mintedAt: string;
  displayName?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  profileImage?: string | null;
  isPaid?: boolean;
  likes: number;
  badgePoints?: number;
  referralCount?: number;
  calculatedBadges?: any[]; // Badges desbloqueados con su info completa
}

export interface Stats {
  totalCards: number;
  avgScore: number;
  topScore: number;
  totalVolume: number;
}

export type ViewMode = 'table' | 'cards';
export type SortBy = 'likes' | 'referralCount' | 'badgePoints' | 'newest' | 'oldest';

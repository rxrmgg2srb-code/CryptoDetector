export interface ExportableCard {
  walletAddress: string;
  displayName: string | null;
  degenScore: number;
  totalTrades: number;
  totalVolume: number;
  profitLoss: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
  avgTradeSize: number;
  totalFees: number;
  tradingDays: number;
  rugsSurvived: number;
  rugsCaught: number;
  moonshots: number;
  quickFlips: number;
  diamondHands: number;
  likes: number;
  badges: number;
  isPaid: boolean;
  tier: string;
  createdAt: string;
}

export function cardToExportable(card: any): ExportableCard {
  return {
    walletAddress: card.walletAddress,
    displayName: card.displayName,
    degenScore: card.degenScore,
    totalTrades: card.totalTrades,
    totalVolume: card.totalVolume,
    profitLoss: card.profitLoss,
    winRate: card.winRate,
    bestTrade: card.bestTrade,
    worstTrade: card.worstTrade,
    avgTradeSize: card.avgTradeSize,
    totalFees: card.totalFees,
    tradingDays: card.tradingDays,
    rugsSurvived: card.rugsSurvived,
    rugsCaught: card.rugsCaught,
    moonshots: card.moonshots,
    quickFlips: card.quickFlips,
    diamondHands: card.diamondHands,
    likes: card.likes,
    badges: card.badges?.length || 0,
    isPaid: card.isPaid,
    tier: card.isPaid ? 'PREMIUM' : 'FREE',
    createdAt: new Date(card.createdAt).toISOString(),
  };
}

export function convertToCSV(data: ExportableCard): string {
  const headers = Object.keys(data).join(',');
  const values = Object.values(data)
    .map((val) => {
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return val;
    })
    .join(',');

  return `${headers}\n${values}`;
}

export function convertToJSON(data: ExportableCard): string {
  return JSON.stringify(data, null, 2);
}

export function generateFileName(walletAddress: string, format: string): string {
  const shortWallet = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`;
  const timestamp = new Date().toISOString().split('T')[0];
  return `degenscore_${shortWallet}_${timestamp}.${format}`;
}

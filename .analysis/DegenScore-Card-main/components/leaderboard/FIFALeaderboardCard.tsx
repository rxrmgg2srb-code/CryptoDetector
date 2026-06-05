import React from 'react';
import FIFACard from '../FIFACard';
import { LeaderboardEntry } from './types';
import { getTierConfig } from './utils';

interface FIFALeaderboardCardProps {
  entry: LeaderboardEntry;
  index: number;
  handleLike: (cardId: string) => Promise<void>;
  userLikes: { [key: string]: boolean };
}

export const FIFALeaderboardCard = ({
  entry,
  index,
  handleLike,
  userLikes,
}: FIFALeaderboardCardProps) => {
  const tier = getTierConfig(entry.degenScore);

  // Convertir LeaderboardEntry a FIFACardProps
  const fifaCardProps = {
    rank: index + 1,
    walletAddress: entry.walletAddress,
    displayName: entry.displayName || undefined,
    profileImage: entry.profileImage || undefined,
    degenScore: entry.degenScore,
    tier: tier.name,
    stats: {
      winRate: entry.winRate,
      totalVolume: entry.totalVolume,
      profitLoss: entry.profitLoss,
      totalTrades: entry.totalTrades,
      avgHoldTime: undefined, // No disponible en LeaderboardEntry
      level: entry.level,
    },
    badges: entry.calculatedBadges || entry.badges || [],
    twitter: entry.twitter || undefined,
    telegram: entry.telegram || undefined,
    // Propiedades específicas del leaderboard
    id: entry.id,
    likes: entry.likes || 0,
    referralCount: entry.referralCount || 0,
    badgePoints: entry.badgePoints || 0,
    onLike: handleLike,
    userHasLiked: userLikes[entry.id] || false,
  };

  return <FIFACard {...fifaCardProps} />;
};

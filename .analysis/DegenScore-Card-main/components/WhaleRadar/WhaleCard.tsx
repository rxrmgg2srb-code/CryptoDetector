import React from 'react';
import { WhaleWallet } from '@/hooks/useWhaleRadar';
import { formatAddress, formatTime } from '@/lib/utils/whale-radar';

interface WhaleCardProps {
  whale: WhaleWallet;
  isFollowing: boolean;
  onFollow: (id: string) => void;
  onUnfollow: (id: string) => void;
  isAuthenticated: boolean;
}

// Determine whale tier based on volume and win rate
function getWhaleTier(volume: number, winRate: number): { tier: string; icon: string; color: string } {
  if (volume >= 100000 && winRate >= 65) {
    return { tier: 'MEGAWHALE', icon: '🌊', color: 'from-pink-500 to-purple-500' };
  }
  if (volume >= 10000 && winRate >= 60) {
    return { tier: 'WHALE', icon: '🐋', color: 'from-blue-500 to-cyan-500' };
  }
  if (volume >= 1000 && winRate >= 55) {
    return { tier: 'SHARK', icon: '🦈', color: 'from-gray-400 to-gray-600' };
  }
  return { tier: 'TRADER', icon: '📈', color: 'from-gray-600 to-gray-700' };
}

export default function WhaleCard({
  whale,
  isFollowing,
  onFollow,
  onUnfollow,
  isAuthenticated,
}: WhaleCardProps) {
  const whaleTier = getWhaleTier(whale.totalVolume, whale.winRate);
  const isHighTier = whaleTier.tier === 'WHALE' || whaleTier.tier === 'MEGAWHALE';

  return (
    <div
      className={`relative bg-gray-900/50 rounded-xl p-4 border transition hover:scale-[1.02] ${isHighTier
          ? 'border-transparent bg-gradient-to-r p-[1px] ' + whaleTier.color
          : 'border-gray-700 hover:border-blue-500/50'
        }`}
    >
      <div className={isHighTier ? 'bg-gray-900 rounded-xl p-4' : ''}>
        {/* Header with tier badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{whaleTier.icon}</span>
              <h4 className="font-bold text-white">
                {whale.nickname || formatAddress(whale.walletAddress)}
              </h4>
              {/* Tier Badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-gradient-to-r ${whaleTier.color} text-white`}>
                {whaleTier.tier}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{formatAddress(whale.walletAddress)}</p>
              {/* Copy Address Button */}
              <button
                onClick={() => navigator.clipboard.writeText(whale.walletAddress)}
                className="text-xs text-gray-500 hover:text-blue-400 transition"
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>
          <button
            onClick={() => (isFollowing ? onUnfollow(whale.id) : onFollow(whale.id))}
            disabled={!isAuthenticated}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${isFollowing
                ? 'bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/40'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isFollowing ? '✓ Following' : '+ Follow'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-xs text-gray-500">Volume</div>
            <div className="text-sm font-bold text-green-400">
              ${whale.totalVolume.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-xs text-gray-500">Win Rate</div>
            <div className={`text-sm font-bold ${whale.winRate >= 60 ? 'text-blue-400' : 'text-yellow-400'}`}>
              {whale.winRate.toFixed(1)}%
              {whale.winRate >= 70 && <span className="ml-1">🔥</span>}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-xs text-gray-500">Avg Position</div>
            <div className="text-sm font-bold text-purple-400">
              ${whale.avgPositionSize.toFixed(0)}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-xs text-gray-500">Total Profit</div>
            <div
              className={`text-sm font-bold ${whale.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {whale.totalProfit >= 0 ? '+' : ''}${whale.totalProfit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Followers and Activity */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{whale.followersCount} followers</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>Active {formatTime(whale.lastActive)}</span>
          </div>
        </div>

        {/* Top Tokens */}
        {whale.topTokens && whale.topTokens.length > 0 && (
          <div className="pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Top tokens:</div>
            <div className="flex flex-wrap gap-1">
              {whale.topTokens.slice(0, 4).map((token, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded-full hover:bg-blue-800/50 cursor-pointer transition"
                >
                  {token}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Copy Trade CTA for authenticated users */}
        {isAuthenticated && isFollowing && (
          <div className="mt-3 pt-2 border-t border-gray-700">
            <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center gap-2">
              <span>🎯</span>
              <span>View Latest Trades</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


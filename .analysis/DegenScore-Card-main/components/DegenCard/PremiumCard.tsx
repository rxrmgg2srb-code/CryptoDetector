import React from 'react';
import { motion } from 'framer-motion';

interface Badge {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface PremiumCardProps {
  degenScore: number;
  totalVolume: number;
  totalTrades: number;
  profitLoss: number;
  winRate: number;
  whaleActivity?: boolean;
  traderLevel?: string;
  badges?: Badge[];
  volatilityScore?: number;
}

const getGradientByScore = (score: number): string => {
  if (score < 25) {
    return 'from-red-600 via-orange-500 to-red-600';
  }
  if (score < 50) {
    return 'from-orange-500 via-yellow-500 to-orange-500';
  }
  if (score < 75) {
    return 'from-yellow-500 via-green-500 to-yellow-500';
  }
  return 'from-green-500 via-purple-500 to-green-500';
};

const getAccentColorByScore = (score: number): string => {
  if (score < 25) {
    return 'from-red-400 to-orange-400';
  }
  if (score < 50) {
    return 'from-orange-400 to-yellow-400';
  }
  if (score < 75) {
    return 'from-yellow-400 to-green-400';
  }
  return 'from-green-400 to-purple-400';
};

const getPowerBarColor = (score: number): string => {
  if (score < 25) {
    return 'bg-red-500';
  }
  if (score < 50) {
    return 'bg-orange-500';
  }
  if (score < 75) {
    return 'bg-yellow-500';
  }
  return 'bg-green-500';
};

export default function PremiumCard({
  degenScore,
  totalVolume,
  totalTrades,
  profitLoss,
  winRate,
  whaleActivity = false,
  traderLevel = 'Legend',
  badges = [],
  volatilityScore = 0,
}: PremiumCardProps) {
  const powerBarWidth = (degenScore / 100) * 100;
  const gradientClass = getGradientByScore(degenScore);
  const accentGradient = getAccentColorByScore(degenScore);
  const powerBarColor = getPowerBarColor(degenScore);

  const formatVolume = (volume: number): string => {
    const dollar = '$';
    if (volume >= 1e9) {
      return `${dollar}${(volume / 1e9).toFixed(2)}B`;
    }
    if (volume >= 1e6) {
      return `${dollar}${(volume / 1e6).toFixed(2)}M`;
    }
    if (volume >= 1e3) {
      return `${dollar}${(volume / 1e3).toFixed(2)}K`;
    }
    return `${dollar}${volume.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative w-full max-w-2xl mx-auto rounded-lg border-2 bg-gradient-to-br ${gradientClass} p-0.5 shadow-2xl overflow-hidden group`}
    >
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none rounded-lg" />

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(139,92,246,0.2))',
        }}
      />

      {/* Main card content */}
      <div className="relative bg-gray-900/95 backdrop-blur-xl rounded-lg p-8 space-y-6">
        {/* Header with badges row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-3 mb-2"
            >
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
                Power Level
              </span>
              {whaleActivity && (
                <span className="px-2 py-1 bg-blue-500/30 border border-blue-400 rounded-full text-xs font-bold text-blue-300 flex items-center gap-1">
                  🐋 Whale
                </span>
              )}
            </motion.div>
          </div>

          {/* Security/Volatility badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`px-3 py-2 rounded-full border bg-gradient-to-r ${accentGradient} border-opacity-30 backdrop-blur-sm`}
          >
            <div className="text-xs font-semibold text-white">
              Security: {100 - volatilityScore}%
            </div>
          </motion.div>
        </div>

        {/* Main Power Level Display */}
        <motion.div className="text-center py-2">
          <div className="relative inline-block">
            {/* Pulsing glow background */}
            <motion.div
              className={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-r ${accentGradient} opacity-30`}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Power number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative text-center"
            >
              <div
                className={`text-8xl font-black bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent drop-shadow-lg`}
              >
                {Math.round(degenScore)}
              </div>
              <div className="text-lg font-bold text-gray-300 mt-2 uppercase tracking-wider">
                {traderLevel}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Power Bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-2"
        >
          <div className="flex justify-between text-xs font-semibold text-gray-400 px-1">
            <span>0</span>
            <span>100</span>
          </div>
          <div className="relative h-3 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700 shadow-inner">
            <motion.div
              className={`h-full ${powerBarColor} rounded-full shadow-lg`}
              initial={{ width: 0 }}
              animate={{ width: `${powerBarWidth}%` }}
              transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
            >
              {/* Shimmer effect on power bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
        </motion.div>

        {/* Badges/Achievements Row */}
        {badges && badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {badges.slice(0, 6).map((badge, idx) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.7 + idx * 0.1,
                  duration: 0.4,
                  ease: 'backOut',
                }}
                whileHover={{ scale: 1.1, y: -4 }}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/50 rounded-full backdrop-blur-sm"
              >
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                  {badge.icon && <span>{badge.icon}</span>}
                  {badge.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Micro-stats section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700"
        >
          {/* Volume stat */}
          <motion.div
            className="text-center p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <div className="text-xs font-semibold text-gray-400 mb-1">Volume</div>
            <div className="text-lg font-black text-cyan-400">{formatVolume(totalVolume)}</div>
          </motion.div>

          {/* Trades stat */}
          <motion.div
            className="text-center p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <div className="text-xs font-semibold text-gray-400 mb-1">Trades</div>
            <div className="text-lg font-black text-purple-400">{totalTrades}</div>
          </motion.div>

          {/* Win Rate stat */}
          <motion.div
            className="text-center p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <div className="text-xs font-semibold text-gray-400 mb-1">Win Rate</div>
            <div
              className={`text-lg font-black ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}
            >
              {winRate.toFixed(1)}%
            </div>
          </motion.div>
        </motion.div>

        {/* PnL Display */}
        {profitLoss !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-center pt-2"
          >
            <div className="text-xs font-semibold text-gray-400 mb-1">Realized P&L</div>
            <div
              className={`text-2xl font-black ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {profitLoss >= 0 ? '+' : ''}
              {formatVolume(Math.abs(profitLoss))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom accent bar */}
      <motion.div
        className={`h-1 bg-gradient-to-r ${accentGradient}`}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: 1, duration: 0.8 }}
      />
    </motion.div>
  );
}

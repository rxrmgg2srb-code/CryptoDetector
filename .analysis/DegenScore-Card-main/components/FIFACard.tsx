import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FIFACardProps {
  rank: number;
  walletAddress: string;
  displayName?: string;
  profileImage?: string;
  degenScore: number;
  tier: string;
  stats: {
    winRate: number;
    totalVolume: number;
    profitLoss: number;
    totalTrades: number;
    avgHoldTime?: number;
    level: number;
  };
  badges: Array<{
    name: string;
    icon: string;
    rarity?: string;
  }>;
  twitter?: string;
  telegram?: string;
  // Leaderboard specific props
  id?: string;
  likes?: number;
  referralCount?: number;
  badgePoints?: number;
  onLike?: (cardId: string) => void;
  userHasLiked?: boolean;
}

export default function FIFACard({
  rank,
  walletAddress,
  displayName,
  profileImage,
  degenScore,
  tier,
  stats,
  badges,
  twitter,
  telegram,
  id,
  likes,
  referralCount,
  badgePoints,
  onLike,
  userHasLiked,
}: FIFACardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsFlipped(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Configuración visual según DegenScore (Oro, Plata, Bronce)
  const isGold = degenScore >= 80;
  const isSilver = degenScore >= 60 && degenScore < 80;

  const cardColors = isGold
    ? {
      bg: 'bg-gradient-to-b from-[#fbf4b6] via-[#e2c373] to-[#bf953f]',
      border: 'border-[#bf953f]',
      text: 'text-[#4a3b18]',
      accent: 'bg-[#bf953f]',
    }
    : isSilver
      ? {
        bg: 'bg-gradient-to-b from-[#e3e3e3] via-[#c4c4c4] to-[#969696]',
        border: 'border-[#969696]',
        text: 'text-[#2d2d2d]',
        accent: 'bg-[#969696]',
      }
      : {
        bg: 'bg-gradient-to-b from-[#eecda3] via-[#d6ae7b] to-[#a67c52]',
        border: 'border-[#a67c52]',
        text: 'text-[#3e2714]',
        accent: 'bg-[#a67c52]',
      };

  return (
    <>
      <motion.div
        className="relative cursor-pointer group perspective-1000"
        onClick={() => setShowDetails(true)}
        whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: isFlipped ? 0 : 90, opacity: isFlipped ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* CARD SHAPE CONTAINER */}
        <div
          className={`
                    relative w-[280px] h-[420px] 
                    ${cardColors.bg}
                    rounded-t-3xl rounded-b-[3rem]
                    shadow-[0_0_30px_rgba(0,0,0,0.5)]
                    border-[6px] ${cardColors.border}
                    overflow-hidden
                    flex flex-col
                    transition-all duration-300 group-hover:shadow-[0_0_50px_rgba(255,215,0,0.6)]
                `}
        >
          {/* TEXTURE OVERLAY (Sunburst) */}
          <div className="absolute inset-0 opacity-30 bg-[repeating-conic-gradient(from_0deg,transparent_0deg_10deg,rgba(255,255,255,0.3)_10deg_20deg)]" />

          {/* INNER BORDER FRAME */}
          <div className="absolute inset-2 border-2 border-white/40 rounded-t-2xl rounded-b-[2.5rem] z-10 pointer-events-none" />

          {/* TOP SECTION: Rating, Image, Tier */}
          <div className="relative z-20 flex p-4 h-[55%]">
            {/* Left Column: Rating & Position */}
            <div className="flex flex-col items-center w-1/4 pt-2">
              <div
                className={`text-5xl font-black ${cardColors.text} leading-none tracking-tighter`}
              >
                {degenScore}
              </div>
              <div
                className={`text-xs font-bold ${cardColors.text} uppercase mt-1 tracking-widest`}
              >
                {tier.substring(0, 3).toUpperCase()}
              </div>

              {/* Rank Badge */}
              <div className="mt-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">
                #{rank}
              </div>

              {/* Team/Chain Logo */}
              <div className="mt-2 w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/50">
                <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  SOL
                </span>
              </div>
            </div>

            {/* Center: Player Image */}
            <div className="w-3/4 relative flex items-end justify-center pb-2">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-lg bg-black/20">
                {profileImage ? (
                  <img src={profileImage} alt="Player" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
                    <span className="text-5xl">👤</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Name & Stats */}
          <div className="relative z-20 flex-1 bg-gradient-to-b from-black/10 to-black/40 mx-2 mb-2 rounded-b-[2.2rem] flex flex-col items-center pt-2 pb-4">
            {/* Name */}
            <div
              className={`text-2xl font-black ${cardColors.text} uppercase tracking-wide drop-shadow-sm mb-1`}
            >
              {displayName || walletAddress.slice(0, 8)}
            </div>

            {/* Divider */}
            <div className={`w-3/4 h-[2px] ${cardColors.accent} opacity-60 mb-3`} />

            {/* STATS GRID - The Soul of the Card */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 w-full px-8">
              <StatRow label="WIN" value={stats.winRate.toFixed(0)} color={cardColors.text} />
              <StatRow label="TRD" value={stats.totalTrades.toString()} color={cardColors.text} />

              <StatRow
                label="VOL"
                value={abbreviateNumber(stats.totalVolume)}
                color={cardColors.text}
              />
              <StatRow
                label="HOD"
                value={stats.avgHoldTime ? Math.round(stats.avgHoldTime).toString() : 'N/A'}
                color={cardColors.text}
              />

              <StatRow
                label="P&L"
                value={abbreviateNumber(stats.profitLoss)}
                color={cardColors.text}
              />
              <StatRow label="LVL" value={stats.level.toString()} color={cardColors.text} />
            </div>

            {/* Social Stats (if leaderboard mode) */}
            {(likes !== undefined || referralCount !== undefined || badgePoints !== undefined) && (
              <div className="grid grid-cols-3 gap-1 mt-2 px-2">
                {likes !== undefined && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onLike && id) {
                        onLike(id);
                      }
                    }}
                    className={`flex flex-col items-center justify-center py-1 rounded-lg transition-all ${userHasLiked
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-black/30 text-gray-400 hover:bg-black/50'
                      }`}
                  >
                    <span className="text-sm">{userHasLiked ? '❤️' : '🤍'}</span>
                    <span className="text-[10px] font-bold">{likes}</span>
                  </button>
                )}
                {referralCount !== undefined && (
                  <div className="flex flex-col items-center justify-center py-1 rounded-lg bg-blue-500/10">
                    <span className="text-sm">👥</span>
                    <span className="text-[10px] font-bold text-blue-300">{referralCount}</span>
                  </div>
                )}
                {badgePoints !== undefined && (
                  <div className="flex flex-col items-center justify-center py-1 rounded-lg bg-yellow-500/10">
                    <span className="text-sm">⭐</span>
                    <span className="text-[10px] font-bold text-yellow-300">{badgePoints}</span>
                  </div>
                )}
              </div>
            )}

            {/* Badges / Chemistry */}
            <div className="mt-auto flex gap-2 pt-2 justify-center">
              {badges.slice(0, 3).map((badge, i) => (
                <div key={i} className="text-lg filter drop-shadow-md" title={badge.name}>
                  {badge.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de Detalles (Mantenemos el mismo porque funciona bien, solo es visualización extra) */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <div className="bg-gray-900 border-2 border-yellow-500/50 p-6 rounded-2xl max-w-md w-full m-4 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative">
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h3 className="text-3xl font-black text-white mb-6 text-center uppercase italic tracking-wider">
                Trader Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Win Rate" value={`${stats.winRate.toFixed(2)}%`} />
                <DetailRow label="Volume" value={`${stats.totalVolume.toFixed(2)} SOL`} />
                <DetailRow label="P&L" value={`${stats.profitLoss.toFixed(2)} SOL`} />
                <DetailRow label="Trades" value={stats.totalTrades} />
              </div>
              <div className="mt-6 flex justify-center gap-4">
                {twitter && (
                  <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">
                    X (Twitter)
                  </button>
                )}
                {telegram && (
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
                    Telegram
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Sub-componentes para limpieza
const StatRow = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex items-center justify-between">
    <span className={`font-bold ${color} text-sm opacity-80`}>{label}</span>
    <span className={`font-black ${color} text-lg`}>{value}</span>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-gray-800 p-3 rounded text-center">
    <div className="text-gray-400 text-xs uppercase">{label}</div>
    <div className="text-white font-bold text-lg">{value}</div>
  </div>
);

function abbreviateNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

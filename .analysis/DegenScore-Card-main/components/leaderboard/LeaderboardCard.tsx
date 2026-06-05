import { LeaderboardEntry } from './types';
import { getTierConfig, formatNumber, getFOMOPhrase } from './utils';

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  index: number;
  handleLike: (cardId: string) => Promise<void>;
  userLikes: { [key: string]: boolean };
}

export const LeaderboardCard = ({ entry, index, handleLike, userLikes }: LeaderboardCardProps) => {
  const tier = getTierConfig(entry.degenScore);
  const isTop3 = index < 3;
  const fomoPhrase = getFOMOPhrase(entry.degenScore);

  return (
    <div className="flex flex-col h-full">
      <div
        className={`relative rounded-3xl border-[6px] ${tier.border} ${tier.glow} hover:scale-[1.03] transition-all duration-500 overflow-hidden group flex flex-col h-full`}
      >
        <div className={`absolute inset-0 ${tier.bgPattern}`}></div>

        {tier.shine && (
          <div className="absolute inset-0 shine-effect opacity-40 group-hover:opacity-60 transition-opacity"></div>
        )}

        <div
          className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-15 group-hover:opacity-20 transition-opacity`}
        ></div>

        <div className="relative flex-grow flex flex-col p-5 bg-gray-900/90 backdrop-blur-md">
          {/* Header: Rank & Medal */}
          <div className="flex justify-between items-start mb-4">
            <div className={`text-3xl font-black ${tier.textColor} drop-shadow-lg`}>
              #{index + 1}
            </div>
            {isTop3 && (
              <div className="text-4xl drop-shadow-lg filter hover:brightness-110 transition">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative">
              {entry.profileImage ? (
                <div className="w-24 h-24 rounded-full border-4 border-cyan-500/60 overflow-hidden bg-gray-800 shadow-2xl ring-4 ring-black/20">
                  <img
                    src={entry.profileImage}
                    alt={entry.displayName || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-cyan-500/60 bg-gray-800 flex items-center justify-center shadow-2xl ring-4 ring-black/20">
                  <span className="text-4xl">👤</span>
                </div>
              )}
              {/* Level Badge Absolute */}
              <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-1 border border-gray-700">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r ${tier.gradient} text-white text-xs font-bold shadow-lg`}
                >
                  {entry.level}
                </div>
              </div>
            </div>

            <div className="text-center">
              {entry.displayName && (
                <div className="text-white font-black text-lg tracking-wide mb-1">
                  {entry.displayName}
                </div>
              )}
              <div className="text-xs text-cyan-400 font-mono bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/20 inline-block mb-2">
                {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-6)}
              </div>

              <div className="flex gap-2 justify-center">
                {entry.twitter && (
                  <a
                    href={`https://twitter.com/${entry.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    🐦
                  </a>
                )}
                {entry.telegram && (
                  <a
                    href={`https://t.me/${entry.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    ✈️
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Score Section */}
          <div className="flex flex-col items-center mb-6">
            <div
              className={`text-6xl font-black bg-gradient-to-br ${tier.gradient} bg-clip-text text-transparent drop-shadow-2xl`}
            >
              {entry.degenScore}
            </div>
            <div className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-3">
              Degen Score
            </div>

            <div className="w-full bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent py-2 border-y border-yellow-500/20">
              <div className="text-yellow-300 font-bold text-xs text-center uppercase tracking-wide">
                {fomoPhrase}
              </div>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/40 rounded-xl p-3 border border-gray-700/50">
              <div className="text-[10px] text-gray-500 uppercase font-bold">Trades</div>
              <div className="text-white font-bold text-lg">
                {formatNumber(entry.totalTrades, 0)}
              </div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-gray-700/50">
              <div className="text-[10px] text-gray-500 uppercase font-bold">Win Rate</div>
              <div className="text-white font-bold text-lg">{entry.winRate.toFixed(0)}%</div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-gray-700/50">
              <div className="text-[10px] text-gray-500 uppercase font-bold">Volume</div>
              <div className="text-white font-bold text-lg">
                {formatNumber(entry.totalVolume)} <span className="text-xs text-gray-500">SOL</span>
              </div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-gray-700/50">
              <div className="text-[10px] text-gray-500 uppercase font-bold">P&L</div>
              <div
                className={`font-bold text-lg ${entry.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {entry.profitLoss >= 0 ? '+' : ''}
                {formatNumber(entry.profitLoss)}
              </div>
            </div>
          </div>

          {/* Bottom Actions & Social Proof */}
          <div className="mt-auto pt-2 space-y-3">
            {/* Social Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleLike(entry.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  userLikes[entry.id]
                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span className="text-lg mb-1">{userLikes[entry.id] ? '❤️' : '🤍'}</span>
                <span className="text-xs font-bold">{entry.likes || 0}</span>
              </button>

              <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <span className="text-lg mb-1">👥</span>
                <span className="text-xs font-bold text-blue-300">{entry.referralCount || 0}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                <span className="text-lg mb-1">⭐</span>
                <span className="text-xs font-bold text-yellow-300">{entry.badgePoints || 0}</span>
              </div>
            </div>

            {/* Badges Row */}
            {entry.calculatedBadges && entry.calculatedBadges.length > 0 && (
              <div className="flex gap-1 justify-center flex-wrap opacity-80">
                {entry.calculatedBadges.slice(0, 5).map((badge, idx) => (
                  <span key={idx} className="text-base" title={badge.name}>
                    {badge.icon}
                  </span>
                ))}
                {entry.calculatedBadges.length > 5 && (
                  <span className="text-xs text-gray-500 flex items-center">
                    +{entry.calculatedBadges.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

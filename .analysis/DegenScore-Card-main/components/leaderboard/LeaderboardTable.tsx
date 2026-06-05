import { LeaderboardEntry } from './types';
import { getTierConfig, getLevelPhrase, formatNumber } from './utils';

interface LeaderboardTableProps {
  filteredLeaderboard: LeaderboardEntry[];
  handleLike: (cardId: string) => Promise<void>;
  userLikes: { [key: string]: boolean };
}

export const LeaderboardTable = ({
  filteredLeaderboard,
  handleLike,
  userLikes,
}: LeaderboardTableProps) => {
  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                Tier
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">
                Score
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">
                Trades
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">
                Volume
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">
                P&L
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">
                Win Rate
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase">
                Level
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase">
                Likes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {filteredLeaderboard.map((entry, index) => {
              const tier = getTierConfig(entry.degenScore);
              const isTop3 = index < 3;
              const levelPhrase = getLevelPhrase(entry.level);

              return (
                <tr
                  key={entry.id}
                  className={`hover:bg-gray-700/30 transition ${
                    isTop3 ? 'bg-gradient-to-r from-yellow-900/10 to-transparent' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                      {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                      {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                      <span className={`font-bold ${isTop3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {entry.profileImage ? (
                        <img
                          src={entry.profileImage}
                          alt={entry.displayName || 'Profile'}
                          className="w-10 h-10 rounded-full border-2 border-cyan-500/50 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-cyan-500/50 bg-gray-800 flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                      )}
                      <div>
                        {entry.displayName && (
                          <div className="text-white font-semibold text-sm">
                            {entry.displayName}
                          </div>
                        )}
                        <div className="text-xs font-mono text-gray-400">
                          {entry.walletAddress.slice(0, 4)}...{entry.walletAddress.slice(-4)}
                        </div>
                        <div className="flex gap-2 mt-0.5 text-[10px] min-h-[16px]">
                          {entry.twitter && (
                            <a
                              href={`https://twitter.com/${entry.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              🐦 @{entry.twitter.slice(0, 8)}
                            </a>
                          )}
                          {entry.telegram && (
                            <a
                              href={`https://t.me/${entry.telegram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              ✈️ @{entry.telegram}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${tier.badgeGradient} text-white inline-flex items-center gap-1`}
                    >
                      {tier.emoji} {tier.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-xl font-bold ${tier.textColor}`}>{entry.degenScore}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-white">{entry.totalTrades.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-white">{formatNumber(entry.totalVolume)} SOL</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={entry.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {entry.profitLoss >= 0 ? '+' : ''}
                      {formatNumber(entry.profitLoss)} SOL
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-white">{entry.winRate.toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-purple-400 font-bold">Lv.{entry.level}</div>
                    <div className="text-[10px] text-gray-400 italic">{levelPhrase}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleLike(entry.id)}
                      className={`px-3 py-1 rounded-lg transition-all inline-flex items-center gap-1 ${
                        userLikes[entry.id]
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <span>{userLikes[entry.id] ? '❤️' : '🤍'}</span>
                      <span className="font-bold text-sm">{entry.likes || 0}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

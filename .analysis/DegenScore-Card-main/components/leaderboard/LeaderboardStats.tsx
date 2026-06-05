import { Stats } from './types';
import { formatNumber } from './utils';

interface LeaderboardStatsProps {
  stats: Stats | null;
}

export const LeaderboardStats = ({ stats }: LeaderboardStatsProps) => {
  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <div className="text-gray-400 text-sm mb-1">Total Degens</div>
        <div className="text-3xl font-bold text-white">{stats.totalCards.toLocaleString()}</div>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="text-gray-400 text-sm mb-1">Average Score</div>
        <div className="text-3xl font-bold text-purple-400">{stats.avgScore.toFixed(0)}</div>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
        <div className="text-gray-400 text-sm mb-1">Top Score</div>
        <div className="text-3xl font-bold text-yellow-400">{stats.topScore}</div>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
        <div className="text-gray-400 text-sm mb-1">Total Volume</div>
        <div className="text-3xl font-bold text-green-400">
          {formatNumber(stats.totalVolume)} SOL
        </div>
      </div>
    </div>
  );
};

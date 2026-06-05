import { useState, useEffect } from 'react';

interface RankingEntry {
  walletAddress: string;
  displayName?: string | null;
  profileImage?: string | null;
  value: number;
}

interface RankingsData {
  likes: RankingEntry[];
  referrals: RankingEntry[];
  badges: RankingEntry[];
}

export default function RankingsWidget() {
  const [activeCategory, setActiveCategory] = useState<'likes' | 'referrals' | 'badges'>('likes');
  const [rankings, setRankings] = useState<RankingsData>({
    likes: [],
    referrals: [],
    badges: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);

      // Fetch top 10 for each category
      const [likesRes, referralsRes, badgesRes] = await Promise.all([
        fetch('/api/leaderboard?sortBy=likes&limit=10'),
        fetch('/api/leaderboard?sortBy=referralCount&limit=10'),
        fetch('/api/leaderboard?sortBy=badgePoints&limit=10'),
      ]);

      const [likesData, referralsData, badgesData] = await Promise.all([
        likesRes.json(),
        referralsRes.json(),
        badgesRes.json(),
      ]);

      setRankings({
        likes:
          likesData.leaderboard?.map((entry: any) => ({
            walletAddress: entry.walletAddress,
            displayName: entry.displayName,
            profileImage: entry.profileImage,
            value: entry.likes || 0,
          })) || [],
        referrals:
          referralsData.leaderboard?.map((entry: any) => ({
            walletAddress: entry.walletAddress,
            displayName: entry.displayName,
            profileImage: entry.profileImage,
            value: entry.referralCount || 0,
          })) || [],
        badges:
          badgesData.leaderboard?.map((entry: any) => ({
            walletAddress: entry.walletAddress,
            displayName: entry.displayName,
            profileImage: entry.profileImage,
            value: entry.badgePoints || 0,
          })) || [],
      });
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryConfig = {
    likes: {
      title: 'Most Likes',
      emoji: '❤️',
      color: 'from-red-500 to-pink-500',
      borderColor: 'border-red-500/30',
      bgColor: 'bg-red-900/20',
    },
    referrals: {
      title: 'Most Referrals',
      emoji: '👥',
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-900/20',
    },
    badges: {
      title: 'Most Achievements',
      emoji: '⭐',
      color: 'from-yellow-500 to-orange-500',
      borderColor: 'border-yellow-500/30',
      bgColor: 'bg-yellow-900/20',
    },
  };

  const currentConfig = categoryConfig[activeCategory];
  const currentRankings = rankings[activeCategory];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        🏆 Season Rankings
      </h2>

      {/* Tabs de categorías */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveCategory('likes')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition ${
            activeCategory === 'likes'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          ❤️
        </button>
        <button
          onClick={() => setActiveCategory('referrals')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition ${
            activeCategory === 'referrals'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          👥
        </button>
        <button
          onClick={() => setActiveCategory('badges')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition ${
            activeCategory === 'badges'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          ⭐
        </button>
      </div>

      {/* Título de categoría */}
      <div
        className={`mb-4 p-3 rounded-lg ${currentConfig.bgColor} border ${currentConfig.borderColor}`}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">{currentConfig.emoji}</div>
          <div className="text-white font-bold text-sm">{currentConfig.title}</div>
          <div className="text-gray-400 text-xs mt-1">Top 10</div>
        </div>
      </div>

      {/* Lista de rankings */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="text-gray-400 mt-2 text-sm">Loading...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentRankings.length > 0 ? (
            currentRankings.map((entry, index) => (
              <div
                key={entry.walletAddress}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  index < 3
                    ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/20 border border-yellow-500/30'
                    : 'bg-gray-700/50'
                } hover:bg-gray-700 transition`}
              >
                {/* Ranking number */}
                <div className="flex-shrink-0 w-8 text-center">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && (
                    <span className="text-gray-400 font-bold text-sm">#{index + 1}</span>
                  )}
                </div>

                {/* Profile image */}
                {entry.profileImage ? (
                  <img
                    src={entry.profileImage}
                    alt={entry.displayName || 'Profile'}
                    className="w-8 h-8 rounded-full border-2 border-cyan-500/50 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-500/50 bg-gray-800 flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                )}

                {/* Name/Address */}
                <div className="flex-1 min-w-0">
                  {entry.displayName ? (
                    <div className="text-white font-semibold text-sm truncate">
                      {entry.displayName}
                    </div>
                  ) : (
                    <div className="text-gray-300 font-mono text-xs">
                      {entry.walletAddress.slice(0, 4)}...{entry.walletAddress.slice(-4)}
                    </div>
                  )}
                </div>

                {/* Value */}
                <div
                  className={`flex-shrink-0 px-3 py-1 rounded-full bg-gradient-to-r ${currentConfig.color} text-white font-bold text-sm`}
                >
                  {entry.value}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No data available</div>
          )}
        </div>
      )}

      {/* Prize info */}
      <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
        <div className="text-xs text-gray-300 text-center">
          <div className="font-bold text-purple-300 mb-1">🎁 Prize per Category</div>
          <div>1 SOL per 100 participants</div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

interface Winner {
  id: string;
  week: number;
  year: number;
  title: string;
  metric: string;
  prizeSOL: number;
  winnerAddress: string | null;
  winnerScore: number | null;
  endDate: string;
  displayName?: string;
}

export default function ChallengeWinnersWidget() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint to fetch past winners
      // For now, we'll use mock data
      setWinners([]);
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'likes':
        return '❤️';
      case 'profit':
        return '💰';
      case 'winRate':
        return '🎯';
      case 'volume':
        return '📊';
      case 'bestTrade':
        return '🚀';
      default:
        return '🏆';
    }
  };

  const formatMetricValue = (metric: string, value: number) => {
    switch (metric) {
      case 'likes':
        return `${value} likes`;
      case 'profit':
      case 'volume':
      case 'bestTrade':
        return `${value.toFixed(2)} SOL`;
      case 'winRate':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/70 via-purple-900/30 to-gray-800/70 backdrop-blur-sm rounded-2xl border-2 border-yellow-500/40 p-6 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
      {/* Header con efecto brillante */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-lg blur-xl"></div>
        <div className="relative flex items-center justify-center gap-3 py-3">
          <span className="text-4xl animate-pulse">🏆</span>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400">
            Hall of Fame
          </h2>
          <span className="text-4xl animate-pulse">🏆</span>
        </div>
      </div>

      {/* Subtitle */}
      <div className="text-center mb-6">
        <p className="text-gray-300 text-sm font-medium">Past Challenge Winners</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
          <span className="text-yellow-400 text-xs font-bold">LEGENDS</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
        </div>
      </div>

      {/* Winners List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
          <p className="text-gray-400 mt-4 text-sm">Loading winners...</p>
        </div>
      ) : winners.length > 0 ? (
        <div className="space-y-4">
          {winners.map((winner, index) => (
            <div
              key={winner.id}
              className="group relative bg-gradient-to-r from-yellow-900/20 via-orange-900/10 to-yellow-900/20 rounded-xl p-4 border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]"
            >
              {/* Crown para el primer lugar */}
              {index === 0 && (
                <div className="absolute -top-3 -right-3 text-4xl animate-bounce">👑</div>
              )}

              {/* Header del winner */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getMetricIcon(winner.metric)}</div>
                  <div>
                    <div className="text-white font-bold text-sm leading-tight">{winner.title}</div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      Week {winner.week}, {winner.year}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-black text-lg">{winner.prizeSOL} SOL</div>
                  <div className="text-gray-500 text-xs">{formatDate(winner.endDate)}</div>
                </div>
              </div>

              {/* Winner info */}
              {winner.winnerAddress && (
                <div className="bg-black/40 rounded-lg p-3 border border-yellow-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🥇</span>
                      <div>
                        {winner.displayName && (
                          <div className="text-white font-bold text-sm">{winner.displayName}</div>
                        )}
                        <div className="text-gray-400 text-xs font-mono">
                          {winner.winnerAddress.slice(0, 6)}...{winner.winnerAddress.slice(-4)}
                        </div>
                      </div>
                    </div>
                    {winner.winnerScore !== null && (
                      <div className="text-yellow-400 font-bold text-sm">
                        {formatMetricValue(winner.metric, winner.winnerScore)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">🏆</div>
          <p className="text-gray-400 text-sm font-medium">Coming soon...</p>
          <p className="text-gray-500 text-xs mt-2">First winners will appear here</p>
          <div className="mt-6 inline-block">
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg px-4 py-2">
              <div className="text-yellow-400 text-xs font-bold mb-1">💡 How to win?</div>
              <div className="text-gray-300 text-xs">
                Participate in weekly challenges
                <br />
                and earn SOL prizes
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Active challenges every week</span>
        </div>
      </div>
    </div>
  );
}

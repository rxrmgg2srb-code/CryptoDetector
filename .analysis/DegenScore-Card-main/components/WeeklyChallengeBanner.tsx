import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface ChallengeData {
  hasChallenge: boolean;
  challenge?: {
    id: string;
    title: string;
    description: string;
    metric: string;
    prizeSOL: number;
    daysRemaining: number;
  };
  currentLeader?: {
    address: string;
    displayName: string;
    score: number;
  };
}

export default function WeeklyChallengeBanner() {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenge();
    // Refresh every 5 minutes
    const interval = setInterval(fetchChallenge, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchChallenge = async () => {
    try {
      const response = await fetch('/api/current-challenge');
      if (response.ok) {
        const data = await response.json();
        setChallengeData(data);
      }
    } catch (error) {
      logger.error('Error fetching challenge', error instanceof Error ? error : undefined, {
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !challengeData?.hasChallenge) {
    return null;
  }

  const { challenge, currentLeader } = challengeData;
  if (!challenge) {
    return null;
  }

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

  return (
    <div className="mb-8 relative">
      <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(251,191,36,0.3)] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/10 to-red-500/5 animate-pulse"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce">{getMetricIcon(challenge.metric)}</span>
              <div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
                  {challenge.title}
                </h3>
                <p className="text-gray-300 text-sm">{challenge.description}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-yellow-400 font-bold text-sm mb-1">PRIZE</div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                {challenge.prizeSOL} SOL
              </div>
            </div>
          </div>

          {currentLeader && (
            <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-400 text-xs mb-1">🔥 Current Leader</div>
                  <div className="text-white font-bold text-lg">{currentLeader.displayName}</div>
                  <div className="text-gray-500 text-xs font-mono">
                    {currentLeader.address.slice(0, 6)}...{currentLeader.address.slice(-4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-black text-2xl">
                    {formatMetricValue(challenge.metric, currentLeader.score)}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {challenge.daysRemaining} day{challenge.daysRemaining !== 1 ? 's' : ''} left
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <svg
              className="w-4 h-4 text-green-500 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Premium users only • Updated every 5 minutes • Winner announced weekly</span>
          </div>
        </div>
      </div>
    </div>
  );
}

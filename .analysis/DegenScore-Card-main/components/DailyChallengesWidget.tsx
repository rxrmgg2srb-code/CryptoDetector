import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateSessionToken } from '../lib/walletAuth';
import { logger } from '../lib/logger';

interface Challenge {
  id: string;
  challengeType: string;
  title: string;
  description: string;
  targetValue: number;
  rewardXP: number;
  progress?: number;
  completed?: boolean;
}

interface ChallengeStats {
  totalCompleted: number;
  todayCompleted: number;
  streakDays: number;
}

export default function DailyChallengesWidget() {
  const { publicKey, signMessage } = useWallet();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey && signMessage) {
      generateToken();
    } else {
      // Fetch challenges without auth (no progress)
      fetchChallenges();
    }
  }, [publicKey, signMessage]);

  useEffect(() => {
    if (sessionToken) {
      fetchChallenges();
    }
  }, [sessionToken]);

  const generateToken = async () => {
    if (!publicKey || !signMessage) {
      return;
    }

    try {
      const token = generateSessionToken(publicKey.toString());
      setSessionToken(token);
    } catch (error: any) {
      logger.error('Failed to generate session token:', error);
    }
  };

  const fetchChallenges = async () => {
    setLoading(true);

    try {
      const headers: HeadersInit = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch('/api/challenges/daily', { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const data = await response.json();
      setChallenges(data.challenges || []);
      setStats(data.stats || null);
    } catch (error: any) {
      logger.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎯</span>
            <span>Desafíos Diarios</span>
          </h3>
          {stats && (
            <p className="text-sm text-gray-400 mt-1">
              {stats.todayCompleted} / {challenges.length} completados hoy
              {stats.streakDays > 0 && ` • ${stats.streakDays} consecutive days`}
            </p>
          )}
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        {challenges.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🎲</div>
            <p>Nuevos desafíos disponibles pronto</p>
          </div>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`relative bg-gray-900/50 rounded-lg p-4 border transition ${
                challenge.completed
                  ? 'border-green-500/50 bg-green-900/10'
                  : 'border-gray-700 hover:border-purple-500/50'
              }`}
            >
              {/* Challenge Info */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-grow">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {challenge.completed && <span className="text-green-400">✓</span>}
                    {challenge.title}
                  </h4>
                  <p className="text-sm text-gray-400 mt-1">{challenge.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-yellow-400 font-bold">+{challenge.rewardXP} XP</div>
                </div>
              </div>

              {/* Progress Bar */}
              {publicKey && !challenge.completed && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progreso</span>
                    <span>
                      {challenge.progress || 0} / {challenge.targetValue}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((challenge.progress || 0) / challenge.targetValue) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Completed Badge */}
              {challenge.completed && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full border border-green-500/50">
                    ¡COMPLETADO!
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Connect Wallet CTA */}
      {!publicKey && challenges.length > 0 && (
        <div className="mt-4 text-center bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Connect your wallet to track your progress and earn rewards
          </p>
        </div>
      )}

      {/* Stats Footer */}
      {stats && stats.totalCompleted > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">{stats.totalCompleted}</div>
              <div className="text-xs text-gray-500">Total Completados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{stats.todayCompleted}</div>
              <div className="text-xs text-gray-500">Hoy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{stats.streakDays}</div>
              <div className="text-xs text-gray-500">Streak (days)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

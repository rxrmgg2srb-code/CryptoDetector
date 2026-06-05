import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateSessionToken } from '../lib/walletAuth';
import { logger } from '../lib/logger';

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  todayCheckedIn: boolean;
  nextReward?: {
    day: number;
    xp: number;
    badge?: string;
  };
}

export default function StreakWidget() {
  const { publicKey, signMessage } = useWallet();
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Generate session token when wallet connects
  useEffect(() => {
    if (publicKey && signMessage) {
      generateToken();
    }
  }, [publicKey, signMessage]);

  // Check streak when token is available
  useEffect(() => {
    if (sessionToken) {
      checkStreak();
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

  const checkStreak = async () => {
    if (!sessionToken) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/streaks/checkin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check streak');
      }

      const data = await response.json();
      setStreak(data.streak);
    } catch (error: any) {
      logger.error('Error checking streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return null; // Don't show if not connected
  }

  if (loading || !streak) {
    return (
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-3 border border-orange-500/30 animate-pulse">
        <div className="h-12 bg-gray-700 rounded"></div>
      </div>
    );
  }

  const daysUntilNext = streak.nextReward ? streak.nextReward.day - streak.currentStreak : null;

  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30 hover:border-orange-500/50 transition">
      <div className="flex items-center justify-between">
        {/* Streak Info */}
        <div className="flex items-center gap-3">
          <div className="text-4xl">🔥</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-orange-400">{streak.currentStreak}</span>
              <span className="text-gray-400 text-sm">
                día{streak.currentStreak !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-500">Récord: {streak.longestStreak} días</div>
          </div>
        </div>

        {/* Next Reward */}
        {streak.nextReward && daysUntilNext !== null && (
          <div className="text-right">
            <div className="text-xs text-gray-400">Siguiente premio:</div>
            <div className="text-sm font-bold text-yellow-400">
              {daysUntilNext === 0
                ? '¡Hoy!'
                : `En ${daysUntilNext} día${daysUntilNext !== 1 ? 's' : ''}`}
            </div>
            <div className="text-xs text-gray-500">
              +{streak.nextReward.xp} XP
              {streak.nextReward.badge && ' + Badge'}
            </div>
          </div>
        )}
      </div>

      {/* Today Check-in Status */}
      <div className="mt-3 pt-3 border-t border-orange-500/20">
        {streak.todayCheckedIn ? (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <span>✓</span>
            <span>¡Check-in de hoy completado!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <span>⚠️</span>
            <span>Vuelve mañana para mantener tu racha</span>
          </div>
        )}
      </div>
    </div>
  );
}

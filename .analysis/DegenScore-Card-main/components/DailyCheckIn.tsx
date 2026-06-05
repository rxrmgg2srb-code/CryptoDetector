import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { logger } from '@/lib/logger';

interface CheckInData {
  currentStreak: number;
  totalXP: number;
  nextMilestone?: {
    days: number;
    badge: string;
    xp: number;
  };
}

export const DailyCheckIn = () => {
  const { publicKey } = useWallet();
  const [data, setData] = useState<CheckInData | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCheckIn = async () => {
    if (!publicKey || isLoading) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });

      const result = await res.json();

      if (result.success) {
        setIsCheckedIn(true);
        setData({
          currentStreak: result.currentStreak,
          totalXP: result.totalXP,
          nextMilestone: result.nextMilestone,
        });

        if (result.alreadyCheckedIn) {
          setMessage('Already checked in today! Come back tomorrow 🔥');
        } else {
          const badgeMsg =
            result.badgesEarned?.length > 0
              ? ` 🎉 Earned: ${result.badgesEarned.map((b: any) => b.name).join(', ')}`
              : '';
          setMessage(`+${result.xpEarned} XP!${badgeMsg}`);

          // Confetti effect or celebration animation
          if (result.badgesEarned?.length > 0) {
            triggerCelebration();
          }
        }
      } else {
        setMessage(result.error || 'Check-in failed');
      }
    } catch (error) {
      setMessage('Failed to check in. Try again.');
      logger.error('Check-in failed', error instanceof Error ? error : undefined, {
        error: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCelebration = () => {
    // Simple confetti or animation trigger
    if (typeof window !== 'undefined' && (window as any).confetti) {
      (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  if (!publicKey) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 shadow-xl border-2 border-yellow-400 relative overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">🔥</span>
            Daily Check-In
          </h3>
          {data && (
            <div className="text-right">
              <p className="text-yellow-200 text-sm font-medium">Streak</p>
              <p className="text-white text-2xl font-bold">{data.currentStreak} days</p>
            </div>
          )}
        </div>

        {/* Check-in button */}
        {!isCheckedIn ? (
          <button
            onClick={handleCheckIn}
            disabled={isLoading}
            className="w-full bg-white text-orange-600 font-bold py-4 px-6 rounded-lg hover:bg-yellow-100 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Checking in...
              </span>
            ) : (
              'Check In Now (+50 XP)'
            )}
          </button>
        ) : (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center border border-white/30">
            <p className="text-white text-lg font-bold mb-2">✅ Checked In!</p>
            {message && <p className="text-yellow-200 text-sm">{message}</p>}
          </div>
        )}

        {/* Next milestone */}
        {data?.nextMilestone && (
          <div className="mt-4 bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-yellow-400/30">
            <p className="text-yellow-200 text-xs font-medium mb-1">Next Milestone:</p>
            <div className="flex items-center justify-between">
              <p className="text-white font-bold text-sm">{data.nextMilestone.badge}</p>
              <p className="text-yellow-200 text-sm">
                {data.nextMilestone.days - data.currentStreak} more days
              </p>
            </div>
            {/* Progress bar */}
            <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(data.currentStreak / data.nextMilestone.days) * 100}%` }}
                className="bg-yellow-400 h-full rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* XP counter */}
        {data && (
          <div className="mt-3 text-center">
            <p className="text-yellow-200 text-xs">Total XP</p>
            <p className="text-white text-xl font-bold">{data.totalXP.toLocaleString()}</p>
          </div>
        )}

        {/* Message */}
        {message && !isCheckedIn && (
          <p className="mt-3 text-center text-yellow-200 text-sm">{message}</p>
        )}
      </div>
    </motion.div>
  );
};

export default DailyCheckIn;

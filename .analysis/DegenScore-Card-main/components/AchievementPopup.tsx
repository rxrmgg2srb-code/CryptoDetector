import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!achievement) {
      return;
    }

    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [achievement, onClose]);

  if (!achievement) {
    return null;
  }

  const rarityColors = {
    common: {
      bg: 'from-gray-600 to-gray-700',
      border: 'border-gray-500',
      glow: 'shadow-gray-500/50',
      text: 'text-gray-300',
    },
    rare: {
      bg: 'from-blue-600 to-blue-700',
      border: 'border-blue-500',
      glow: 'shadow-blue-500/50',
      text: 'text-blue-300',
    },
    epic: {
      bg: 'from-purple-600 to-pink-600',
      border: 'border-purple-500',
      glow: 'shadow-purple-500/50',
      text: 'text-purple-300',
    },
    legendary: {
      bg: 'from-orange-500 to-red-600',
      border: 'border-orange-500',
      glow: 'shadow-orange-500/50',
      text: 'text-orange-300',
    },
  };

  const colors = rarityColors[achievement.rarity];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed top-4 right-4 z-[9999] max-w-sm"
        >
          <div
            className={`relative bg-gradient-to-br ${colors.bg} rounded-xl p-6 border-2 ${colors.border} ${colors.glow} shadow-2xl overflow-hidden`}
          >
            {/* Animated background shimmer */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
            </div>

            {/* Glow effect */}
            <div
              className={`absolute -inset-1 bg-gradient-to-r ${colors.bg} opacity-50 blur-xl`}
            ></div>

            {/* Content */}
            <div className="relative">
              <div className="flex items-start gap-4">
                {/* Icon with animation */}
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="text-5xl flex-shrink-0"
                >
                  {achievement.icon}
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{achievement.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors.text} bg-white/20 uppercase tracking-wide`}
                    >
                      {achievement.rarity}
                    </span>
                  </div>
                  <p className="text-white/90 text-sm">{achievement.description}</p>
                </div>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 4, ease: 'linear' }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 origin-left"
              ></motion.div>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setShow(false);
                setTimeout(onClose, 300);
              }}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Achievement definitions
export const achievements = {
  firstCard: {
    id: 'first-card',
    title: 'First Card Generated!',
    description: 'Welcome to the degen club! Your journey begins.',
    icon: '🎴',
    rarity: 'common' as const,
  },
  premiumUnlock: {
    id: 'premium-unlock',
    title: 'Premium Degen',
    description: 'Unlocked premium features! You are now a true degen.',
    icon: '💎',
    rarity: 'epic' as const,
  },
  highScore: {
    id: 'high-score',
    title: 'Elite Trader',
    description: 'Scored 80+! You are among the best.',
    icon: '⭐',
    rarity: 'rare' as const,
  },
  legendary: {
    id: 'legendary',
    title: 'LEGENDARY DEGEN',
    description: 'Scored 90+! You are a trading god!',
    icon: '👑',
    rarity: 'legendary' as const,
  },
  top10: {
    id: 'top-10',
    title: 'Top 10 Degen',
    description: 'Entered the top 10 leaderboard!',
    icon: '🏆',
    rarity: 'epic' as const,
  },
  profileComplete: {
    id: 'profile-complete',
    title: 'Profile Customized',
    description: 'Added your personal touch to your card!',
    icon: '✨',
    rarity: 'common' as const,
  },
};

export default AchievementPopup;

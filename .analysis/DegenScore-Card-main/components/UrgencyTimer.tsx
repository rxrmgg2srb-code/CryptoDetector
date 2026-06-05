/**
 * Urgency Timer Component
 *
 * Creates FOMO through countdown timers for limited-time offers
 * Psychological trigger: scarcity + time pressure = higher conversions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UrgencyTimerProps {
  endTime: Date;
  title?: string;
  subtitle?: string;
  onExpire?: () => void;
  type?: 'flash-sale' | 'early-bird' | 'bonus' | 'event';
}

export default function UrgencyTimer({
  endTime,
  title = '⚡ Flash Sale Ending Soon!',
  subtitle = 'Lock in early bird pricing',
  onExpire,
  type = 'flash-sale',
}: UrgencyTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isExpired, setIsExpired] = useState(false);

  function calculateTimeLeft() {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      total: difference,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        setIsExpired(true);
        clearInterval(timer);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (isExpired) {
    return null;
  }

  const isCritical = timeLeft.total < 3600000; // Less than 1 hour
  const isUrgent = timeLeft.total < 7200000; // Less than 2 hours

  const configs = {
    'flash-sale': {
      emoji: '⚡',
      colors: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-900/30 to-red-900/30',
      borderColor: 'border-orange-500/50',
    },
    'early-bird': {
      emoji: '🐦',
      colors: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-900/30 to-cyan-900/30',
      borderColor: 'border-blue-500/50',
    },
    bonus: {
      emoji: '🎁',
      colors: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-900/30 to-pink-900/30',
      borderColor: 'border-purple-500/50',
    },
    event: {
      emoji: '🎯',
      colors: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-900/30 to-emerald-900/30',
      borderColor: 'border-green-500/50',
    },
  };

  const config = configs[type];
  const progressPercent = (timeLeft.total / (24 * 60 * 60 * 1000)) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} p-6 backdrop-blur-sm`}
      >
        {isCritical && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`absolute inset-0 bg-gradient-to-br ${config.colors} opacity-20`}
          />
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <motion.span
              animate={isCritical ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-4xl"
            >
              {config.emoji}
            </motion.span>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {title}
                {isCritical && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    ENDING SOON!
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-300">{subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <TimeUnit value={timeLeft.hours} label="Hours" isCritical={isCritical} />
            <TimeUnit value={timeLeft.minutes} label="Minutes" isCritical={isCritical} />
            <TimeUnit value={timeLeft.seconds} label="Seconds" isCritical={isCritical} />
          </div>

          <div className="mt-4">
            <div className="bg-black/30 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercent}%` }}
                className={`h-full bg-gradient-to-r ${config.colors}`}
              />
            </div>
          </div>

          {isUrgent && (
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-center mt-4 text-sm font-bold text-white"
            >
              {isCritical ? '🚨 FINAL HOUR! Act now or miss out!' : '⏰ Limited time remaining!'}
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface TimeUnitProps {
  value: number;
  label: string;
  isCritical: boolean;
}

function TimeUnit({ value, label, isCritical }: TimeUnitProps) {
  return (
    <motion.div
      animate={isCritical && value < 10 ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1 }}
      className="text-center"
    >
      <div className={`text-4xl font-bold ${isCritical ? 'text-red-400' : 'text-white'} mb-1`}>
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}

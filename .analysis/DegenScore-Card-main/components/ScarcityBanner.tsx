/**
 * 🔥 Scarcity Banner Component
 *
 * Psychological FOMO trigger that shows limited availability
 * Creates urgency through artificial scarcity
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';

interface ScarcityBannerProps {
  maxSlots?: number;
  currentSlots?: number;
  type?: 'premium' | 'genesis' | 'early-bird';
}

export default function ScarcityBanner({
  maxSlots = 1000,
  currentSlots,
  type = 'premium',
}: ScarcityBannerProps) {
  const [slots, setSlots] = useState(currentSlots || maxSlots);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Fetch real slot count from API
    fetchSlotCount();

    // Update every 30 seconds
    const interval = setInterval(fetchSlotCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSlotCount = async () => {
    try {
      const response = await fetch('/api/scarcity/slots');
      if (response.ok) {
        const data = await response.json();
        setSlots(data.remaining);
      }
    } catch (error) {
      logger.error('Error fetching slot count', error instanceof Error ? error : undefined, {
        error: String(error),
      });
    }
  };

  const remaining = maxSlots - slots;
  const percentageFilled = (remaining / maxSlots) * 100;

  // Don't show if slots are full or banner is dismissed
  if (remaining <= 0 || !showBanner) {
    return null;
  }

  // Determine urgency level
  const isUrgent = remaining < 100;
  const isCritical = remaining < 20;

  const config = {
    premium: {
      title: '💎 Premium Slots Limited',
      subtitle: 'Lock in early bird pricing before it increases',
      bgColor: 'from-purple-900/90 to-pink-900/90',
      textColor: 'text-purple-200',
    },
    genesis: {
      title: '🔥 Genesis NFTs - Limited Edition',
      subtitle: 'First 1,000 get exclusive perks forever',
      bgColor: 'from-cyan-900/90 to-blue-900/90',
      textColor: 'text-cyan-200',
    },
    'early-bird': {
      title: '⚡ Early Bird Special',
      subtitle: 'Get 50% off - Limited time offer',
      bgColor: 'from-green-900/90 to-emerald-900/90',
      textColor: 'text-green-200',
    },
  };

  const currentConfig = config[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r ${currentConfig.bgColor} backdrop-blur-lg border-b border-white/10 shadow-2xl`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {isCritical && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-2xl"
                  >
                    🚨
                  </motion.div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {currentConfig.title}
                    {isUrgent && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        ALMOST GONE
                      </span>
                    )}
                  </h3>
                  <p className={`text-sm ${currentConfig.textColor}`}>{currentConfig.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Center: Progress */}
            <div className="hidden md:block flex-1 mx-8">
              <div className="bg-black/30 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentageFilled}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full ${
                    isCritical
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : isUrgent
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                  }`}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-white/70">
                <span>{remaining} left</span>
                <span>{maxSlots} total</span>
              </div>
            </div>

            {/* Right: CTA + Close */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-3xl font-bold text-white">{remaining}</div>
                <div className="text-xs text-white/70">slots left</div>
              </div>

              <button
                onClick={() => (window.location.href = '/mint')}
                className="bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition shadow-lg"
              >
                Claim Now
              </button>

              <button
                onClick={() => setShowBanner(false)}
                className="text-white/50 hover:text-white/80 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Progress */}
          <div className="md:hidden mt-3">
            <div className="bg-black/30 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentageFilled}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              />
            </div>
            <div className="text-center mt-1 text-xs text-white/70">
              {remaining} of {maxSlots} slots remaining
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

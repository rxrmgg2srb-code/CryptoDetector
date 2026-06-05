import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: string;
  type: 'card-generated' | 'premium-unlock' | 'high-score';
  walletAddress: string;
  score?: number;
  timestamp: number;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Generate fake activity for demo (in production, fetch from API)
    const generateActivity = (): Activity => {
      const types: Activity['type'][] = ['card-generated', 'premium-unlock', 'high-score'];
      const type = types[Math.floor(Math.random() * types.length)] as Activity['type'];
      const score =
        type === 'card-generated' || type === 'high-score'
          ? Math.floor(Math.random() * 40) + 60
          : undefined;

      return {
        id: Math.random().toString(36),
        type,
        walletAddress: `${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
        score,
        timestamp: Date.now(),
      };
    };

    // Initialize with some activities
    const initial = Array.from({ length: 5 }, generateActivity);
    setActivities(initial);

    // Add new activity every 5-10 seconds
    const interval = setInterval(
      () => {
        const newActivity = generateActivity();
        setActivities((prev) => [newActivity, ...prev].slice(0, 10));
      },
      Math.random() * 5000 + 5000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Rotate through activities
    if (activities.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % Math.min(activities.length, 5));
      }, 3000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [activities.length]);

  const currentActivity = activities[currentIndex];

  if (!currentActivity) {
    return null;
  }

  const getActivityMessage = (activity: Activity) => {
    switch (activity.type) {
      case 'card-generated':
        return {
          icon: '🎴',
          message: `generated a ${activity.score} score card!`,
          color: activity.score! >= 80 ? 'text-purple-400' : 'text-cyan-400',
        };
      case 'premium-unlock':
        return {
          icon: '💎',
          message: 'unlocked premium features!',
          color: 'text-pink-400',
        };
      case 'high-score':
        return {
          icon: '⭐',
          message: `achieved ${activity.score}+ degen score!`,
          color: 'text-orange-400',
        };
      default:
        return {
          icon: '🎴',
          message: 'did something cool!',
          color: 'text-gray-400',
        };
    }
  };

  const activityInfo = getActivityMessage(currentActivity);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentActivity.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900/95 backdrop-blur-md rounded-lg px-4 py-3 border border-gray-700/50 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activityInfo.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-white truncate">
                  {currentActivity.walletAddress}
                </span>
                <span className={`${activityInfo.color} font-medium`}>{activityInfo.message}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              LIVE
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Activity count indicator */}
      <div className="mt-2 text-center">
        <div className="inline-flex gap-1">
          {activities.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className={`h-1 w-8 rounded-full transition-all ${
                i === currentIndex ? 'bg-purple-500' : 'bg-gray-700'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LiveActivityFeed;

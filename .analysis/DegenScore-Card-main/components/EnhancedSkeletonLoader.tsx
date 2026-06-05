/**
 * Enhanced Skeleton Loader Component
 *
 * Professional loading states with smooth animations
 * Reduces perceived loading time and improves UX
 */

import { motion } from 'framer-motion';

interface SkeletonProps {
  variant?: 'card' | 'leaderboard' | 'stats' | 'profile' | 'list';
  count?: number;
  animated?: boolean;
}

export default function EnhancedSkeletonLoader({
  variant = 'card',
  count = 1,
  animated = true,
}: SkeletonProps) {
  const variants = {
    card: <CardSkeleton animated={animated} />,
    leaderboard: <LeaderboardSkeleton animated={animated} count={count} />,
    stats: <StatsSkeleton animated={animated} />,
    profile: <ProfileSkeleton animated={animated} />,
    list: <ListSkeleton animated={animated} count={count} />,
  };

  return <>{variants[variant]}</>;
}

// Card Skeleton
function CardSkeleton({ animated }: { animated: boolean }) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative aspect-[5/7] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl overflow-hidden border border-gray-700/30">
        {animated && <ShimmerEffect />}

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" animated={animated} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" animated={animated} />
              <Skeleton className="h-3 w-24" animated={animated} />
            </div>
          </div>

          {/* Score */}
          <div className="text-center py-8">
            <Skeleton className="h-20 w-20 rounded-full mx-auto mb-2" animated={animated} />
            <Skeleton className="h-3 w-24 mx-auto" animated={animated} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-6 w-16" animated={animated} />
                <Skeleton className="h-3 w-20" animated={animated} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Leaderboard Skeleton
function LeaderboardSkeleton({ animated, count }: { animated: boolean; count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30"
        >
          <Skeleton className="h-8 w-8 rounded-full" animated={animated} />
          <Skeleton className="h-10 w-10 rounded-full" animated={animated} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" animated={animated} />
            <Skeleton className="h-3 w-24" animated={animated} />
          </div>
          <Skeleton className="h-6 w-16" animated={animated} />
        </div>
      ))}
    </div>
  );
}

// Stats Skeleton
function StatsSkeleton({ animated }: { animated: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-xl border border-gray-700/30"
        >
          <Skeleton className="h-8 w-8 rounded-lg mb-3" animated={animated} />
          <Skeleton className="h-8 w-20 mb-2" animated={animated} />
          <Skeleton className="h-3 w-24" animated={animated} />
        </div>
      ))}
    </div>
  );
}

// Profile Skeleton
function ProfileSkeleton({ animated }: { animated: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" animated={animated} />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48" animated={animated} />
          <Skeleton className="h-4 w-32" animated={animated} />
          <Skeleton className="h-3 w-64" animated={animated} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" animated={animated} />
            <Skeleton className="h-3 w-20 mx-auto" animated={animated} />
          </div>
        ))}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" animated={animated} />
        <Skeleton className="h-4 w-4/5" animated={animated} />
        <Skeleton className="h-4 w-3/5" animated={animated} />
      </div>
    </div>
  );
}

// List Skeleton
function ListSkeleton({ animated, count }: { animated: boolean; count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="h-12 w-12 rounded-lg" animated={animated} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" animated={animated} />
            <Skeleton className="h-3 w-32" animated={animated} />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" animated={animated} />
        </div>
      ))}
    </div>
  );
}

// Base Skeleton Component
function Skeleton({ className = '', animated = true }: { className?: string; animated?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-700/30 ${className} ${
        animated ? 'animate-pulse' : ''
      }`}
    >
      {animated && <ShimmerEffect />}
    </div>
  );
}

// Shimmer Effect
function ShimmerEffect() {
  return (
    <motion.div
      animate={{
        x: ['-100%', '100%'],
      }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
    />
  );
}

// Export individual components
export { CardSkeleton, LeaderboardSkeleton, StatsSkeleton, ProfileSkeleton, ListSkeleton };

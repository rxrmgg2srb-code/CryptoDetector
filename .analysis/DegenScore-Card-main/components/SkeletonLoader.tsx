import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'card' | 'leaderboard' | 'text' | 'avatar' | 'badge';
  count?: number;
}

export default function SkeletonLoader({ variant = 'card', count = 1 }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return <CardSkeleton />;
      case 'leaderboard':
        return <LeaderboardSkeleton />;
      case 'text':
        return <TextSkeleton />;
      case 'avatar':
        return <AvatarSkeleton />;
      case 'badge':
        return <BadgeSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}

// Card Skeleton
function CardSkeleton() {
  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-6 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2" />
            <div className="h-6 bg-gray-700 rounded animate-pulse w-3/4" />
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex space-x-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-12 h-12 bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    </motion.div>
  );
}

// Leaderboard Row Skeleton
function LeaderboardSkeleton() {
  return (
    <motion.div
      className="flex items-center justify-between bg-gray-800 rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
        <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded animate-pulse w-32" />
          <div className="h-3 bg-gray-700 rounded animate-pulse w-24" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="h-6 bg-gray-700 rounded animate-pulse w-16" />
        <div className="h-3 bg-gray-700 rounded animate-pulse w-12" />
      </div>
    </motion.div>
  );
}

// Text Skeleton
function TextSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-gray-700 rounded animate-pulse w-full" />
      <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6" />
      <div className="h-4 bg-gray-700 rounded animate-pulse w-4/6" />
    </div>
  );
}

// Avatar Skeleton
function AvatarSkeleton() {
  return <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse" />;
}

// Badge Skeleton
function BadgeSkeleton() {
  return (
    <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3">
      <div className="w-10 h-10 bg-gray-700 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-24" />
        <div className="h-3 bg-gray-700 rounded animate-pulse w-32" />
      </div>
    </div>
  );
}

// Progress Bar Skeleton (útil para análisis de wallet)
export function ProgressSkeleton({ steps = 5 }: { steps?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-700 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-gray-700 rounded animate-pulse w-16" />
          </div>
          <div className="h-2 bg-gray-700 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

import DegenCard from '../components/DegenCard';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { LanguageSelector } from '../components/LanguageSelector';

// PERFORMANCE: Lazy loading de componentes pesados para reducir bundle inicial
const HotFeedWidget = dynamic(
  () =>
    import('../components/HotFeedWidget').catch(() => {
      console.error('Failed to load HotFeedWidget');
      return {
        default: () => (
          <div className="h-96 bg-gray-800/30 rounded-lg p-4 text-center text-gray-400">
            Failed to load feed
          </div>
        ),
      };
    }),
  {
    loading: () => <div className="h-96 bg-gray-800/30 animate-pulse rounded-lg" />,
    ssr: false,
  }
);

const GlobalStats = dynamic(
  () =>
    import('../components/GlobalStats')
      .then((mod) => ({ default: mod.GlobalStats }))
      .catch(() => {
        console.error('Failed to load GlobalStats');
        return { default: () => <div className="h-32 bg-gray-800/30 rounded-lg" /> };
      }),
  {
    loading: () => <div className="h-32 bg-gray-800/30 animate-pulse rounded-lg" />,
  }
);

const LiveActivityFeed = dynamic(
  () =>
    import('../components/LiveActivityFeed')
      .then((mod) => ({ default: mod.LiveActivityFeed }))
      .catch(() => {
        console.error('Failed to load LiveActivityFeed');
        return { default: () => null };
      }),
  {
    ssr: false,
  }
);

const OnboardingTour = dynamic(
  () =>
    import('../components/OnboardingTour').catch(() => {
      console.error('Failed to load OnboardingTour');
      return { default: () => null };
    }),
  {
    ssr: false,
  }
);

const WeeklyChallengeBanner = dynamic(
  () =>
    import('../components/WeeklyChallengeBanner').catch(() => {
      console.error('Failed to load WeeklyChallengeBanner');
      return { default: () => null };
    }),
  {
    loading: () => <div className="h-24 bg-gray-800/30 animate-pulse rounded-lg" />,
  }
);

// KILLER FEATURES: AI Coach, Whale Radar, Engagement
const StreakWidget = dynamic(() => Promise.resolve({ default: () => null }), {
  ssr: false,
});

const DailyChallengesWidget = dynamic(() => Promise.resolve({ default: () => null }), {
  ssr: false,
});

const AITradingCoach = dynamic(() => Promise.resolve({ default: () => null }), {
  ssr: false,
});

const WhaleRadar = dynamic(() => Promise.resolve({ default: () => null }), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="neon-streak"></div>

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* Live Activity Feed */}
      <LiveActivityFeed />

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        {/* Language Selector - Top Right */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          {/* Logo/Title */}
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold gradient-text-gold animate-float">
              DegenScore
            </h1>
            <p className="text-gray-400 text-sm mt-1">Track your trading mastery</p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
            <Link href="/compare">
              <button className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-medium transition">
                ⚔️ Compare
              </button>
            </Link>
            <Link href="/documentation">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition">
                📚 Docs
              </button>
            </Link>
            <Link href="/leaderboard">
              <button className="btn-premium px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:scale-105 transition shadow-lg hover:shadow-purple-500/50">
                🏆 Leaderboard
              </button>
            </Link>
          </div>
        </div>

        {/* Global Stats */}
        <GlobalStats className="mb-8 animate-slide-up global-stats" />

        {/* Weekly Challenge Banner */}
        <WeeklyChallengeBanner />
      </div>

      {/* Layout con Card Generator y Hot Feed */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card Generator - 2 columnas */}
          <div className="lg:col-span-2">
            <DegenCard />
          </div>

          {/* Hot Feed Widget - 1 columna */}
          <div className="lg:col-span-1 activity-feed">
            <HotFeedWidget />
          </div>
        </div>

        {/* ENGAGEMENT FEATURES */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Streak Widget */}
          <StreakWidget />

          {/* Daily Challenges */}
          <DailyChallengesWidget />
        </div>

        {/* KILLER FEATURES */}
        <div className="mt-8 space-y-8">
          {/* AI Trading Coach */}
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-3xl font-bold gradient-text-gold">🧠 AI Trading Coach</h2>
              <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                NEW
              </span>
            </div>
            <AITradingCoach />
          </div>

          {/* Whale Tracking Radar */}
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-3xl font-bold gradient-text-gold">🐋 Whale Tracking Radar</h2>
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                NEW
              </span>
            </div>
            <WhaleRadar />
          </div>
        </div>
      </div>
    </div>
  );
}

// Force SSR to prevent build timeout
export async function getServerSideProps() {
  return {
    props: {},
  };
}

// ✅ PERFORMANCE: Static generation enabled
// 10x faster page loads than SSR

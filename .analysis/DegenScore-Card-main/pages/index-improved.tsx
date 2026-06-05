import DegenCard from '../components/DegenCard';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { LanguageSelector } from '../components/LanguageSelector';
import { HeroSection } from '../components/landing/HeroSection';
import { SocialProof } from '../components/landing/SocialProof';
import { FeatureHighlights } from '../components/landing/FeatureHighlights';
import { Testimonials } from '../components/landing/Testimonials';
import { CTASection } from '../components/landing/CTASection';

// PERFORMANCE: Lazy loading de componentes pesados para reducir bundle inicial
const HotFeedWidget = dynamic(() => import('../components/HotFeedWidget'), {
  loading: () => <div className="h-96 bg-gray-800/30 animate-pulse rounded-lg" />,
  ssr: false,
});

const GlobalStats = dynamic(
  () => import('../components/GlobalStats').then((mod) => ({ default: mod.GlobalStats })),
  {
    loading: () => <div className="h-32 bg-gray-800/30 animate-pulse rounded-lg" />,
  }
);

const LiveActivityFeed = dynamic(
  () => import('../components/LiveActivityFeed').then((mod) => ({ default: mod.LiveActivityFeed })),
  {
    ssr: false,
  }
);

const OnboardingTour = dynamic(() => import('../components/OnboardingTour'), {
  ssr: false,
});

const WeeklyChallengeBanner = dynamic(() => import('../components/WeeklyChallengeBanner'), {
  loading: () => <div className="h-24 bg-gray-800/30 animate-pulse rounded-lg" />,
});

export default function HomeImproved() {
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

        {/* Hero Section */}
        <HeroSection />

        {/* Social Proof */}
        <SocialProof />

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
      </div>

      {/* Feature Highlights */}
      <div className="container mx-auto px-4">
        <FeatureHighlights />
      </div>

      {/* Testimonials */}
      <div className="container mx-auto px-4">
        <Testimonials />
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4">
        <CTASection />
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 border-t border-gray-800">
        <p className="mb-2">
          Powered by <span className="text-cyan-400 font-semibold">Helius RPC</span> ×{' '}
          <span className="text-purple-400 font-semibold">Solana</span>
        </p>
        <p className="text-sm">
          © 2025 DegenScore. All trading data is sourced from public blockchain records.
        </p>
      </footer>
    </div>
  );
}

// Force SSR to prevent build timeout
// Components make API calls during render, so we need SSR to avoid build hanging
export async function getServerSideProps() {
  return {
    props: {},
  };
}

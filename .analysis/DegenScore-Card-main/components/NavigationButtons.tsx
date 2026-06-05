import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

/**
 * FULL Navigation - All pages visible for demo/sale
 * Shows complete feature set to potential buyers
 */
export function NavigationButtons() {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path;
  const [showMore, setShowMore] = useState(false);

  const mainNavItems = [
    {
      href: '/',
      label: 'My Score',
      emoji: '🎯',
      gradient: 'from-purple-500 to-pink-500',
      activeGradient: 'from-purple-400 to-pink-400',
    },
    {
      href: '/leaderboard',
      label: 'Top Traders',
      emoji: '🏆',
      gradient: 'from-yellow-500 to-orange-500',
      activeGradient: 'from-yellow-400 to-orange-400',
    },
    {
      href: '/whale-radar',
      label: 'Copy Whales',
      emoji: '🐋',
      gradient: 'from-blue-500 to-cyan-500',
      activeGradient: 'from-blue-400 to-cyan-400',
    },
    {
      href: '/compare',
      label: 'Battle',
      emoji: '⚔️',
      gradient: 'from-red-500 to-orange-500',
      activeGradient: 'from-red-400 to-orange-400',
    },
  ];

  const moreNavItems = [
    {
      href: '/token-scanner',
      label: 'Token Scanner',
      emoji: '🔍',
      gradient: 'from-green-500 to-emerald-500',
      activeGradient: 'from-green-400 to-emerald-400',
    },
    {
      href: '/super-token-scorer',
      label: 'Super Scorer',
      emoji: '🧠',
      gradient: 'from-violet-500 to-purple-500',
      activeGradient: 'from-violet-400 to-purple-400',
    },
    {
      href: '/achievements',
      label: 'Achievements',
      emoji: '🏅',
      gradient: 'from-amber-500 to-yellow-500',
      activeGradient: 'from-amber-400 to-yellow-400',
    },
    {
      href: '/challenges',
      label: 'Challenges',
      emoji: '🎮',
      gradient: 'from-pink-500 to-rose-500',
      activeGradient: 'from-pink-400 to-rose-400',
    },
    {
      href: '/following',
      label: 'Following',
      emoji: '👥',
      gradient: 'from-sky-500 to-blue-500',
      activeGradient: 'from-sky-400 to-blue-400',
    },
    {
      href: '/settings',
      label: 'Settings',
      emoji: '⚙️',
      gradient: 'from-gray-500 to-slate-500',
      activeGradient: 'from-gray-400 to-slate-400',
    },
    {
      href: '/documentation',
      label: 'Docs',
      emoji: '📚',
      gradient: 'from-teal-500 to-cyan-500',
      activeGradient: 'from-teal-400 to-cyan-400',
    },
  ];

  const renderNavItem = (item: typeof mainNavItems[0]) => (
    <Link key={item.href} href={item.href}>
      <button
        className={`px-3 sm:px-4 py-2 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-sm ${isActive(item.href)
            ? `bg-gradient-to-r ${item.activeGradient} text-white shadow-white/20`
            : `bg-gradient-to-r ${item.gradient} text-white hover:shadow-lg`
          }`}
      >
        <span className="mr-1">{item.emoji}</span>
        <span className="hidden sm:inline">{item.label}</span>
      </button>
    </Link>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Main Navigation Row */}
      <div className="flex flex-wrap gap-2 justify-center">
        {mainNavItems.map(renderNavItem)}
        
        {/* More Button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`px-3 sm:px-4 py-2 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg text-sm ${
            showMore 
              ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white' 
              : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700'
          }`}
        >
          <span className="mr-1">{showMore ? '✕' : '+'}</span>
          <span className="hidden sm:inline">{showMore ? 'Less' : 'More'}</span>
        </button>
      </div>

      {/* Extended Navigation Row */}
      {showMore && (
        <div className="flex flex-wrap gap-2 justify-center animate-fadeIn">
          {moreNavItems.map(renderNavItem)}
        </div>
      )}
    </div>
  );
}

export default NavigationButtons;

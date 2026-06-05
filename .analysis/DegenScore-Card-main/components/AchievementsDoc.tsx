import React from 'react';
import {
  ALL_BADGES,
  VOLUME_BADGES,
  PNL_BADGES,
  WINRATE_BADGES,
  ACTIVITY_BADGES,
  WHALE_TRACKER_BADGES,
  SOCIAL_BADGES,
  PREMIUM_BADGES,
  BADGE_POINTS,
  BadgeDefinition,
  BadgeRarity,
} from '../lib/badges-with-points';

const rarityColors: Record<BadgeRarity, { bg: string; text: string; border: string }> = {
  COMMON: { bg: 'bg-gray-800/50', text: 'text-gray-300', border: 'border-gray-600' },
  RARE: { bg: 'bg-blue-800/50', text: 'text-blue-300', border: 'border-blue-500' },
  EPIC: { bg: 'bg-purple-800/50', text: 'text-purple-300', border: 'border-purple-500' },
  LEGENDARY: { bg: 'bg-yellow-800/50', text: 'text-yellow-300', border: 'border-yellow-500' },
  MYTHIC: { bg: 'bg-pink-800/50', text: 'text-pink-300', border: 'border-pink-500' },
};

interface BadgeCardProps {
  badge: BadgeDefinition;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const colors = rarityColors[badge.rarity];

  return (
    <div
      className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 transition-all hover:scale-105 hover:shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{badge.icon}</div>
        <div className="flex-1">
          <h4 className={`font-bold text-lg ${colors.text}`}>{badge.name}</h4>
          <p className="text-gray-400 text-sm mt-1">{badge.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-1 rounded ${colors.bg} ${colors.text} font-bold`}>
              {badge.rarity}
            </span>
            <span className="text-green-400 font-bold text-sm">+{badge.points} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BadgeCategoryProps {
  title: string;
  icon: string;
  badges: BadgeDefinition[];
}

const BadgeCategory: React.FC<BadgeCategoryProps> = ({ title, icon, badges }) => {
  return (
    <div className="mb-12">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
        <span>{icon}</span>
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {title}
        </span>
        <span className="text-gray-500 text-base font-normal">({badges.length} badges)</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <BadgeCard key={badge.key} badge={badge} />
        ))}
      </div>
    </div>
  );
};

export default function AchievementsDoc() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🏆 Achievement Points System
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete your trading milestones, unlock badges, and earn points to climb the
            leaderboard
          </p>
        </div>

        {/* Points System Overview */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-black mb-6">📊 How Badge Points Work</h2>
          <p className="text-gray-200 mb-6">
            Every badge you unlock adds points to your total <strong>Badge Points</strong> score.
            Higher rarity badges give more points. The more points you have, the higher you rank on
            the leaderboard!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">⚪</div>
              <div className="font-bold text-gray-300">COMMON</div>
              <div className="text-3xl font-black text-green-400 mt-2">+{BADGE_POINTS.COMMON}</div>
              <div className="text-xs text-gray-400 mt-1">point</div>
            </div>

            <div className="bg-blue-800/50 border border-blue-500 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🔵</div>
              <div className="font-bold text-blue-300">RARE</div>
              <div className="text-3xl font-black text-green-400 mt-2">+{BADGE_POINTS.RARE}</div>
              <div className="text-xs text-gray-400 mt-1">points</div>
            </div>

            <div className="bg-purple-800/50 border border-purple-500 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🟣</div>
              <div className="font-bold text-purple-300">EPIC</div>
              <div className="text-3xl font-black text-green-400 mt-2">+{BADGE_POINTS.EPIC}</div>
              <div className="text-xs text-gray-400 mt-1">points</div>
            </div>

            <div className="bg-yellow-800/50 border border-yellow-500 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🟡</div>
              <div className="font-bold text-yellow-300">LEGENDARY</div>
              <div className="text-3xl font-black text-green-400 mt-2">
                +{BADGE_POINTS.LEGENDARY}
              </div>
              <div className="text-xs text-gray-400 mt-1">points</div>
            </div>

            <div className="bg-pink-800/50 border border-pink-500 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🔴</div>
              <div className="font-bold text-pink-300">MYTHIC</div>
              <div className="text-3xl font-black text-green-400 mt-2">+{BADGE_POINTS.MYTHIC}</div>
              <div className="text-xs text-gray-400 mt-1">points</div>
            </div>
          </div>

          <div className="mt-6 bg-black/30 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              💡 <strong>Example:</strong> If you unlock 5 COMMON badges (+5 pts), 3 RARE badges (+9
              pts), and 1 LEGENDARY badge (+10 pts), your total Badge Points would be{' '}
              <strong className="text-green-400">24 points</strong>
            </p>
          </div>
        </div>

        {/* All Badge Categories */}
        <div className="space-y-8">
          <BadgeCategory title="Trading Volume Badges" icon="💰" badges={VOLUME_BADGES} />

          <BadgeCategory title="Profit & Loss Badges" icon="📈" badges={PNL_BADGES} />

          <BadgeCategory title="Win Rate Badges" icon="🎯" badges={WINRATE_BADGES} />

          <BadgeCategory title="Activity Badges" icon="⚡" badges={ACTIVITY_BADGES} />

          <BadgeCategory title="🐋 Whale Tracker Badges" icon="🐋" badges={WHALE_TRACKER_BADGES} />

          <BadgeCategory title="Social & Referral Badges" icon="🤝" badges={SOCIAL_BADGES} />

          <BadgeCategory title="Premium Badges" icon="💎" badges={PREMIUM_BADGES} />
        </div>

        {/* Stats Summary */}
        <div className="mt-12 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-2xl p-8">
          <h3 className="text-2xl font-black mb-4">📊 Badge Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-black text-purple-400">{ALL_BADGES.length}</div>
              <div className="text-sm text-gray-400 mt-1">Total Badges</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-black text-green-400">
                {ALL_BADGES.reduce((sum, b) => sum + b.points, 0)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Max Possible Points</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-black text-blue-400">6</div>
              <div className="text-sm text-gray-400 mt-1">Categories</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-black text-yellow-400">5</div>
              <div className="text-sm text-gray-400 mt-1">Rarity Tiers</div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-4 text-yellow-400">
            💡 Tips to Max Out Your Badge Points
          </h3>
          <ul className="space-y-2 text-gray-200">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>Trade consistently</strong> - Activity badges reward regular trading
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>Increase volume</strong> - Higher volume unlocks more valuable badges
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>Improve win rate</strong> - Accuracy badges give solid points
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>Go premium</strong> - Unlock exclusive premium badges
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>Refer friends</strong> - Social badges can add up quickly
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { BadgeDefinition, getBadgeColor, getBadgeGlow } from '@/lib/badges-with-points';

interface BadgesDisplayProps {
  badges: BadgeDefinition[];
  totalPoints: number;
  showPoints?: boolean;
  maxDisplay?: number;
}

export function BadgesDisplay({
  badges,
  totalPoints,
  showPoints = true,
  maxDisplay,
}: BadgesDisplayProps) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remaining = badges.length - displayBadges.length;

  return (
    <div className="relative">
      {showPoints && (
        <div className="mb-2 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg">
            <span className="text-yellow-400 text-xl">⭐</span>
            <span className="text-white font-bold text-lg">{totalPoints}</span>
            <span className="text-gray-300 text-sm">Achievement Points</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {displayBadges.map((badge) => {
          const colorClass = getBadgeColor(badge.rarity);
          const glowClass = getBadgeGlow(badge.rarity);

          return (
            <div
              key={badge.key}
              className="relative"
              onMouseEnter={() => setHoveredBadge(badge.key)}
              onMouseLeave={() => setHoveredBadge(null)}
            >
              <div
                className={`
                  px-3 py-2 rounded-lg bg-gray-800/80 border-2
                  transition-all duration-200 cursor-help
                  ${colorClass} ${glowClass}
                  hover:scale-110 hover:bg-gray-700/80
                  ${hoveredBadge === badge.key ? 'scale-110 bg-gray-700/80' : ''}
                `}
                style={{
                  borderColor:
                    badge.rarity === 'LEGENDARY'
                      ? '#fbbf24'
                      : badge.rarity === 'MYTHIC'
                        ? '#ec4899'
                        : badge.rarity === 'EPIC'
                          ? '#a855f7'
                          : badge.rarity === 'RARE'
                            ? '#3b82f6'
                            : '#9ca3af',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-sm font-bold">{badge.points}</span>
                </div>
              </div>

              {/* Tooltip */}
              {hoveredBadge === badge.key && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
                  <div className="bg-gray-900 border-2 border-purple-500/50 rounded-lg p-3 shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="flex-1">
                        <div className={`font-bold ${colorClass}`}>{badge.name}</div>
                        <div className="text-xs text-gray-400 uppercase">{badge.rarity}</div>
                      </div>
                      <div className="text-yellow-400 font-bold text-lg">{badge.points}pt</div>
                    </div>
                    <div className="text-sm text-gray-300">{badge.description}</div>
                  </div>
                  {/* Flecha del tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                    <div className="border-8 border-transparent border-t-purple-500/50"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {remaining > 0 && (
          <div className="px-3 py-2 rounded-lg bg-gray-800/80 border-2 border-gray-600 text-gray-400 text-sm font-bold flex items-center">
            +{remaining} more
          </div>
        )}
      </div>
    </div>
  );
}

// Versión compacta para mostrar solo puntos (para cards en el leaderboard)
interface BadgePointsCompactProps {
  totalPoints: number;
  badgeCount: number;
}

export function BadgePointsCompact({ totalPoints, badgeCount }: BadgePointsCompactProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-900/30 border border-purple-500/30 rounded">
      <span className="text-yellow-400">⭐</span>
      <span className="text-white font-bold text-sm">{totalPoints}</span>
      <span className="text-gray-400 text-xs">({badgeCount})</span>
    </div>
  );
}

export default BadgesDisplay;

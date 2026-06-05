import React from 'react';

interface Ranking {
  rank: number;
  address: string;
  score: number;
  change?: number;
}

interface RankingsWidgetProps {
  rankings: Ranking[];
  currentUserRank?: number;
  title?: string;
}

export function RankingsWidget({
  rankings,
  currentUserRank,
  title = 'Top Rankings',
}: RankingsWidgetProps) {
  return (
    <div className="rankings-widget">
      <h3>{title}</h3>
      <div className="rankings-list">
        {rankings.map((ranking) => (
          <div
            key={ranking.address}
            className={`ranking-item ${ranking.rank === currentUserRank ? 'current-user' : ''}`}
          >
            <span className="rank">#{ranking.rank}</span>
            <span className="address">{ranking.address}</span>
            <span className="score">{ranking.score}</span>
            {ranking.change !== undefined && (
              <span className={`change ${ranking.change >= 0 ? 'positive' : 'negative'}`}>
                {ranking.change >= 0 ? '+' : ''}
                {ranking.change}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RankingsWidget;

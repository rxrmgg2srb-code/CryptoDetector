import React from 'react';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  userId?: string;
}

export function StreakWidget({ currentStreak, longestStreak }: StreakWidgetProps) {
  return (
    <div className="streak-widget">
      <div className="streak-current">
        <span className="streak-label">Current Streak</span>
        <span className="streak-value">{currentStreak} days</span>
      </div>
      <div className="streak-longest">
        <span className="streak-label">Longest Streak</span>
        <span className="streak-value">{longestStreak} days</span>
      </div>
    </div>
  );
}

export default StreakWidget;

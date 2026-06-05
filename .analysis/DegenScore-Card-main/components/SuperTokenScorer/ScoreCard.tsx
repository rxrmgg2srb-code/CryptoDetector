import React from 'react';

interface ScoreCardProps {
  title: string;
  score: number;
  max: number;
  icon: string;
}

export default function ScoreCard({ title, score, max, icon }: ScoreCardProps) {
  const percentage = (score / max) * 100;

  return (
    <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-300">
          {icon} {title}
        </div>
        <div className="text-lg font-bold text-white">
          {score}
          <span className="text-xs text-gray-500">/{max}</span>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

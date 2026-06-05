import React from 'react';

interface ScoreBarProps {
  label: string;
  score: number;
  max: number;
}

export default function ScoreBar({ label, score, max }: ScoreBarProps) {
  const percentage = (score / max) * 100;
  const color =
    percentage >= 80
      ? 'from-green-500 to-emerald-500'
      : percentage >= 60
        ? 'from-blue-500 to-cyan-500'
        : percentage >= 40
          ? 'from-yellow-500 to-orange-500'
          : 'from-red-500 to-pink-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-bold">
          {score}/{max}
        </span>
      </div>
      <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`bg-gradient-to-r ${color} h-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

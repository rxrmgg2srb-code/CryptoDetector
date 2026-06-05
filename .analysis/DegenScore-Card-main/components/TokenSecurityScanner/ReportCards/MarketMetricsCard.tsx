import React from 'react';
import ScoreBar from '../Shared/ScoreBar';
import InfoRow from '../Shared/InfoRow';

interface MarketMetricsCardProps {
  metrics: any;
}

export default function MarketMetricsCard({ metrics }: MarketMetricsCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">📈 Market Metrics</h3>
      <div className="grid md:grid-cols-3 gap-4">
        <InfoRow label="Age" value={`${metrics.ageInDays.toFixed(1)} days`} />
        <InfoRow
          label="Pump & Dump"
          value={metrics.isPumpAndDump ? '⚠️ Detected' : '✅ No'}
          danger={metrics.isPumpAndDump}
        />
        <ScoreBar label="Market Score" score={metrics.score} max={10} />
      </div>
    </div>
  );
}

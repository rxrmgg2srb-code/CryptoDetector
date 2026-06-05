import React from 'react';
import ScoreBar from '../Shared/ScoreBar';
import InfoRow from '../Shared/InfoRow';

interface TradingPatternsCardProps {
  patterns: any;
}

export default function TradingPatternsCard({ patterns }: TradingPatternsCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">📊 Trading Patterns</h3>
      <div className="space-y-3">
        <ScoreBar label="Trading Score" score={patterns.score} max={15} />

        <InfoRow
          label="Bundle Bots"
          value={patterns.bundleBots.toString()}
          danger={patterns.bundleBots > 10}
        />
        <InfoRow label="Snipers" value={patterns.snipers.toString()} />
        <InfoRow
          label="Wash Trading"
          value={patterns.washTrading ? '⚠️ Detected' : '✅ None'}
          danger={patterns.washTrading}
        />
        <InfoRow
          label="Honeypot"
          value={patterns.honeypotDetected ? '🚨 DETECTED' : '✅ Safe'}
          danger={patterns.honeypotDetected}
        />
        <InfoRow
          label="Can Sell"
          value={patterns.canSell ? '✅ Yes' : '⛔ NO'}
          danger={!patterns.canSell}
        />
      </div>
    </div>
  );
}

import React from 'react';
import ScoreBar from '../Shared/ScoreBar';
import InfoRow from '../Shared/InfoRow';

interface HolderDistributionCardProps {
  distribution: any;
}

export default function HolderDistributionCard({ distribution }: HolderDistributionCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">👥 Holder Distribution</h3>
      <div className="space-y-3">
        <ScoreBar label="Distribution Score" score={distribution.score} max={20} />

        <InfoRow label="Total Holders" value={distribution.totalHolders.toLocaleString()} />
        <InfoRow
          label="Top 10 Holders"
          value={`${distribution.top10HoldersPercent.toFixed(1)}%`}
          danger={distribution.top10HoldersPercent > 60}
        />
        <InfoRow
          label="Creator Holdings"
          value={`${distribution.creatorPercent.toFixed(1)}%`}
          danger={distribution.creatorPercent > 30}
        />
        <InfoRow
          label="Concentration Risk"
          value={distribution.concentrationRisk}
          danger={
            distribution.concentrationRisk === 'HIGH' ||
            distribution.concentrationRisk === 'CRITICAL'
          }
        />
        {distribution.bundleDetected && (
          <InfoRow
            label="Bundle Wallets"
            value={`⚠️ ${distribution.bundleWallets} detected`}
            danger={true}
          />
        )}
      </div>
    </div>
  );
}

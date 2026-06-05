import React from 'react';
import ScoreBar from '../Shared/ScoreBar';
import InfoRow from '../Shared/InfoRow';

interface LiquidityCardProps {
  liquidity: any;
}

export default function LiquidityCard({ liquidity }: LiquidityCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">💧 Liquidity Analysis</h3>
      <div className="space-y-3">
        <ScoreBar label="Liquidity Score" score={liquidity.score} max={20} />

        <InfoRow
          label="Total Liquidity"
          value={`${liquidity.totalLiquiditySOL.toFixed(2)} SOL ($${liquidity.liquidityUSD.toFixed(0)})`}
        />
        <InfoRow
          label="LP Burned"
          value={liquidity.lpBurned ? '✅ Yes' : '❌ No'}
          danger={!liquidity.lpBurned}
        />
        <InfoRow
          label="LP Locked"
          value={liquidity.lpLocked ? '✅ Yes' : '❌ No'}
          danger={!liquidity.lpLocked}
        />
        <InfoRow
          label="Risk Level"
          value={liquidity.riskLevel}
          danger={liquidity.riskLevel === 'HIGH' || liquidity.riskLevel === 'CRITICAL'}
        />
      </div>
    </div>
  );
}

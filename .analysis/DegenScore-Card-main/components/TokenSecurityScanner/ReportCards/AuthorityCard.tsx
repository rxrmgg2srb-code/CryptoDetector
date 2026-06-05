import React from 'react';
import ScoreBar from '../Shared/ScoreBar';
import InfoRow from '../Shared/InfoRow';

interface AuthorityCardProps {
  authorities: any;
}

export default function AuthorityCard({ authorities }: AuthorityCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">🔑 Token Authorities</h3>
      <div className="space-y-3">
        <ScoreBar label="Authority Score" score={authorities.score} max={25} />

        <InfoRow
          label="Mint Authority"
          value={authorities.hasMintAuthority ? '⚠️ Active' : '✅ Revoked'}
          danger={authorities.hasMintAuthority}
        />
        <InfoRow
          label="Freeze Authority"
          value={authorities.hasFreezeAuthority ? '⚠️ Active' : '✅ Revoked'}
          danger={authorities.hasFreezeAuthority}
        />
        <InfoRow
          label="Risk Level"
          value={authorities.riskLevel}
          danger={authorities.riskLevel === 'HIGH' || authorities.riskLevel === 'CRITICAL'}
        />
      </div>
    </div>
  );
}

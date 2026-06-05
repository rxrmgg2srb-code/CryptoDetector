import React from 'react';
import { SuperTokenScore } from '@/lib/services/superTokenScorer';
import { getSeverityEmoji } from '@/lib/utils/token-scoring';

interface FlagSectionProps {
  result: SuperTokenScore;
}

export default function FlagSection({ result }: FlagSectionProps) {
  return (
    <>
      {/* Red Flags */}
      {result.allRedFlags.length > 0 && (
        <div className="bg-red-900/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
          <h2 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-2">
            🚨 Red Flags ({result.allRedFlags.length})
          </h2>
          <div className="space-y-3">
            {result.allRedFlags.map((flag, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  flag.severity === 'CRITICAL'
                    ? 'bg-red-900/30 border-red-500'
                    : flag.severity === 'HIGH'
                      ? 'bg-orange-900/30 border-orange-500'
                      : flag.severity === 'MEDIUM'
                        ? 'bg-yellow-900/30 border-yellow-500'
                        : 'bg-blue-900/30 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-white mb-1">
                      {getSeverityEmoji(flag.severity)} {flag.category}
                    </div>
                    <div className="text-gray-300">{flag.message}</div>
                  </div>
                  <div className="text-sm text-red-400 font-bold">-{flag.score_impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Green Flags */}
      {result.greenFlags.length > 0 && (
        <div className="bg-green-900/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
          <h2 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-2">
            ✅ Green Flags ({result.greenFlags.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.greenFlags.map((flag, idx) => (
              <div key={idx} className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-white mb-1">{flag.category}</div>
                    <div className="text-gray-300 text-sm">{flag.message}</div>
                  </div>
                  <div className="text-sm text-green-400 font-bold">+{flag.score_boost}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

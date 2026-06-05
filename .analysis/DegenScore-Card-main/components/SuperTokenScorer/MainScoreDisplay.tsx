import React from 'react';
import { SuperTokenScore } from '@/lib/services/superTokenScorer';
import { getScoreColor, getRiskBadge } from '@/lib/utils/token-scoring';

interface MainScoreDisplayProps {
  result: SuperTokenScore;
}

export default function MainScoreDisplay({ result }: MainScoreDisplayProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
      <div className="text-center">
        <div className="text-6xl md:text-8xl font-black mb-4">
          <span className={getScoreColor(result.superScore)}>{result.superScore}</span>
          <span className="text-3xl text-gray-400">/100</span>
        </div>
        <div className="text-2xl md:text-3xl font-bold mb-2">
          {result.tokenSymbol} - {result.tokenName}
        </div>
        <div
          className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${getRiskBadge(result.globalRiskLevel)}`}
        >
          {result.globalRiskLevel}
        </div>
        <div className="mt-6 text-gray-300 text-lg max-w-3xl mx-auto">{result.recommendation}</div>
        <div className="mt-4 text-sm text-gray-500">
          Analysis completado en {result.analysisTimeMs}ms ·{' '}
          {new Date(result.analyzedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

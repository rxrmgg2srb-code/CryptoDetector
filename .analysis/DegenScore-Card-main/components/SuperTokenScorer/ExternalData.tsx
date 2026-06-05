import React from 'react';
import { SuperTokenScore } from '@/lib/services/superTokenScorer';

interface ExternalDataProps {
  result: SuperTokenScore;
}

export default function ExternalData({ result }: ExternalDataProps) {
  if (!result.dexScreenerData && !result.birdeyeData && !result.rugCheckData) {
    return null;
  }

  return (
    <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
      <h2 className="text-2xl font-bold text-white mb-4">📡 Datos de APIs Externas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {result.dexScreenerData && (
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="font-bold text-purple-400 mb-2">DexScreener</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Price: ${result.dexScreenerData.priceUSD.toFixed(8)}</div>
              <div>Liquidity: ${result.dexScreenerData.liquidity.toLocaleString()}</div>
              <div>Volume 24h: ${result.dexScreenerData.volume24h.toLocaleString()}</div>
              <div>DEX: {result.dexScreenerData.dex}</div>
            </div>
          </div>
        )}
        {result.birdeyeData && (
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="font-bold text-blue-400 mb-2">Birdeye</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Price: ${result.birdeyeData.price.toFixed(8)}</div>
              <div>Market Cap: ${result.birdeyeData.marketCap.toLocaleString()}</div>
              <div>Holders: {result.birdeyeData.holder.toLocaleString()}</div>
              <div>24h Trades: {result.birdeyeData.trade24h}</div>
            </div>
          </div>
        )}
        {result.rugCheckData && (
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="font-bold text-red-400 mb-2">RugCheck</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Score: {result.rugCheckData.score}/100</div>
              <div>Rugged: {result.rugCheckData.rugged ? '⚠️ YES' : '✅ NO'}</div>
              <div>Risks: {result.rugCheckData.risks.length}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

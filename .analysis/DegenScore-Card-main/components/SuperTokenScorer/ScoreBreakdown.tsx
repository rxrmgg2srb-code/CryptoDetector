import React from 'react';
import { SuperTokenScore } from '@/lib/services/superTokenScorer';
import ScoreCard from './ScoreCard';

interface ScoreBreakdownProps {
  result: SuperTokenScore;
}

export default function ScoreBreakdown({ result }: ScoreBreakdownProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <ScoreCard
        title="Seguridad Base"
        score={result.scoreBreakdown.baseSecurityScore}
        max={100}
        icon="🔒"
      />
      <ScoreCard
        title="Wallets Nuevas"
        score={result.scoreBreakdown.newWalletScore}
        max={50}
        icon="👶"
      />
      <ScoreCard
        title="Actividad Insiders"
        score={result.scoreBreakdown.insiderScore}
        max={50}
        icon="🕵️"
      />
      <ScoreCard
        title="Volumen Real"
        score={result.scoreBreakdown.volumeScore}
        max={40}
        icon="📊"
      />
      <ScoreCard
        title="Redes Sociales"
        score={result.scoreBreakdown.socialScore}
        max={30}
        icon="🌐"
      />
      <ScoreCard
        title="Detección de Bots"
        score={result.scoreBreakdown.botDetectionScore}
        max={60}
        icon="🤖"
      />
      <ScoreCard
        title="Smart Money"
        score={result.scoreBreakdown.smartMoneyScore}
        max={70}
        icon="💎"
      />
      <ScoreCard title="Equipo" score={result.scoreBreakdown.teamScore} max={40} icon="👥" />
      <ScoreCard
        title="Patrón de Precio"
        score={result.scoreBreakdown.pricePatternScore}
        max={50}
        icon="📈"
      />
      <ScoreCard
        title="Holders Históricos"
        score={result.scoreBreakdown.historicalHoldersScore}
        max={40}
        icon="📅"
      />
      <ScoreCard
        title="Liquidez"
        score={result.scoreBreakdown.liquidityDepthScore}
        max={50}
        icon="💧"
      />
      <ScoreCard
        title="Cross-Chain"
        score={result.scoreBreakdown.crossChainScore}
        max={30}
        icon="🌉"
      />
      <ScoreCard title="RugCheck" score={result.scoreBreakdown.rugCheckScore} max={100} icon="⛔" />
      <ScoreCard
        title="DexScreener"
        score={result.scoreBreakdown.dexScreenerScore}
        max={60}
        icon="📱"
      />
      <ScoreCard title="Birdeye" score={result.scoreBreakdown.birdeyeScore} max={50} icon="🦅" />
      <ScoreCard title="Jupiter" score={result.scoreBreakdown.jupiterScore} max={50} icon="🪐" />
    </div>
  );
}

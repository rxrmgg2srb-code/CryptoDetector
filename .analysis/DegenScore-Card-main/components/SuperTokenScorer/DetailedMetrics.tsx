import React from 'react';
import { SuperTokenScore } from '@/lib/services/superTokenScorer';
import {
  getRiskColor,
  getSignalColor,
  getPatternColor,
  getLiquidityColor,
} from '@/lib/utils/token-scoring';
import MetricCard from './MetricCard';
import MetricRow from './MetricRow';

interface DetailedMetricsProps {
  result: SuperTokenScore;
}

export default function DetailedMetrics({ result }: DetailedMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* New Wallets Analysis */}
      <MetricCard title="New Wallets Analysis" icon="👶">
        <MetricRow
          label="Wallets < 10 días"
          value={`${result.newWalletAnalysis.walletsUnder10Days} (${result.newWalletAnalysis.percentageNewWallets.toFixed(1)}%)`}
        />
        <MetricRow
          label="Edad promedio"
          value={`${result.newWalletAnalysis.avgWalletAge.toFixed(1)} días`}
        />
        <MetricRow
          label="Wallets sospechosas"
          value={result.newWalletAnalysis.suspiciousNewWallets}
        />
        <MetricRow
          label="Nivel de riesgo"
          value={result.newWalletAnalysis.riskLevel}
          valueClass={getRiskColor(result.newWalletAnalysis.riskLevel)}
        />
      </MetricCard>

      {/* Insider Analysis */}
      <MetricCard title="Insider Analysis" icon="🕵️">
        <MetricRow label="Wallets insiders" value={result.insiderAnalysis.insiderWallets} />
        <MetricRow
          label="Holdings insiders"
          value={`${result.insiderAnalysis.insiderHoldings.toFixed(1)}%`}
        />
        <MetricRow label="Early buyers" value={result.insiderAnalysis.earlyBuyers} />
        <MetricRow
          label="Profit taking"
          value={result.insiderAnalysis.insiderProfitTaking ? '⚠️ SÍ' : '✅ NO'}
          valueClass={
            result.insiderAnalysis.insiderProfitTaking ? 'text-red-400' : 'text-green-400'
          }
        />
      </MetricCard>

      {/* Volume Analysis */}
      <MetricCard title="Volume Analysis" icon="📊">
        <MetricRow
          label="Volumen 24h"
          value={`$${result.volumeAnalysis.volume24h.toLocaleString()}`}
        />
        <MetricRow
          label="Volumen real"
          value={`$${result.volumeAnalysis.realVolume.toLocaleString()}`}
        />
        <MetricRow
          label="Volumen fake"
          value={`${result.volumeAnalysis.fakeVolumePercent.toFixed(1)}%`}
          valueClass={
            result.volumeAnalysis.fakeVolumePercent > 30 ? 'text-red-400' : 'text-green-400'
          }
        />
        <MetricRow label="Tendencia" value={result.volumeAnalysis.volumeTrend} />
      </MetricCard>

      {/* Social Analysis */}
      <MetricCard title="Redes Sociales" icon="🌐">
        <MetricRow
          label="Twitter"
          value={
            result.socialAnalysis.hasTwitter
              ? `✅ ${result.socialAnalysis.twitterFollowers.toLocaleString()} followers`
              : '❌ No'
          }
        />
        <MetricRow
          label="Telegram"
          value={
            result.socialAnalysis.hasTelegram
              ? `✅ ${result.socialAnalysis.telegramMembers.toLocaleString()} miembros`
              : '❌ No'
          }
        />
        <MetricRow
          label="Website"
          value={
            result.socialAnalysis.hasWebsite
              ? `✅ ${result.socialAnalysis.websiteSSL ? 'SSL' : 'Sin SSL'}`
              : '❌ No'
          }
        />
        <MetricRow
          label="Discord"
          value={
            result.socialAnalysis.hasDiscord
              ? `✅ ${result.socialAnalysis.discordMembers.toLocaleString()} miembros`
              : '❌ No'
          }
        />
      </MetricCard>

      {/* Bot Detection */}
      <MetricCard title="Detección de Bots" icon="🤖">
        <MetricRow label="Total de bots" value={result.botDetection.totalBots} />
        <MetricRow
          label="Porcentaje bots"
          value={`${result.botDetection.botPercent.toFixed(1)}%`}
          valueClass={result.botDetection.botPercent > 40 ? 'text-red-400' : 'text-green-400'}
        />
        <MetricRow label="MEV Bots" value={result.botDetection.mevBots} />
        <MetricRow label="Bundle Bots" value={result.botDetection.bundleBots} />
        <MetricRow label="Wash Trading Bots" value={result.botDetection.washTradingBots} />
      </MetricCard>

      {/* Smart Money */}
      <MetricCard title="Smart Money" icon="💎">
        <MetricRow label="Wallets detectadas" value={result.smartMoneyAnalysis.smartMoneyWallets} />
        <MetricRow
          label="Holdings"
          value={`${result.smartMoneyAnalysis.smartMoneyHoldings.toFixed(1)}%`}
        />
        <MetricRow
          label="Señal"
          value={result.smartMoneyAnalysis.signal}
          valueClass={getSignalColor(result.smartMoneyAnalysis.signal)}
        />
        <MetricRow
          label="Profit promedio"
          value={`${result.smartMoneyAnalysis.averageSmartMoneyProfit.toFixed(1)}%`}
          valueClass={
            result.smartMoneyAnalysis.averageSmartMoneyProfit > 0
              ? 'text-green-400'
              : 'text-red-400'
          }
        />
      </MetricCard>

      {/* Team Analysis */}
      <MetricCard title="Team Analysis" icon="👥">
        <MetricRow
          label="Tokens bloqueados"
          value={result.teamAnalysis.teamTokensLocked ? '✅ SÍ' : '❌ NO'}
          valueClass={result.teamAnalysis.teamTokensLocked ? 'text-green-400' : 'text-red-400'}
        />
        <MetricRow
          label="Asignación team"
          value={`${result.teamAnalysis.teamAllocation.toFixed(1)}%`}
        />
        <MetricRow
          label="Vesting"
          value={
            result.teamAnalysis.vestingSchedule
              ? `✅ ${result.teamAnalysis.vestingDuration} meses`
              : '❌ NO'
          }
        />
        <MetricRow
          label="Team vendiendo"
          value={result.teamAnalysis.teamSelling ? '⚠️ SÍ' : '✅ NO'}
          valueClass={result.teamAnalysis.teamSelling ? 'text-red-400' : 'text-green-400'}
        />
      </MetricCard>

      {/* Price Pattern */}
      <MetricCard title="Patrón de Precio" icon="📈">
        <MetricRow
          label="Patrón"
          value={result.pricePattern.pattern}
          valueClass={getPatternColor(result.pricePattern.pattern)}
        />
        <MetricRow label="Volatilidad" value={`${result.pricePattern.volatility.toFixed(1)}%`} />
        <MetricRow
          label="Estabilidad"
          value={`${result.pricePattern.priceStability.toFixed(1)}%`}
        />
        <MetricRow
          label="Fuerza de tendencia"
          value={`${result.pricePattern.trendStrength.toFixed(1)}%`}
        />
      </MetricCard>

      {/* Liquidity Depth */}
      <MetricCard title="Profundidad de Liquidez" icon="💧">
        <MetricRow
          label="Salud"
          value={result.liquidityDepth.liquidityHealth}
          valueClass={getLiquidityColor(result.liquidityDepth.liquidityHealth)}
        />
        <MetricRow
          label="Slippage 1 SOL"
          value={`${result.liquidityDepth.slippage1SOL.toFixed(2)}%`}
        />
        <MetricRow
          label="Slippage 10 SOL"
          value={`${result.liquidityDepth.slippage10SOL.toFixed(2)}%`}
        />
        <MetricRow
          label="Slippage 100 SOL"
          value={`${result.liquidityDepth.slippage100SOL.toFixed(2)}%`}
        />
      </MetricCard>
    </div>
  );
}

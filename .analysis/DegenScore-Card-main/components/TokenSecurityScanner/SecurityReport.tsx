import React from 'react';
import { motion } from 'framer-motion';
import { TokenSecurityReport } from '@/hooks/useTokenSecurity';
import RedFlagsCard from './ReportCards/RedFlagsCard';
import AuthorityCard from './ReportCards/AuthorityCard';
import HolderDistributionCard from './ReportCards/HolderDistributionCard';
import LiquidityCard from './ReportCards/LiquidityCard';
import TradingPatternsCard from './ReportCards/TradingPatternsCard';
import MarketMetricsCard from './ReportCards/MarketMetricsCard';

interface SecurityReportProps {
  report: TokenSecurityReport;
}

export default function SecurityReport({ report }: SecurityReportProps) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'ULTRA_SAFE':
        return 'from-green-500 to-emerald-500';
      case 'LOW_RISK':
        return 'from-blue-500 to-cyan-500';
      case 'MODERATE_RISK':
        return 'from-yellow-500 to-orange-500';
      case 'HIGH_RISK':
        return 'from-orange-500 to-red-500';
      case 'EXTREME_DANGER':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskEmoji = (riskLevel: string) => {
    switch (riskLevel) {
      case 'ULTRA_SAFE':
        return '✅';
      case 'LOW_RISK':
        return '🟢';
      case 'MODERATE_RISK':
        return '🟡';
      case 'HIGH_RISK':
        return '🔴';
      case 'EXTREME_DANGER':
        return '⛔';
      default:
        return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-gradient-to-br ${getRiskColor(report.riskLevel)} p-1 rounded-2xl`}
      >
        <div className="bg-gray-900 rounded-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">{getRiskEmoji(report.riskLevel)}</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Security Score: {report.securityScore}/100
            </h2>
            <div className="text-2xl font-semibold text-gray-300 mb-4">
              {report.riskLevel.replace('_', ' ')}
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">{report.recommendation}</p>
          </div>

          {/* Token Info */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm">Token</div>
                <div className="text-white font-bold">{report.metadata.symbol}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Holders</div>
                <div className="text-white font-bold">
                  {report.holderDistribution.totalHolders.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Liquidity</div>
                <div className="text-white font-bold">
                  {report.liquidityAnalysis.totalLiquiditySOL.toFixed(1)} SOL
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Age</div>
                <div className="text-white font-bold">
                  {report.marketMetrics.ageInDays.toFixed(1)} days
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Red Flags */}
      {report.redFlags.flags.length > 0 && <RedFlagsCard redFlags={report.redFlags} />}

      {/* Detailed Analysis Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <AuthorityCard authorities={report.tokenAuthorities} />
        <HolderDistributionCard distribution={report.holderDistribution} />
        <LiquidityCard liquidity={report.liquidityAnalysis} />
        <TradingPatternsCard patterns={report.tradingPatterns} />
      </div>

      {/* Market Metrics */}
      <MarketMetricsCard metrics={report.marketMetrics} />
    </div>
  );
}

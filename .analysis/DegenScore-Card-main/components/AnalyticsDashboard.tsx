import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsProps {
  walletAddress: string;
  analysisData: any;
}

interface TradingMetrics {
  totalPnL: number;
  winRate: number;
  avgTradeSize: number;
  totalTrades: number;
  bestTrade: number;
  worstTrade: number;
  volatilityScore: number;
  sharpeRatio: number;
}

export default function AnalyticsDashboard({
  walletAddress: _walletAddress,
  analysisData,
}: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'insights'>('overview');
  const [metrics, setMetrics] = useState<TradingMetrics | null>(null);

  useEffect(() => {
    if (analysisData) {
      calculateMetrics();
    }
  }, [analysisData]);

  const calculateMetrics = () => {
    const sharpeRatio = calculateSharpeRatio(analysisData);

    setMetrics({
      totalPnL: analysisData.realizedPnL + analysisData.unrealizedPnL,
      winRate: analysisData.winRate || 0,
      avgTradeSize: analysisData.avgTradeSize || 0,
      totalTrades: analysisData.totalTrades || 0,
      bestTrade: analysisData.bestTrade || 0,
      worstTrade: analysisData.worstTrade || 0,
      volatilityScore: analysisData.volatilityScore || 0,
      sharpeRatio,
    });
  };

  const calculateSharpeRatio = (data: any): number => {
    // Simplified Sharpe Ratio calculation
    const returns = data.profitLoss / (data.totalVolume || 1);
    const volatility = data.volatilityScore || 1;
    return returns / volatility;
  };

  // Performance Over Time Chart Data
  const performanceData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'P&L (SOL)',
        data: generateMockPerformanceData(analysisData),
        borderColor: 'rgb(34, 211, 238)',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Trade Distribution Chart Data
  const tradeDistributionData = {
    labels: ['Wins', 'Losses', 'Break-even'],
    datasets: [
      {
        data: [
          Math.floor(((analysisData?.totalTrades || 0) * (analysisData?.winRate || 0)) / 100),
          Math.floor((analysisData?.totalTrades || 0) * (1 - (analysisData?.winRate || 0) / 100)),
          Math.floor((analysisData?.totalTrades || 0) * 0.05),
        ],
        backgroundColor: [
          'rgba(34, 211, 153, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: ['rgb(34, 211, 153)', 'rgb(239, 68, 68)', 'rgb(156, 163, 175)'],
        borderWidth: 2,
      },
    ],
  };

  // Trading Volume by Day
  const volumeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Trading Volume (SOL)',
        data: generateMockVolumeData(),
        backgroundColor: 'rgba(147, 51, 234, 0.7)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(147, 51, 234, 0.5)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 bg-gray-800/50 p-2 rounded-xl">
        {(['overview', 'performance', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Total P&L"
                  value={metrics.totalPnL}
                  prefix={metrics.totalPnL >= 0 ? '+' : ''}
                  suffix=" SOL"
                  trend={metrics.totalPnL >= 0 ? 'up' : 'down'}
                  icon="💰"
                />
                <MetricCard
                  title="Win Rate"
                  value={metrics.winRate}
                  suffix="%"
                  trend={metrics.winRate >= 50 ? 'up' : 'down'}
                  icon="🎯"
                />
                <MetricCard title="Total Trades" value={metrics.totalTrades} icon="📊" />
                <MetricCard
                  title="Sharpe Ratio"
                  value={metrics.sharpeRatio}
                  decimals={2}
                  trend={metrics.sharpeRatio >= 1 ? 'up' : 'down'}
                  icon="📈"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span>📈</span>
                    Performance Over Time
                  </h3>
                  <div className="h-64">
                    <Line data={performanceData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span>🎯</span>
                    Trade Distribution
                  </h3>
                  <div className="h-64">
                    <Doughnut data={tradeDistributionData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Weekly Trading Volume
                </h3>
                <div className="h-80">
                  <Bar data={volumeData} options={chartOptions} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                  <div className="text-sm text-green-400 mb-2">Best Trade</div>
                  <div className="text-3xl font-bold text-white">
                    +<CountUp end={metrics.bestTrade} decimals={2} duration={1} /> SOL
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Your highest win</div>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-6">
                  <div className="text-sm text-red-400 mb-2">Worst Trade</div>
                  <div className="text-3xl font-bold text-white">
                    <CountUp end={metrics.worstTrade} decimals={2} duration={1} /> SOL
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Biggest loss</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <InsightCard
                icon="🧠"
                title="Trading Pattern Analysis"
                insight={generateTradingInsight(metrics)}
                type="info"
              />
              <InsightCard
                icon="💡"
                title="Risk Assessment"
                insight={generateRiskInsight(metrics)}
                type={metrics.volatilityScore > 70 ? 'warning' : 'success'}
              />
              <InsightCard
                icon="🎓"
                title="Performance Recommendation"
                insight={generateRecommendation(metrics)}
                type="info"
              />
              <InsightCard
                icon="🔥"
                title="Trader Profile"
                insight={generateTraderProfile(metrics)}
                type="success"
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: 'up' | 'down';
  icon?: string;
}

function MetricCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  icon,
}: MetricCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-400">{title}</div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-bold text-white">
          {prefix}
          <CountUp end={value} decimals={decimals} duration={1.5} />
          {suffix}
        </div>
        {trend && (
          <div className={`text-sm mb-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
    </div>
  );
}

interface InsightCardProps {
  icon: string;
  title: string;
  insight: string;
  type: 'success' | 'warning' | 'info';
}

function InsightCard({ icon, title, insight, type }: InsightCardProps) {
  const colors = {
    success: 'from-green-500/20 to-green-600/20 border-green-500/30',
    warning: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    info: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[type]} border rounded-xl p-6`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <h4 className="text-white font-bold mb-2">{title}</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
}

// Helper Functions

function generateMockPerformanceData(data: any): number[] {
  const totalPnL = data?.profitLoss || 0;
  const variance = totalPnL * 0.2;
  return Array.from({ length: 6 }, (_, i) => {
    const trend = (totalPnL / 6) * (i + 1);
    const noise = (Math.random() - 0.5) * variance;
    return Math.max(0, trend + noise);
  });
}

function generateMockVolumeData(): number[] {
  return Array.from({ length: 7 }, () => Math.random() * 100 + 50);
}

function generateTradingInsight(metrics: TradingMetrics): string {
  if (metrics.winRate >= 60) {
    return `You're showing strong trading patterns with a ${metrics.winRate.toFixed(1)}% win rate. Your strategy appears to be working well. Consider scaling up gradually while maintaining risk management.`;
  } else if (metrics.winRate >= 40) {
    return `Your win rate of ${metrics.winRate.toFixed(1)}% is in the balanced range. Focus on improving your entry and exit timing, and consider reducing position sizes on lower-conviction trades.`;
  } else {
    return `With a ${metrics.winRate.toFixed(1)}% win rate, there's room for improvement. Review your strategy, focus on risk management, and consider paper trading new approaches before implementing them.`;
  }
}

function generateRiskInsight(metrics: TradingMetrics): string {
  if (metrics.volatilityScore > 70) {
    return `High volatility detected (${metrics.volatilityScore}/100). Consider diversifying your positions and implementing stricter stop-losses to protect your portfolio during market swings.`;
  } else if (metrics.volatilityScore > 40) {
    return `Moderate risk level detected. Your portfolio shows balanced volatility. Continue monitoring market conditions and adjust position sizes accordingly.`;
  } else {
    return `Low volatility in your trading activity. While this suggests conservative risk management, ensure you're not missing profitable opportunities. Consider strategic position sizing.`;
  }
}

function generateRecommendation(metrics: TradingMetrics): string {
  const sharpe = metrics.sharpeRatio;
  if (sharpe >= 2) {
    return `Excellent risk-adjusted returns (Sharpe: ${sharpe.toFixed(2)})! Your strategy is performing exceptionally. Document your process and maintain consistency.`;
  } else if (sharpe >= 1) {
    return `Good risk-adjusted returns (Sharpe: ${sharpe.toFixed(2)}). Look for ways to either increase returns or reduce volatility to improve further.`;
  } else {
    return `Your Sharpe ratio (${sharpe.toFixed(2)}) suggests room for improvement. Focus on risk management and consider reducing position sizes until you find a more profitable strategy.`;
  }
}

function generateTraderProfile(metrics: TradingMetrics): string {
  if (metrics.avgTradeSize > 10 && metrics.totalTrades < 50) {
    return `Position Trader: You make larger, less frequent trades. This style requires patience and strong conviction. Ensure thorough research before entries.`;
  } else if (metrics.totalTrades > 100 && metrics.avgTradeSize < 5) {
    return `Active Trader: High frequency with smaller positions suggests a scalping or day trading approach. Focus on transaction costs and execution quality.`;
  } else {
    return `Balanced Trader: Your mix of trade frequency and position sizing suggests a well-rounded approach. Continue refining your strategy based on market conditions.`;
  }
}

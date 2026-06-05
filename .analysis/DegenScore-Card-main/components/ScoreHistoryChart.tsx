import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { logger } from '../lib/logger';

interface ScoreHistoryData {
  timestamp: string;
  score: number;
  rank: number | null;
  totalTrades: number;
  totalVolume: number;
  profitLoss: number;
  winRate: number;
  badges: number;
}

interface ScoreHistoryResponse {
  walletAddress: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  dataPoints: number;
  history: ScoreHistoryData[];
  statistics: {
    current: number;
    max: number;
    min: number;
    average: number;
    change: number;
    changePercent: number;
    bestRank: number | null;
  };
}

interface ScoreHistoryChartProps {
  walletAddress: string;
  className?: string;
}

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: 365 },
];

const CHART_TYPES = [
  { label: 'Score', value: 'score' },
  { label: 'P&L', value: 'pnl' },
  { label: 'Win Rate', value: 'winRate' },
  { label: 'Volume', value: 'volume' },
];

export default function ScoreHistoryChart({
  walletAddress,
  className = '',
}: ScoreHistoryChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedChart, setSelectedChart] = useState('score');
  const [data, setData] = useState<ScoreHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [walletAddress, selectedPeriod]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/score-history?walletAddress=${walletAddress}&days=${selectedPeriod}`
      );
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch history');
      }

      setData(json);
    } catch (err: any) {
      logger.error('Error fetching score history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format data for recharts
  const chartData =
    data?.history.map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      score: point.score,
      rank: point.rank,
      volume: point.totalVolume,
      winRate: point.winRate,
      pnl: point.profitLoss,
      trades: point.totalTrades,
    })) || [];

  // Get gradient colors based on chart type
  const getGradientColors = () => {
    switch (selectedChart) {
      case 'pnl':
        return { start: '#10B981', end: '#10B981' }; // Green
      case 'winRate':
        return { start: '#3B82F6', end: '#3B82F6' }; // Blue
      case 'volume':
        return { start: '#F59E0B', end: '#F59E0B' }; // Yellow
      default:
        return { start: '#9945FF', end: '#14F195' }; // Purple to green
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-gray-900/95 backdrop-blur-lg border border-purple-500/50 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <p className="text-white font-bold mb-3 text-lg border-b border-gray-700 pb-2">{item.date}</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Score:</span>
              <span className="text-purple-400 font-bold">{item.score}</span>
            </div>
            {item.rank && (
              <div className="flex justify-between">
                <span className="text-gray-400">Rank:</span>
                <span className="text-blue-400 font-bold">#{item.rank}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Win Rate:</span>
              <span className="text-green-400 font-bold">{item.winRate?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">P&L:</span>
              <span className={`font-bold ${item.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.pnl >= 0 ? '+' : ''}{item.pnl?.toFixed(2)} SOL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volume:</span>
              <span className="text-yellow-400 font-bold">{item.volume?.toFixed(1)} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Trades:</span>
              <span className="text-gray-300 font-bold">{item.trades}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 ${className}`}>
        <div className="animate-pulse">
          <div className="flex justify-between mb-6">
            <div className="h-8 bg-gray-700 rounded-lg w-1/3"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-16 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="h-80 bg-gray-700/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 ${className}`}>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-white mb-2">No History Available</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <p className="text-gray-500 text-xs">
            History is generated every 6 hours for Premium users.
          </p>
          <button
            onClick={fetchHistory}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { statistics } = data;
  const isPositiveChange = statistics.change >= 0;
  const colors = getGradientColors();

  return (
    <div className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            📈 Score Evolution
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">LIVE</span>
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {statistics.current}
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPositiveChange ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
              <span className="text-xl">{isPositiveChange ? '↑' : '↓'}</span>
              <span className="font-bold">{Math.abs(statistics.change)}</span>
              <span className="text-xs opacity-75">
                ({statistics.changePercent > 0 ? '+' : ''}{statistics.changePercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Chart type selector */}
          <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1">
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedChart(type.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${selectedChart === type.value
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1">
            {PERIODS.map((period) => (
              <button
                key={period.days}
                onClick={() => setSelectedPeriod(period.days)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedPeriod === period.days
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-900/30 to-green-950/50 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
            <span>📈</span> All-Time High
          </div>
          <div className="text-2xl font-black text-green-400">{statistics.max}</div>
        </div>
        <div className="bg-gradient-to-br from-red-900/30 to-red-950/50 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
            <span>📉</span> All-Time Low
          </div>
          <div className="text-2xl font-black text-red-400">{statistics.min}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
            <span>📊</span> Average
          </div>
          <div className="text-2xl font-black text-blue-400">{Math.round(statistics.average)}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/50 rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
            <span>🏆</span> Best Rank
          </div>
          <div className="text-2xl font-black text-yellow-400">
            {statistics.bestRank ? `#${statistics.bestRank}` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.start} stopOpacity={0.4} />
                <stop offset="95%" stopColor={colors.end} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              domain={selectedChart === 'score' ? [0, 100] : ['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={selectedChart}
              stroke={colors.start}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorGradient)"
              dot={{ fill: colors.start, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <span>{data.dataPoints} data points • Updated every 6 hours</span>
        <span className="text-purple-400">Premium feature</span>
      </div>
    </div>
  );
}

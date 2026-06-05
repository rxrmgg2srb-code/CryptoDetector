import { useState } from 'react';
import { motion } from 'framer-motion';
import { LanguageSelector } from '../components/LanguageSelector';
import { NavigationButtons } from '../components/NavigationButtons';

interface ComparisonData {
  wallet1: any;
  wallet2: any;
  differences: any;
  winner: any;
}

// Cambiado a export default para que funcione con dynamic import
export default function CompareContent() {
  const [wallet1, setWallet1] = useState('');
  const [wallet2, setWallet2] = useState('');
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overallWinner, setOverallWinner] = useState('');

  const handleCompare = async () => {
    if (!wallet1 || !wallet2) {
      setError('Please enter both wallet addresses');
      return;
    }

    if (wallet1 === wallet2) {
      setError('Please enter different wallet addresses');
      return;
    }

    setLoading(true);
    setError('');
    setComparison(null);

    try {
      const res = await fetch(
        `/api/compare-cards?wallet1=${encodeURIComponent(wallet1)}&wallet2=${encodeURIComponent(wallet2)}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to compare cards');
      }

      setComparison(data.comparison);
      setOverallWinner(data.overallWinner);
    } catch (err: any) {
      setError(err.message || 'Failed to compare cards');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(decimals)}B`;
    }
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(decimals)}M`;
    }
    if (num >= 1e3) {
      return `${(num / 1e3).toFixed(decimals)}K`;
    }
    return num.toFixed(decimals);
  };

  const getWinnerIcon = (winner: string) => {
    if (winner === 'wallet1') {
      return '🥇';
    }
    if (winner === 'wallet2') {
      return '🥈';
    }
    return '🤝';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Language Selector - Top Right */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text-gold mb-4">⚔️ Card Comparison</h1>
          <p className="text-gray-400 text-lg mb-6">Compare two trading cards side by side</p>

          {/* Navigation Buttons */}
          <NavigationButtons />
        </div>

        {/* Input Section */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-300 font-medium mb-2">Wallet Address 1</label>
              <input
                type="text"
                value={wallet1}
                onChange={(e) => setWallet1(e.target.value)}
                placeholder="Enter first wallet address..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-2">Wallet Address 2</label>
              <input
                type="text"
                value={wallet2}
                onChange={(e) => setWallet2(e.target.value)}
                placeholder="Enter second wallet address..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 hover:from-green-600 hover:via-purple-600 hover:to-blue-600 text-white font-bold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Comparing...' : '⚔️ Compare Cards'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Comparison Results */}
        {comparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Overall Winner Banner */}
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                {getWinnerIcon(overallWinner)} Overall Winner
              </h2>
              <p className="text-2xl font-bold text-white">
                {overallWinner === 'wallet1'
                  ? comparison.wallet1.displayName || 'Wallet 1'
                  : overallWinner === 'wallet2'
                    ? comparison.wallet2.displayName || 'Wallet 2'
                    : "It's a Tie!"}
              </p>
            </div>

            {/* Metrics Comparison Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
              <div className="grid grid-cols-3 bg-gray-900">
                <div className="p-4 text-center border-r border-gray-700">
                  <p className="text-sm text-gray-400">Wallet 1</p>
                  <p className="font-bold text-green-400 truncate">
                    {comparison.wallet1.displayName || comparison.wallet1.address.slice(0, 8)}
                  </p>
                </div>
                <div className="p-4 text-center border-r border-gray-700">
                  <p className="text-sm text-gray-400">Metric</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-400">Wallet 2</p>
                  <p className="font-bold text-blue-400 truncate">
                    {comparison.wallet2.displayName || comparison.wallet2.address.slice(0, 8)}
                  </p>
                </div>
              </div>

              {/* Degen Score */}
              <ComparisonRow
                label="Degen Score"
                value1={comparison.wallet1.degenScore}
                value2={comparison.wallet2.degenScore}
                winner={comparison.winner.degenScore}
                formatter={(v) => `${v}/100`}
              />

              {/* Total Trades */}
              <ComparisonRow
                label="Total Trades"
                value1={comparison.wallet1.totalTrades}
                value2={comparison.wallet2.totalTrades}
                winner={comparison.winner.totalTrades}
              />

              {/* Total Volume */}
              <ComparisonRow
                label="Total Volume"
                value1={comparison.wallet1.totalVolume}
                value2={comparison.wallet2.totalVolume}
                winner={comparison.winner.totalVolume}
                formatter={(v) => `${formatNumber(v)} SOL`}
              />

              {/* Profit/Loss */}
              <ComparisonRow
                label="Profit/Loss"
                value1={comparison.wallet1.profitLoss}
                value2={comparison.wallet2.profitLoss}
                winner={comparison.winner.profitLoss}
                formatter={(v) => `${v >= 0 ? '+' : ''}${formatNumber(v)} SOL`}
              />

              {/* Win Rate */}
              <ComparisonRow
                label="Win Rate"
                value1={comparison.wallet1.winRate}
                value2={comparison.wallet2.winRate}
                winner={comparison.winner.winRate}
                formatter={(v) => `${v.toFixed(1)}%`}
              />

              {/* Best Trade */}
              <ComparisonRow
                label="Best Trade"
                value1={comparison.wallet1.bestTrade}
                value2={comparison.wallet2.bestTrade}
                winner={comparison.winner.bestTrade}
                formatter={(v) => `${formatNumber(v)} SOL`}
              />

              {/* Badges */}
              <ComparisonRow
                label="Badges"
                value1={comparison.wallet1.badges}
                value2={comparison.wallet2.badges}
                winner={comparison.winner.badges}
              />

              {/* Likes */}
              <ComparisonRow
                label="Likes"
                value1={comparison.wallet1.likes}
                value2={comparison.wallet2.likes}
                winner={comparison.winner.likes}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface ComparisonRowProps {
  label: string;
  value1: number;
  value2: number;
  winner: 'wallet1' | 'wallet2' | 'tie';
  formatter?: (val: number) => string;
}

function ComparisonRow({ label, value1, value2, winner, formatter }: ComparisonRowProps) {
  const format = formatter || ((v: number) => v.toString());

  return (
    <div className="grid grid-cols-3 border-t border-gray-700 hover:bg-gray-750 transition">
      <div className="p-4 text-center border-r border-gray-700">
        <p
          className={`text-xl font-bold ${winner === 'wallet1' ? 'text-green-400' : 'text-gray-400'}`}
        >
          {format(value1)} {winner === 'wallet1' && '🏆'}
        </p>
      </div>
      <div className="p-4 text-center border-r border-gray-700">
        <p className="text-gray-300 font-medium">{label}</p>
      </div>
      <div className="p-4 text-center">
        <p
          className={`text-xl font-bold ${winner === 'wallet2' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          {format(value2)} {winner === 'wallet2' && '🏆'}
        </p>
      </div>
    </div>
  );
}

// Eliminado getServerSideProps - esto no debe estar en un componente, solo en páginas

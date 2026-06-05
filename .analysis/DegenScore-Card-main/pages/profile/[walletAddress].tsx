import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { isValidSolanaAddress } from '../../lib/validation';
import { logger } from '../../lib/logger';

// Lazy load heavy components
const ScoreHistoryChart = dynamic(() => import('../../components/ScoreHistoryChart'), {
  loading: () => <div className="h-96 bg-gray-800/30 animate-pulse rounded-lg" />,
  ssr: false,
});

const FollowButton = dynamic(() => import('../../components/FollowButton'), {
  loading: () => <div className="h-10 bg-gray-700 animate-pulse rounded-lg w-32" />,
  ssr: false,
});

interface CardData {
  walletAddress: string;
  degenScore: number;
  totalTrades: number;
  totalVolume: number;
  profitLoss: number;
  winRate: number;
  avgHoldTime: number;
  isPaid: boolean;
  profileName?: string;
  profileBio?: string;
  profileAvatar?: string;
  badges: Array<{
    name: string;
    rarity: string;
    icon: string;
  }>;
  createdAt: string;
  lastUpdated: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { walletAddress } = router.query;
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (walletAddress && typeof walletAddress === 'string') {
      fetchCardData();
    }
  }, [walletAddress]);

  const fetchCardData = async () => {
    if (!walletAddress || typeof walletAddress !== 'string') {
      return;
    }

    if (!isValidSolanaAddress(walletAddress)) {
      setError('Invalid Solana wallet address');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch card data from API
      const response = await fetch(`/api/get-card?walletAddress=${walletAddress}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch card data');
      }

      const data = await response.json();
      setCardData(data);

      // Generate card image URL
      setCardImageUrl(`/api/generate-card?walletAddress=${walletAddress}`);
    } catch (err: any) {
      logger.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = () => {
    if (!cardImageUrl || !walletAddress) {
      return;
    }

    const link = document.createElement('a');
    link.href = cardImageUrl;
    link.download = `degenscore_${walletAddress.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportData = async (format: 'json' | 'csv') => {
    if (!walletAddress) {
      return;
    }

    try {
      const response = await fetch(
        `/api/export/card?walletAddress=${walletAddress}&format=${format}`
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `degenscore_${walletAddress.slice(0, 8)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center bg-gray-800/50 rounded-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error || 'Card not found'}</p>
          <Link href="/">
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition">
              Volver al Inicio
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="neon-streak"></div>

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <Link href="/">
            <button className="text-gray-400 hover:text-white transition flex items-center gap-2">
              ← Volver
            </button>
          </Link>
          <h1 className="text-3xl font-bold gradient-text-gold">Perfil DegenScore</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Profile Header */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {cardData.profileAvatar ? (
                <img
                  src={cardData.profileAvatar}
                  alt={cardData.profileName || 'Profile'}
                  className="w-24 h-24 rounded-full border-4 border-purple-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-4xl">
                  {cardData.profileName?.charAt(0) || '🎭'}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-white mb-1">
                {cardData.profileName || `Degen ${cardData.walletAddress.slice(0, 6)}`}
              </h2>
              <p className="text-gray-400 text-sm mb-2 font-mono">{cardData.walletAddress}</p>
              {cardData.profileBio && (
                <p className="text-gray-300 text-sm mb-3">{cardData.profileBio}</p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">DegenScore</div>
                  <div className="text-xl font-bold gradient-text-gold">{cardData.degenScore}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">Win Rate</div>
                  <div className="text-xl font-bold text-green-400">{cardData.winRate}%</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">Trades</div>
                  <div className="text-xl font-bold text-blue-400">{cardData.totalTrades}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">Volume</div>
                  <div className="text-xl font-bold text-purple-400">
                    ${cardData.totalVolume.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Follow Button */}
              <div className="mt-3">
                <FollowButton walletAddress={walletAddress as string} showCounts={true} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <button
                onClick={downloadCard}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                📥 Download Card
              </button>
              <button
                onClick={() => exportData('json')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                📊 Export JSON
              </button>
              <button
                onClick={() => exportData('csv')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                📑 Export CSV
              </button>
            </div>
          </div>

          {/* Badges */}
          {cardData.badges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">Badges ({cardData.badges.length})</h3>
              <div className="flex flex-wrap gap-2">
                {cardData.badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1 bg-gray-900/50 border border-purple-500/30 rounded-full text-xs flex items-center gap-1"
                  >
                    <span>{badge.icon}</span>
                    <span className="text-white">{badge.name}</span>
                    <span className="text-gray-500">({badge.rarity})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Score History Chart */}
        {cardData.isPaid && (
          <ScoreHistoryChart walletAddress={walletAddress as string} className="mb-6" />
        )}

        {/* Card Image */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">🎴 Card Preview</h3>
          {cardImageUrl && (
            <div className="flex justify-center">
              <img
                src={cardImageUrl}
                alt="DegenScore Card"
                className="rounded-lg shadow-2xl max-w-full h-auto"
                style={{ maxWidth: '600px' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Force SSR to prevent build timeout
export async function getServerSideProps() {
  return {
    props: {},
  };
}

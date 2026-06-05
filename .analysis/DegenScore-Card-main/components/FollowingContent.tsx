import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { logger } from '../lib/logger';

interface FollowedWallet {
  walletAddress: string;
  followedAt: string;
  card: {
    walletAddress: string;
    degenScore: number;
    totalTrades: number;
    totalVolume: number;
    winRate: number;
    isPaid: boolean;
    profileName: string | null;
    profileAvatar: string | null;
    lastUpdated: string;
  };
}

// Cambiado a export default para que funcione con dynamic import
export default function FollowingContent() {
  const { publicKey, connected } = useWallet();
  const [followedWallets, setFollowedWallets] = useState<FollowedWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      fetchFollowedWallets();
    } else {
      setLoading(false);
      setFollowedWallets([]);
    }
  }, [connected, publicKey]);

  const fetchFollowedWallets = async () => {
    if (!publicKey) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const walletAddress = publicKey.toBase58();
      const response = await fetch(`/api/follows/list?walletAddress=${walletAddress}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch followed wallets');
      }

      const data = await response.json();
      setFollowedWallets(data.wallets);
    } catch (err: any) {
      logger.error('Error fetching followed wallets', err instanceof Error ? err : undefined, {
        error: String(err),
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="neon-streak"></div>

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="text-gray-400 hover:text-white transition">← Volver</button>
            </Link>
            <h1 className="text-3xl font-bold gradient-text-gold">Following</h1>
          </div>
          <WalletMultiButton />
        </div>

        {/* Content */}
        {!connected ? (
          <div className="text-center bg-gray-800/50 rounded-lg p-12 max-w-2xl mx-auto">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to see the wallets you follow</p>
            <WalletMultiButton />
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                <div className="h-16 bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center bg-gray-800/50 rounded-lg p-12 max-w-2xl mx-auto">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchFollowedWallets}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition"
            >
              Reintentar
            </button>
          </div>
        ) : followedWallets.length === 0 ? (
          <div className="text-center bg-gray-800/50 rounded-lg p-12 max-w-2xl mx-auto">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-white mb-2">No sigues a nadie aún</h2>
            <p className="text-gray-400 mb-6">
              Empieza a seguir wallets para trackear su progreso y recibir notificaciones
            </p>
            <Link href="/leaderboard">
              <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition">
                Explorar Leaderboard
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Siguiendo {followedWallets.length} wallets
                  </h3>
                  <p className="text-sm text-gray-400">
                    Trackea su progreso y recibe notificaciones
                  </p>
                </div>
                <button
                  onClick={fetchFollowedWallets}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                >
                  🔄 Actualizar
                </button>
              </div>
            </div>

            {/* Followed Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followedWallets.map((followed) => {
                const { card } = followed;
                return (
                  <Link key={followed.walletAddress} href={`/profile/${followed.walletAddress}`}>
                    <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition cursor-pointer border border-gray-700 hover:border-purple-500">
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 mb-3">
                        {card.profileAvatar ? (
                          <img
                            src={card.profileAvatar}
                            alt={card.profileName || 'Profile'}
                            className="w-12 h-12 rounded-full border-2 border-purple-500"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl">
                            {card.profileName?.charAt(0) || '🎭'}
                          </div>
                        )}
                        <div className="flex-grow min-w-0">
                          <h3 className="text-white font-bold truncate">
                            {card.profileName || `Degen ${card.walletAddress.slice(0, 6)}`}
                          </h3>
                          <p className="text-gray-400 text-xs font-mono truncate">
                            {card.walletAddress.slice(0, 8)}...{card.walletAddress.slice(-4)}
                          </p>
                        </div>
                        {card.isPaid && (
                          <div className="text-yellow-400 text-xl" title="Premium">
                            👑
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-900/50 rounded p-2">
                          <div className="text-xs text-gray-400">Score</div>
                          <div className="text-lg font-bold gradient-text-gold">
                            {card.degenScore}
                          </div>
                        </div>
                        <div className="bg-gray-900/50 rounded p-2">
                          <div className="text-xs text-gray-400">Win Rate</div>
                          <div className="text-lg font-bold text-green-400">{card.winRate}%</div>
                        </div>
                        <div className="bg-gray-900/50 rounded p-2">
                          <div className="text-xs text-gray-400">Trades</div>
                          <div className="text-sm font-bold text-blue-400">{card.totalTrades}</div>
                        </div>
                        <div className="bg-gray-900/50 rounded p-2">
                          <div className="text-xs text-gray-400">Volume</div>
                          <div className="text-sm font-bold text-purple-400">
                            ${(card.totalVolume / 1000).toFixed(0)}k
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Siguiendo desde {formatDate(followed.followedAt)}</span>
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Eliminado getServerSideProps - esto no debe estar en un componente, solo en páginas

import { useEffect, useState } from 'react';
import { getPusherClient, PusherChannels, PusherEvents } from '../lib/realtime/pusher';
import SkeletonLoader from './SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';

interface LeaderboardEntry {
  walletAddress: string;
  displayName?: string;
  degenScore: number;
  rank: number;
}

export default function RealtimeLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [newTopScorer, setNewTopScorer] = useState<string | null>(null);

  useEffect(() => {
    // Fetch inicial
    fetchLeaderboard();

    // Configurar Pusher real-time
    const pusher = getPusherClient();
    if (!pusher) {
      logger.warn('Pusher not configured, falling back to polling');
      // Fallback: polling every 30 seconds
      const interval = setInterval(fetchLeaderboard, 30000);
      return () => clearInterval(interval);
    }

    // Subscribe al canal de leaderboard
    const channel = pusher.subscribe(PusherChannels.LEADERBOARD);

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      logger.info('✅ Connected to real-time leaderboard');
    });

    // Escuchar updates del leaderboard
    channel.bind(PusherEvents.LEADERBOARD_UPDATE, (data: { leaderboard: LeaderboardEntry[] }) => {
      logger.info('📊 Leaderboard update received:', { count: data.leaderboard.length });
      setLeaderboard(data.leaderboard);
    });

    // Escuchar nuevo top scorer
    channel.bind(
      PusherEvents.NEW_TOP_SCORER,
      (data: { walletAddress: string; username?: string; score: number }) => {
        logger.info('👑 New top scorer:', data);
        setNewTopScorer(data.username || data.walletAddress);
        // Show notification for 5 seconds
        setTimeout(() => setNewTopScorer(null), 5000);
        // Refresh leaderboard
        fetchLeaderboard();
      }
    );

    // Cleanup
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard?limit=10');
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      logger.error('Error fetching leaderboard', error instanceof Error ? error : undefined, {
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="leaderboard" count={10} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
          />
          <span className="text-sm text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* New Top Scorer Alert */}
      <AnimatePresence>
        {newTopScorer && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-center"
          >
            <p className="font-bold text-white">👑 {newTopScorer} is now #1!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.walletAddress}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={`
                flex items-center justify-between bg-gray-800 rounded-lg p-4
                ${index === 0 ? 'ring-2 ring-yellow-500' : ''}
                ${index === 1 ? 'ring-2 ring-gray-400' : ''}
                ${index === 2 ? 'ring-2 ring-orange-600' : ''}
              `}
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="w-8 h-8 flex items-center justify-center font-bold text-lg">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>

                {/* User Info */}
                <div>
                  <p className="font-semibold">
                    {entry.displayName ||
                      `${entry.walletAddress.slice(0, 4)}...${entry.walletAddress.slice(-4)}`}
                  </p>
                  <p className="text-sm text-gray-400">{entry.walletAddress.slice(0, 8)}...</p>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">{entry.degenScore}</p>
                <p className="text-xs text-gray-400">Degen Score</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No entries yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}

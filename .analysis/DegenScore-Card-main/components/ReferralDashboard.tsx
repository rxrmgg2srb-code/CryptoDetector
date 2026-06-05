import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface ReferralStats {
  totalReferrals: number;
  level1Referrals: number;
  level2Referrals: number;
  level3Referrals: number;
  totalEarnings: number;
  pendingRewards: number;
  claimedRewards: number;
  currentTier: string;
  nextMilestone: any;
}

export default function ReferralDashboard() {
  const { publicKey } = useWallet();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const referralCode = publicKey ? publicKey.toString().slice(0, 8) : '';

  useEffect(() => {
    if (publicKey) {
      fetchStats();
    }
  }, [publicKey]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/referrals/stats', {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('authToken'),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      logger.error('Error fetching referral stats', error instanceof Error ? error : undefined, {
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = 'https://degenscore.com?ref=' + referralCode;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  if (!publicKey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Connect your wallet to view referral stats</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">🔥 Viral Referral Program</h1>
        <p className="text-gray-400">
          Earn $DEGEN by inviting friends. Multi-level rewards up to 3 levels deep!
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/50 to-cyan-900/50 rounded-2xl p-6 border border-cyan-500/30"
      >
        <h2 className="text-2xl font-bold mb-4">Your Referral Link</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={'https://degenscore.com?ref=' + referralCode}
            readOnly
            className="flex-1 bg-black/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-cyan-400 font-mono"
          />
          <button
            onClick={copyReferralLink}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg transition"
          >
            Copy
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-900/20 border border-cyan-500/30 rounded-xl p-4">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
          <div className="text-sm text-gray-400">Total Referrals</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-900/20 border border-green-500/30 rounded-xl p-4">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold">{stats?.level1Referrals || 0}</div>
          <div className="text-sm text-gray-400">Level 1 (Direct)</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold">{(stats?.totalEarnings || 0).toFixed(0)} $DEGEN</div>
          <div className="text-sm text-gray-400">Total Earnings</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-900/20 border border-purple-500/30 rounded-xl p-4">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold">{(stats?.pendingRewards || 0).toFixed(0)} $DEGEN</div>
          <div className="text-sm text-gray-400">Pending Rewards</div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  rewardsEarned: number;
  nextReward: number;
}

interface ReferralSystemProps {
  walletAddress: string;
}

export default function ReferralSystem({ walletAddress }: ReferralSystemProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, [walletAddress]);

  const fetchReferralStats = async () => {
    try {
      const response = await fetch(`/api/referrals/stats?wallet=${walletAddress}`);
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

  const generateReferralCode = () => {
    return walletAddress.slice(0, 8).toUpperCase();
  };

  const getReferralLink = () => {
    const code = stats?.referralCode || generateReferralCode();
    return `${window.location.origin}?ref=${code}`;
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const link = getReferralLink();
    const text = `Check out my DegenScore Card! 🚀 Join me on DegenScore and get exclusive rewards!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareOnTelegram = () => {
    const link = getReferralLink();
    const text = `Check out my DegenScore Card! 🚀`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-gray-400">Loading referral stats...</p>
      </div>
    );
  }

  const defaultStats: ReferralStats = stats || {
    referralCode: generateReferralCode(),
    totalReferrals: 0,
    activeReferrals: 0,
    rewardsEarned: 0,
    nextReward: 5,
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
          Referral Program
        </h2>
        <p className="text-gray-300">Invite friends and earn rewards together!</p>
      </div>

      {/* Rewards Banner */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl mb-2">🎁</div>
            <h3 className="text-white font-bold text-xl mb-1">Earn Premium Features</h3>
            <p className="text-gray-300 text-sm">
              Get 1 free premium feature for every 5 referrals
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              <CountUp end={defaultStats.totalReferrals} duration={1} />/{defaultStats.nextReward}
            </div>
            <div className="text-gray-400 text-sm">Referrals</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min((defaultStats.totalReferrals / defaultStats.nextReward) * 100, 100)}%`,
            }}
          ></div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
          <div className="text-cyan-400 text-sm font-semibold mb-2">Total Referrals</div>
          <div className="text-4xl font-bold text-white mb-1">
            <CountUp end={defaultStats.totalReferrals} duration={1.5} />
          </div>
          <div className="text-gray-400 text-xs">All-time referrals</div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
          <div className="text-green-400 text-sm font-semibold mb-2">Active Users</div>
          <div className="text-4xl font-bold text-white mb-1">
            <CountUp end={defaultStats.activeReferrals} duration={1.5} />
          </div>
          <div className="text-gray-400 text-xs">Active this month</div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
          <div className="text-purple-400 text-sm font-semibold mb-2">Rewards Earned</div>
          <div className="text-4xl font-bold text-white mb-1">
            <CountUp end={defaultStats.rewardsEarned} duration={1.5} />
          </div>
          <div className="text-gray-400 text-xs">Total rewards</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <span>🔗</span>
          Your Referral Link
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={getReferralLink()}
            readOnly
            className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg font-mono text-sm"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold rounded-lg transition-all"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Social Share */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <span>📢</span>
          Share Your Link
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          <button
            onClick={shareOnTwitter}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-bold rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
            Share on Twitter
          </button>

          <button
            onClick={shareOnTelegram}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Share on Telegram
          </button>
        </div>
      </div>

      {/* Reward Tiers */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <span>🏆</span>
          Reward Tiers
        </h3>
        <div className="space-y-3">
          <RewardTier
            icon="🥉"
            title="Bronze Tier"
            requirement="5 referrals"
            reward="1 Premium Feature"
            achieved={defaultStats.totalReferrals >= 5}
          />
          <RewardTier
            icon="🥈"
            title="Silver Tier"
            requirement="15 referrals"
            reward="3 Premium Features + Badge"
            achieved={defaultStats.totalReferrals >= 15}
          />
          <RewardTier
            icon="🥇"
            title="Gold Tier"
            requirement="30 referrals"
            reward="All Premium Features + Exclusive Badge"
            achieved={defaultStats.totalReferrals >= 30}
          />
          <RewardTier
            icon="💎"
            title="Diamond Tier"
            requirement="50 referrals"
            reward="Lifetime Premium + Special Perks"
            achieved={defaultStats.totalReferrals >= 50}
          />
        </div>
      </div>
    </div>
  );
}

interface RewardTierProps {
  icon: string;
  title: string;
  requirement: string;
  reward: string;
  achieved: boolean;
}

function RewardTier({ icon, title, requirement, reward, achieved }: RewardTierProps) {
  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        achieved
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500'
          : 'bg-gray-700/30 border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <div className="text-white font-bold">{title}</div>
            <div className="text-gray-400 text-sm">{requirement}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-300">{reward}</div>
          {achieved && <div className="text-green-400 font-bold text-sm mt-1">✓ Unlocked</div>}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

interface Referrer {
    rank: number;
    walletAddress: string;
    username?: string;
    avatar?: string;
    totalReferrals: number;
    paidReferrals: number;
    totalEarnings: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    streak: number;
    lastReferralAt?: number;
    badges: string[];
}

const TIER_CONFIG = {
    bronze: {
        color: 'from-orange-700 to-orange-900',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        min: 1,
        icon: '🥉'
    },
    silver: {
        color: 'from-gray-400 to-gray-600',
        border: 'border-gray-400/30',
        text: 'text-gray-300',
        min: 5,
        icon: '🥈'
    },
    gold: {
        color: 'from-yellow-500 to-yellow-700',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        min: 10,
        icon: '🥇'
    },
    platinum: {
        color: 'from-cyan-400 to-cyan-600',
        border: 'border-cyan-400/30',
        text: 'text-cyan-400',
        min: 25,
        icon: '💎'
    },
    diamond: {
        color: 'from-purple-400 to-pink-600',
        border: 'border-purple-400/30',
        text: 'text-purple-400',
        min: 50,
        icon: '👑'
    },
};

const MOCK_REFERRERS: Referrer[] = [
    {
        rank: 1,
        walletAddress: 'DgX7...h9Kp',
        username: 'CryptoKing',
        totalReferrals: 127,
        paidReferrals: 89,
        totalEarnings: 8.9,
        tier: 'diamond',
        streak: 15,
        lastReferralAt: Date.now() - 3600000,
        badges: ['👑', '🔥', '💎'],
    },
    {
        rank: 2,
        walletAddress: 'Bc4Y...mN2x',
        username: 'DegenMaster',
        totalReferrals: 98,
        paidReferrals: 67,
        totalEarnings: 6.7,
        tier: 'diamond',
        streak: 12,
        lastReferralAt: Date.now() - 7200000,
        badges: ['🔥', '💎'],
    },
    {
        rank: 3,
        walletAddress: 'Fk8P...qR5t',
        username: 'WhaleHunter',
        totalReferrals: 76,
        paidReferrals: 52,
        totalEarnings: 5.2,
        tier: 'platinum',
        streak: 8,
        lastReferralAt: Date.now() - 14400000,
        badges: ['🐋', '💎'],
    },
    {
        rank: 4,
        walletAddress: 'Jm2W...vK9z',
        username: 'SolanaElite',
        totalReferrals: 54,
        paidReferrals: 38,
        totalEarnings: 3.8,
        tier: 'platinum',
        streak: 6,
        badges: ['⭐'],
    },
    {
        rank: 5,
        walletAddress: 'Np7L...xM3s',
        totalReferrals: 43,
        paidReferrals: 31,
        totalEarnings: 3.1,
        tier: 'gold',
        streak: 4,
        badges: [],
    },
    {
        rank: 6,
        walletAddress: 'Qr9T...yH6w',
        username: 'TokenTrader',
        totalReferrals: 35,
        paidReferrals: 24,
        totalEarnings: 2.4,
        tier: 'gold',
        streak: 3,
        badges: [],
    },
    {
        rank: 7,
        walletAddress: 'Uv4Z...pJ8m',
        totalReferrals: 28,
        paidReferrals: 19,
        totalEarnings: 1.9,
        tier: 'gold',
        streak: 2,
        badges: [],
    },
    {
        rank: 8,
        walletAddress: 'Xy6B...nF2c',
        totalReferrals: 21,
        paidReferrals: 14,
        totalEarnings: 1.4,
        tier: 'silver',
        streak: 1,
        badges: [],
    },
    {
        rank: 9,
        walletAddress: 'Cd3G...kL5v',
        totalReferrals: 15,
        paidReferrals: 10,
        totalEarnings: 1.0,
        tier: 'silver',
        streak: 1,
        badges: [],
    },
    {
        rank: 10,
        walletAddress: 'Ef8H...bQ7r',
        totalReferrals: 9,
        paidReferrals: 6,
        totalEarnings: 0.6,
        tier: 'bronze',
        streak: 0,
        badges: [],
    },
];

type TimeFilter = 'all' | 'month' | 'week';

export default function ReferrerLeaderboard() {
    const { publicKey } = useWallet();
    const [referrers, setReferrers] = useState<Referrer[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [myStats, setMyStats] = useState<Referrer | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, [timeFilter]);

    useEffect(() => {
        // Check if current wallet is in the leaderboard
        if (publicKey && referrers.length > 0) {
            const myRank = referrers.find(r =>
                r.walletAddress.startsWith(publicKey.toBase58().substring(0, 4))
            );
            setMyStats(myRank || null);
        }
    }, [publicKey, referrers]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setReferrers(MOCK_REFERRERS);
        setLoading(false);
    };

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return 'Never';
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const stats = {
        totalReferrers: referrers.length,
        totalPaidReferrals: referrers.reduce((sum, r) => sum + r.paidReferrals, 0),
        totalEarnings: referrers.reduce((sum, r) => sum + r.totalEarnings, 0),
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-700 rounded-lg w-1/3 mb-6"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-gray-700/50 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        🏆 Top Referrers
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full animate-pulse">
                            LIVE
                        </span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Earn 0.02 SOL for every paid referral
                    </p>
                </div>

                {/* Time filter */}
                <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1">
                    {(['all', 'month', 'week'] as const).map((time) => (
                        <button
                            key={time}
                            onClick={() => setTimeFilter(time)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${timeFilter === time
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            {time === 'all' ? '🌍 All Time' : time === 'month' ? '📅 This Month' : '📆 This Week'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/50 rounded-xl p-4 border border-purple-500/20 text-center">
                    <div className="text-3xl font-black text-purple-400">{stats.totalReferrers}</div>
                    <div className="text-xs text-gray-400">Active Referrers</div>
                </div>
                <div className="bg-gradient-to-br from-green-900/30 to-green-950/50 rounded-xl p-4 border border-green-500/20 text-center">
                    <div className="text-3xl font-black text-green-400">{stats.totalPaidReferrals}</div>
                    <div className="text-xs text-gray-400">Paid Referrals</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/50 rounded-xl p-4 border border-yellow-500/20 text-center">
                    <div className="text-3xl font-black text-yellow-400">{stats.totalEarnings.toFixed(1)} SOL</div>
                    <div className="text-xs text-gray-400">Total Paid Out</div>
                </div>
            </div>

            {/* My Stats (if connected) */}
            {publicKey && (
                <div className="mb-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-3xl">👤</div>
                            <div>
                                <h3 className="font-bold text-white">Your Referral Stats</h3>
                                <p className="text-sm text-gray-400">
                                    {myStats
                                        ? `Rank #${myStats.rank} • ${myStats.paidReferrals} paid referrals`
                                        : 'Start referring to appear on the leaderboard!'}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/referrals"
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all hover:scale-105"
                        >
                            View Dashboard →
                        </Link>
                    </div>
                </div>
            )}

            {/* Leaderboard Table */}
            <div className="overflow-hidden rounded-xl border border-gray-700/50">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-900/50">
                            <th className="text-left p-4 text-gray-400 text-sm font-medium">Rank</th>
                            <th className="text-left p-4 text-gray-400 text-sm font-medium">Referrer</th>
                            <th className="text-center p-4 text-gray-400 text-sm font-medium hidden sm:table-cell">Tier</th>
                            <th className="text-center p-4 text-gray-400 text-sm font-medium">Referrals</th>
                            <th className="text-center p-4 text-gray-400 text-sm font-medium hidden md:table-cell">Streak</th>
                            <th className="text-right p-4 text-gray-400 text-sm font-medium">Earnings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {referrers.map((referrer) => {
                            const tierConfig = TIER_CONFIG[referrer.tier];
                            const isMyWallet = publicKey &&
                                referrer.walletAddress.startsWith(publicKey.toBase58().substring(0, 4));

                            return (
                                <tr
                                    key={referrer.rank}
                                    className={`hover:bg-gray-800/50 transition-all ${isMyWallet ? 'bg-purple-900/20' : ''
                                        } ${referrer.rank <= 3 ? 'bg-gradient-to-r' : ''} ${referrer.rank === 1 ? 'from-yellow-900/10 to-transparent' :
                                            referrer.rank === 2 ? 'from-gray-500/10 to-transparent' :
                                                referrer.rank === 3 ? 'from-orange-900/10 to-transparent' : ''
                                        }`}
                                >
                                    {/* Rank */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xl ${referrer.rank <= 3 ? '' : 'text-gray-400'}`}>
                                                {getRankIcon(referrer.rank)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Referrer Info */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierConfig.color} flex items-center justify-center text-lg`}>
                                                {referrer.username ? referrer.username.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white">
                                                        {referrer.username || referrer.walletAddress}
                                                    </span>
                                                    {referrer.badges.map((badge, i) => (
                                                        <span key={i} className="text-sm">{badge}</span>
                                                    ))}
                                                    {isMyWallet && (
                                                        <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">YOU</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    Last referral: {formatTime(referrer.lastReferralAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Tier */}
                                    <td className="p-4 text-center hidden sm:table-cell">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${tierConfig.text} bg-gray-900/50 capitalize`}>
                                            {tierConfig.icon} {referrer.tier}
                                        </span>
                                    </td>

                                    {/* Referrals */}
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-white">{referrer.paidReferrals}</div>
                                        <div className="text-xs text-gray-500">{referrer.totalReferrals} total</div>
                                    </td>

                                    {/* Streak */}
                                    <td className="p-4 text-center hidden md:table-cell">
                                        {referrer.streak > 0 ? (
                                            <span className="text-orange-400 font-bold">
                                                🔥 {referrer.streak}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>

                                    {/* Earnings */}
                                    <td className="p-4 text-right">
                                        <div className="font-bold text-green-400">{referrer.totalEarnings.toFixed(2)} SOL</div>
                                        <div className="text-xs text-gray-500">≈ ${(referrer.totalEarnings * 150).toFixed(0)}</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Tier Legend */}
            <div className="mt-6 pt-4 border-t border-gray-700/50">
                <h4 className="text-sm font-bold text-gray-400 mb-3">Referrer Tiers</h4>
                <div className="flex flex-wrap gap-3">
                    {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                        <div key={tier} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.border} bg-gray-900/30`}>
                            <span>{config.icon}</span>
                            <span className={`text-sm font-medium ${config.text} capitalize`}>{tier}</span>
                            <span className="text-xs text-gray-500">{config.min}+ refs</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="mt-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30 text-center">
                <h3 className="text-xl font-bold text-white mb-2">🚀 Start Referring Now!</h3>
                <p className="text-gray-400 mb-4">
                    Earn 0.02 SOL for every friend who upgrades to Premium
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all hover:scale-105">
                    Get Your Referral Link
                </button>
            </div>
        </div>
    );
}

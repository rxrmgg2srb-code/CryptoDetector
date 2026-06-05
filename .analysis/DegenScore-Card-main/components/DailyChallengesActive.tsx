import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Challenge {
    id: string;
    type: 'daily' | 'weekly' | 'special';
    title: string;
    description: string;
    icon: string;
    reward: {
        type: 'xp' | 'badge' | 'sol' | 'pro';
        amount: number;
        label: string;
    };
    requirement: {
        type: string;
        target: number;
        current: number;
    };
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
    expiresAt: number;
    claimedAt?: number;
}

interface ChallengeStats {
    total: number;
    completed: number;
    claimed: number;
}

interface WalletMetrics {
    totalTrades: number;
    totalVolume: number;
    profitLoss: number;
    winRate: number;
    // Today's metrics (real)
    todayTrades?: number;
    todayVolume?: number;
    todayProfit?: number;
    // This week's metrics (real)
    weekTrades?: number;
    weekVolume?: number;
    weekProfit?: number;
    weekActiveDays?: number;
}

const DIFFICULTY_COLORS = {
    easy: { bg: 'from-green-900/30 to-green-950/50', border: 'border-green-500/30', text: 'text-green-400', bar: 'from-green-500 to-green-400' },
    medium: { bg: 'from-blue-900/30 to-blue-950/50', border: 'border-blue-500/30', text: 'text-blue-400', bar: 'from-blue-500 to-blue-400' },
    hard: { bg: 'from-purple-900/30 to-purple-950/50', border: 'border-purple-500/30', text: 'text-purple-400', bar: 'from-purple-500 to-purple-400' },
    legendary: { bg: 'from-yellow-900/30 to-orange-950/50', border: 'border-yellow-500/30', text: 'text-yellow-400', bar: 'from-yellow-500 to-orange-400' },
};

export default function DailyChallengesActive() {
    const { publicKey, connected } = useWallet();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [stats, setStats] = useState<ChallengeStats>({ total: 0, completed: 0, claimed: 0 });
    const [metrics, setMetrics] = useState<WalletMetrics | null>(null);
    const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'special'>('all');
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchChallenges = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const walletParam = publicKey ? `?walletAddress=${publicKey.toBase58()}` : '';
            const response = await fetch(`/api/challenges${walletParam}`);

            if (!response.ok) {
                throw new Error('Failed to fetch challenges');
            }

            const data = await response.json();

            if (data.success) {
                setChallenges(data.challenges || []);
                setStats(data.stats || { total: 0, completed: 0, claimed: 0 });
                setMetrics(data.metrics || null);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (err: any) {
            console.error('Error fetching challenges:', err);
            setError(err.message || 'Failed to load challenges');
        } finally {
            setLoading(false);
        }
    }, [publicKey]);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    const formatTimeLeft = (expiresAt: number) => {
        const diff = expiresAt - Date.now();
        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h left`;
        }
        return `${hours}h ${minutes}m left`;
    };

    const getProgress = (challenge: Challenge) => {
        return Math.min(100, (challenge.requirement.current / challenge.requirement.target) * 100);
    };

    const isCompleted = (challenge: Challenge) => {
        return challenge.requirement.current >= challenge.requirement.target;
    };

    const handleClaim = async (challengeId: string) => {
        if (!publicKey) return;

        setClaiming(challengeId);

        try {
            const response = await fetch('/api/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    challengeId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setChallenges(prev =>
                    prev.map(c =>
                        c.id === challengeId ? { ...c, claimedAt: Date.now() } : c
                    )
                );
                setStats(prev => ({ ...prev, claimed: prev.claimed + 1 }));
            }
        } catch (err) {
            console.error('Error claiming reward:', err);
        } finally {
            setClaiming(null);
        }
    };

    const handleRefresh = () => {
        fetchChallenges();
    };

    const filteredChallenges = challenges.filter(c =>
        filter === 'all' || c.type === filter
    );

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-700 rounded-lg w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-700/50 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        ⚔️ Active Challenges
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                            {stats.completed}/{stats.total} Complete
                        </span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {connected
                            ? 'Complete challenges to earn rewards • Progress tracked from your trades'
                            : '⚠️ Connect wallet to track your progress'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Refresh button */}
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 transition-all text-sm"
                        title="Refresh challenges"
                    >
                        🔄
                    </button>

                    {/* Filter buttons */}
                    <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1">
                        {(['all', 'daily', 'weekly', 'special'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${filter === type
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                    }`}
                            >
                                {type === 'all' ? '🎮 All' : type === 'daily' ? '📅 Daily' : type === 'weekly' ? '📆 Weekly' : '⭐ Special'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Wallet Metrics Summary - Period Specific */}
            {metrics && (
                <div className="mb-6">
                    {/* Today's Stats */}
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                            📅 Today&apos;s Activity
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 rounded-xl p-3 border border-blue-500/20 text-center">
                                <div className="text-2xl font-black text-blue-400">{metrics.todayTrades || 0}</div>
                                <div className="text-xs text-gray-400">Trades Today</div>
                            </div>
                            <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/50 rounded-xl p-3 border border-cyan-500/20 text-center">
                                <div className="text-2xl font-black text-cyan-400">{(metrics.todayVolume || 0).toFixed(1)}</div>
                                <div className="text-xs text-gray-400">Volume (SOL)</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/50 rounded-xl p-3 border border-purple-500/20 text-center">
                                <div className="text-2xl font-black text-purple-400">{metrics.winRate}%</div>
                                <div className="text-xs text-gray-400">Win Rate</div>
                            </div>
                        </div>
                    </div>

                    {/* This Week's Stats */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                            📆 This Week
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/50 rounded-xl p-3 border border-orange-500/20 text-center">
                                <div className="text-2xl font-black text-orange-400">{metrics.weekTrades || 0}</div>
                                <div className="text-xs text-gray-400">Trades</div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/50 rounded-xl p-3 border border-yellow-500/20 text-center">
                                <div className="text-2xl font-black text-yellow-400">{(metrics.weekVolume || 0).toFixed(1)}</div>
                                <div className="text-xs text-gray-400">Volume (SOL)</div>
                            </div>
                            <div className={`bg-gradient-to-br ${(metrics.weekProfit || 0) >= 0 ? 'from-green-900/30 to-green-950/50 border-green-500/20' : 'from-red-900/30 to-red-950/50 border-red-500/20'} rounded-xl p-3 border text-center`}>
                                <div className={`text-2xl font-black ${(metrics.weekProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {(metrics.weekProfit || 0) >= 0 ? '+' : ''}{(metrics.weekProfit || 0).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-400">Profit (SOL)</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm">⚠️ {error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 text-sm text-red-300 underline hover:text-red-200"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Progress Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/50 rounded-xl p-4 border border-purple-500/20 text-center">
                    <div className="text-3xl font-black text-purple-400">{stats.completed}</div>
                    <div className="text-xs text-gray-400">Completed</div>
                </div>
                <div className="bg-gradient-to-br from-green-900/30 to-green-950/50 rounded-xl p-4 border border-green-500/20 text-center">
                    <div className="text-3xl font-black text-green-400">{stats.claimed}</div>
                    <div className="text-xs text-gray-400">Claimed</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/50 rounded-xl p-4 border border-yellow-500/20 text-center">
                    <div className="text-3xl font-black text-yellow-400">
                        {challenges.reduce((sum, c) => sum + (isCompleted(c) && !c.claimedAt ? c.reward.amount : 0), 0)}
                    </div>
                    <div className="text-xs text-gray-400">Pending Rewards</div>
                </div>
            </div>

            {/* Challenges List */}
            <div className="space-y-4">
                {filteredChallenges.map((challenge) => {
                    const colors = DIFFICULTY_COLORS[challenge.difficulty];
                    const completed = isCompleted(challenge);
                    const claimed = !!challenge.claimedAt;
                    const progress = getProgress(challenge);

                    return (
                        <div
                            key={challenge.id}
                            className={`relative overflow-hidden rounded-xl border ${colors.border} ${claimed ? 'opacity-60' : ''
                                }`}
                        >
                            {/* Background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`}></div>

                            {/* Content */}
                            <div className="relative p-4">
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="text-4xl flex-shrink-0">{challenge.icon}</div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white text-lg">{challenge.title}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.text} bg-gray-900/50 capitalize`}>
                                                {challenge.difficulty}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900/50 text-gray-400 capitalize">
                                                {challenge.type}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-3">{challenge.description}</p>

                                        {/* Progress bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">
                                                    {typeof challenge.requirement.current === 'number'
                                                        ? challenge.requirement.current.toFixed(challenge.requirement.current % 1 !== 0 ? 1 : 0)
                                                        : 0} / {challenge.requirement.target}
                                                </span>
                                                <span className={colors.text}>{Math.round(progress)}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 bg-gradient-to-r ${completed ? 'from-green-500 to-green-400' : colors.bar}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-bold ${colors.text}`}>
                                                    {challenge.reward.label}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ⏰ {formatTimeLeft(challenge.expiresAt)}
                                                </span>
                                            </div>

                                            {/* Claim button */}
                                            {completed && !claimed && connected && (
                                                <button
                                                    onClick={() => handleClaim(challenge.id)}
                                                    disabled={claiming === challenge.id}
                                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    {claiming === challenge.id ? (
                                                        <>
                                                            <span className="animate-spin">⏳</span> Claiming...
                                                        </>
                                                    ) : (
                                                        <>
                                                            🎁 Claim Reward
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {claimed && (
                                                <span className="text-green-400 font-bold flex items-center gap-1">
                                                    ✅ Claimed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Completed overlay */}
                            {completed && !claimed && (
                                <div className="absolute top-2 right-2">
                                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse">
                                        🎉 COMPLETE!
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {filteredChallenges.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-5xl mb-4">🎮</div>
                    <h3 className="text-xl font-bold text-white mb-2">No Challenges Available</h3>
                    <p className="text-gray-400">Check back later for new challenges!</p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-700/50 text-center">
                <p className="text-xs text-gray-500">
                    Daily challenges reset at 00:00 UTC • Weekly challenges reset on Mondays
                    <br />
                    <span className="text-purple-400">Progress is calculated from your real trading history</span>
                </p>
            </div>
        </div>
    );
}

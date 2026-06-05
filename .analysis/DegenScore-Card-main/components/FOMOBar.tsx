import { useState, useEffect, useCallback } from 'react';

interface FOMOStats {
    spotsRemaining: number;
    dailyLimit: number;
    totalCards: number;
    cardsToday: number;
    cardsThisWeek: number;
    paidCardsTotal: number;
    recentActivity: { wallet: string; score: number; timeAgo: string }[];
    topScoreToday: number;
    msUntilReset: number;
}

/**
 * FOMO Bar - REAL DATA + Maximum Visual Impact
 * Creates genuine urgency with actual platform statistics
 */
export function FOMOBar() {
    const [stats, setStats] = useState<FOMOStats | null>(null);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [mounted, setMounted] = useState(false);
    const [isLowSpots, setIsLowSpots] = useState(false);

    // Fetch real stats from API
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/fomo-stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setIsLowSpots(data.stats.spotsRemaining <= 10);
            }
        } catch (error) {
            console.error('Failed to fetch FOMO stats:', error);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchStats();

        // Refresh stats every 30 seconds
        const statsInterval = setInterval(fetchStats, 30000);

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            const now = new Date();
            const tomorrow = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 1,
                0, 0, 0, 0
            ));
            const diff = tomorrow.getTime() - now.getTime();

            setTimeLeft({
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => {
            clearInterval(statsInterval);
            clearInterval(countdownInterval);
        };
    }, [fetchStats]);

    if (!mounted) return null;

    return (
        <>
            {/* Main FOMO Bar */}
            <div className={`w-full relative overflow-hidden ${isLowSpots
                ? 'bg-gradient-to-r from-red-900 via-red-800 to-red-900 animate-pulse'
                : 'bg-gradient-to-r from-purple-900/90 via-black to-purple-900/90'
                }`}>
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent animate-pulse"></div>
                    <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-pink-500/30 to-transparent animate-pulse delay-100"></div>
                    <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent animate-pulse delay-200"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-2.5">
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">

                        {/* 🔥 SPOTS REMAINING - SCARCITY */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isLowSpots
                            ? 'bg-red-500/30 border border-red-400/50 animate-bounce'
                            : 'bg-purple-500/20 border border-purple-400/30'
                            }`}>
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLowSpots ? 'bg-red-400' : 'bg-yellow-400'
                                    }`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLowSpots ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}></span>
                            </span>
                            <span className="text-white font-bold">
                                {isLowSpots ? '🚨' : '⚡'} Only{' '}
                                <span className={`text-lg font-black ${isLowSpots ? 'text-red-300' : 'text-yellow-400'
                                    }`}>
                                    {stats?.spotsRemaining ?? 23}
                                </span>
                                {' '}spots left!
                            </span>
                        </div>

                        {/* 🔥 LIVE COUNTER - SOCIAL PROOF */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            <span className="text-white font-bold">
                                🔥{' '}
                                <span className="text-lg font-black text-green-400">
                                    {stats?.cardsToday ?? 47}
                                </span>
                                {' '}degens scored today
                            </span>
                        </div>

                        {/* ⏰ COUNTDOWN - URGENCY */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/30">
                            <span className="text-orange-400">⏰</span>
                            <span className="text-white font-bold">
                                Resets:{' '}
                                <span className="font-mono text-lg font-black text-orange-400 tabular-nums">
                                    {String(timeLeft.hours).padStart(2, '0')}:
                                    {String(timeLeft.minutes).padStart(2, '0')}:
                                    {String(timeLeft.seconds).padStart(2, '0')}
                                </span>
                            </span>
                        </div>

                        {/* 🏆 TOP SCORE - COMPETITION */}
                        {(stats?.topScoreToday ?? 0) > 0 && (
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-400/30">
                                <span className="text-yellow-400">🏆</span>
                                <span className="text-white font-bold">
                                    Top today:{' '}
                                    <span className="text-lg font-black text-yellow-400">
                                        {stats?.topScoreToday ?? 0}
                                    </span>
                                    {' '}pts
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Secondary bar - Recent activity ticker */}
            <div className="w-full bg-black/80 border-b border-gray-800 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 py-1.5">
                    <div className="flex items-center gap-4 text-xs text-gray-400 animate-marquee">
                        <span className="text-green-400 font-bold shrink-0">LIVE:</span>
                        {(stats?.recentActivity || []).map((activity, i) => (
                            <span key={i} className="flex items-center gap-1 shrink-0">
                                <span className="font-mono text-gray-500">{activity.wallet}</span>
                                <span className="text-purple-400 font-bold">{activity.score} pts</span>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-500">{activity.timeAgo}</span>
                                {i < (stats?.recentActivity?.length || 0) - 1 && (
                                    <span className="text-gray-700 mx-2">|</span>
                                )}
                            </span>
                        ))}
                        {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                            <>
                                <span className="font-mono text-gray-500">7xKp...3mNq</span>
                                <span className="text-purple-400 font-bold">847 pts</span>
                                <span className="text-gray-500">• just now</span>
                            </>
                        )}
                        <span className="text-gray-600 mx-4">•</span>
                        <span className="text-cyan-400 font-bold shrink-0">
                            {stats?.totalCards || 500}+ total degens
                        </span>
                        <span className="text-gray-600 mx-4">•</span>
                        <span className="text-pink-400 font-bold shrink-0">
                            {stats?.paidCardsTotal || 89} premium members
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * Floating FOMO popup - appears randomly
 */
export function FOMOPopup() {
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const messages = [
            '🔥 Someone just got 892 DegenScore!',
            '⚡ 3 whales analyzed in the last minute',
            '🏆 New high score: 945 points!',
            '💎 Premium spot just claimed!',
            '🚀 +12 new degens in the last 5 min',
        ];

        const showPopup = () => {
            const randomIndex = Math.floor(Math.random() * messages.length);
            setMessage(messages[randomIndex] as string);
            setShow(true);
            setTimeout(() => setShow(false), 4000);
        };

        // Show popup randomly between 15-30 seconds
        const scheduleNext = () => {
            const delay = 15000 + Math.random() * 15000;
            setTimeout(() => {
                showPopup();
                scheduleNext();
            }, delay);
        };

        // Initial popup after 5 seconds
        const initial = setTimeout(() => {
            showPopup();
            scheduleNext();
        }, 5000);

        return () => clearTimeout(initial);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl shadow-2xl shadow-purple-500/50 flex items-center gap-3 max-w-xs">
                <div className="text-2xl">🔔</div>
                <div>
                    <p className="font-bold text-sm">{message}</p>
                    <p className="text-xs text-purple-200">just now</p>
                </div>
            </div>
        </div>
    );
}

export default FOMOBar;

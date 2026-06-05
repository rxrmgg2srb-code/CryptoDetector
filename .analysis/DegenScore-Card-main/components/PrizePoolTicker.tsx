import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

interface PrizePoolTickerProps {
    /** Initial seed amount in SOL (for display before real data loads) */
    seedAmount?: number;
}

/**
 * 🍯 PrizePoolTicker
 * 
 * A prominent, animated ticker showing the current season's prize pool.
 * Designed to create FOMO and urgency.
 */
export default function PrizePoolTicker({ seedAmount = 0 }: PrizePoolTickerProps) {
    const [prizePool, setPrizePool] = useState<number>(seedAmount);
    const [seasonSales, setSeasonSales] = useState<number>(0);
    const [_loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<number>(prizePool);

    // Fetch real stats from API
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/season/stats');
                if (response.ok) {
                    const data = await response.json();
                    setLastUpdate(prizePool);
                    setPrizePool(data.prizePool || seedAmount);
                    setSeasonSales(data.totalSales || 0);
                }
            } catch (error) {
                console.error('Failed to fetch season stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [seedAmount]);

    // Calculate approximate USD value (assuming SOL = $150)
    const usdValue = prizePool * 150;

    return (
        <div className="relative w-full overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-orange-500/20 to-red-500/20 animate-pulse"></div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-yellow-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(234,179,8,0.3)]"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl animate-bounce">🏆</span>
                        <div>
                            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                                SEASON 1 PRIZE POOL
                            </h2>
                            <p className="text-gray-400 text-sm">Ends in 27 days</p>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-xs font-bold">LIVE</span>
                    </div>
                </div>

                {/* Prize Amount - BIG */}
                <div className="text-center py-6">
                    <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 animate-text-shimmer">
                        <CountUp
                            start={lastUpdate}
                            end={prizePool}
                            duration={2}
                            decimals={1}
                            suffix=" SOL"
                            useEasing
                        />
                    </div>
                    <div className="text-2xl text-gray-400 mt-2">
                        ≈ $<CountUp end={usdValue} duration={2} separator="," />
                    </div>
                </div>

                {/* Progress Bar (visual representation of pool growth) */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>{seasonSales} cards minted</span>
                        <span>Next milestone: 100</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((seasonSales % 100) / 100 * 100, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        +3 SOL added every 100 cards 🔥
                    </p>
                </div>

                {/* Winners Distribution */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/30">
                        <span className="text-lg">🥇</span>
                        <p className="text-yellow-400 font-bold">30%</p>
                        <p className="text-gray-500">#1 Score</p>
                    </div>
                    <div className="bg-gray-500/10 rounded-lg p-2 border border-gray-500/30">
                        <span className="text-lg">🥈🥉</span>
                        <p className="text-gray-300 font-bold">20%</p>
                        <p className="text-gray-500">#2-3</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
                        <span className="text-lg">🎲</span>
                        <p className="text-purple-400 font-bold">15%</p>
                        <p className="text-gray-500">Random</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-400">
                        Mint your card to compete for the prize! 🚀
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

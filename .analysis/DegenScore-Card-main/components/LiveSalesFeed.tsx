import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sale {
    wallet: string;
    timestamp: number;
    amount: number;
}

/**
 * 🔥 LiveSalesFeed
 * 
 * Shows recent purchases in real-time to create social proof and FOMO.
 * "X just minted a DegenCard!"
 */
export default function LiveSalesFeed() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [currentSale, setCurrentSale] = useState<Sale | null>(null);

    // Fetch recent sales
    useEffect(() => {
        const fetchSales = async () => {
            try {
                const response = await fetch('/api/season/recent-sales');
                if (response.ok) {
                    const data = await response.json();
                    setSales(data.sales || []);
                }
            } catch (error) {
                console.error('Failed to fetch sales:', error);
            }
        };

        fetchSales();
        // Refresh every 10 seconds
        const interval = setInterval(fetchSales, 10000);
        return () => clearInterval(interval);
    }, []);

    // Rotate through sales for display
    useEffect(() => {
        if (sales.length === 0) return;

        let index = 0;
        const showNextSale = () => {
            const sale = sales[index];
            if (sale) setCurrentSale(sale);
            index = (index + 1) % sales.length;
        };

        showNextSale();
        const interval = setInterval(showNextSale, 4000);
        return () => clearInterval(interval);
    }, [sales]);

    // Format wallet address (8x...abc)
    const formatWallet = (wallet: string) => {
        if (!wallet || wallet.length < 10) return wallet;
        return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
    };

    // Time ago
    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (!currentSale) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentSale.wallet}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="fixed bottom-4 right-4 z-50"
            >
                <div className="bg-gray-900/95 backdrop-blur-xl border border-green-500/50 rounded-xl px-4 py-3 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-3">
                    {/* Icon */}
                    <div className="text-2xl animate-bounce">🎴</div>

                    {/* Content */}
                    <div>
                        <p className="text-white font-bold text-sm">
                            <span className="text-green-400">{formatWallet(currentSale.wallet)}</span> just minted!
                        </p>
                        <p className="text-gray-500 text-xs">{timeAgo(currentSale.timestamp)}</p>
                    </div>

                    {/* Live dot */}
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

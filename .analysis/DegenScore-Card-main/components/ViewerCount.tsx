import React, { useState, useEffect } from 'react';

interface ViewerCountProps {
    walletAddress?: string;
    className?: string;
}

export const ViewerCount: React.FC<ViewerCountProps> = ({
    walletAddress,
    className = '',
}) => {
    const [viewerCount, setViewerCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Simulate viewer count (in production, use Redis or real-time service)
        // Base count + random variance + time-based fluctuation
        const baseCount = Math.floor(Math.random() * 5) + 2; // 2-6 base
        const timeVariance = Math.floor(Math.sin(Date.now() / 10000) * 3) + 3;
        const total = baseCount + timeVariance;

        setViewerCount(Math.max(1, total));

        // Show after short delay for smooth UX
        const showTimeout = setTimeout(() => setIsVisible(true), 500);

        // Update periodically
        const interval = setInterval(() => {
            const newCount = Math.floor(Math.random() * 5) + 2 + Math.floor(Math.sin(Date.now() / 10000) * 3) + 3;
            setViewerCount(Math.max(1, newCount));
        }, 30000); // Update every 30s

        return () => {
            clearTimeout(showTimeout);
            clearInterval(interval);
        };
    }, [walletAddress]);

    if (!isVisible) return null;

    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 
        bg-gray-800/80 backdrop-blur-sm rounded-full 
        border border-gray-700/50 text-sm ${className}`}
        >
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-gray-300">
                <span className="font-semibold text-white">{viewerCount}</span>
                {' '}viendo ahora
            </span>
        </div>
    );
};

// Global page viewer count (not wallet-specific)
export const PageViewerCount: React.FC<{ className?: string }> = ({ className }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Simulate active users on the platform
        const base = Math.floor(Math.random() * 20) + 10; // 10-30
        setCount(base);

        const interval = setInterval(() => {
            setCount(prev => {
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                return Math.max(5, prev + change);
            });
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <div className={`text-xs text-gray-400 flex items-center gap-1 ${className}`}>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            {count} usuarios activos
        </div>
    );
};

export default ViewerCount;

import React, { useState, useEffect, useCallback } from 'react';

interface ActivityEvent {
    id: string;
    type: 'card_generated' | 'analysis' | 'whale_alert' | 'payment';
    message: string;
    icon: string;
    timestamp: number;
}

const MOCK_ACTIVITIES: ActivityEvent[] = [
    { id: '1', type: 'card_generated', message: 'Un degen acaba de generar su card 🔥', icon: '🎴', timestamp: Date.now() },
    { id: '2', type: 'analysis', message: '3 wallets analizándose ahora mismo', icon: '📊', timestamp: Date.now() },
    { id: '3', type: 'whale_alert', message: 'Whale movió 500 SOL en Jupiter', icon: '🐋', timestamp: Date.now() },
    { id: '4', type: 'payment', message: 'Nuevo DegenCard Premium vendido!', icon: '💎', timestamp: Date.now() },
];

export const LiveActivityBanner: React.FC = () => {
    const [currentActivity, setCurrentActivity] = useState<ActivityEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const showRandomActivity = useCallback(() => {
        if (MOCK_ACTIVITIES.length === 0) return;

        const randomIndex = Math.floor(Math.random() * MOCK_ACTIVITIES.length);
        const activity = MOCK_ACTIVITIES[randomIndex] as ActivityEvent;

        setCurrentActivity({
            id: Date.now().toString(),
            type: activity.type,
            message: activity.message,
            icon: activity.icon,
            timestamp: Date.now()
        });
        setIsVisible(true);
        setIsExiting(false);

        setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => setIsVisible(false), 300);
        }, 4000);
    }, []);

    useEffect(() => {
        const initialTimeout = setTimeout(showRandomActivity, 3000);

        const interval = setInterval(() => {
            if (!isVisible) {
                showRandomActivity();
            }
        }, 15000 + Math.random() * 15000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [showRandomActivity, isVisible]);

    if (!isVisible || !currentActivity) return null;

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 max-w-sm 
        ${isExiting ? 'animate-slideOutRight' : 'animate-slideInRight'}`}
        >
            <div className="bg-gray-900/95 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{currentActivity.icon}</span>
                    <div className="flex-1">
                        <p className="text-sm text-white font-medium">{currentActivity.message}</p>
                        <p className="text-xs text-gray-400">Hace un momento</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsExiting(true);
                            setTimeout(() => setIsVisible(false), 300);
                        }}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveActivityBanner;

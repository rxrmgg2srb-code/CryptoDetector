import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface WhaleAlert {
    id: string;
    type: 'buy' | 'sell';
    walletAddress: string;
    walletScore: number;
    tokenSymbol: string;
    tokenMint: string;
    amount: number;
    timestamp: number;
    priceImpact?: number;
    isFollowed: boolean;
}

interface NotificationSettings {
    enabled: boolean;
    minScore: number;
    minAmount: number;
    onlyFollowed: boolean;
    buyAlerts: boolean;
    sellAlerts: boolean;
    soundEnabled: boolean;
}

export default function WhaleNotifications() {
    const { publicKey } = useWallet();
    const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
    const [settings, setSettings] = useState<NotificationSettings>({
        enabled: true,
        minScore: 70,
        minAmount: 10,
        onlyFollowed: false,
        buyAlerts: true,
        sellAlerts: true,
        soundEnabled: true,
    });
    const [showSettings, setShowSettings] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('whaleNotificationSettings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, []);

    // Save settings to localStorage
    const saveSettings = useCallback((newSettings: NotificationSettings) => {
        setSettings(newSettings);
        localStorage.setItem('whaleNotificationSettings', JSON.stringify(newSettings));
    }, []);

    // Connect to WebSocket for real-time alerts (simulated for now)
    useEffect(() => {
        if (!settings.enabled || !publicKey) return;

        // Simulate WebSocket connection
        setIsConnected(true);

        // Simulate incoming alerts
        const interval = setInterval(() => {
            const tokens = ['$BONK', '$WIF', '$POPCAT', '$FWOG', '$GIGA'];
            const randomToken = tokens[Math.floor(Math.random() * tokens.length)] || '$BONK';

            const mockAlert: WhaleAlert = {
                id: `alert-${Date.now()}`,
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                walletAddress: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`,
                walletScore: Math.floor(Math.random() * 30) + 70,
                tokenSymbol: randomToken,
                tokenMint: 'TokenMint123',
                amount: Math.floor(Math.random() * 100) + 10,
                timestamp: Date.now(),
                priceImpact: Math.random() * 5,
                isFollowed: Math.random() > 0.7,
            };

            // Filter based on settings
            if (mockAlert.walletScore < settings.minScore) return;
            if (mockAlert.amount < settings.minAmount) return;
            if (settings.onlyFollowed && !mockAlert.isFollowed) return;
            if (mockAlert.type === 'buy' && !settings.buyAlerts) return;
            if (mockAlert.type === 'sell' && !settings.sellAlerts) return;

            setAlerts(prev => [mockAlert, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);

            // Show browser notification
            if (Notification.permission === 'granted') {
                new Notification(`🐋 Whale Alert: ${mockAlert.type.toUpperCase()}`, {
                    body: `${mockAlert.walletAddress} ${mockAlert.type === 'buy' ? 'bought' : 'sold'} ${mockAlert.amount} SOL of ${mockAlert.tokenSymbol}`,
                    icon: '/favicon.ico',
                    tag: mockAlert.id,
                });
            }

            // Play sound
            if (settings.soundEnabled) {
                const audio = new Audio('/sounds/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => { }); // Ignore errors if sound doesn't exist
            }
        }, 30000 + Math.random() * 30000); // Random interval 30-60s

        return () => {
            clearInterval(interval);
            setIsConnected(false);
        };
    }, [settings, publicKey]);

    const clearAlerts = () => {
        setAlerts([]);
        setUnreadCount(0);
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <>
            {/* Notification Bell Button */}
            <button
                onClick={() => {
                    setShowPanel(!showPanel);
                    setUnreadCount(0);
                }}
                className="relative p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all group"
            >
                <span className="text-2xl group-hover:animate-wiggle">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {isConnected && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
            </button>

            {/* Notification Panel */}
            {showPanel && (
                <div className="fixed right-4 top-20 w-96 max-h-[80vh] bg-gradient-to-br from-gray-900 to-gray-950 border border-purple-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 border-b border-purple-500/30">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🐋</span>
                                <h3 className="text-lg font-bold text-white">Whale Alerts</h3>
                                {isConnected && (
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all"
                                    title="Settings"
                                >
                                    ⚙️
                                </button>
                                <button
                                    onClick={() => setShowPanel(false)}
                                    className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="p-4 bg-gray-800/50 border-b border-gray-700">
                            <h4 className="font-bold text-white mb-3">Notification Settings</h4>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between">
                                    <span className="text-gray-300 text-sm">Enable Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.enabled}
                                        onChange={(e) => saveSettings({ ...settings, enabled: e.target.checked })}
                                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                                    />
                                </label>
                                <label className="flex items-center justify-between">
                                    <span className="text-gray-300 text-sm">Minimum Score</span>
                                    <input
                                        type="number"
                                        value={settings.minScore}
                                        onChange={(e) => saveSettings({ ...settings, minScore: parseInt(e.target.value) || 0 })}
                                        className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                        min={0}
                                        max={100}
                                    />
                                </label>
                                <label className="flex items-center justify-between">
                                    <span className="text-gray-300 text-sm">Minimum Amount (SOL)</span>
                                    <input
                                        type="number"
                                        value={settings.minAmount}
                                        onChange={(e) => saveSettings({ ...settings, minAmount: parseInt(e.target.value) || 0 })}
                                        className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                        min={0}
                                    />
                                </label>
                                <label className="flex items-center justify-between">
                                    <span className="text-gray-300 text-sm">Only Followed Wallets</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.onlyFollowed}
                                        onChange={(e) => saveSettings({ ...settings, onlyFollowed: e.target.checked })}
                                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                                    />
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.buyAlerts}
                                            onChange={(e) => saveSettings({ ...settings, buyAlerts: e.target.checked })}
                                            className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-600"
                                        />
                                        <span className="text-green-400 text-sm">🟢 Buys</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.sellAlerts}
                                            onChange={(e) => saveSettings({ ...settings, sellAlerts: e.target.checked })}
                                            className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-red-600"
                                        />
                                        <span className="text-red-400 text-sm">🔴 Sells</span>
                                    </label>
                                </div>
                                <label className="flex items-center justify-between">
                                    <span className="text-gray-300 text-sm">Sound Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.soundEnabled}
                                        onChange={(e) => saveSettings({ ...settings, soundEnabled: e.target.checked })}
                                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Alerts List */}
                    <div className="overflow-y-auto max-h-96">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-5xl mb-3">🐋</div>
                                <p className="text-gray-400 text-sm">No whale alerts yet</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    Alerts appear when whales make big moves
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="p-4 hover:bg-gray-800/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`text-2xl ${alert.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                                {alert.type === 'buy' ? '🟢' : '🔴'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-white text-sm">{alert.walletAddress}</span>
                                                    {alert.isFollowed && (
                                                        <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Following</span>
                                                    )}
                                                </div>
                                                <p className="text-gray-300 text-sm">
                                                    <span className={alert.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                                                        {alert.type === 'buy' ? 'Bought' : 'Sold'}
                                                    </span>
                                                    {' '}<span className="font-bold text-yellow-400">{alert.amount} SOL</span>
                                                    {' '}of <span className="font-bold text-purple-400">{alert.tokenSymbol}</span>
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                                        Score: {alert.walletScore}
                                                    </span>
                                                    {alert.priceImpact && (
                                                        <span className="text-xs text-gray-500">
                                                            Impact: {alert.priceImpact.toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all">
                                                →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {alerts.length > 0 && (
                        <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                            <button
                                onClick={clearAlerts}
                                className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                            >
                                Clear All Alerts
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .group-hover\\:animate-wiggle:hover {
          animation: wiggle 0.5s ease-in-out;
        }
      `}</style>
        </>
    );
}

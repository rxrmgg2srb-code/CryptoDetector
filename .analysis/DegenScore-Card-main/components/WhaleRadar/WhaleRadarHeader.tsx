import React from 'react';

interface WhaleRadarHeaderProps {
  activeTab: 'top' | 'following' | 'alerts';
  setActiveTab: (tab: 'top' | 'following' | 'alerts') => void;
  followingCount: number;
  alertsCount: number;
}

export default function WhaleRadarHeader({
  activeTab,
  setActiveTab,
  followingCount,
  alertsCount,
}: WhaleRadarHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🐋</span>
            <span>Whale Tracking Radar</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">Follow top traders and get real-time alerts</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('top')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'top'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🏆 Top Whales
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'following'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          💙 Following ({followingCount})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'alerts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🔔 Alerts ({alertsCount})
        </button>
      </div>
    </>
  );
}

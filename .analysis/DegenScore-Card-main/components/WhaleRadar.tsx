import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWhaleRadar } from '@/hooks/useWhaleRadar';
import WhaleRadarHeader from './WhaleRadar/WhaleRadarHeader';
import WhaleCard from './WhaleRadar/WhaleCard';
import AlertCard from './WhaleRadar/AlertCard';
import EmptyState from './WhaleRadar/EmptyState';

export default function WhaleRadar() {
  const { publicKey } = useWallet();
  const {
    activeTab,
    setActiveTab,
    topWhales,
    followedWhales,
    alerts,
    loading,
    sessionToken,
    handleFollow,
    handleUnfollow,
    isFollowing,
  } = useWhaleRadar();

  if (loading && topWhales.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-8 border border-blue-500/30 animate-pulse">
        <div className="h-96 bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-500/30">
      <WhaleRadarHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        followingCount={followedWhales.length}
        alertsCount={alerts.length}
      />

      <div className="space-y-3">
        {/* Top Whales Tab */}
        {activeTab === 'top' && (
          <>
            {topWhales.length === 0 ? (
              <EmptyState
                icon="🐋"
                title="No whales detected yet"
                description="Whales are traders with high volume and win rate"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topWhales.map((whale) => (
                  <WhaleCard
                    key={whale.id}
                    whale={whale}
                    isFollowing={isFollowing(whale.id)}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    isAuthenticated={!!sessionToken}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Following Tab */}
        {activeTab === 'following' && (
          <>
            {!publicKey ? (
              <div className="text-center bg-blue-900/20 border border-blue-500/30 rounded-lg p-8">
                <div className="text-4xl mb-3">🔐</div>
                <p className="text-gray-400">Connect your wallet to follow whales</p>
              </div>
            ) : followedWhales.length === 0 ? (
              <EmptyState
                icon="👀"
                title="Not following any whales yet"
                description="Go to Top Whales tab to find traders to follow"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followedWhales.map((whale) => (
                  <WhaleCard
                    key={whale.id}
                    whale={whale}
                    isFollowing={true}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    isAuthenticated={!!sessionToken}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <>
            {!publicKey ? (
              <div className="text-center bg-blue-900/20 border border-blue-500/30 rounded-lg p-8">
                <div className="text-4xl mb-3">🔐</div>
                <p className="text-gray-400">Connect your wallet to see alerts</p>
              </div>
            ) : alerts.length === 0 ? (
              <EmptyState
                icon="🔕"
                title="No alerts yet"
                description="Follow whales to get notified of their trades"
              />
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info Footer */}
      {!publicKey && (
        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
          Connect your wallet to follow whales and get real-time alerts
        </div>
      )}
    </div>
  );
}

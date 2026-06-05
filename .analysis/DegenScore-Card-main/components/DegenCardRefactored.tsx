import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ProfileFormModal, { ProfileData } from './ProfileFormModal';
import UpgradeModal from './UpgradeModal';
import ShareModal from './ShareModal';
import { Celebration } from './Celebration';
import { AchievementPopup, achievements } from './AchievementPopup';
import { useCardGeneration } from '@/hooks/useCardGeneration';
import { WalletConnectionPrompt } from './card/WalletConnectionPrompt';
import { CardGenerationProgress } from './card/CardGenerationProgress';
import { GenerateCardButton } from './card/GenerateCardButton';
import { CardPreview } from './card/CardPreview';
import { CardActions } from './card/CardActions';
import { logger } from '@/lib/logger';

export default function DegenCardRefactored() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  const {
    state,
    celebrationState,
    modalState,
    generateCard,
    downloadCard,
    regenerateCard,
    setModalState,
    setCelebrationState,
  } = useCardGeneration();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerateCard = () => {
    if (!connected || !publicKey) {
      return;
    }
    generateCard(publicKey.toBase58());
  };

  const handleUpgrade = () => {
    setModalState((prev) => ({ ...prev, showUpgradeModal: false, hasPaid: true }));

    setCelebrationState({
      showCelebration: true,
      celebrationType: 'premium-unlock',
      celebrationScore: undefined,
      currentAchievement: achievements.premiumUnlock,
    });

    setTimeout(() => {
      setModalState((prev) => ({ ...prev, showShareModal: true }));
    }, 1500);
  };

  const handleShared = () => {
    setModalState((prev) => ({ ...prev, showShareModal: false }));
    setTimeout(() => {
      setModalState((prev) => ({ ...prev, showProfileModal: true }));
    }, 500);
  };

  const handleSkipShare = () => {
    setModalState((prev) => ({ ...prev, showShareModal: false }));
    setTimeout(() => {
      setModalState((prev) => ({ ...prev, showProfileModal: true }));
    }, 500);
  };

  const handleSkip = () => {
    setModalState((prev) => ({ ...prev, showUpgradeModal: false }));
    downloadCard(false);
  };

  const handleProfileSubmit = async (profileData: ProfileData) => {
    try {
      logger.info('📝 Saving profile for:', { walletAddress: state.walletAddress });

      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: state.walletAddress,
          ...profileData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      logger.info('✅ Profile saved');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await regenerateCard();

      setModalState((prev) => ({ ...prev, showProfileModal: false, hasPaid: true }));

      // 🎉 Auto-descargar la card premium
      logger.info('📥 Auto-downloading premium card...');
      setTimeout(() => {
        downloadCard(true);
      }, 500);

      // 🏆 Redirect to leaderboard after 2 seconds
      logger.info('🏆 Redirecting to leaderboard...');
      setTimeout(() => {
        window.location.href = '/leaderboard';
      }, 2000);
    } catch (error) {
      logger.error('Payment error', error instanceof Error ? error : undefined, {
        error: String(error),
      });
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewLeaderboard = () => {
    window.location.href = '/leaderboard';
  };

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <Header />

        <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl p-10 shadow-[0_0_60px_rgba(139,92,246,0.4)] border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-500">
          <div className="mb-8">
            {!connected ? (
              <WalletConnectionPrompt />
            ) : (
              <ConnectedWalletView
                publicKey={publicKey!}
                error={state.error}
                analyzing={state.analyzing}
                analysisMessage={state.analysisMessage}
                analysisProgress={state.analysisProgress}
                loading={state.loading}
                onGenerateCard={handleGenerateCard}
              />
            )}
          </div>

          {state.cardImage && (
            <>
              <CardPreview cardImage={state.cardImage} />

              {modalState.hasPaid && (
                <CardActions
                  onDownload={() => downloadCard(true)}
                  onViewLeaderboard={handleViewLeaderboard}
                />
              )}
            </>
          )}
        </div>

        <Footer />
      </div>

      {/* Modals */}
      <UpgradeModal
        isOpen={modalState.showUpgradeModal}
        onClose={() => setModalState((prev) => ({ ...prev, showUpgradeModal: false }))}
        onUpgrade={handleUpgrade}
        onSkip={handleSkip}
      />

      <ShareModal
        isOpen={modalState.showShareModal}
        walletAddress={state.walletAddress}
        degenScore={state.analysisData?.degenScore || 0}
        onShared={handleShared}
        onSkip={handleSkipShare}
      />

      <ProfileFormModal
        isOpen={modalState.showProfileModal}
        onClose={() => setModalState((prev) => ({ ...prev, showProfileModal: false }))}
        onSubmit={handleProfileSubmit}
        walletAddress={state.walletAddress}
      />

      {/* Celebrations */}
      {celebrationState.showCelebration && (
        <Celebration
          type={celebrationState.celebrationType}
          score={celebrationState.celebrationScore}
        />
      )}

      <AchievementPopup
        achievement={celebrationState.currentAchievement}
        onClose={() => setCelebrationState((prev) => ({ ...prev, currentAchievement: null }))}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Header />
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="text-center mb-10">
      <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 animate-float drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
        DegenScore Card Generator
      </h1>
      <p className="text-gray-300 text-xl md:text-2xl font-medium">
        Generate your Solana trader card with real on-chain metrics
      </p>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-8 text-center text-gray-400 text-sm">
      <p>Powered by Helius RPC × Solana</p>
      <p className="mt-2">💡 Connect your wallet to get started</p>
    </div>
  );
}

interface ConnectedWalletViewProps {
  publicKey: any;
  error: string | null;
  analyzing: boolean;
  analysisMessage: string;
  analysisProgress: number;
  loading: boolean;
  onGenerateCard: () => void;
}

function ConnectedWalletView({
  publicKey,
  error,
  analyzing,
  analysisMessage,
  analysisProgress,
  loading,
  onGenerateCard,
}: ConnectedWalletViewProps) {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.3)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-300 text-base font-bold mb-2 flex items-center gap-2">
              <span className="text-2xl">✅</span> Wallet Connected
            </p>
            <p className="text-white font-mono text-lg font-semibold">
              {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
            </p>
          </div>
          <div className="transform hover:scale-105 transition-transform">
            <WalletMultiButton />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {analyzing && (
        <CardGenerationProgress message={analysisMessage} progress={analysisProgress} />
      )}

      <GenerateCardButton onClick={onGenerateCard} loading={loading} />
    </div>
  );
}

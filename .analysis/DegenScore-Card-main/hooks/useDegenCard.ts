import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { achievements, Achievement } from '@/components/AchievementPopup';
import { logger } from '@/lib/logger';
import { ProfileData } from '@/components/ProfileFormModal';

/**
 * Custom hook for managing DegenCard state and operations
 *
 * Handles the complete lifecycle of a trading card generation:
 * - Wallet connection and validation
 * - Card analysis and generation
 * - Payment processing for premium features
 * - Profile customization
 * - Achievement tracking and celebrations
 *
 * @returns {Object} Card state and control methods
 * @returns {string} walletAddress - Connected wallet address
 * @returns {string | null} cardImage - Generated card image URL
 * @returns {boolean} loading - Loading state for card generation
 * @returns {string | null} error - Error message if any
 * @returns {Function} generateCard - Trigger card generation
 * @returns {Function} handleUpgrade - Process premium upgrade
 * @returns {Function} handleProfileSubmit - Save profile customization
 *
 * @example
 * const {
 *   cardImage,
 *   loading,
 *   error,
 *   generateCard
 * } = useDegenCard();
 *
 * // Generate card for connected wallet
 * await generateCard();
 */
export function useDegenCard() {
  const { publicKey, connected } = useWallet();
  const [walletAddress, setWalletAddress] = useState('');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [hasPromoCode, setHasPromoCode] = useState(false);
  const [promoCodeApplied, setPromoCodeApplied] = useState<string | null>(null);
  const [isFreeDownload, setIsFreeDownload] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Premium features
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<
    'card-generated' | 'premium-unlock' | 'achievement' | 'rank-up' | 'legendary'
  >('card-generated');
  const [celebrationScore, setCelebrationScore] = useState<number | undefined>(undefined);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);


  const generateCard = async (spyAddress?: string) => {
    // Spy Mode: If spyAddress is provided, use it. Otherwise, check for connected wallet.
    const addressToUse = spyAddress || (connected && publicKey ? publicKey.toBase58() : null);

    if (!addressToUse) {
      setError('Please connect your wallet first');
      return;
    }

    setWalletAddress(addressToUse);
    setLoading(true);
    setAnalyzing(true);
    setError(null);
    setCardImage(null);
    setAnalysisProgress(0);

    try {
      setAnalysisMessage('🔍 Analyzing wallet...');
      setAnalysisProgress(10);

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: addressToUse }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Failed to analyze wallet');
      }

      const data = await analyzeResponse.json();
      logger.info('✅ Analysis complete:', data);
      setAnalysisData(data);

      setAnalysisMessage('📊 Analysis complete!');
      setAnalysisProgress(50);

      setAnalysisMessage('💾 Saving to database...');
      setAnalysisProgress(60);

      const saveResponse = await fetch('/api/save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: addressToUse,
          analysisData: data
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save card data');
      }

      const saveData = await saveResponse.json();
      logger.info('✅ Card saved:', saveData);

      setAnalysisMessage('✅ Saved!');
      setAnalysisProgress(80);

      setAnalysisMessage('🎨 Generating card image...');
      setAnalysisProgress(90);

      const imageResponse = await fetch('/api/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: addressToUse }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.error || 'Failed to generate card');
      }

      const blob = await imageResponse.blob();
      const imageUrl = URL.createObjectURL(blob);
      setCardImage(imageUrl);

      setAnalysisMessage('🎉 Complete!');
      setAnalysisProgress(100);

      setTimeout(() => {
        setAnalyzing(false);

        // Trigger celebration based on score
        const score = data.degenScore || 0;
        setCelebrationScore(score);

        if (score >= 90) {
          setCelebrationType('legendary');
          setCurrentAchievement(achievements.legendary);
        } else if (score >= 80) {
          setCelebrationType('card-generated');
          setCurrentAchievement(achievements.highScore);
        } else {
          setCelebrationType('card-generated');
        }

        setShowCelebration(true);

        // Show first card achievement
        setTimeout(() => {
          setCurrentAchievement(achievements.firstCard);
        }, 2000);

        // Show upgrade modal
        setTimeout(() => {
          setShowUpgradeModal(true);
        }, 1000);
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logger.error('Error generating card', err instanceof Error ? err : undefined, {
        error: String(err),
      });
      setAnalyzing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    setHasPaid(true);

    // Trigger premium unlock celebration
    setCelebrationType('premium-unlock');
    setShowCelebration(true);
    setCelebrationType('premium-unlock');
    setShowCelebration(true);
    setCurrentAchievement(achievements.premiumUnlock);

    // Go directly to profile modal (paid users don't need to share on Twitter)
    setTimeout(() => {
      setShowProfileModal(true);
    }, 1500);
  };

  const downloadBasicCard = () => {
    if (!cardImage) return;

    const link = document.createElement('a');
    link.href = cardImage;
    link.download = `degen-card-basic-${walletAddress.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShared = () => {
    setShowShareModal(false);

    // If free download, just download the basic card
    if (isFreeDownload) {
      downloadBasicCard();
      setIsFreeDownload(false);
      return;
    }

    // If promo code user, continue to profile modal
    if (hasPromoCode) {
      setTimeout(() => {
        setShowProfileModal(true);
      }, 500);
    }
  };

  const handleSkipShare = () => {
    setShowShareModal(false);

    // If free download, allow download even if they skip
    if (isFreeDownload) {
      downloadBasicCard();
      setIsFreeDownload(false);
      return;
    }

    // If promo code user, still let them continue
    if (hasPromoCode) {
      setTimeout(() => {
        setShowProfileModal(true);
      }, 500);
    }
  };

  const handleSkip = () => {
    setShowUpgradeModal(false);
    setIsFreeDownload(true); // Mark as free download

    // Show ShareModal for free downloads (they must share on Twitter)
    setTimeout(() => {
      setShowShareModal(true);
    }, 500);
  };

  const handleProfileSubmit = async (profileData: ProfileData) => {
    try {
      logger.info('📝 Saving profile for:', { walletAddress });
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress,
          ...profileData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      logger.info('✅ Profile saved');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      logger.info('🎨 Regenerating premium card...');
      const imageResponse = await fetch('/api/generate-card?nocache=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress }),
      });

      if (imageResponse.ok) {
        const blob = await imageResponse.blob();
        const imageUrl = URL.createObjectURL(blob);
        setCardImage(imageUrl);
        logger.info('✅ Premium card generated!');
      }

      setShowProfileModal(false);
      setHasPaid(true);
    } catch (error) {
      logger.error('Payment error', error instanceof Error ? error : undefined, {
        error: String(error),
      });
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const downloadPremiumCard = async () => {
    if (!walletAddress) return;

    try {
      logger.info('Downloading premium card with golden borders...');

      const imageUrl = `/api/generate-card?walletAddress=${encodeURIComponent(walletAddress)}`;
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error('Failed to generate premium card');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `degenscore-premium-${walletAddress.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.info('✅ Premium card downloaded');
    } catch (error) {
      logger.error('Failed to download premium card', error as Error);
      alert('Failed to download premium card. Please try again.');
    }
  };

  return {
    mounted,
    connected,
    publicKey,
    walletAddress,
    cardImage,
    loading,
    error,
    analyzing,
    analysisProgress,
    analysisMessage,
    analysisData,
    hasPaid,
    hasPromoCode,
    promoCodeApplied,
    showUpgradeModal,
    showShareModal,
    showProfileModal,
    showCelebration,
    celebrationType,
    celebrationScore,
    currentAchievement,
    generateCard,
    handleUpgrade,
    handleSkip,
    handleShared,
    handleSkipShare,
    handleProfileSubmit,
    downloadPremiumCard,
    setShowUpgradeModal,
    setShowShareModal,
    setShowProfileModal,
    setHasPromoCode,
    setPromoCodeApplied,
    setCurrentAchievement,
  };
}

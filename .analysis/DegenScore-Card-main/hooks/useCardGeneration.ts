import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Achievement, achievements } from '@/components/AchievementPopup';

export interface CardGenerationState {
  walletAddress: string;
  cardImage: string | null;
  loading: boolean;
  error: string | null;
  analyzing: boolean;
  analysisProgress: number;
  analysisMessage: string;
  analysisData: any | null;
}

export interface CelebrationState {
  showCelebration: boolean;
  celebrationType: 'card-generated' | 'premium-unlock' | 'achievement' | 'rank-up' | 'legendary';
  celebrationScore?: number;
  currentAchievement: Achievement | null;
}

export interface ModalState {
  showUpgradeModal: boolean;
  showShareModal: boolean;
  showProfileModal: boolean;
  hasPaid: boolean;
}

export function useCardGeneration() {
  const [state, setState] = useState<CardGenerationState>({
    walletAddress: '',
    cardImage: null,
    loading: false,
    error: null,
    analyzing: false,
    analysisProgress: 0,
    analysisMessage: '',
    analysisData: null,
  });

  const [celebrationState, setCelebrationState] = useState<CelebrationState>({
    showCelebration: false,
    celebrationType: 'card-generated',
    celebrationScore: undefined,
    currentAchievement: null,
  });

  const [modalState, setModalState] = useState<ModalState>({
    showUpgradeModal: false,
    showShareModal: false,
    showProfileModal: false,
    hasPaid: false,
  });

  const generateCard = async (address: string) => {
    setState((prev) => ({
      ...prev,
      walletAddress: address,
      loading: true,
      analyzing: true,
      error: null,
      cardImage: null,
      analysisProgress: 0,
    }));

    try {
      // Step 1: Analyze wallet
      setState((prev) => ({
        ...prev,
        analysisMessage: '🔍 Analyzing wallet...',
        analysisProgress: 10,
      }));

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Failed to analyze wallet');
      }

      const data = await analyzeResponse.json();
      logger.info('✅ Analysis complete:', data);

      setState((prev) => ({
        ...prev,
        analysisData: data,
        analysisMessage: '📊 Analysis complete!',
        analysisProgress: 50,
      }));

      // Step 2: Save to database
      setState((prev) => ({
        ...prev,
        analysisMessage: '💾 Saving to database...',
        analysisProgress: 60,
      }));

      const saveResponse = await fetch('/api/save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          analysisData: data,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save card data');
      }

      const saveData = await saveResponse.json();
      logger.info('✅ Card saved:', saveData);

      setState((prev) => ({ ...prev, analysisMessage: '✅ Saved!', analysisProgress: 80 }));

      // Step 3: Generate card image (force fresh generation, no cache)
      setState((prev) => ({
        ...prev,
        analysisMessage: '🎨 Generating card image...',
        analysisProgress: 90,
      }));

      const imageResponse = await fetch('/api/generate-card?nocache=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.error || 'Failed to generate card');
      }

      const blob = await imageResponse.blob();
      const imageUrl = URL.createObjectURL(blob);

      setState((prev) => ({
        ...prev,
        cardImage: imageUrl,
        analysisMessage: '🎉 Complete!',
        analysisProgress: 100,
      }));

      // Step 4: Trigger celebrations
      setTimeout(() => {
        setState((prev) => ({ ...prev, analyzing: false }));

        const score = data.degenScore || 0;
        let celebrationType: CelebrationState['celebrationType'] = 'card-generated';
        let achievement: Achievement | null = null;

        if (score >= 90) {
          celebrationType = 'legendary';
          achievement = achievements.legendary;
        } else if (score >= 80) {
          celebrationType = 'card-generated';
          achievement = achievements.highScore;
        } else {
          celebrationType = 'card-generated';
        }

        setCelebrationState({
          showCelebration: true,
          celebrationType,
          celebrationScore: score,
          currentAchievement: achievement,
        });

        // Show first card achievement
        setTimeout(() => {
          setCelebrationState((prev) => ({
            ...prev,
            currentAchievement: achievements.firstCard,
          }));
        }, 2000);

        // Show upgrade modal
        setTimeout(() => {
          setModalState((prev) => ({ ...prev, showUpgradeModal: true }));
        }, 1000);
      }, 500);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'An error occurred',
        analyzing: false,
        loading: false,
      }));
      logger.error('Error generating card', err instanceof Error ? err : undefined, {
        error: String(err),
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const downloadCard = (isPremium: boolean = false) => {
    if (!state.cardImage) return;

    const link = document.createElement('a');
    link.href = state.cardImage;
    link.download = `degen-card-${isPremium ? 'premium' : 'basic'}-${state.walletAddress.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const regenerateCard = async () => {
    if (!state.walletAddress) return;

    logger.info('🎨 Regenerating card (forcing fresh generation)...');
    const imageResponse = await fetch('/api/generate-card?nocache=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: state.walletAddress }),
    });

    if (imageResponse.ok) {
      const blob = await imageResponse.blob();
      const imageUrl = URL.createObjectURL(blob);
      setState((prev) => ({ ...prev, cardImage: imageUrl }));
      logger.info('✅ Card regenerated!');
    }
  };

  return {
    state,
    celebrationState,
    modalState,
    generateCard,
    downloadCard,
    regenerateCard,
    setState,
    setCelebrationState,
    setModalState,
  };
}

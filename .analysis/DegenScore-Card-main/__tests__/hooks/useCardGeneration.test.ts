import { renderHook, act, waitFor } from '@testing-library/react';
import { useCardGeneration } from '@/hooks/useCardGeneration';
import { logger } from '@/lib/logger';

// Mock fetch
global.fetch = jest.fn();

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

describe('useCardGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useCardGeneration());

      expect(result.current.state).toEqual({
        walletAddress: '',
        cardImage: null,
        loading: false,
        error: null,
        analyzing: false,
        analysisProgress: 0,
        analysisMessage: '',
        analysisData: null,
      });
    });

    it('should initialize celebration state', () => {
      const { result } = renderHook(() => useCardGeneration());

      expect(result.current.celebrationState).toEqual({
        showCelebration: false,
        celebrationType: 'card-generated',
        celebrationScore: undefined,
        currentAchievement: null,
      });
    });

    it('should initialize modal state', () => {
      const { result } = renderHook(() => useCardGeneration());

      expect(result.current.modalState).toEqual({
        showUpgradeModal: false,
        showShareModal: false,
        showProfileModal: false,
        hasPaid: false,
      });
    });
  });

  describe('generateCard - Success Flow', () => {
    const mockWalletAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
    const mockAnalysisData = {
      degenScore: 85,
      totalTrades: 150,
      winRate: 0.65,
      totalVolume: 50000,
    };

    beforeEach(() => {
      // Mock successful API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          // analyze API
          ok: true,
          json: async () => mockAnalysisData,
        })
        .mockResolvedValueOnce({
          // save-card API
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          // generate-card API
          ok: true,
          blob: async () => new Blob(['fake-image-data'], { type: 'image/png' }),
        });
    });

    it('should successfully generate card with all steps', async () => {
      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard(mockWalletAddress);
      });

      await waitFor(() => {
        expect(result.current.state.cardImage).toBe('blob:mock-url');
      });

      expect(result.current.state.walletAddress).toBe(mockWalletAddress);
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.analysisData).toEqual(mockAnalysisData);
    });

    it('should update progress through all steps', async () => {
      const { result } = renderHook(() => useCardGeneration());
      const progressUpdates: number[] = [];

      await act(async () => {
        const promise = result.current.generateCard(mockWalletAddress);
        // Capture progress updates
        await new Promise((resolve) => setTimeout(resolve, 100));
        progressUpdates.push(result.current.state.analysisProgress);
        await promise;
      });

      await waitFor(() => {
        expect(result.current.state.analysisProgress).toBe(100);
      });

      expect(progressUpdates).toContain(10); // Analysis started
    });

    it('should call all API endpoints in correct order', async () => {
      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard(mockWalletAddress);
      });

      await waitFor(() => {
        expect(result.current.state.cardImage).toBeTruthy();
      });

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/analyze', expect.any(Object));
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/save-card', expect.any(Object));
      expect(fetch).toHaveBeenNthCalledWith(
        3,
        '/api/generate-card?nocache=true',
        expect.any(Object)
      );
    });

    it('should trigger celebration for high score (>= 90)', async () => {
      (global.fetch as jest.Mock)
        .mockClear()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockAnalysisData, degenScore: 95 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['fake'], { type: 'image/png' }),
        });

      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard(mockWalletAddress);
      });

      await waitFor(
        () => {
          expect(result.current.celebrationState.celebrationScore).toBe(95);
        },
        { timeout: 3000 }
      );

      expect(result.current.celebrationState.celebrationType).toBe('legendary');
    });

    it('should trigger celebration for good score (>= 80)', async () => {
      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard(mockWalletAddress);
      });

      await waitFor(
        () => {
          expect(result.current.celebrationState.celebrationScore).toBe(85);
        },
        { timeout: 3000 }
      );

      expect(result.current.celebrationState.celebrationType).toBe('card-generated');
    });

    it('should log success messages', async () => {
      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard(mockWalletAddress);
      });

      await waitFor(() => {
        expect(logger.info).toHaveBeenCalledWith('✅ Analysis complete:', expect.any(Object));
      });

      expect(logger.info).toHaveBeenCalledWith('✅ Card saved:', expect.any(Object));
    });
  });

  describe('generateCard - Error Handling', () => {
    it('should handle analyze API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Wallet not found' }),
      });

      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard('invalid-wallet');
      });

      expect(result.current.state.error).toBe('Wallet not found');
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.analyzing).toBe(false);
      expect(result.current.state.cardImage).toBe(null);
    });

    it('should handle save-card API error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ degenScore: 75 }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Database error' }),
        });

      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard('test-wallet');
      });

      expect(result.current.state.error).toBe('Database error');
      expect(result.current.state.loading).toBe(false);
    });

    it('should handle generate-card API error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ degenScore: 75 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Image generation failed' }),
        });

      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard('test-wallet');
      });

      expect(result.current.state.error).toBe('Image generation failed');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard('test-wallet');
      });

      expect(result.current.state.error).toBe('Network error');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard('test-wallet');
      });

      expect(result.current.state.error).toBe('An error occurred');
    });
  });

  describe('downloadCard', () => {
    it('should download basic card', () => {
      const { result } = renderHook(() => useCardGeneration());
      const mockClick = jest.fn();
      const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation();

      jest.spyOn(document, 'createElement').mockReturnValue({
        click: mockClick,
        download: '',
        href: '',
      } as any);

      act(() => {
        result.current.setState((prev) => ({
          ...prev,
          cardImage: 'blob:test-url',
          walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        }));
      });

      act(() => {
        result.current.downloadCard(false);
      });

      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();

      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });

    it('should download premium card', () => {
      const { result } = renderHook(() => useCardGeneration());
      let downloadName = '';

      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();
      jest.spyOn(document, 'createElement').mockReturnValue({
        click: jest.fn(),
        set download(value: string) {
          downloadName = value;
        },
        get download() {
          return downloadName;
        },
        href: '',
      } as any);

      act(() => {
        result.current.setState((prev) => ({
          ...prev,
          cardImage: 'blob:test-url',
          walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        }));
      });

      act(() => {
        result.current.downloadCard(true);
      });

      expect(downloadName).toContain('premium');
    });

    it('should not download if no card image exists', () => {
      const { result } = renderHook(() => useCardGeneration());
      const mockClick = jest.fn();

      jest.spyOn(document, 'createElement').mockReturnValue({
        click: mockClick,
      } as any);

      act(() => {
        result.current.downloadCard();
      });

      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('regenerateCard', () => {
    it('should regenerate card image', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['new-image'], { type: 'image/png' }),
      });

      const { result } = renderHook(() => useCardGeneration());

      act(() => {
        result.current.setState((prev) => ({
          ...prev,
          walletAddress: 'test-wallet',
          cardImage: 'old-blob-url',
        }));
      });

      await act(async () => {
        await result.current.regenerateCard();
      });

      expect(result.current.state.cardImage).toBe('blob:mock-url');
      expect(fetch).toHaveBeenCalledWith('/api/generate-card?nocache=true', expect.any(Object));
    });

    it('should not regenerate if no wallet address', async () => {
      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.regenerateCard();
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle regeneration errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useCardGeneration());

      act(() => {
        result.current.setState((prev) => ({
          ...prev,
          walletAddress: 'test-wallet',
          cardImage: 'old-url',
        }));
      });

      await act(async () => {
        await result.current.regenerateCard();
      });

      // Card image should remain unchanged
      expect(result.current.state.cardImage).toBe('old-url');
    });
  });

  describe('State Management', () => {
    it('should allow updating state directly', () => {
      const { result } = renderHook(() => useCardGeneration());

      act(() => {
        result.current.setState((prev) => ({
          ...prev,
          error: 'Custom error',
        }));
      });

      expect(result.current.state.error).toBe('Custom error');
    });

    it('should allow updating celebration state', () => {
      const { result } = renderHook(() => useCardGeneration());

      act(() => {
        result.current.setCelebrationState((prev) => ({
          ...prev,
          showCelebration: true,
          celebrationType: 'achievement',
        }));
      });

      expect(result.current.celebrationState.showCelebration).toBe(true);
      expect(result.current.celebrationState.celebrationType).toBe('achievement');
    });

    it('should allow updating modal state', () => {
      const { result } = renderHook(() => useCardGeneration());

      act(() => {
        result.current.setModalState((prev) => ({
          ...prev,
          hasPaid: true,
          showProfileModal: true,
        }));
      });

      expect(result.current.modalState.hasPaid).toBe(true);
      expect(result.current.modalState.showProfileModal).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty wallet address gracefully', async () => {
      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard('');
      });

      // Should still attempt to generate (validation happens server-side)
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle very long wallet addresses', async () => {
      const longAddress = 'a'.repeat(1000);
      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        await result.current.generateCard(longAddress);
      });

      expect(result.current.state.walletAddress).toBe(longAddress);
    });

    it('should handle rapid consecutive calls', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ degenScore: 50 }),
        blob: async () => new Blob(['image'], { type: 'image/png' }),
      });

      const { result } = renderHook(() => useCardGeneration());

      await act(async () => {
        const promise1 = result.current.generateCard('wallet1');
        const promise2 = result.current.generateCard('wallet2');
        await Promise.all([promise1, promise2]);
      });

      // Last call should win
      expect(result.current.state.walletAddress).toBe('wallet2');
    });
  });

  describe('Analysis Progress Messages', () => {
    it('should display correct progress messages', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ degenScore: 75 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['image'], { type: 'image/png' }),
        });

      const { result } = renderHook(() => useCardGeneration());
      const messages: string[] = [];

      await act(async () => {
        const promise = result.current.generateCard('test-wallet');

        // Collect messages during execution
        const interval = setInterval(() => {
          if (result.current.state.analysisMessage) {
            messages.push(result.current.state.analysisMessage);
          }
        }, 50);

        await promise;
        clearInterval(interval);
      });

      // Verify key messages appeared
      expect(messages.some((m) => m.includes('Analyzing'))).toBe(true);
    });
  });
});

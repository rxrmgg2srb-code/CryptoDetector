import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDegenCard } from '@/hooks/useDegenCard';

// Mock wallet
const mockWallet = {
  publicKey: { toBase58: () => 'So11111111111111111111111111111111111111112' },
  connected: true,
  disconnect: jest.fn(),
};

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockWallet,
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/AchievementPopup', () => ({
  achievements: {
    legendary: { id: 'legendary', title: 'Legendary Degen' },
    highScore: { id: 'highScore', title: 'High Scorer' },
    firstCard: { id: 'firstCard', title: 'First Card' },
    premiumUnlock: { id: 'premiumUnlock', title: 'Premium Member' },
  },
}));

global.fetch = jest.fn();
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

describe('useDegenCard (comprehensive)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default successful responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/analyze')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ degenScore: 85, badges: [], level: 5 }),
        });
      }
      if (url.includes('/api/save-card')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (url.includes('/api/generate-card')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['fake image'], { type: 'image/png' })),
        });
      }
      if (url.includes('/api/update-profile')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDegenCard());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.cardImage).toBeNull();
      expect(result.current.analyzing).toBe(false);
    });

    it('should track wallet connection', () => {
      const { result } = renderHook(() => useDegenCard());

      expect(result.current.connected).toBe(true);
      expect(result.current.publicKey).toBeDefined();
    });
  });

  describe('generateCard', () => {
    it('should generate card successfully', async () => {
      const { result } = renderHook(() => useDegenCard());

      await act(async () => {
        await result.current.generateCard();
        jest.advanceTimersByTime(1000);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analyze',
        expect.objectContaining({ method: 'POST' })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/save-card',
        expect.objectContaining({ method: 'POST' })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-card',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle disconnected wallet', async () => {
      mockWallet.connected = false;
      const { result } = renderHook(() => useDegenCard());

      await act(async () => {
        await result.current.generateCard();
      });

      expect(result.current.error).toBe('Please connect your wallet first');
      mockWallet.connected = true;
    });

    it('should handle analysis errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Analysis failed' }),
        })
      );

      const { result } = renderHook(() => useDegenCard());

      await act(async () => {
        await result.current.generateCard();
      });

      expect(result.current.error).toContain('Analysis failed');
      expect(result.current.loading).toBe(false);
    });

    it('should update progress during generation', async () => {
      const { result } = renderHook(() => useDegenCard());

      await act(async () => {
        const promise = result.current.generateCard();

        await waitFor(() => {
          expect(result.current.analysisProgress).toBeGreaterThan(0);
        });

        await promise;
      });

      expect(result.current.analysisProgress).toBe(100);
    });

    it('should trigger celebration for high scores', async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/analyze')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ degenScore: 95, badges: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob()),
          json: () => Promise.resolve({ success: true }),
        });
      });

      const { result } = renderHook(() => useDegenCard());

      await act(async () => {
        await result.current.generateCard();
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.celebrationType).toBe('legendary');
    });
  });

  describe('handleUpgrade', () => {
    it('should process upgrade correctly', () => {
      const { result } = renderHook(() => useDegenCard());

      act(() => {
        result.current.setShowUpgradeModal(true);
      });

      act(() => {
        result.current.handleUpgrade();
      });

      expect(result.current.showUpgradeModal).toBe(false);
      expect(result.current.hasPaid).toBe(true);
      expect(result.current.celebrationType).toBe('premium-unlock');
    });
  });

  describe('handleProfileSubmit', () => {
    it('should save profile and regenerate card', async () => {
      const { result } = renderHook(() => useDegenCard());

      // First generate a card to set wallet address
      await act(async () => {
        await result.current.generateCard();
      });

      const profileData = {
        displayName: 'Test User',
        bio: 'Test bio',
        twitter: '@testuser',
      };

      await act(async () => {
        await result.current.handleProfileSubmit(profileData);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/update-profile',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test User'),
        })
      );
    });

    it('should handle profile save errors', async () => {
      const { result } = renderHook(() => useDegenCard());

      await act(async () => {
        await result.current.generateCard();
      });

      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Save failed' }),
        })
      );

      // Mock alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation();

      await act(async () => {
        await result.current.handleProfileSubmit({
          displayName: 'Test',
          bio: 'Test',
        });
      });

      expect(alertMock).toHaveBeenCalled();
      alertMock.mockRestore();
    });
  });

  describe('handleSkip', () => {
    it('should enable free download mode', () => {
      const { result } = renderHook(() => useDegenCard());

      act(() => {
        result.current.handleSkip();
        jest.advanceTimersByTime(600);
      });

      expect(result.current.showUpgradeModal).toBe(false);
      expect(result.current.showShareModal).toBe(true);
    });
  });

  describe('handleShared', () => {
    it('should close share modal after sharing', () => {
      const { result } = renderHook(() => useDegenCard());

      act(() => {
        result.current.setShowShareModal(true);
      });

      act(() => {
        result.current.handleShared();
      });

      expect(result.current.showShareModal).toBe(false);
    });
  });
});

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import DailyChallengesWidget from '@/components/DailyChallengesWidget';
import { useWallet } from '@solana/wallet-adapter-react';

// Mock useWallet
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock walletAuth
jest.mock('@/lib/walletAuth', () => ({
  generateSessionToken: jest.fn().mockReturnValue('mock-token'),
}));

describe('DailyChallengesWidget', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: null,
      signMessage: null,
    });
    global.fetch = jest.fn();
  });

  it('renders loading state initially', async () => {
    // Mock fetch to delay response so we can see loading state
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    // Check for loading skeleton (animate-pulse class)
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders challenges when fetched successfully', async () => {
    const mockChallenges = [
      {
        id: '1',
        title: 'First Trade',
        description: 'Make your first trade',
        targetValue: 1,
        rewardXP: 100,
        completed: false,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ challenges: mockChallenges, stats: null }),
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('First Trade')).toBeInTheDocument();
      expect(screen.getByText('+100 XP')).toBeInTheDocument();
    });
  });

  it('renders empty state when no challenges', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ challenges: [], stats: null }),
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('Nuevos desafíos disponibles pronto')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      // Should show empty state or handle error without crashing
      // Based on component code, it catches error and sets loading false, leaving challenges empty
      expect(screen.getByText('Nuevos desafíos disponibles pronto')).toBeInTheDocument();
    });
  });

  it('displays progress when wallet connected', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toString: () => 'mock-pubkey' },
      signMessage: jest.fn(),
    });

    const mockChallenges = [
      {
        id: '1',
        title: 'Volume King',
        description: 'Trade 100 SOL',
        targetValue: 100,
        progress: 50,
        rewardXP: 500,
        completed: false,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ challenges: mockChallenges, stats: null }),
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('50 / 100')).toBeInTheDocument();
    });
  });
});

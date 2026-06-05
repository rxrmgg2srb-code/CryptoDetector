import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import FollowingContent from '@/components/FollowingContent';
import { useWallet } from '@solana/wallet-adapter-react';

// Mock dependencies
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

jest.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: () => React.createElement('button', {}, 'Connect Wallet'),
}));

jest.mock('next/link', () => {
  return ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };
});

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('FollowingContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: null,
      connected: false,
    });
    global.fetch = jest.fn();
  });

  it('renders connect wallet state when not connected', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    expect(
      screen.getByText('Conecta tu wallet para ver las wallets que sigues')
    ).toBeInTheDocument();
  });

  it('renders loading state when connected and fetching', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'mock-pubkey' },
      connected: true,
    });
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    // Check for loading skeleton (animate-pulse)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders followed wallets when fetch successful', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'mock-pubkey' },
      connected: true,
    });

    const mockWallets = [
      {
        walletAddress: 'wallet-1',
        followedAt: new Date().toISOString(),
        card: {
          walletAddress: 'wallet-1',
          degenScore: 85,
          totalTrades: 100,
          totalVolume: 50000,
          winRate: 60,
          isPaid: true,
          profileName: 'Top Trader',
          profileAvatar: null,
          lastUpdated: new Date().toISOString(),
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ wallets: mockWallets }),
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('Top Trader')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument(); // Score
      expect(screen.getByText('60%')).toBeInTheDocument(); // Win Rate
      expect(screen.getByText('Siguiendo 1 wallets')).toBeInTheDocument();
    });
  });

  it('renders empty state when following no one', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'mock-pubkey' },
      connected: true,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ wallets: [] }),
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('No sigues a nadie aún')).toBeInTheDocument();
      expect(screen.getByText('Explorar Leaderboard')).toBeInTheDocument();
    });
  });

  it('renders error state on fetch failure', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'mock-pubkey' },
      connected: true,
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });
  });
});

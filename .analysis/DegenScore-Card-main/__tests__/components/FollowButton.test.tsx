import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FollowButton from '@/components/FollowButton';
import { useWallet } from '@solana/wallet-adapter-react';

// Mock useWallet
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

// Mock walletAuth
jest.mock('@/lib/walletAuth', () => ({
  generateSessionToken: jest.fn().mockReturnValue('mock-token'),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('FollowButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: null,
      connected: false,
    });
    global.fetch = jest.fn();
  });

  it('renders counts only when not connected', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/followers/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when own wallet', () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'my-wallet' },
      connected: true,
    });
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders follow button when connected and not following', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'my-wallet' },
      connected: true,
    });

    // Mock status check
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        isFollowing: false,
        counts: { followers: 10, following: 5 },
      }),
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('+ Follow')).toBeInTheDocument();
      expect(screen.getByText('👥 10 followers')).toBeInTheDocument();
    });
  });

  it('renders following button when already following', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'my-wallet' },
      connected: true,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        isFollowing: true,
        counts: { followers: 11, following: 5 },
      }),
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Following')).toBeInTheDocument();
    });
  });

  it('handles follow action', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'my-wallet' },
      connected: true,
    });

    // Initial status: not following
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isFollowing: false,
          counts: { followers: 10, following: 5 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    const button = screen.getByText('+ Follow');

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Following')).toBeInTheDocument();
    });
  });
});

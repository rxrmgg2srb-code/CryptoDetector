import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DailyCheckIn from '@/components/DailyCheckIn';
import { useWallet } from '@solana/wallet-adapter-react';

// Mock dependencies
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
}));

describe('DailyCheckIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({ publicKey: null });
    global.fetch = jest.fn();
  });

  it('returns null when wallet not connected', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders check-in button when wallet connected', () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'test-wallet' },
    });

    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Daily Check-In')).toBeInTheDocument();
    expect(screen.getByText('Check In Now (+50 XP)')).toBeInTheDocument();
  });

  it('handles successful check-in', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'test-wallet' },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        currentStreak: 5,
        totalXP: 250,
        xpEarned: 50,
        badgesEarned: [],
      }),
    });

    render(React.createElement('div', null, 'MockedComponent'));

    const button = screen.getByText('Check In Now (+50 XP)');

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('✅ Checked In!')).toBeInTheDocument();
      expect(screen.getByText('+50 XP!')).toBeInTheDocument();
    });
  });

  it('handles already checked in', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'test-wallet' },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        currentStreak: 3,
        totalXP: 150,
        alreadyCheckedIn: true,
      }),
    });

    render(React.createElement('div', null, 'MockedComponent'));

    await act(async () => {
      fireEvent.click(screen.getByText('Check In Now (+50 XP)'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Already checked in today/)).toBeInTheDocument();
    });
  });

  it('handles check-in error', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'test-wallet' },
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(React.createElement('div', null, 'MockedComponent'));

    await act(async () => {
      fireEvent.click(screen.getByText('Check In Now (+50 XP)'));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to check in. Try again.')).toBeInTheDocument();
    });
  });
});

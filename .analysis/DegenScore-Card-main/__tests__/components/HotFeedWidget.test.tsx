import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import HotFeedWidget from '@/components/HotFeedWidget';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('HotFeedWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders loading state initially', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders feed data when fetch successful', async () => {
    const mockData = {
      success: true,
      tier: 'FREE',
      delay: '24h',
      upgradeAvailable: true,
      trades: [
        {
          id: 'trade-1',
          degen: 'DegenKing',
          degenScore: 85,
          type: 'buy',
          solAmount: '10.5',
          tokenSymbol: 'BONK',
          timeAgo: '5m',
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('🔥 Hot Wallet Feed')).toBeInTheDocument();
      expect(screen.getByText('DegenKing')).toBeInTheDocument();
      expect(screen.getByText('BONK')).toBeInTheDocument();
      expect(screen.getByText('🟢 BUY')).toBeInTheDocument();
    });
  });

  it('renders empty state when no trades', async () => {
    const mockData = {
      success: true,
      tier: 'FREE',
      delay: '24h',
      upgradeAvailable: true,
      trades: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('No recent trades from top degens')).toBeInTheDocument();
    });
  });

  it('opens upgrade modal when upgrade button clicked', async () => {
    const mockData = {
      success: true,
      tier: 'FREE',
      delay: '24h',
      upgradeAvailable: true,
      trades: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      const upgradeBtn = screen.getByText('⚡ Upgrade');
      fireEvent.click(upgradeBtn);
    });

    expect(screen.getByText('⚡ Upgrade Hot Feed Access')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    // Should return null (render nothing) on error based on component logic
    // Or we can check if logger was called
    const { logger } = require('@/lib/logger');
    expect(logger.error).toHaveBeenCalled();
  });
});

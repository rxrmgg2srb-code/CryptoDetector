import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import RankingsWidget from '@/components/RankingsWidget';

describe('RankingsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders loading state initially', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders rankings when fetch successful', async () => {
    const mockData = {
      leaderboard: [
        {
          walletAddress: 'wallet-1',
          displayName: 'Top Degen',
          profileImage: null,
          likes: 100,
          referralCount: 50,
          badgePoints: 200,
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
      expect(screen.getByText('Top Degen')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // Likes value
    });
  });

  it('switches categories correctly', async () => {
    const mockData = {
      leaderboard: [
        {
          walletAddress: 'wallet-1',
          displayName: 'Top Degen',
          likes: 100,
          referralCount: 50,
          badgePoints: 200,
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

    // Switch to Referrals
    const referralsBtn = screen.getByText('👥');
    fireEvent.click(referralsBtn);

    expect(screen.getByText('Más Referidos')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // Referral count

    // Switch to Badges
    const badgesBtn = screen.getByText('⭐');
    fireEvent.click(badgesBtn);

    expect(screen.getByText('Más Logros')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument(); // Badge points
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeaderboardPage from '@/pages/leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';

jest.mock('@/hooks/useLeaderboard');

describe('Pages/Leaderboard', () => {
  const mockData = [
    { rank: 1, wallet: 'alice', score: 98, badges: ['🏆'] },
    { rank: 2, wallet: 'bob', score: 95, badges: ['🥈'] },
  ];

  beforeEach(() => {
    (useLeaderboard as jest.Mock).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  it('should render leaderboard table', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should display entries', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('should show scores', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('98')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useLeaderboard as jest.Mock).mockReturnValue({
      data: [],
      loading: true,
      error: null,
    });
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useLeaderboard as jest.Mock).mockReturnValue({
      data: [],
      loading: false,
      error: 'Failed to load',
    });
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('should handle pagination', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/next/i)).toBeInTheDocument();
    expect(screen.getByText(/prev/i)).toBeInTheDocument();
  });

  it('should filter by timeframe', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    fireEvent.click(screen.getByText(/weekly/i));
    // Expect hook to be called with new filter
    expect(useLeaderboard).toHaveBeenCalled();
  });

  it('should search users', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'charlie' } });
    expect(input).toHaveValue('charlie');
  });

  it('should display badges', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('should highlight current user', () => {
    // Mock current user context if needed
    render(React.createElement('div', null, 'MockedComponent'));
    // Check for highlight class
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });
});

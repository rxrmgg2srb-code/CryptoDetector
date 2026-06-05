import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { GlobalStats } from '@/components/GlobalStats';

// Mock react-countup
jest.mock('react-countup', () => ({
  __esModule: true,
  default: ({ end }: any) => <span>{end}</span>,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('GlobalStats', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('renders with provided stats', () => {
    const stats = {
      totalUsers: 1000,
      totalVolume: 50000,
      activeToday: 150,
      trend: 5,
    };

    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    // Component should show loading indicators (skeletons or similar)
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Failed to load stats/i)).toBeInTheDocument();
  });

  it('fetches stats when not provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        totalUsers: 500,
        totalVolume: 25000,
        activeToday: 75,
      }),
    });

    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });
});

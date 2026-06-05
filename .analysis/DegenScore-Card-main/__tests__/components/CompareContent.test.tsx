import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompareContent from '@/components/CompareContent';

// Mock NavigationButtons and LanguageSelector to simplify test
jest.mock('@/components/NavigationButtons', () => ({
  NavigationButtons: () =>
    React.createElement('div', { 'data-testid': 'nav-buttons' }, 'Nav Buttons'),
}));
jest.mock('@/components/LanguageSelector', () => ({
  LanguageSelector: () =>
    React.createElement('div', { 'data-testid': 'lang-selector' }, 'Lang Selector'),
}));

describe('CompareContent', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('renders input fields and compare button', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Card Comparison/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter first wallet address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter second wallet address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compare Cards/i })).toBeInTheDocument();
  });

  it('shows error if wallets are missing', async () => {
    render(React.createElement('div', null, 'MockedComponent'));
    fireEvent.click(screen.getByRole('button', { name: /Compare Cards/i }));
    expect(await screen.findByText(/Please enter both wallet addresses/i)).toBeInTheDocument();
  });

  it('shows error if wallets are identical', async () => {
    render(React.createElement('div', null, 'MockedComponent'));
    fireEvent.change(screen.getByPlaceholderText(/Enter first wallet address/i), {
      target: { value: 'wallet1' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter second wallet address/i), {
      target: { value: 'wallet1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Compare Cards/i }));
    expect(await screen.findByText(/Please enter different wallet addresses/i)).toBeInTheDocument();
  });

  it('fetches and displays comparison data', async () => {
    const mockComparisonData = {
      comparison: {
        wallet1: {
          displayName: 'Wallet One',
          degenScore: 80,
          totalTrades: 10,
          totalVolume: 100,
          profitLoss: 50,
          winRate: 60,
          bestTrade: 20,
          badges: 2,
          likes: 5,
        },
        wallet2: {
          displayName: 'Wallet Two',
          degenScore: 70,
          totalTrades: 8,
          totalVolume: 80,
          profitLoss: 40,
          winRate: 50,
          bestTrade: 15,
          badges: 1,
          likes: 3,
        },
        winner: {
          degenScore: 'wallet1',
          totalTrades: 'wallet1',
          totalVolume: 'wallet1',
          profitLoss: 'wallet1',
          winRate: 'wallet1',
          bestTrade: 'wallet1',
          badges: 'wallet1',
          likes: 'wallet1',
        },
      },
      overallWinner: 'wallet1',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockComparisonData,
    });

    render(React.createElement('div', null, 'MockedComponent'));
    fireEvent.change(screen.getByPlaceholderText(/Enter first wallet address/i), {
      target: { value: 'wallet1' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter second wallet address/i), {
      target: { value: 'wallet2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Compare Cards/i }));

    expect(screen.getByText(/Comparing.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Overall Winner')).toBeInTheDocument();
    });

    expect(screen.getByText('Wallet One')).toBeInTheDocument();
    expect(screen.getByText('Wallet Two')).toBeInTheDocument();
    expect(screen.getByText('80/100')).toBeInTheDocument();
  });
});

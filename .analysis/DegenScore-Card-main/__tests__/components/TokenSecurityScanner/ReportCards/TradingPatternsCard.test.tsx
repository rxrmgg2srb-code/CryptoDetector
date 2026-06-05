import React from 'react';
import { render, screen } from '@testing-library/react';
import TradingPatternsCard from '@/components/TokenSecurityScanner/ReportCards/TradingPatternsCard';

const mockPatterns = {
  score: 12,
  bundleBots: 5,
  snipers: 2,
  washTrading: false,
  honeypotDetected: false,
  canSell: true,
};

describe('TradingPatternsCard', () => {
  it('renders trading patterns correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Trading Patterns/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Bundle Bots
    expect(screen.getByText('2')).toBeInTheDocument(); // Snipers
    expect(screen.getByText('✅ None')).toBeInTheDocument();
    expect(screen.getByText('✅ Safe')).toBeInTheDocument();
    expect(screen.getByText('✅ Yes')).toBeInTheDocument();
  });

  it('shows warnings for risks', () => {
    const riskyPatterns = {
      ...mockPatterns,
      washTrading: true,
      honeypotDetected: true,
      canSell: false,
    };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('⚠️ Detected')).toBeInTheDocument();
    expect(screen.getByText('🚨 DETECTED')).toBeInTheDocument();
    expect(screen.getByText('⛔ NO')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import LiquidityCard from '@/components/TokenSecurityScanner/ReportCards/LiquidityCard';

const mockLiquidity = {
  score: 15,
  totalLiquiditySOL: 500,
  liquidityUSD: 50000,
  lpBurned: true,
  lpLocked: true,
  riskLevel: 'LOW',
};

describe('LiquidityCard', () => {
  it('renders liquidity metrics correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Liquidity Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/500.00 SOL/)).toBeInTheDocument();
    expect(screen.getByText(/\$50000/)).toBeInTheDocument();
    expect(screen.getAllByText(/✅ Yes/)).toHaveLength(2); // Burned and Locked
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('shows danger indicators for high risk', () => {
    const riskyLiquidity = {
      ...mockLiquidity,
      lpBurned: false,
      lpLocked: false,
      riskLevel: 'CRITICAL',
    };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getAllByText(/❌ No/)).toHaveLength(2);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });
});

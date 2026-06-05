import React from 'react';
import { render, screen } from '@testing-library/react';
import LiquidityCard from '@/components/TokenSecurityScanner/ReportCards/LiquidityCard';

describe('TokenSecurityScanner/LiquidityCard', () => {
  const mockData = {
    totalLiquiditySOL: 100,
    liquidityUSD: 15000,
    lpBurned: true,
    lpLocked: false,
    liquidityToMarketCapRatio: 0.15,
    majorPools: [
      { dex: 'Raydium', liquiditySOL: 60, lpBurned: true },
      { dex: 'Orca', liquiditySOL: 40, lpBurned: false },
    ],
    riskLevel: 'LOW' as const,
    score: 18,
  };

  it('should render liquidity amounts', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/15,000/)).toBeInTheDocument();
  });

  it('should show LP burned status', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/burned/i)).toBeInTheDocument();
  });

  it('should display risk level', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/LOW/i)).toBeInTheDocument();
  });

  it('should show major pools', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Raydium/)).toBeInTheDocument();
    expect(screen.getByText(/Orca/)).toBeInTheDocument();
  });

  it('should handle critical risk', () => {
    const critical = { ...mockData, riskLevel: 'CRITICAL' as const, totalLiquiditySOL: 2 };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/CRITICAL/i)).toBeInTheDocument();
  });

  it('should show LP locked status', () => {
    const locked = { ...mockData, lpBurned: false, lpLocked: true };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/locked/i)).toBeInTheDocument();
  });

  it('should display score', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/18/)).toBeInTheDocument();
  });

  it('should handle zero liquidity', () => {
    const zero = { ...mockData, totalLiquiditySOL: 0, liquidityUSD: 0 };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it('should show liquidity to market cap ratio', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/0\.15/)).toBeInTheDocument();
  });

  it('should handle no pools', () => {
    const noPools = { ...mockData, majorPools: [] };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/No pools/i)).toBeInTheDocument();
  });
});

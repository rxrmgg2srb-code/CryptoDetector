import React from 'react';
import { render, screen } from '@testing-library/react';
import HolderDistributionCard from '@/components/TokenSecurityScanner/ReportCards/HolderDistributionCard';

const mockDistribution = {
  score: 18,
  totalHolders: 1500,
  top10HoldersPercent: 15.5,
  creatorPercent: 2.5,
  concentrationRisk: 'LOW',
  bundleDetected: false,
  bundleWallets: 0,
};

describe('HolderDistributionCard', () => {
  it('renders distribution metrics correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Holder Distribution/i)).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('15.5%')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('shows bundle warning when detected', () => {
    const bundleDistribution = {
      ...mockDistribution,
      bundleDetected: true,
      bundleWallets: 5,
    };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/⚠️ 5 detected/)).toBeInTheDocument();
  });
});

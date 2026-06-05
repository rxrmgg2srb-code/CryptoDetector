import React from 'react';
import { render, screen } from '@testing-library/react';
import RedFlagsCard from '@/components/TokenSecurityScanner/ReportCards/RedFlagsCard';

const mockRedFlags = {
  flags: [
    { severity: 'CRITICAL', category: 'Liquidity', message: 'Liquidity not locked' },
    { severity: 'HIGH', category: 'Ownership', message: 'Mint authority enabled' },
    { severity: 'MEDIUM', category: 'Trading', message: 'High sell tax' },
  ],
};

describe('RedFlagsCard', () => {
  it('renders red flags correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Security Warnings/i)).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();

    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('Liquidity not locked')).toBeInTheDocument();

    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('Mint authority enabled')).toBeInTheDocument();

    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('High sell tax')).toBeInTheDocument();
  });
});

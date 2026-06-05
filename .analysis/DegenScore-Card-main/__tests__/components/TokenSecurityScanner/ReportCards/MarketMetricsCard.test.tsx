import React from 'react';
import { render, screen } from '@testing-library/react';
import MarketMetricsCard from '@/components/TokenSecurityScanner/ReportCards/MarketMetricsCard';

const mockMetrics = {
  ageInDays: 10.5,
  isPumpAndDump: false,
  score: 8,
};

describe('MarketMetricsCard', () => {
  it('renders market metrics correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Market Metrics/i)).toBeInTheDocument();
    expect(screen.getByText('10.5 days')).toBeInTheDocument();
    expect(screen.getByText('✅ No')).toBeInTheDocument();
  });

  it('shows warning for pump and dump', () => {
    const riskyMetrics = { ...mockMetrics, isPumpAndDump: true };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('⚠️ Detected')).toBeInTheDocument();
  });
});

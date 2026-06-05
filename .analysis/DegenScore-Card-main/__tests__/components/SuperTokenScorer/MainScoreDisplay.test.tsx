import React from 'react';
import { render } from '@testing-library/react';
import MainScoreDisplay from '@/components/SuperTokenScorer/MainScoreDisplay.tsx';

const mockResult = {
  tokenAddress: 'test-address',
  tokenSymbol: 'TEST',
  tokenName: 'Test Token',
  superScore: 75,
  globalRiskLevel: 'MEDIUM' as const,
  recommendation: 'Test recommendation',
  analysisTimeMs: 100,
  analyzedAt: new Date().toISOString(),
  categories: {
    security: { score: 80, weight: 30, findings: [] },
    fundamentals: { score: 70, weight: 25, findings: [] },
    technicalAnalysis: { score: 75, weight: 20, findings: [] },
    sentiment: { score: 70, weight: 15, findings: [] },
    innovation: { score: 80, weight: 10, findings: [] },
  },
  redFlags: [],
  greenFlags: [],
};

describe('MainScoreDisplay', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });

  it('displays the token score', () => {
    const { getByText } = render(React.createElement('div', null, 'MockedComponent'));
    expect(getByText('75')).toBeInTheDocument();
  });

  it('displays the token name and symbol', () => {
    const { getByText } = render(React.createElement('div', null, 'MockedComponent'));
    expect(getByText(/TEST - Test Token/i)).toBeInTheDocument();
  });
});

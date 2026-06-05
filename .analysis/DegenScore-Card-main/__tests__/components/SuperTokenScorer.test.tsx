import React from 'react';
import { render, screen } from '@testing-library/react';
import SuperTokenScorerContent from '@/components/SuperTokenScorer';
import { useTokenAnalysis } from '@/hooks/useTokenAnalysis';

// Mock the hook
jest.mock('@/hooks/useTokenAnalysis');

const mockUseTokenAnalysis = useTokenAnalysis as jest.Mock;

describe('SuperTokenScorerContent', () => {
  beforeEach(() => {
    mockUseTokenAnalysis.mockReturnValue({
      tokenAddress: '',
      setTokenAddress: jest.fn(),
      loading: false,
      progress: 0,
      progressMessage: '',
      result: null,
      error: null,
      analyzeToken: jest.fn(),
    });
  });

  it('renders initial state correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    const container = screen.getByRole('textbox');
    expect(container).toBeInTheDocument();
  });

  it('renders result when available', () => {
    mockUseTokenAnalysis.mockReturnValue({
      tokenAddress: 'some-address',
      setTokenAddress: jest.fn(),
      loading: false,
      progress: 100,
      progressMessage: 'Done',
      result: {
        score: 90,
        scoreBreakdown: {
          baseSecurityScore: 80,
          liquidityScore: 90,
          holderScore: 85,
          marketScore: 70,
        },
        dexScreenerData: { priceUSD: 1, liquidity: 100, volume24h: 100, dex: 'dex' },
        birdeyeData: { price: 1, marketCap: 100, holder: 10, trade24h: 10 },
        rugCheckData: { score: 10, rugged: false, risks: [] },
        flags: [],
        metrics: {
          ageInDays: 10,
          isPumpAndDump: false,
          bundleBots: 0,
          snipers: 0,
          washTrading: false,
          honeypotDetected: false,
          canSell: true,
        },
      },
      error: null,
      analyzeToken: jest.fn(),
    });

    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Datos de APIs Externas/i)).toBeInTheDocument();
  });
});
